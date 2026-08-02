/**
 * bake-relief.mjs — Grand Canyon DEM → heightmap for the Relief viewshed demo.
 *
 * Run once, locally; the output is committed:
 *   node scripts/bake-relief.mjs
 *
 * SOURCE
 *   Copernicus GLO-30 DEM (30 m global, 1 arc-second), Cloud Optimised GeoTIFF,
 *   from the AWS open-data mirror. No auth, no key. Tiles are 1° × 1°, named by
 *   their south-west corner, 3600 × 3600 after AWS strips the shared east/south
 *   edge rows. The Grand Canyon window spans two tiles:
 *     Copernicus_DSM_COG_10_N36_00_W113_00_DEM  (lon -113..-112)
 *     Copernicus_DSM_COG_10_N36_00_W112_00_DEM  (lon -112..-111)
 *   Tiles are cached under scripts/.cache/relief/ so re-runs are offline.
 *
 * ENCODING — Terrarium RGB (the mapzen/AWS standard):
 *     elevation_metres = (R * 256 + G + B / 256) - 32768
 *   Decoded verbatim in the terrain shader. Elevations are quantised to
 *   QUANT_M metres before encoding so the B channel takes only a handful of
 *   distinct values — Terrarium's fractional byte is otherwise high-entropy
 *   noise that roughly triples the compressed PNG size for precision we do not
 *   need across 1.8 km of relief.
 *
 * The GeoTIFF decode is the only thing borrowed here. Grid resampling, the
 * metre-per-pixel geodesy, and everything downstream is written by hand.
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromArrayBuffer } from 'geotiff'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CACHE = path.join(__dirname, '.cache', 'relief')
const OUT = path.join(ROOT, 'public', 'relief')

/** Grand Canyon, South Rim / Bright Angel. ~45 × 44 km, ~1.8 km of relief. */
const BBOX = { north: 36.4, south: 36.0, west: -112.4, east: -111.9 }

/** Output grid. Square raster; metres-per-pixel differs slightly per axis. */
const SIZE = Number(process.env.RELIEF_SIZE ?? 1536)

/** Elevation quantisation, metres. Keeps the Terrarium B channel compressible. */
const QUANT_M = Number(process.env.RELIEF_QUANT ?? 0.5)

const TILES = [
  'Copernicus_DSM_COG_10_N36_00_W113_00_DEM',
  'Copernicus_DSM_COG_10_N36_00_W112_00_DEM',
]
const TILE_URL = (t) => `https://copernicus-dem-30m.s3.amazonaws.com/${t}/${t}.tif`

const log = (...a) => console.log('[relief]', ...a)

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

/** Fetch a tile to the cache. Skips if already there. */
async function fetchTile(name) {
  const dest = path.join(CACHE, `${name}.tif`)
  if (await exists(dest)) {
    const { size } = await stat(dest)
    log(`cached  ${name} (${(size / 1e6).toFixed(1)} MB)`)
    return dest
  }
  const url = TILE_URL(name)
  log(`fetching ${name} …`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `${name}: HTTP ${res.status}.\n` +
        `If this machine has no network access, download it manually:\n` +
        `  curl -o scripts/.cache/relief/${name}.tif "${url}"\n` +
        `then re-run this script.`,
    )
  }
  await pipeline(res.body, createWriteStream(dest))
  const { size } = await stat(dest)
  log(`fetched ${name} (${(size / 1e6).toFixed(1)} MB)`)
  return dest
}

/**
 * Load a tile and read only the pixel window overlapping BBOX.
 * Geo-referencing is read from the file rather than assumed — origin is the
 * outer NW corner, resolution is degrees/pixel with a negative y.
 */
async function loadTile(file) {
  const buf = await readFile(file)
  const tiff = await fromArrayBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  const image = await tiff.getImage()

  const [ox, oy] = image.getOrigin() // lon, lat of NW corner
  const [rx, ry] = image.getResolution() // deg/px; ry is negative (north-up)
  const width = image.getWidth()
  const height = image.getHeight()

  // Pixel-space window covering BBOX, clamped to the tile.
  const px = (lon) => (lon - ox) / rx
  const py = (lat) => (lat - oy) / ry // ry < 0, so lat decreasing => py increasing

  const left = Math.max(0, Math.floor(px(BBOX.west)) - 2)
  const right = Math.min(width, Math.ceil(px(BBOX.east)) + 2)
  const top = Math.max(0, Math.floor(py(BBOX.north)) - 2)
  const bottom = Math.min(height, Math.ceil(py(BBOX.south)) + 2)

  if (left >= right || top >= bottom) return null // no overlap

  const [data] = await image.readRasters({ window: [left, top, right, bottom] })

  return {
    data,
    w: right - left,
    h: bottom - top,
    // Geo transform for this window: lon/lat of the window's NW pixel origin.
    ox: ox + left * rx,
    oy: oy + top * ry,
    rx,
    ry,
  }
}

