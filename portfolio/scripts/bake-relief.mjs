/**
 * bake-relief.mjs — terrain heightmaps for the Relief viewshed demo.
 *
 *   node scripts/bake-relief.mjs            # every site
 *   node scripts/bake-relief.mjs matterhorn # one site
 *   node scripts/bake-relief.mjs --manifest # republish the manifest only
 *
 * Most of relief-sites.mjs describes how a site is RENDERED — sun angle, contour
 * interval, palette, seed observer — none of which affects a single baked byte.
 * --manifest rebuilds manifest.json from the meta.json files already on disk so
 * changing any of that costs nothing, while a bbox change still needs a re-bake.
 *
 * Output is committed. Per site it writes public/relief/<id>/heightmap.png and
 * meta.json, plus a small preview.png; it then writes public/relief/manifest.json
 * describing every site, which the app fetches. The site list lives in
 * relief-sites.mjs so bounding boxes and render settings cannot drift between
 * build and runtime.
 *
 * SOURCE
 *   Copernicus GLO-30 DEM (30 m, 1 arc-second), Cloud Optimised GeoTIFF, from
 *   the AWS open-data mirror. No auth, no key. Tiles are 1° x 1°, named by their
 *   south-west corner, 3600 x 3600 after AWS strips the shared edge rows.
 *
 *   Reads happen over HTTP range requests, so a site costs a few hundred KB
 *   rather than an 80 MB tile download — which also means a site spanning four
 *   tiles is no longer expensive to bake.
 *
 * ENCODING — Terrarium RGB (the mapzen/AWS standard):
 *     elevation_metres = (R * 256 + G + B / 256) - 32768
 *   Decoded verbatim in the terrain and shadow shaders. Elevations are quantised
 *   to QUANT_M before encoding: Terrarium's fractional byte is otherwise
 *   high-entropy noise that roughly doubles the compressed PNG for precision
 *   this does not need.
 *
 * The GeoTIFF decode is the only borrowed part. Grid resampling, the
 * metre-per-pixel geodesy and everything downstream is written by hand.
 */

import { writeFile, readFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromUrl } from 'geotiff'
import { PNG } from 'pngjs'
import { SITES, siteById, manifestEntry } from './relief-sites.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'relief')

/** Raster size. Higher buys interpolation, not detail — the source is 30 m. */
const SIZE = 1024
/** A low-resolution tier shipped upfront so something renders immediately. */
const PREVIEW = 256
/** Elevation quantisation, metres. Keeps the Terrarium B channel compressible. */
const QUANT_M = 0.5

const log = (...a) => console.log('[relief]', ...a)
const pad2 = (n) => String(Math.abs(n)).padStart(2, '0')
const pad3 = (n) => String(Math.abs(n)).padStart(3, '0')

const tileName = (lat, lon) =>
  `Copernicus_DSM_COG_10_${lat < 0 ? 'S' : 'N'}${pad2(Math.floor(lat))}_00_` +
  `${lon < 0 ? 'W' : 'E'}${pad3(Math.floor(lon))}_00_DEM`
const tileUrl = (t) => `https://copernicus-dem-30m.s3.amazonaws.com/${t}/${t}.tif`

/** WGS84 ellipsoidal degree lengths at a latitude, metres. */
function degLengths(latDeg) {
  const p = (latDeg * Math.PI) / 180
  return {
    lat: 111132.92 - 559.82 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p) - 0.0023 * Math.cos(6 * p),
    lon: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p) + 0.118 * Math.cos(5 * p),
  }
}

const tiles = new Map()
const openTile = (name) => {
  if (!tiles.has(name)) tiles.set(name, fromUrl(tileUrl(name)).then((t) => t.getImage()))
  return tiles.get(name)
}

