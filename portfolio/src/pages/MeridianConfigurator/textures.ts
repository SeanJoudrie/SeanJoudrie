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
