/**
 * probe-morph.mjs — does cross-fading two heightmaps produce terrain or mush?
 *
 * The worry with a linear blend is that features which do not align cancel:
 * a ridge in A over a valley in B averages toward flat, so the midpoint has
 * LOWER relief and LOWER slope than either end. That would read as mush.
 *
 * Measures mean slope (feature sharpness) and elevation spread across the blend
 * for three strategies, and prints ASCII hillshades so the shape can be seen:
 *
 *   linear      mix(a, b, t)                      — the naive version
 *   normalised  each field rescaled to 0..1 first, then blended, then mapped
 *               to a blended range — preserves relative structure
 *   sharpened   normalised, then contrast restored at the midpoint
 *
 *   node scripts/probe-morph.mjs
 */

import { fromUrl } from 'geotiff'

const N = 192 // evaluation grid; enough for statistics, cheap to fetch

const A = { name: 'Matterhorn', n: 46.05, s: 45.92, w: 7.6, e: 7.79 }
const B = { name: 'Sossusvlei dunes', n: -24.65, s: -24.8, w: 15.2, e: 15.4 }
const C = { name: 'Grand Canyon', n: 36.19, s: 36.02, w: -112.22, e: -112.0 }

const pad2 = (n) => String(Math.abs(n)).padStart(2, '0')
const pad3 = (n) => String(Math.abs(n)).padStart(3, '0')
const tileName = (lat, lon) =>
  `Copernicus_DSM_COG_10_${lat < 0 ? 'S' : 'N'}${pad2(Math.floor(lat))}_00_${lon < 0 ? 'W' : 'E'}${pad3(Math.floor(lon))}_00_DEM`

async function grid(site) {
  const name = tileName(site.s, site.w)
  const image = await (await fromUrl(`https://copernicus-dem-30m.s3.amazonaws.com/${name}/${name}.tif`)).getImage()
  const [ox, oy] = image.getOrigin()
  const [rx, ry] = image.getResolution()
  const left = Math.max(0, Math.floor((site.w - ox) / rx) - 1)
  const right = Math.min(image.getWidth(), Math.ceil((site.e - ox) / rx) + 1)
  const top = Math.max(0, Math.floor((site.n - oy) / ry) - 1)
  const bottom = Math.min(image.getHeight(), Math.ceil((site.s - oy) / ry) + 1)
  const [data] = await image.readRasters({ window: [left, top, right, bottom] })
  const w = right - left
  const h = bottom - top
  const out = new Float32Array(N * N)
  for (let y = 0; y < N; y++) {
    const fy = Math.min(Math.max(((y + 0.5) / N) * (h - 1), 0), h - 1)
    for (let x = 0; x < N; x++) {
      const fx = Math.min(Math.max(((x + 0.5) / N) * (w - 1), 0), w - 1)
      out[y * N + x] = data[Math.round(fy) * w + Math.round(fx)]
    }
  }
  return out
}

const stats = (g) => {
  let mn = Infinity
  let mx = -Infinity
  let sum = 0
  for (const v of g) {
    if (v < mn) mn = v
    if (v > mx) mx = v
    sum += v
  }
  const mean = sum / g.length
  let varSum = 0
  for (const v of g) varSum += (v - mean) ** 2
  // Mean gradient magnitude in metres per cell — a proxy for how sharp the
  // landscape reads. Mush shows up here before it shows up anywhere else.
  let slope = 0
  let n = 0
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const dx = g[y * N + x + 1] - g[y * N + x - 1]
      const dy = g[(y + 1) * N + x] - g[(y - 1) * N + x]
      slope += Math.hypot(dx, dy) / 2
      n++
    }
  }
  return { min: mn, max: mx, relief: mx - mn, sd: Math.sqrt(varSum / g.length), slope: slope / n }
}

const norm = (g, s) => {
  const o = new Float32Array(g.length)
  for (let i = 0; i < g.length; i++) o[i] = (g[i] - s.min) / (s.max - s.min)
  return o
}

