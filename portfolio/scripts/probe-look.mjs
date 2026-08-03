#!/usr/bin/env node
/**
 * probe-look.mjs — what each site actually looks like, as numbers.
 *
 *   node scripts/probe-look.mjs [baseUrl] [outDir]
 *
 * Four sites now share one shader, one lighting model and one exposure, but
 * each brings its own two-stop palette and its own sun. That is four chances
 * for a site to come out crushed to black or blown to white while the other
 * three look fine, and a screenshot glanced at proves nothing about the tail of
 * the histogram.
 *
 * So measure the tail. Per site:
 *
 *   crushed   share of terrain pixels below 12/255. Anything much above zero is
 *             detail that exists in the elevation model and not on the screen.
 *   blown     share above 250/255.
 *   darkSd    standard deviation WITHIN the darkest quartile. The number that
 *             separates "dark" from "black": a shadowed slope should still have
 *             structure in it. The single-factor lighting model this shader
 *             replaced measured 0.43 here; the two-term one measured 2.70.
 *   mean      overall brightness, for comparison across sites.
 *
 * Writes a PNG per site alongside the figures so the two can be checked against
 * each other. Not part of the smoke suite — this is a measuring instrument, not
 * a gate.
 */
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? '/tmp/relief-look'
const SITES = ['Grand Canyon', 'Matterhorn', 'Crater Lake', 'Death Valley']

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(`${BASE}/#/demos/relief`, { waitUntil: 'networkidle' })
await p.waitForTimeout(9000)

const { PNG } = await import('pngjs')

/**
 * Sample the right half of the frame, clear of the control panel. Sky is
 * excluded by luminance — it is the darkest thing on screen and would otherwise
 * dominate the "crushed" figure with pixels that are supposed to be dark.
 */
function analyse(buf) {
  const img = PNG.sync.read(buf)
  const lum = []
  for (let i = 0; i < img.width * img.height; i++) {
    const o = i * 4
    const v = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2]
    // The sky gradient tops out around 40/255; terrain in shadow starts above
    // it. A fixed cut is crude but stable across sites, which is the point.
    if (v < 8) continue
    lum.push(v)
  }
  if (!lum.length) return null
  lum.sort((a, b) => a - b)
  const mean = lum.reduce((s, v) => s + v, 0) / lum.length
  const q = lum.slice(0, Math.floor(lum.length / 4))
  const qm = q.reduce((s, v) => s + v, 0) / q.length
  const darkSd = Math.sqrt(q.reduce((s, v) => s + (v - qm) ** 2, 0) / q.length)
  return {
    mean,
    darkSd,
    crushed: lum.filter((v) => v < 12).length / lum.length,
    blown: lum.filter((v) => v > 250).length / lum.length,
  }
}

console.log('site            mean   darkSd   crushed   blown')
for (const name of SITES) {
  await p.getByRole('button', { name, exact: true }).click()
  await p.waitForTimeout(8000)
  const clip = { x: 380, y: 60, width: 1040, height: 780 }
  const buf = await p.screenshot({ clip })
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  await writeFile(path.join(OUT, `${slug}.png`), buf)
  const a = analyse(buf)
  console.log(
    `${name.padEnd(14)} ${a.mean.toFixed(1).padStart(5)}   ${a.darkSd.toFixed(2).padStart(5)}   ` +
      `${(a.crushed * 100).toFixed(2).padStart(6)}%  ${(a.blown * 100).toFixed(2).padStart(5)}%`,
  )
}

await browser.close()
console.log(`\nwrote ${SITES.length} frames to ${OUT}`)
