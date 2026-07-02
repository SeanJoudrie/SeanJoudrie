import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Procedural texture recipes — the zero-asset policy's paintbrush. Every
 * map on the watch is drawn here with the 2D canvas API at build-the-scene
 * time, so option swaps only rebind already-built textures.
 */

export type DialSpec = {
  /** Center of the sunray. */
  base: string
  /** Outer edge of the sunray. */
  deep: string
  /** Print ink: minute track, brand. */
  ink: string
}

export function makeDialTexture({ base, deep, ink }: DialSpec): CanvasTexture {
  const S = 1024
  const R = S / 2
  const c = document.createElement('canvas')
  c.width = c.height = S
  const x = c.getContext('2d')!

  // Base — lighter center falling to a deeper rim.
  const rad = x.createRadialGradient(R, R, S * 0.04, R, R, R)
  rad.addColorStop(0, base)
  rad.addColorStop(1, deep)
  x.fillStyle = rad
  x.fillRect(0, 0, S, S)

  // Sunray — a conic ripple of light, the way brushed dials catch a key.
  if ('createConicGradient' in x) {
    const conic = x.createConicGradient(-Math.PI / 2, R, R)
    const STOPS = 192
    for (let i = 0; i <= STOPS; i++) {
      const t = i / STOPS
      const a = 0.085 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 24))
      conic.addColorStop(t, `rgba(255,255,255,${a.toFixed(4)})`)
    }
    x.fillStyle = conic
    x.globalCompositeOperation = 'overlay'
    x.fillRect(0, 0, S, S)
    x.globalCompositeOperation = 'source-over'
  }

  // Vignette seats the dial under the bezel.
  const vig = x.createRadialGradient(R, R, R * 0.62, R, R, R)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.28)')
  x.fillStyle = vig
  x.fillRect(0, 0, S, S)

  // Minute track — 60 ticks, longer and heavier every 5th.
  x.strokeStyle = ink
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2
    const major = m % 5 === 0
    const r0 = R * (major ? 0.83 : 0.855)
    const r1 = R * 0.885
    x.lineWidth = major ? 5 : 2.5
    x.beginPath()
    x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0)
    x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1)
    x.stroke()
  }

  // Brand print. Inter is already the site's loaded webfont.
  x.fillStyle = ink
  x.textAlign = 'center'
  x.font = '600 44px Inter, system-ui, sans-serif'
  try {
    x.letterSpacing = '14px'
  } catch {
    /* older canvas — spacing is a nicety */
  }
  x.fillText('MERIDIAN', R + 7, S * 0.335)
  x.font = '500 26px Inter, system-ui, sans-serif'
  try {
    x.letterSpacing = '8px'
  } catch {
    /* ditto */
  }
  x.fillText('ONE', R + 4, S * 0.665)
  x.font = '500 20px Inter, system-ui, sans-serif'
  x.fillText('QUARTZ · 40 MM', R + 4, S * 0.71)

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Grayscale leather grain — pores and a few creases — used as a bump map
    across every leather color (the material's color does the rest). */
export function makeLeatherBump(): CanvasTexture {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const x = c.getContext('2d')!
  x.fillStyle = '#808080'
  x.fillRect(0, 0, S, S)
  // Deterministic speckle — mulberry-style hash so builds are identical.
  let seed = 42
  const rand = () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 0; i < 5200; i++) {
    const r = 0.6 + rand() * 2.1
    x.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${0.05 + rand() * 0.07})` : `rgba(0,0,0,${0.06 + rand() * 0.08})`
    x.beginPath()
    x.ellipse(rand() * S, rand() * S, r, r * (0.6 + rand() * 0.8), rand() * Math.PI, 0, Math.PI * 2)
    x.fill()
  }
  // A few soft creases along the strap's length.
  x.strokeStyle = 'rgba(0,0,0,0.10)'
  for (let i = 0; i < 14; i++) {
    x.lineWidth = 1 + rand() * 2
    x.beginPath()
    const y0 = rand() * S
    x.moveTo(0, y0)
    x.bezierCurveTo(S * 0.33, y0 + (rand() - 0.5) * 40, S * 0.66, y0 + (rand() - 0.5) * 40, S, y0 + (rand() - 0.5) * 30)
    x.stroke()
  }
  const tex = new CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}
