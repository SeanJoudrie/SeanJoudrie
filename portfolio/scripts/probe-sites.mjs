/**
 * probe-sites.mjs — measure candidate terrain sites before committing to them.
 *
 * Reads only the pixel window each bounding box needs, straight out of the
 * Copernicus GLO-30 COGs over HTTP range requests, so a site costs a few hundred
 * KB to evaluate instead of an 80 MB tile download. Reports the numbers that
 * decide whether a site is worth a slot: true frame size, measured elevation
 * range, relief-to-width ratio, and the encoded heightmap size at a given
 * raster resolution.
 *
 *   node scripts/probe-sites.mjs [size]
 */

import { fromUrl } from 'geotiff'
import { PNG } from 'pngjs'

const SIZE = Number(process.argv[2] ?? 1024)
const QUANT_M = 0.5

/**
 * Candidate frames, with measured results in the comments so the numbers do not
 * have to be rediscovered. Bounding boxes are starting points — each still needs
 * visual confirmation before it is baked.
 *
 * Measured at 1024², 0.5 m quantisation, Paeth filtering. "ratio" is frame width
 * to relief; lower is more dramatic. Target for a landscape that reads as
 * mountainous is roughly 1:7.
 */
const SITES = [
  // --- strong: little or no vertical exaggeration needed ---
  { id: 'matterhorn', name: 'Matterhorn / Zermatt', n: 46.05, s: 45.92, w: 7.6, e: 7.79 },
  //   14.7x14.4 km | 1472-4329 m | relief 2858 | 1:5.2  | 1.16 MB
  { id: 'st-helens', name: 'Mount St. Helens', n: 46.25, s: 46.14, w: -122.25, e: -122.1 },
  //   11.6x12.2 km |  586-2531 m | relief 1944 | 1:6.0  | 1.00 MB
  { id: 'death-valley', name: 'Death Valley / Badwater', n: 36.35, s: 36.15, w: -116.9, e: -116.7 },
  //   18.0x22.2 km |  -91-1744 m | relief 1835 | 1:9.8  | 0.75 MB  (below sea level)
  { id: 'yosemite', name: 'Yosemite Valley', n: 37.79, s: 37.68, w: -119.68, e: -119.5 },
  //   15.9x12.2 km | 1166-2757 m | relief 1592 | 1:10.0 | 1.10 MB  (3DEP 1 m lidar exists)

  // --- the current site, re-cropped: 1:20.8 -> 1:10.9 on framing alone ---
  { id: 'grand-canyon', name: 'Grand Canyon (tight)', n: 36.19, s: 36.02, w: -112.22, e: -112.0 },
  //   19.8x18.9 km |  713-2523 m | relief 1810 | 1:10.9 | 1.24 MB

  // --- water: min elevation lands exactly on the published lake surface, so
  //     the DEM carries the real water plane. Flat water compresses to nothing. ---
  { id: 'crater-lake', name: 'Crater Lake (8km)', n: 42.98, s: 42.905, w: -122.17, e: -122.07 },
  //    8.2x8.3 km  | 1883-2469 m | relief  587 | 1:13.9 | 0.30 MB

  // --- rescued by cropping, but the 30 m source then limits real detail ---
  { id: 'monument-valley', name: 'Monument Valley (5km)', n: 37.0, s: 36.955, w: -110.12, e: -110.07 },
  //    4.5x5.0 km  | 1538-2004 m | relief  466 | 1:9.6  | 0.55 MB  (was 1:31.4 at 18 km)
  { id: 'zion', name: 'Zion Canyon', n: 37.32, s: 37.19, w: -113.06, e: -112.9 },
  //   14.2x14.4 km | 1182-2315 m | relief 1134 | 1:12.5 | 1.18 MB  (redundant w/ Grand Canyon)

  // --- weak: would need 3x+ exaggeration to read ---
  { id: 'sossusvlei', name: 'Sossusvlei dunes (8km)', n: -24.7, s: -24.77, w: 15.26, e: 15.34 },
  //    8.1x7.8 km  |  517-820 m  | relief  303 | 1:26.7 | 0.66 MB  (no lidar outside US)
  { id: 'meteor-crater', name: 'Meteor Crater', n: 35.045, s: 35.015, w: -111.045, e: -111.005 },
  //    3.7x3.3 km  | 1562-1745 m | relief  183 | 1:19.9 | 0.25 MB  (novelty)
]

const pad2 = (n) => String(Math.abs(n)).padStart(2, '0')
const pad3 = (n) => String(Math.abs(n)).padStart(3, '0')

/** Copernicus tiles are named by their SW corner, 1°×1°. */
function tileName(lat, lon) {
  const ns = lat < 0 ? 'S' : 'N'
  const ew = lon < 0 ? 'W' : 'E'
  return `Copernicus_DSM_COG_10_${ns}${pad2(Math.floor(lat))}_00_${ew}${pad3(Math.floor(lon))}_00_DEM`
}
const tileUrl = (t) => `https://copernicus-dem-30m.s3.amazonaws.com/${t}/${t}.tif`

/** WGS84 ellipsoidal degree lengths at a latitude, metres. */
function degLengths(latDeg) {
  const p = (latDeg * Math.PI) / 180
  return {
    lat: 111132.92 - 559.82 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p) - 0.0023 * Math.cos(6 * p),
    lon: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p) + 0.118 * Math.cos(5 * p),
  }
}

const cache = new Map()
async function openTile(name) {
  if (!cache.has(name)) cache.set(name, fromUrl(tileUrl(name)).then((t) => t.getImage()))
  return cache.get(name)
}

