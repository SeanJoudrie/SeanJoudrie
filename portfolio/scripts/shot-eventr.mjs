#!/usr/bin/env node
/**
 * shot-eventr.mjs — card and gallery captures for the Eventr case study.
 *
 *   node scripts/shot-eventr.mjs [baseUrl]
 *
 * Eventr is an Expo / React Native Web app published as a static export, so it
 * screenshots like any other site — but it is NOT part of this repo, and it is
 * on a different origin. Playwright in this sandbox cannot reach the public
 * host, so the default base URL points at a local mirror:
 *
 *   curl -s https://seanjoudrie.github.io/eventr/ -o eventr/index.html
 *   # plus the one JS bundle it references, at the same path
 *   python3 -m http.server 4599
 *   node scripts/shot-eventr.mjs http://localhost:4599
 *
 * Captured at 430x932 — an iPhone 16 Pro — because that is the device the app is
 * designed for and the only aspect where its layout is the intended one.
 *
 * TWO SHAPES, on purpose. The card slot is 16:10 and crops from the top, so
 * handing it a full-length phone screenshot means shipping an image of which
 * 71% is never seen — measured. The card gets its own clip of the top 430x269:
 * header, town, count, time filters and the first card, which is the part that
 * says what the product is. The gallery inside the case study gets the
 * full-length shots, where their shape is the point.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4599'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'shots')

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 })

/** Re-encode a PNG buffer to WebP through the browser, no image library. */
const encoder = await browser.newPage()
const toWebp = async (png, quality = 0.84) => {
  const url = await encoder.evaluate(
    async ([b64, q]) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      return c.toDataURL('image/webp', q)
    },
    [png.toString('base64'), quality],
  )
  if (!url.startsWith('data:image/webp')) throw new Error('browser did not encode webp')
  return Buffer.from(url.split(',')[1], 'base64')
}

await mkdir(OUT, { recursive: true })
await page.goto(`${BASE}/eventr/`, { waitUntil: 'load', timeout: 60000 })
// The location gate is the first screen; the feed only exists once a town is
// chosen, and the choice is persisted per device.
await page.waitForTimeout(7000)
await page.getByText('Wakefield', { exact: false }).first().click()
await page.waitForTimeout(5000)

const shots = [
  // 16:10 for the card. 430 x 269 is the top of the feed at the exact aspect
  // the slot crops to, so nothing is thrown away.
  ['eventr-plate', async () => page.screenshot({ clip: { x: 0, y: 0, width: 430, height: 269 } })],
  ['eventr-feed', async () => page.screenshot()],
  [
    'eventr-detail',
    async () => {
      await page.getByText('Thursday Night Lake Loop').first().click({ force: true })
      await page.waitForTimeout(3500)
      return page.screenshot()
    },
  ],
]

for (const [name, take] of shots) {
  const webp = await toWebp(await take())
  await writeFile(path.join(OUT, `${name}.webp`), webp)
  console.log(`[eventr] ${name}.webp — ${(webp.length / 1024).toFixed(0)} KB`)
}

await browser.close()
