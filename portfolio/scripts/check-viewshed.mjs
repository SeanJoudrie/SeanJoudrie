/**
 * check-viewshed.mjs — independent CPU reference for the GPU viewshed.
 *
 * Reimplements the reference-angle method against the same baked heightmap,
 * with the same curvature and refraction corrections, so the shader's output
 * can be checked against something written separately. Three modes:
 *
 *   node scripts/check-viewshed.mjs
 *     Compute the viewshed for one observer and print visible area, share of
 *     the frame, and the furthest visible cell. Compare against the figures the
 *     page reports — they agreed to within rounding when this was written
 *     (2.71% here vs 2.7% on the GPU).
 *
 *   VS_SELFTEST=1 node scripts/check-viewshed.mjs
 *     Run the same code over a perfectly flat plane, where the horizon has a
 *     closed form: sqrt(2Rh/(1-k)). This is the check that matters — it says
 *     whether the ALGORITHM is right, independently of any terrain. It was what
 *     established the maths was correct while the rendered picture was still
 *     wrong, which pointed at the plumbing instead of the geometry.
 *
 *   VS_SEARCH=1 node scripts/check-viewshed.mjs
 *     Score candidate observer positions by the area each actually sees, and
 *     print the best. Used to choose the page's SEED: the highest ground in the
 *     frame is ringed by taller plateau and sees only 2.7%, while a rim position
 *     372 m lower sees 12.4%.
 *
 * VS_HEIGHT overrides the observer height (default 25 m) in every mode.
 * VS_SITE picks the site (default grand-canyon) — the same ids as
 * scripts/relief-sites.mjs. Each site needs its own seed: a position chosen on
 * the canyon rim means nothing on a caldera.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EARTH_R = 6371000
const GRID = 256 // evaluation grid, matching the GPU stats target
const STEPS = 256
const K = 0.13

const SITE = process.env.VS_SITE ?? 'grand-canyon'
const DIR = path.join(ROOT, 'public/relief', SITE)
const meta = JSON.parse(await readFile(path.join(DIR, 'meta.json'), 'utf8'))
const png = PNG.sync.read(await readFile(path.join(DIR, 'heightmap.png')))
console.log(`site      ${SITE}  ${(meta.widthM / 1000).toFixed(1)}x${(meta.heightM / 1000).toFixed(1)} km  ${meta.minElev}–${meta.maxElev} m`)

const W = png.width
const H = png.height
const elev = new Float32Array(W * H)
for (let i = 0; i < W * H; i++) {
  const o = i * 4
  elev[i] = png.data[o] * 256 + png.data[o + 1] + png.data[o + 2] / 256 - 32768
}

/** v = 1 is the north edge, i.e. raster row 0 — matching heightfield.ts. */
function elevAt(u, v) {
  const x = Math.min(Math.max(u, 0), 1) * (W - 1)
  const y = (1 - Math.min(Math.max(v, 0), 1)) * (H - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, W - 1)
  const y1 = Math.min(y0 + 1, H - 1)
  const tx = x - x0
  const ty = y - y0
  const a = elev[y0 * W + x0]
  const b = elev[y0 * W + x1]
  const c = elev[y1 * W + x0]
  const d = elev[y1 * W + x1]
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
}

// The observer under test: highest ground in the central band.
//
// NOTE this is deliberately NOT the position the page seeds. The page uses the
// winner of VS_SEARCH (u 0.30, v 0.50), because this rule — take the highest
// point — turns out to be a trap: it lands on a 2,638 m high point ringed by
// taller plateau that sees only 2.7% of the frame. Keeping the bad position
// here is useful, since a pathological viewshed is a sharper test of the
// algorithm than a generous one. Override with VS_OBS_U / VS_OBS_V.
let obs = { u: 0.5, v: 0.45, e: -Infinity }
if (process.env.VS_OBS_U && process.env.VS_OBS_V) {
  obs = { u: Number(process.env.VS_OBS_U), v: Number(process.env.VS_OBS_V), e: 0 }
  obs.e = elevAt(obs.u, obs.v)
} else {
  for (let vi = 30; vi <= 62; vi++) {
    for (let ui = 8; ui <= 92; ui++) {
      const e = elevAt(ui / 100, vi / 100)
      if (e > obs.e) obs = { u: ui / 100, v: vi / 100, e }
    }
  }
}
const HEIGHT = Number(process.env.VS_HEIGHT ?? 25)
const eye = obs.e + HEIGHT
console.log(`observer  u=${obs.u} v=${obs.v} ground=${obs.e.toFixed(1)} m  eye=${eye.toFixed(1)} m`)

