#!/usr/bin/env node
/**
 * Relief viewshed smoke — same shape as smoke-skein.mjs. Verifies the page
 * loads, the terrain canvas gets a live GL context, the seeded observer
 * produces non-zero statistics, and that raising the observer both grows the
 * visible area and visibly changes the render.
 *
 * That last check matters: the viewshed pass and the terrain shader can each
 * be correct while the texture never reaches the material, in which case the
 * numbers update and the picture does not. Comparing pixels catches it.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/relief`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))
p.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(m.text())
})

await p.goto(URL, { waitUntil: 'networkidle' })
// The heightmap is ~3 MB and both the GPU texture and the CPU heightfield have
// to decode before the first viewshed can run.
await p.waitForTimeout(9000)

const gl = await p.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return null
  const ctx = c.getContext('webgl2') || c.getContext('webgl')
  return { w: c.width, h: c.height, lost: ctx ? ctx.isContextLost() : true }
})
check('canvas present with a live GL context', !!gl && !gl.lost, gl ? `${gl.w}×${gl.h}` : 'no canvas')
check('static fallback not shown', !(await p.locator('svg[role="img"]').count()))

const readStats = async () => {
  const nums = await p.$$eval('.relief-num', (els) => els.map((e) => e.textContent.trim()))
  const num = (s) => Number(String(s).replace(/[^0-9.]/g, ''))
  return { height: num(nums[0]), ground: num(nums[1]), area: num(nums[2]), pct: num(nums[3]), far: num(nums[4]) }
}

const before = await readStats()
check('observer seeded on real ground', before.ground > 500, `${before.ground} m`)
check('visible area is non-zero', before.area > 0, `${before.area} km²`)
check('furthest visible is non-zero', before.far > 0, `${before.far} km`)

/** Mean brightness of the terrain region, ignoring near-black sky. */
const brightness = async () => {
  const buf = await p.screenshot({ clip: { x: 360, y: 200, width: 1000, height: 600 } })
  const { PNG } = await import('pngjs')
  const img = PNG.sync.read(buf)
  let sum = 0
  let n = 0
  for (let i = 0; i < img.width * img.height; i++) {
    const o = i * 4
    const v = (img.data[o] + img.data[o + 1] + img.data[o + 2]) / 3
    if (v * 3 < 40) continue
    sum += v
    n++
  }
  return n ? sum / n : 0
}

const brightBefore = await brightness()
await p.getByTitle('400 m').click()
await p.waitForTimeout(4000)
const after = await readStats()
const brightAfter = await brightness()

check('raising the observer grows visible area', after.area > before.area * 1.5, `${before.area} → ${after.area} km²`)
check(
  'raising the observer changes the render',
  brightAfter > brightBefore * 1.05,
  `mean brightness ${brightBefore.toFixed(1)} → ${brightAfter.toFixed(1)}`,
)

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(failed ? `\nrelief: ${failed} check(s) failed` : '\nrelief: all checks passed')
process.exit(failed ? 1 : 0)
