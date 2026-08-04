#!/usr/bin/env node
/**
 * shot-relief-card.mjs — the Relief card's thumbnail, captured from the demo.
 *
 *   node scripts/shot-relief-card.mjs [baseUrl]
 *
 * The card used to carry a hand-drawn SVG schematic: a canyon in section with a
 * dashed sight line. It read as a placeholder, because that is what a diagram
 * standing in for a render looks like — and the demo behind it is the most
 * visually striking thing on the page. This captures the actual scene instead.
 *
 * The frame is addressed by a SHARE LINK rather than by a sequence of clicks, so
 * it is reproducible: the same URL renders the same view, and changing which
 * view the card shows means editing one query string. Chosen for what it proves
 * in one glance — a flooded canyon showing terrain, a water surface with a real
 * coastline, and the viewshed overlay on the near plateau, all at once.
 *
 * Captured from the CANVAS element, not the viewport: the page chrome would
 * otherwise have to be hidden, and hiding it reflows the canvas without
 * necessarily resizing the drawing buffer, which left a black band along the
 * bottom of every early attempt.
 *
 * WebP is encoded by Chromium itself through a canvas rather than by adding an
 * image library to the build. It is the browser that will decode it.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'shots', 'relief-card.webp')

/** The view. A share link, so this is exactly what a visitor would see. */
const VIEW = '?site=grand-canyon&o=0.3,0.3&t=14.43&d=3&w=1300'
/** Card aspect is 7:4; 1120x640 covers a 2x display at the size it renders. */
const W = 1120
const H = 640
const QUALITY = 0.82

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

// Size the viewport so the canvas itself lands on 7:4 once the header and
// footer have taken their share.
const page = await browser.newPage({
  viewport: { width: W, height: H + 104 },
  deviceScaleFactor: 2,
})
await page.goto(`${BASE}/#/demos/relief${VIEW}`, { waitUntil: 'networkidle' })
// The full raster has to download and decode, and the shadow and viewshed
// passes have to run, before the frame is worth keeping.
await page.waitForTimeout(14000)

const canvas = page.locator('canvas').first()
const png = await canvas.screenshot()
const box = await canvas.boundingBox()
console.log(`[card] canvas ${Math.round(box.width)}x${Math.round(box.height)} css`)

// Re-encode through a canvas at the target size.
const encoder = await browser.newPage()
const dataUrl = await encoder.evaluate(
  async ([b64, w, h, q]) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    // Cover: crop rather than squash if the source aspect drifted.
    const scale = Math.max(w / img.width, h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    return c.toDataURL('image/webp', q)
  },
  [png.toString('base64'), W, H, QUALITY],
)

if (!dataUrl.startsWith('data:image/webp')) throw new Error('browser did not encode webp')
const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
await writeFile(OUT, bytes)
console.log(`[card] wrote ${path.relative(ROOT, OUT)} — ${W}x${H}, ${(bytes.length / 1024).toFixed(0)} KB`)

await browser.close()