const apparent = (e, d) => e - ((d * d) / (2 * EARTH_R)) * (1 - K)

let visible = 0
let furthest = 0
for (let yi = 0; yi < GRID; yi++) {
  for (let xi = 0; xi < GRID; xi++) {
    const u = (xi + 0.5) / GRID
    const v = (yi + 0.5) / GRID
    const du = u - obs.u
    const dv = v - obs.v
    const dist = Math.hypot(du * meta.widthM, dv * meta.heightM)
    if (dist < 1) {
      visible++
      continue
    }
    let maxAngle = -Infinity
    for (let i = 1; i < STEPS; i++) {
      const t = i / STEPS
      const d = dist * t
      const e = apparent(elevAt(obs.u + du * t, obs.v + dv * t), d)
      const a = (e - eye) / d
      if (a > maxAngle) maxAngle = a
    }
    const angT = (apparent(elevAt(u, v), dist) - eye) / dist
    if (angT >= maxAngle) {
      visible++
      if (dist > furthest) furthest = dist
    }
  }
}

// --- candidate search: which observer position sees the most? ---
// "Highest point" is a poor default — a summit ringed by higher ground sees
// almost nothing. Score a coarse spread of candidates by actual visible area
// and report the winner, so the page can seed a position that is worth looking
// at rather than one that merely sounds impressive.
if (process.env.VS_SEARCH) {
  const G = 96
  const ST = 128
  const score = (ou, ov, h) => {
    const og = elevAt(ou, ov)
    const ey = og + h
    let vis = 0
    for (let yi = 0; yi < G; yi++) {
      for (let xi = 0; xi < G; xi++) {
        const du = (xi + 0.5) / G - ou
        const dv = (yi + 0.5) / G - ov
        const dist = Math.hypot(du * meta.widthM, dv * meta.heightM)
        if (dist < 1) { vis++; continue }
        let mx = -Infinity
        for (let i = 1; i < ST; i++) {
          const t = i / ST
          const d = dist * t
          const a = (apparent(elevAt(ou + du * t, ov + dv * t), d) - ey) / d
          if (a > mx) mx = a
        }
        const target = elevAt((xi + 0.5) / G, (yi + 0.5) / G)
        if ((apparent(target, dist) - ey) / dist >= mx) vis++
      }
    }
    return { vis, frac: vis / (G * G), ground: og }
  }
  // VS_MIN_GROUND rejects candidates below an elevation. Crater Lake needs it:
  // the DEM carries the lake as a perfectly flat 1,883 m plane, and every one of
  // the top eight candidates was an observer standing on the water, seeing 82%
  // of the caldera. True of the raster, useless as a demonstration — the point
  // is a sensor somewhere a sensor could be.
  const minGround = Number(process.env.VS_MIN_GROUND ?? -Infinity)
  const results = []
  for (let vi = 1; vi < 10; vi++) {
    for (let ui = 1; ui < 10; ui++) {
      const u = ui / 10
      const v = vi / 10
      const r = score(u, v, 25)
      if (r.ground < minGround) continue
      results.push({ u, v, ...r })
    }
  }
  results.sort((a, b) => b.frac - a.frac)
  console.log('top candidates at 25 m:')
  for (const r of results.slice(0, 8)) {
    console.log(`  u=${r.u.toFixed(2)} v=${r.v.toFixed(2)}  ground=${r.ground.toFixed(0)} m  visible=${(r.frac * 100).toFixed(1)}%`)
  }
  process.exit(0)
}

