/** Shape of public/relief/meta.json, written by scripts/bake-relief.mjs. */
export type ReliefMeta = {
  source: string
  encoding: string
  quantisationM: number
  bbox: { north: number; south: number; west: number; east: number }
  width: number
  height: number
  minElev: number
  maxElev: number
  /** Ground extent of the raster, metres. */
  widthM: number
  heightM: number
  /** Ground sample distance. Differs per axis: a degree of longitude is
   *  shorter than a degree of latitude at 36°N. */
  metersPerPixelX: number
  metersPerPixelY: number
}

export async function loadReliefMeta(): Promise<ReliefMeta> {
  const res = await fetch(`${import.meta.env.BASE_URL}relief/meta.json`)
  if (!res.ok) throw new Error(`relief meta: HTTP ${res.status}`)
  return res.json()
}
