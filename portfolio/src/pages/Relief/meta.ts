/** Shape of public/relief/<id>/meta.json, written by scripts/bake-relief.mjs. */
export type ReliefMeta = {
  id: string
  source: string
  encoding: string
  quantisationM: number
  bbox: { north: number; south: number; west: number; east: number }
  width: number
  height: number
  previewWidth: number
  minElev: number
  maxElev: number
  /** Ground extent of the raster, metres. */
  widthM: number
  heightM: number
  /** Ground sample distance. Differs per axis: a degree of longitude is
   *  shorter than a degree of latitude away from the equator. */
  metersPerPixelX: number
  metersPerPixelY: number
}

/** A site as described by public/relief/manifest.json. */
export type ReliefSite = {
  id: string
  name: string
  subtitle: string
  note: string
  /** Compass azimuth and elevation, degrees. The most site-specific value
   *  there is — a crater wants 15–20°, a peak wants 30°+ or its faces go
   *  black. */
  sun: { azimuth: number; elevation: number }
  contourM: number
  /** Opening observer position, chosen by VS_SEARCH — see relief-sites.mjs. */
  seed: { u: number; v: number }
  /** Two-stop ramp, lowest ground in the frame to highest. Death Valley's runs
   *  pale to dark: its salt flat is the brightest thing in the frame and the
   *  lowest. */
  palette: { low: string; high: string }
  /** Flood surface. 'min' means the lowest ground in the frame — see
   *  relief-sites.mjs for why only two of the four sites name a level. */
  water: {
    default: number | 'min' | null
    presets: { label: string; at: number | 'min' }[]
  }
  meta: ReliefMeta
}

/**
 * Resolve a water level that may be expressed as 'min'.
 *
 * 'min' resolves to one quantisation step ABOVE the lowest ground, not to it.
 * minElev is measured from the resampled floats before encoding, while the
 * raster the flood test actually reads has been quantised to 0.5 m — so the two
 * disagree by up to a quarter of a metre in either direction. Using minElev
 * directly made Crater Lake's lake surface, which is the lowest ground in that
 * frame and dead flat, land fractionally ABOVE the waterline: the plane
 * discarded everywhere and the site reported 0.0 km² flooded. Half a metre is
 * inside the DEM's own precision and puts the surface reliably under.
 */
export const waterAt = (at: number | 'min' | null, m: ReliefMeta): number | null =>
  at === null ? null : at === 'min' ? m.minElev + m.quantisationM : at

/** The preview tier is the same raster at 256² — a real elevation model, not a
 *  thumbnail, so it can carry the terrain while the full map downloads. */
export function previewMeta(m: ReliefMeta): ReliefMeta {
  const n = m.previewWidth
  return {
    ...m,
    width: n,
    height: n,
    metersPerPixelX: m.widthM / n,
    metersPerPixelY: m.heightM / n,
  }
}

const base = () => `${import.meta.env.BASE_URL}relief`

export const heightmapUrl = (id: string) => `${base()}/${id}/heightmap.png`
export const previewUrl = (id: string) => `${base()}/${id}/preview.png`

export async function loadManifest(): Promise<ReliefSite[]> {
  const res = await fetch(`${base()}/manifest.json`)
  if (!res.ok) throw new Error(`relief manifest: HTTP ${res.status}`)
  const json = (await res.json()) as { sites: ReliefSite[] }
  if (!json.sites?.length) throw new Error('relief manifest: no sites')
  return json.sites
}

/**
 * Vertical exaggeration for a site, derived from its own measured geometry
 * rather than hard-coded.
 *
 * Target an effective ratio near 1:7 — dramatic without the stalagmite look
 * that starts around 3× — and never go below true scale. The Grand Canyon
 * (1:10.9) lands near 1.6×; the Matterhorn (1:5.2) correctly comes out at 1.0×
 * with no special case, which is the point of deriving it.
 */
export const EXAG_MIN = 1
export const EXAG_MAX = 4
export function defaultExaggeration(m: ReliefMeta) {
  const relief = m.maxElev - m.minElev
  if (relief <= 0) return 1
  return Math.min(Math.max(m.widthM / relief / 7, EXAG_MIN), EXAG_MAX)
}