// --- self-test: a perfectly flat plane, where the answer is analytic ---
// With curvature+refraction the horizon sits at sqrt(2*R*h/(1-k)); everything
// inside that radius must be visible and everything outside hidden.
if (process.env.VS_SELFTEST) {
  const h = HEIGHT
  const horizon = Math.sqrt((2 * EARTH_R * h) / (1 - K))

  /**
   * The plane is synthetic, so its EXTENT must be too.
   *
   * This used to borrow the site's frame size, which worked only for as long as
   * the frame happened to be bigger than the horizon. Re-cropping the Grand
   * Canyon to 19.8 km — against a 19.1 km horizon for a 25 m eye — put the
   * entire raster inside the horizon: no cell could be hidden, "nearest hidden"
   * came back Infinity, and an assertion about where visibility ENDS had nothing
   * left to measure. A test of the algorithm has no business depending on which
   * bounding box someone chose.
   *
   * Sized at 2.5x the horizon so the boundary falls well inside the grid, and
   * evaluated at 512 rather than 256 so a cell (93 m) stays comfortably below
   * the 1% tolerance (191 m) the assertions use.
   */
  const extent = horizon * 2.5
  const grid = 512
  const centre = { u: 0.5, v: 0.5 }

  let vis = 0
  let maxVisD = 0
  let minHidD = Infinity
  for (let yi = 0; yi < grid; yi++) {
    for (let xi = 0; xi < grid; xi++) {
      const du = (xi + 0.5) / grid - centre.u
      const dv = (yi + 0.5) / grid - centre.v
      const dist = Math.hypot(du * extent, dv * extent)
      if (dist < 1) { vis++; continue }
      let maxA = -Infinity
      for (let i = 1; i < STEPS; i++) {
        const t = i / STEPS
        const d = dist * t
        const a = (apparent(0, d) - h) / d
        if (a > maxA) maxA = a
      }
      const angT = (apparent(0, dist) - h) / dist
      if (angT >= maxA) { vis++; if (dist > maxVisD) maxVisD = dist }
      else if (dist < minHidD) minHidD = dist
    }
  }
  console.log(`SELFTEST flat plane, eye ${h} m, ${(extent / 1000).toFixed(1)} km square at ${grid}²`)
  console.log(`  analytic horizon      ${(horizon / 1000).toFixed(2)} km`)
  console.log(`  furthest visible      ${(maxVisD / 1000).toFixed(2)} km`)
  console.log(`  nearest hidden        ${(minHidD / 1000).toFixed(2)} km`)
  console.log(`  visible cells         ${((vis / (grid * grid)) * 100).toFixed(2)}%`)

  // Assert, don't just report. A self-test that prints its result and exits 0
  // regardless tells you nothing on the day it starts disagreeing.
  //
  // Tolerance is 1% of the horizon distance. The march samples the ray at a
  // finite number of steps and the evaluation grid is finite, so exact equality
  // is not expected — but the two must not drift apart. The visible/hidden
  // boundary must also be sharp: everything inside the horizon visible,
  // everything beyond it hidden, with no overlap between the two.
  let bad = 0

  // Pin the physical constants to an independently computed value.
  //
  // Without this, the test is self-consistent but hollow: the analytic horizon
  // is derived from the same EARTH_R and K the algorithm uses, so changing
  // either moves both sides together and the comparison still passes. Verified
  // by mutation — k = 0.13 -> 0.5 moved the horizon from 19.1 km to 25.2 km and
  // the test happily reported PASS. This figure is worked out by hand:
  //   sqrt(2 * 6371000 * 25 / (1 - 0.13)) = 19135 m
  if (h === 25) {
    const EXPECTED_HORIZON_M = 19135
    const ok = Math.abs(horizon - EXPECTED_HORIZON_M) <= 5
    if (!ok) bad++
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  constants give the expected horizon: ` +
        `${horizon.toFixed(0)} m vs ${EXPECTED_HORIZON_M} m expected for R=6371 km, k=0.13`,
    )
  }

  const near = (label, got, want, tol) => {
    const ok = Math.abs(got - want) <= tol
    if (!ok) bad++
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${(got / 1000).toFixed(3)} km vs ${(want / 1000).toFixed(3)} km ` +
        `(tolerance ${(tol / 1000).toFixed(3)} km)`,
    )
  }
  const tol = horizon * 0.01
  near('furthest visible matches the analytic horizon', maxVisD, horizon, tol)
  near('nearest hidden matches the analytic horizon', minHidD, horizon, tol)
  if (minHidD < maxVisD) {
    bad++
    console.log('  FAIL  boundary is not sharp: hidden ground found nearer than the furthest visible')
  } else {
    console.log('  PASS  boundary is sharp')
  }

  console.log(bad ? `\nSELFTEST: ${bad} assertion(s) failed` : '\nSELFTEST: passed')
  process.exit(bad ? 1 : 0)
}

const n = GRID * GRID
const frameKm2 = (meta.widthM / 1000) * (meta.heightM / 1000)
console.log(`visible   ${visible} / ${n} cells = ${((visible / n) * 100).toFixed(2)}%`)
console.log(`area      ${((visible / n) * frameKm2).toFixed(1)} km²`)
console.log(`furthest  ${(furthest / 1000).toFixed(1)} km`)
