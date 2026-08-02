import * as THREE from 'three'
import type { ReliefMeta } from './meta'

/**
 * Loads the Terrarium heightmap once and produces both consumers of it:
 * the GPU texture the shaders sample, and a CPU-side grid for picking.
 *
 * Both are needed. The terrain is displaced in the vertex shader, so the
 * geometry three.js would raycast against is still a flat plane — picking off
 * it would place the observer wherever the *undisplaced* plane meets the ray,
 * which is wrong by kilometres at an oblique camera angle. Marching the pointer
 * ray against this grid instead gives the actual surface hit.
 *
 * Previously each side loaded the file itself. The browser deduplicated the
 * request, so it cost one download but two full PNG decodes of a 1536² image.
 * Streaming it once gives a single decode and real byte progress to report.
 */

export type Heightfield = {
  width: number
  height: number
  /** Bilinear elevation in metres at normalised (u, v). v = 1 is the north edge. */
  elevAt: (u: number, v: number) => number
  data: Float32Array
}

export type Heightmap = {
  texture: THREE.Texture
  field: Heightfield
}

export async function loadHeightmap(
  url: string,
  meta: ReliefMeta,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Heightmap> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`heightmap: HTTP ${res.status}`)

  // Stream so the page can show progress — this is ~3 MB, long enough on a
  // phone connection that a bare spinner reads as broken.
  const total = Number(res.headers.get('content-length')) || 0
  let blob: Blob
  if (res.body && total) {
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      onProgress?.(loaded, total)
    }
    blob = new Blob(chunks as BlobPart[], { type: 'image/png' })
  } else {
    blob = await res.blob()
    onProgress?.(1, 1)
  }

  // Decode once, flipped at decode time. three's flipY does not apply to an
  // ImageBitmap source, so the flip has to happen here to keep v = 1 on the
  // north edge — the orientation both the shader and elevAt below assume.
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' })

  const texture = new THREE.Texture(bitmap)
  texture.flipY = false // already flipped above; flipping again would undo it
  // NearestFilter + NoColorSpace: the viewshed march and the normal differences
  // both need the raw sample. Interpolating or sRGB-decoding a Terrarium triple
  // across a G-channel wrap yields a garbage elevation spike of hundreds of
  // metres.
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.NoColorSpace
  texture.needsUpdate = true

  const { width, height } = meta
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) throw new Error('heightfield: no 2d context')
  ctx.drawImage(bitmap, 0, 0, width, height)
  const rgba = ctx.getImageData(0, 0, width, height).data

  const data = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    data[i] = rgba[o] * 256 + rgba[o + 1] + rgba[o + 2] / 256 - 32768
  }

  // The bitmap was flipped at decode, so canvas row 0 is the raster's LAST row
  // — the southern edge. v therefore maps to rows directly rather than inverted.
  const elevAt = (u: number, v: number) => {
    const x = Math.min(Math.max(u, 0), 1) * (width - 1)
    const y = Math.min(Math.max(v, 0), 1) * (height - 1)
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

  return { texture, field: { width, height, elevAt, data } }
}
