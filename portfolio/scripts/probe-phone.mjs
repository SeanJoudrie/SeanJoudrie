#!/usr/bin/env node
/**
 * probe-phone.mjs — how much of a phone screen the terrain actually gets.
 *
 *   node scripts/probe-phone.mjs [baseUrl] [outDir]
 *
 * The demo was built and tuned on a 1440 px viewport, where the control panel
 * is a side card and costs nothing. On a phone it is a bottom sheet stacked on
 * top of a header and a footer, and the thing the page exists to show ends up
 * with whatever is left. "Looks cramped" is not a number; this is.
 *
 * Reports, at 375x812:
 *   chrome      share of the viewport covered by header, panel and footer
 *   terrain     share showing terrain — sampled, not assumed, by counting
 *               pixels that are neither sky nor covered by chrome
 *   panelH      panel height in CSS pixels
 */
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? '/tmp/relief-phone'
const VIEW = { width: 375, height: 812 }

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const p = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await p.goto(`${BASE}/#/demos/relief`, { waitUntil: 'networkidle' })
await p.waitForTimeout(12000)

const boxes = await p.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, height: r.height }
  }
  return {
    header: pick('header'),
    footer: pick('footer'),
    panel: pick('.relief-panel') ?? pick('main .absolute.inset-x-0 > div'),
    vh: window.innerHeight,
  }
})

const buf = await p.screenshot()
await writeFile(path.join(OUT, 'phone.png'), buf)

const { PNG } = await import('pngjs')
const img = PNG.sync.read(buf)
const scale = img.width / VIEW.width

// Terrain is anything that is neither the near-black sky nor chrome. The sky
// gradient tops out well under 40/255; lit rock starts far above it.
const covered = [boxes.header, boxes.footer, boxes.panel].filter(Boolean)
let terrain = 0
let sky = 0
let chrome = 0
for (let y = 0; y < img.height; y++) {
  const cssY = y / scale
  const inChrome = covered.some((b) => cssY >= b.top && cssY < b.top + b.height)
  for (let x = 0; x < img.width; x++) {
    if (inChrome) {
      chrome++
      continue
    }
    const o = (y * img.width + x) * 4
    const v = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2]
    if (v < 45) sky++
    else terrain++
  }
}
const total = img.width * img.height

console.log(`viewport    ${VIEW.width}x${VIEW.height}`)
for (const [k, b] of Object.entries(boxes)) {
  if (b && typeof b === 'object') console.log(`${k.padEnd(11)} top ${b.top.toFixed(0)}  height ${b.height.toFixed(0)}`)
}
console.log(`chrome      ${((chrome / total) * 100).toFixed(1)}%`)
console.log(`sky         ${((sky / total) * 100).toFixed(1)}%`)
console.log(`terrain     ${((terrain / total) * 100).toFixed(1)}%`)

await browser.close()
console.log(`\nwrote ${path.join(OUT, 'phone.png')}`)