function hillshade(g, label) {
  const s = stats(g)
  const ramp = ' .:-=+*#%@'
  const W = 56
  const H = 20
  let out = `${label}\n`
  for (let y = 0; y < H; y++) {
    let row = ''
    for (let x = 0; x < W; x++) {
      const gx = Math.floor((x / W) * (N - 2)) + 1
      const gy = Math.floor((y / H) * (N - 2)) + 1
      const dzdx = g[gy * N + gx + 1] - g[gy * N + gx - 1]
      const dzdy = g[(gy + 1) * N + gx] - g[(gy - 1) * N + gx]
      // NW sun, fixed scale so the three strategies are comparable
      const nx = -dzdx
      const ny = -dzdy
      const nz = 60
      const len = Math.hypot(nx, ny, nz)
      const lit = Math.max(0, (nx * -0.54 + ny * 0.54 + nz * 0.64) / len)
      row += ramp[Math.min(9, Math.max(0, Math.round(lit * 9)))]
    }
    out += row + '\n'
  }
  return out
}

const a = await grid(A)
const b = await grid(B)
const c = await grid(C)
const sa = stats(a)
const sb = stats(b)
const sc = stats(c)

console.log(`${A.name.padEnd(18)} relief ${sa.relief.toFixed(0)} m  sd ${sa.sd.toFixed(0)}  mean slope ${sa.slope.toFixed(2)} m/cell`)
console.log(`${B.name.padEnd(18)} relief ${sb.relief.toFixed(0)} m  sd ${sb.sd.toFixed(0)}  mean slope ${sb.slope.toFixed(2)} m/cell`)
console.log(`${C.name.padEnd(18)} relief ${sc.relief.toFixed(0)} m  sd ${sc.sd.toFixed(0)}  mean slope ${sc.slope.toFixed(2)} m/cell`)

function report(pairName, g1, s1, g2, s2) {
  console.log(`\n=== ${pairName} ===`)
  const n1 = norm(g1, s1)
  const n2 = norm(g2, s2)
  console.log('  t      linear slope   normalised slope   (endpoint slopes: ' +
    `${s1.slope.toFixed(2)} -> ${s2.slope.toFixed(2)})`)
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const lin = new Float32Array(N * N)
    const nrm = new Float32Array(N * N)
    const relief = s1.relief * (1 - t) + s2.relief * t
    const base = s1.min * (1 - t) + s2.min * t
    for (let i = 0; i < N * N; i++) {
      lin[i] = g1[i] * (1 - t) + g2[i] * t
      nrm[i] = (n1[i] * (1 - t) + n2[i] * t) * relief + base
    }
    const sl = stats(lin)
    const sn = stats(nrm)
    console.log(
      `  ${t.toFixed(2)}   ${sl.slope.toFixed(2).padStart(10)}   ${sn.slope.toFixed(2).padStart(14)}` +
        `      linear relief ${sl.relief.toFixed(0)} m`,
    )
  }
}

report(`${A.name} -> ${B.name}`, a, sa, b, sb)
report(`${C.name} -> ${A.name}`, c, sc, a, sa)

// Show the midpoint so the shape is visible, not just the statistics.
const n1 = norm(c, sc)
const n2 = norm(a, sa)
const linMid = new Float32Array(N * N)
const nrmMid = new Float32Array(N * N)
const relief = (sc.relief + sa.relief) / 2
const base = (sc.min + sa.min) / 2
for (let i = 0; i < N * N; i++) {
  linMid[i] = (c[i] + a[i]) / 2
  nrmMid[i] = ((n1[i] + n2[i]) / 2) * relief + base
}
console.log('\n' + hillshade(c, `--- Grand Canyon (t=0) ---`))
console.log(hillshade(linMid, `--- linear blend at t=0.5 ---`))
console.log(hillshade(nrmMid, `--- range-normalised blend at t=0.5 ---`))
console.log(hillshade(a, `--- Matterhorn (t=1) ---`))