/** Read every tile window the bbox touches. A bbox may span up to four. */
async function readWindows(bbox) {
  const lats = new Set([Math.floor(bbox.south), Math.floor(bbox.north - 1e-9)])
  const lons = new Set([Math.floor(bbox.west), Math.floor(bbox.east - 1e-9)])
  const out = []
  for (const la of lats) {
    for (const lo of lons) {
      const name = tileName(la + 0.5, lo + 0.5)
      const image = await openTile(name)
      const [ox, oy] = image.getOrigin()
      const [rx, ry] = image.getResolution()
      const left = Math.max(0, Math.floor((bbox.west - ox) / rx) - 1)
      const right = Math.min(image.getWidth(), Math.ceil((bbox.east - ox) / rx) + 1)
      const top = Math.max(0, Math.floor((bbox.north - oy) / ry) - 1)
      const bottom = Math.min(image.getHeight(), Math.ceil((bbox.south - oy) / ry) + 1)
      if (left >= right || top >= bottom) continue
      const [data] = await image.readRasters({ window: [left, top, right, bottom] })
      out.push({
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
  return out
}

/**
 * Bilinear sample across the loaded windows.
 *
 * TOL exists because the bbox edges land mid-pixel: the southernmost sample row
 * sits ~0.5 px below the last row a tile provides, and a strict bounds test
 * rejects it even though the data is there — leaving a band of void along every
 * bbox edge.
 */
const TOL = 1.5
function sample(windows, lon, lat) {
  for (const t of windows) {
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
    if (a < -1000 || b < -1000 || c < -1000 || d < -1000) return null
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
  }
  return null
}

/**
 * Terrarium encode.
 *
 * pngjs always allocates its in-memory buffer as RGBA and packs down on write,
 * so entries must be written at a 4-byte stride even for colorType 2. A 3-byte
 * stride silently produces garbage that still round-trips against itself.
 *
 * Paeth filtering, not adaptive: terrain is locally smooth, so predicting each
 * byte from its neighbours leaves small residuals almost everywhere. Measured on
 * this raster type: Paeth 2.91 MB, adaptive 2.94, Sub 3.20, None 5.64.
 */
function encode(elev, size) {
  const png = new PNG({ width: size, height: size, colorType: 2 })
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(elev[i] / QUANT_M) * QUANT_M + 32768
    const r = Math.floor(v / 256)
    const g = Math.floor(v - r * 256)
    const o = i * 4
    png.data[o] = r
    png.data[o + 1] = g
    png.data[o + 2] = Math.round((v - Math.floor(v)) * 256) & 0xff
    png.data[o + 3] = 255
  }
  return PNG.sync.write(png, { deflateLevel: 9, filterType: 4 })
}

function resample(windows, bbox, size) {
  const elev = new Float32Array(size * size)
  let min = Infinity
  let max = -Infinity
  let voids = 0
  const lonSpan = bbox.east - bbox.west
  const latSpan = bbox.north - bbox.south
  for (let y = 0; y < size; y++) {
    // Sample at pixel CENTRES: sampling edges instead stretches the raster by
    // half a cell and skews every distance downstream.
    const lat = bbox.north - ((y + 0.5) / size) * latSpan
    for (let x = 0; x < size; x++) {
      const lon = bbox.west + ((x + 0.5) / size) * lonSpan
      let v = sample(windows, lon, lat)
      if (v === null) {
        voids++
        v = min === Infinity ? 0 : min
      }
      elev[y * size + x] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  return { elev, min, max, voids }
}

async function bake(site) {
  const dir = path.join(OUT, site.id)
  await mkdir(dir, { recursive: true })
  const windows = await readWindows(site.bbox)
  if (!windows.length) throw new Error(`${site.id}: no tile overlapped the bounding box`)

  const full = resample(windows, site.bbox, SIZE)
  if (full.voids) log(`WARNING ${site.id}: ${full.voids} void samples`)

  const midLat = (site.bbox.north + site.bbox.south) / 2
  const dl = degLengths(midLat)
  const widthM = (site.bbox.east - site.bbox.west) * dl.lon
  const heightM = (site.bbox.north - site.bbox.south) * dl.lat

  await writeFile(path.join(dir, 'heightmap.png'), encode(full.elev, SIZE))
  const prev = resample(windows, site.bbox, PREVIEW)
  await writeFile(path.join(dir, 'preview.png'), encode(prev.elev, PREVIEW))

  // Verify by decoding the file just written, not the in-memory buffer — the
  // only check that would catch a stride bug.
  const { PNG: P } = await import('pngjs')
  const back = P.sync.read(await (await import('node:fs/promises')).readFile(path.join(dir, 'heightmap.png')))
  let worst = 0
  for (let i = 0; i < SIZE * SIZE; i += 97) {
    const o = i * 4
    const dec = back.data[o] * 256 + back.data[o + 1] + back.data[o + 2] / 256 - 32768
    worst = Math.max(worst, Math.abs(dec - full.elev[i]))
  }
  if (worst > QUANT_M) throw new Error(`${site.id}: encoding error ${worst} m exceeds quantisation`)

  const meta = {
    id: site.id,
    source: 'Copernicus GLO-30 DEM (ESA / Copernicus Programme), AWS open-data mirror',
    encoding: 'terrarium-rgb: elev_m = (R*256 + G + B/256) - 32768',
    quantisationM: QUANT_M,
    bbox: site.bbox,
    width: SIZE,
    height: SIZE,
    previewWidth: PREVIEW,
    minElev: Math.round(full.min * 100) / 100,
    maxElev: Math.round(full.max * 100) / 100,
    widthM: Math.round(widthM),
    heightM: Math.round(heightM),
    metersPerPixelX: Math.round((widthM / SIZE) * 1000) / 1000,
    metersPerPixelY: Math.round((heightM / SIZE) * 1000) / 1000,
  }
  await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')

  const bytes = (await stat(path.join(dir, 'heightmap.png'))).size
  const pbytes = (await stat(path.join(dir, 'preview.png'))).size
  const relief = full.max - full.min
  log(
    `${site.id.padEnd(14)} ${(widthM / 1000).toFixed(1)}x${(heightM / 1000).toFixed(1)} km  ` +
      `${full.min.toFixed(0)}–${full.max.toFixed(0)} m  1:${(widthM / relief).toFixed(1)}  ` +
      `${(bytes / 1e6).toFixed(2)} MB + ${(pbytes / 1e3).toFixed(0)} KB preview  ` +
      `(round-trip ${worst.toFixed(3)} m)`,
  )
  return { meta, bytes, pbytes }
}

const writeManifest = async (entries) => {
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify({ sites: entries }, null, 2) + '\n')
  log(`wrote manifest.json — ${entries.length} sites`)
}

async function main() {
  const arg = process.argv[2]

  // Render settings only. Read back each site's meta.json rather than trusting
  // relief-sites.mjs for it: the measured figures belong to the raster on disk,
  // and re-deriving them here would let the manifest describe a bake that never
  // happened.
  if (arg === '--manifest') {
    const entries = []
    for (const site of SITES) {
      const meta = JSON.parse(await readFile(path.join(OUT, site.id, 'meta.json'), 'utf8'))
      entries.push(manifestEntry(site, meta))
    }
    await writeManifest(entries)
    return
  }

  const list = arg ? [siteById(arg)].filter(Boolean) : SITES
  if (!list.length) throw new Error(`unknown site "${arg}"`)
  await mkdir(OUT, { recursive: true })

  let total = 0
  const entries = []
  for (const site of list) {
    const { meta, bytes, pbytes } = await bake(site)
    total += bytes + pbytes
    entries.push(manifestEntry(site, meta))
  }

  // Only rewrite the manifest on a full bake, so a single-site run cannot
  // silently drop the others.
  if (!arg) {
    await writeManifest(entries)
    log(`${(total / 1e6).toFixed(2)} MB total`)
  } else {
    log('single-site bake: manifest left untouched — run --manifest to republish')
  }
}

main().catch((e) => {
  console.error('[relief] FAILED:', e.message)
  process.exit(1)
})
