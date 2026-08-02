import type { ReliefMeta } from './meta'

/**
 * CPU-side copy of the elevation grid, decoded from the same Terrarium PNG the
 * shader reads.
 *
 * The terrain is displaced in the vertex shader, so the geometry three.js would
 * raycast against is still a flat plane — picking off it would place the
 * observer wherever the *undisplaced* plane happens to intersect the ray, which
 * is wrong by kilometres at an oblique camera angle. Marching the pointer ray
 * against this grid instead gives the actual surface hit.
 */
export type Heightfield = {
  width: number
  height: number
  /** Bilinear elevation in metres at normalised (u, v). v=1 is the north edge. */
  elevAt: (u: number, v: number) => number
  data: Float32Array
}

export async function loadHeightfield(url: string, meta: ReliefMeta): Promise<Heightfield> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  await img.decode()

  const { width, height } = meta
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) throw new Error('heightfield: no 2d context')
  ctx.drawImage(img, 0, 0, width, height)
  const rgba = ctx.getImageData(0, 0, width, height).data

  // Row 0 of the PNG is the north edge. The GPU sees it flipped (v=1 is north);
  // store it in the same orientation here so both agree on what v means.
  const data = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    data[i] = rgba[o] * 256 + rgba[o + 1] + rgba[o + 2] / 256 - 32768
  }

  const elevAt = (u: number, v: number) => {
    const x = Math.min(Math.max(u, 0), 1) * (width - 1)
    // v=1 (north) maps to raster row 0
    const y = (1 - Math.min(Math.max(v, 0), 1)) * (height - 1)
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = Math.min(x0 + 1, width - 1)
    const y1 = Math.min(y0 + 1, height - 1)
    const tx = x - x0
    const ty = y - y0
    const a = data[y0 * width + x0]
    const b = data[y0 * width + x1]
    const c = data[y1 * width + x0]
    const d = data[y1 * width + x1]
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
  }

  return { width, height, elevAt, data }
}
