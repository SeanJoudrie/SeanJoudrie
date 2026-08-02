/**
 * check-viewshed.mjs — independent CPU reference for the GPU viewshed.
 *
 * Reimplements the reference-angle method against the same baked heightmap,
 * with the same curvature and refraction corrections, so the shader's output
 * can be checked against something that was written separately. Run:
 *   node scripts/check-viewshed.mjs
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

const meta = JSON.parse(await readFile(path.join(ROOT, 'public/relief/meta.json'), 'utf8'))
const png = PNG.sync.read(await readFile(path.join(ROOT, 'public/relief/heightmap.png')))

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

// Same seeding rule as the page: highest ground in the central band.
let obs = { u: 0.5, v: 0.45, e: -Infinity }
for (let vi = 30; vi <= 62; vi++) {
  for (let ui = 8; ui <= 92; ui++) {
    const e = elevAt(ui / 100, vi / 100)
    if (e > obs.e) obs = { u: ui / 100, v: vi / 100, e }
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
        if ((apparent(elevAt(ou, ov) * 0 + elevAt((xi + 0.5) / G, (yi + 0.5) / G), dist) - ey) / dist >= mx) vis++
      }
    }
    return { vis, frac: vis / (G * G), ground: og }
  }
  const results = []
  for (let vi = 1; vi < 10; vi++) {
    for (let ui = 1; ui < 10; ui++) {
      const u = ui / 10
      const v = vi / 10
      const r = score(u, v, 25)
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
  let vis = 0
  let maxVisD = 0
  let minHidD = Infinity
  for (let yi = 0; yi < GRID; yi++) {
    for (let xi = 0; xi < GRID; xi++) {
      const du = (xi + 0.5) / GRID - obs.u
      const dv = (yi + 0.5) / GRID - obs.v
      const dist = Math.hypot(du * meta.widthM, dv * meta.heightM)
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
  console.log(`SELFTEST flat plane, eye ${h} m`)
  console.log(`  analytic horizon      ${(horizon / 1000).toFixed(2)} km`)
  console.log(`  furthest visible      ${(maxVisD / 1000).toFixed(2)} km`)
  console.log(`  nearest hidden        ${(minHidD / 1000).toFixed(2)} km`)
  console.log(`  visible cells         ${((vis / (GRID * GRID)) * 100).toFixed(2)}%`)
  process.exit(0)
}

const n = GRID * GRID
const frameKm2 = (meta.widthM / 1000) * (meta.heightM / 1000)
console.log(`visible   ${visible} / ${n} cells = ${((visible / n) * 100).toFixed(2)}%`)
console.log(`area      ${((visible / n) * frameKm2).toFixed(1)} km²`)
console.log(`furthest  ${(furthest / 1000).toFixed(1)} km`)