/**
 * Bilinear sample across the loaded tiles. Returns null outside coverage.
 *
 * TOL exists because the bbox edges land mid-pixel: the southernmost sample
 * row sits ~0.5 px below the last row the tile provides, and a strict bounds
 * test rejects it even though the data is there. Allow a small overshoot and
 * clamp — the alternative is a band of void along every bbox edge.
 */
const TOL = 1.5

function sample(tiles, lon, lat) {
  for (const t of tiles) {
    const rawX = (lon - t.ox) / t.rx
    const rawY = (lat - t.oy) / t.ry
    if (rawX < -TOL || rawY < -TOL || rawX > t.w - 1 + TOL || rawY > t.h - 1 + TOL) continue

    const fx = Math.min(Math.max(rawX, 0), t.w - 1)
    const fy = Math.min(Math.max(rawY, 0), t.h - 1)

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

    // Copernicus marks voids with large negatives; the canyon has none, but
    // guard anyway so a bad pixel can never poison the bilinear blend.
    if (a < -1000 || b < -1000 || c < -1000 || d < -1000) return null

    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
  }
  return null
}

async function main() {
  await mkdir(CACHE, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const files = []
  for (const t of TILES) files.push(await fetchTile(t))

  const tiles = []
  for (const f of files) {
    const t = await loadTile(f)
    if (t) {
      tiles.push(t)
      log(`window  ${path.basename(f)} → ${t.w} × ${t.h} px`)
    }
  }
  if (!tiles.length) throw new Error('no tile overlapped the bounding box')

  // ---- Resample onto the output grid -------------------------------------
  // Samples are taken at pixel CENTRES: the grid divides the bbox into SIZE
  // cells per axis and we sample the middle of each. Sampling the edges instead
  // would stretch the raster by half a cell and skew every distance downstream.
  const elev = new Float32Array(SIZE * SIZE)
  let min = Infinity
  let max = -Infinity
  let voids = 0

  const lonSpan = BBOX.east - BBOX.west
  const latSpan = BBOX.north - BBOX.south

  for (let y = 0; y < SIZE; y++) {
    const lat = BBOX.north - ((y + 0.5) / SIZE) * latSpan
    for (let x = 0; x < SIZE; x++) {
      const lon = BBOX.west + ((x + 0.5) / SIZE) * lonSpan
      let v = sample(tiles, lon, lat)
      if (v === null) {
        voids++
        v = 0
      }
      elev[y * SIZE + x] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  if (voids) log(`WARNING: ${voids} void samples (filled with 0)`)
  log(`elevation range: ${min.toFixed(1)} → ${max.toFixed(1)} m  (relief ${(max - min).toFixed(0)} m)`)

  // ---- Metres per pixel ---------------------------------------------------
  // A degree of longitude shortens with latitude; ignoring that skews every
  // distance the viewshed computes. Use the WGS84 ellipsoidal lengths at the
  // bbox mid-latitude.
  const midLat = ((BBOX.north + BBOX.south) / 2) * (Math.PI / 180)
  const mPerDegLat =
    111132.92 - 559.82 * Math.cos(2 * midLat) + 1.175 * Math.cos(4 * midLat) - 0.0023 * Math.cos(6 * midLat)
  const mPerDegLon =
    111412.84 * Math.cos(midLat) - 93.5 * Math.cos(3 * midLat) + 0.118 * Math.cos(5 * midLat)

  const widthM = lonSpan * mPerDegLon
  const heightM = latSpan * mPerDegLat
  const metersPerPixelX = widthM / SIZE
  const metersPerPixelY = heightM / SIZE

  log(`extent: ${(widthM / 1000).toFixed(2)} × ${(heightM / 1000).toFixed(2)} km`)
  log(`m/px:   ${metersPerPixelX.toFixed(2)} × ${metersPerPixelY.toFixed(2)}`)

  // ---- Terrarium RGB encode ----------------------------------------------
  // colorType 2 writes RGB to disk, but pngjs ALWAYS allocates its in-memory
  // `data` buffer as RGBA and packs down on write — so entries must be written
  // at a 4-byte stride. Writing at a 3-byte stride silently produces garbage
  // that still round-trips against itself.
  const png = new PNG({ width: SIZE, height: SIZE, colorType: 2 })
  for (let i = 0; i < SIZE * SIZE; i++) {
    const q = Math.round(elev[i] / QUANT_M) * QUANT_M
    const v = q + 32768
    const r = Math.floor(v / 256)
    const g = Math.floor(v - r * 256)
    const b = Math.round((v - Math.floor(v)) * 256) & 0xff
    const o = i * 4
    png.data[o] = r
    png.data[o + 1] = g
    png.data[o + 2] = b
    png.data[o + 3] = 255
  }
  // filterType 4 (Paeth) rather than adaptive. Terrain is locally smooth, so
  // predicting each byte from its neighbours leaves small residuals almost
  // everywhere; the only places it loses are the G-channel wraps every 256 m of
  // elevation, which are rare enough not to matter. Measured on this raster:
  // Paeth 2.91 MB, adaptive 2.94, Sub 3.20, None 5.64.
  const heightmapPath = path.join(OUT, 'heightmap.png')
  await writeFile(heightmapPath, PNG.sync.write(png, { deflateLevel: 9, filterType: 4 }))
  const { size: pngSize } = await stat(heightmapPath)
  log(`wrote heightmap.png — ${SIZE} × ${SIZE}, ${(pngSize / 1e6).toFixed(2)} MB`)

  // ---- Round-trip check ---------------------------------------------------
  // Decode exactly as the shader will and confirm the error is within
  // quantisation. A silent encoding bug here would be invisible until the
  // terrain looked subtly wrong, so fail loudly instead.
  // Decode from the file we just wrote, not from the in-memory buffer — that is
  // the only check that would have caught the stride bug above.
  const verify = PNG.sync.read(await readFile(heightmapPath))
  let worst = 0
  for (let i = 0; i < SIZE * SIZE; i += 97) {
    const o = i * 4
    const dec = verify.data[o] * 256 + verify.data[o + 1] + verify.data[o + 2] / 256 - 32768
    worst = Math.max(worst, Math.abs(dec - elev[i]))
  }
  log(`round-trip max error: ${worst.toFixed(3)} m (quantisation is ${QUANT_M} m)`)
  if (worst > QUANT_M) throw new Error(`encoding error ${worst} m exceeds quantisation`)

  // ---- meta.json ----------------------------------------------------------
  const meta = {
    source: 'Copernicus GLO-30 DEM (ESA / Copernicus Programme), AWS open-data mirror',
    encoding: 'terrarium-rgb: elev_m = (R*256 + G + B/256) - 32768',
    quantisationM: QUANT_M,
    bbox: BBOX,
    width: SIZE,
    height: SIZE,
    minElev: Math.round(min * 100) / 100,
    maxElev: Math.round(max * 100) / 100,
    widthM: Math.round(widthM),
    heightM: Math.round(heightM),
    metersPerPixelX: Math.round(metersPerPixelX * 1000) / 1000,
    metersPerPixelY: Math.round(metersPerPixelY * 1000) / 1000,
  }
  await writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
  log('wrote meta.json')

  // ---- Grayscale preview (gate check, not shipped) ------------------------
  const prev = new PNG({ width: SIZE, height: SIZE, colorType: 0 })
  for (let i = 0; i < SIZE * SIZE; i++) {
    prev.data[i * 4] = Math.round(((elev[i] - min) / (max - min)) * 255)
  }
  // colorType 0 still allocates RGBA in pngjs; pack the gray into all channels.
  for (let i = 0; i < SIZE * SIZE; i++) {
    const g = prev.data[i * 4]
    prev.data[i * 4 + 1] = g
    prev.data[i * 4 + 2] = g
    prev.data[i * 4 + 3] = 255
  }
  await writeFile(path.join(CACHE, 'preview.png'), PNG.sync.write(prev))
  log(`wrote preview → scripts/.cache/relief/preview.png (inspect this)`)
}

main().catch((e) => {
  console.error('[relief] FAILED:', e.message)
  process.exit(1)
})