async function probe(site) {
  const latTiles = new Set()
  const lonTiles = new Set()
  for (const lat of [site.s, site.n - 1e-9]) latTiles.add(Math.floor(lat))
  for (const lon of [site.w, site.e - 1e-9]) lonTiles.add(Math.floor(lon))

  const windows = []
  for (const la of latTiles) {
    for (const lo of lonTiles) {
      const name = tileName(la + 0.5, lo + 0.5)
      let image
      try {
        image = await openTile(name)
      } catch {
        return { error: `tile ${name} unavailable` }
      }
      const [ox, oy] = image.getOrigin()
      const [rx, ry] = image.getResolution()
      const W = image.getWidth()
      const H = image.getHeight()
      const px = (lon) => (lon - ox) / rx
      const py = (lat) => (lat - oy) / ry
      const left = Math.max(0, Math.floor(px(site.w)) - 1)
      const right = Math.min(W, Math.ceil(px(site.e)) + 1)
      const top = Math.max(0, Math.floor(py(site.n)) - 1)
      const bottom = Math.min(H, Math.ceil(py(site.s)) + 1)
      if (left >= right || top >= bottom) continue
      let data
      try {
        ;[data] = await image.readRasters({ window: [left, top, right, bottom] })
      } catch (e) {
        return { error: `read failed for ${name}: ${e.message}` }
      }
      windows.push({
        data,
        w: right - left,
        h: bottom - top,
        ox: ox + left * rx,
        oy: oy + top * ry,
        rx,
        ry,
      })
    }
  }
  if (!windows.length) return { error: 'no overlap' }

  const sample = (lon, lat) => {
    for (const t of windows) {
      const fx = Math.min(Math.max((lon - t.ox) / t.rx, 0), t.w - 1)
      const fy = Math.min(Math.max((lat - t.oy) / t.ry, 0), t.h - 1)
      const raw = (lon - t.ox) / t.rx
      const rawY = (lat - t.oy) / t.ry
      if (raw < -1.5 || rawY < -1.5 || raw > t.w + 0.5 || rawY > t.h + 0.5) continue
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const x1 = Math.min(x0 + 1, t.w - 1)
      const y1 = Math.min(y0 + 1, t.h - 1)
      const tx = fx - x0
      const ty = fy - y0
      const a = t.data[y0 * t.w + x0]
      const b = t.data[y0 * t.w + x1]
      const c = t.data[y1 * t.w + x0]
      const d = t.data[y1 * t.w + x1]
      if (a < -1000 || b < -1000 || c < -1000 || d < -1000) return null
      return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
    }
    return null
  }

  const midLat = (site.n + site.s) / 2
  const dl = degLengths(midLat)
  const widthM = (site.e - site.w) * dl.lon
  const heightM = (site.n - site.s) * dl.lat

  const elev = new Float32Array(SIZE * SIZE)
  let min = Infinity
  let max = -Infinity
  let voids = 0
  for (let y = 0; y < SIZE; y++) {
    const lat = site.n - ((y + 0.5) / SIZE) * (site.n - site.s)
    for (let x = 0; x < SIZE; x++) {
      const lon = site.w + ((x + 0.5) / SIZE) * (site.e - site.w)
      let v = sample(lon, lat)
      if (v === null) {
        voids++
        v = min === Infinity ? 0 : min
      }
      elev[y * SIZE + x] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  // Encode exactly as the bake does, to get a truthful payload figure.
  const png = new PNG({ width: SIZE, height: SIZE, colorType: 2 })
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = Math.round(elev[i] / QUANT_M) * QUANT_M + 32768
    const r = Math.floor(v / 256)
    const g = Math.floor(v - r * 256)
    const o = i * 4
    png.data[o] = r
    png.data[o + 1] = g
    png.data[o + 2] = Math.round((v - Math.floor(v)) * 256) & 0xff
    png.data[o + 3] = 255
  }
  const bytes = PNG.sync.write(png, { deflateLevel: 9, filterType: 4 }).length

  const relief = max - min
  return {
    widthM,
    heightM,
    min,
    max,
    relief,
    ratio: widthM / relief,
    gsd: widthM / SIZE,
    bytes,
    voids,
  }
}

console.log(`raster ${SIZE}x${SIZE}, quantisation ${QUANT_M} m, Paeth filtering\n`)
console.log(
  'site'.padEnd(22) +
    'frame km'.padStart(14) +
    'elev range m'.padStart(18) +
    'relief'.padStart(9) +
    'ratio'.padStart(9) +
    'gsd'.padStart(8) +
    'PNG'.padStart(9),
)
console.log('-'.repeat(89))
let total = 0
for (const s of SITES) {
  try {
    const r = await probe(s)
    if (r.error) {
      console.log(s.name.padEnd(22) + '  ERROR: ' + r.error)
      continue
    }
    total += r.bytes
    console.log(
      s.name.padEnd(22) +
        `${(r.widthM / 1000).toFixed(1)}x${(r.heightM / 1000).toFixed(1)}`.padStart(14) +
        `${r.min.toFixed(0)} - ${r.max.toFixed(0)}`.padStart(18) +
        `${r.relief.toFixed(0)}`.padStart(9) +
        `1:${r.ratio.toFixed(1)}`.padStart(9) +
        `${r.gsd.toFixed(1)}m`.padStart(8) +
        `${(r.bytes / 1e6).toFixed(2)}MB`.padStart(9) +
        (r.voids ? `  (${r.voids} voids)` : ''),
    )
  } catch (e) {
    console.log(s.name.padEnd(22) + '  FAILED: ' + e.message)
  }
}
console.log('-'.repeat(89))
console.log(`total payload if all shipped at ${SIZE}²: ${(total / 1e6).toFixed(1)} MB`)
