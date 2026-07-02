#!/usr/bin/env node
/**
 * Meridian configurator smoke suite. A smoke, not a pixel-perfect visual
 * regression: thresholds are generous by design (GPU output varies), and
 * screen-reader behavior is approximated by ARIA assertions, not a real SR.
 *
 * Usage:  npm run build && npx vite preview --port 4173 &
 *         node scripts/smoke-meridian.mjs [base-url]
 * Env:    PW_CHROMIUM=/path/to/chromium   (optional executable override)
 *
 * Needs devDeps: playwright-core, pngjs.
 */
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/meridian`
const LAUNCH = {
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
}

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const decode = (buf) => PNG.sync.read(buf)
/** Mean per-pixel abs diff (0–765). The 1Hz seconds hand moves <2% of
    pixels between shots; a material/dial swap moves far more. */
const meanDiff = (a, b) => {
  const A = decode(a)
  const B = decode(b)
  let sum = 0
  const n = Math.min(A.data.length, B.data.length)
  for (let i = 0; i < n; i += 4)
    sum += Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2])
  return sum / (n / 4)
}
const litFraction = (buf) => {
  const img = decode(buf)
  let lit = 0
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i] + img.data[i + 1] + img.data[i + 2] > 120) lit++
  return lit / (img.data.length / 4)
}

const browser = await chromium.launch(LAUNCH)
const pageErrors = []

// ---- Reduced-motion context: deterministic (no autorotate, no entrance). --
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => pageErrors.push(String(e)))
  await p.addInitScript(() => {
    window.__raf = 0
    const orig = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (fn) =>
      orig((t) => {
        window.__raf++
        fn(t)
      })
  })
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)

  const canvas = p.locator('canvas')
  const box = await canvas.boundingBox()
  check('canvas renders', !!box)
  const shot = () => canvas.screenshot()
  let before = await shot()
  check('scene paints (not a black box)', litFraction(before) > 0.04, `${(litFraction(before) * 100).toFixed(1)}% lit`)

  // Idle rendering budget: the 1Hz quartz tick only.
  await p.evaluate(() => (window.__raf = 0))
  await p.waitForTimeout(3000)
  const raf = await p.evaluate(() => window.__raf)
  check('idle ≈ 1Hz (quartz tick, demand frameloop)', raf >= 1 && raf <= 14, `${raf} frames in 3s`)

  // Every material family actually re-renders the watch.
  for (const label of ['Titanium', 'Black ceramic', 'Silver sunray', 'Steel bracelet']) {
    await p.click(`button:has-text("${label}")`)
    await p.waitForTimeout(700)
    const after = await shot()
    check(`option renders: ${label}`, meanDiff(before, after) > 2, `Δ ${meanDiff(before, after).toFixed(1)}`)
    before = after
  }

  check(
    'selection rides the URL',
    await p.evaluate(() => /case=titanium/.test(location.hash) && /strap=bracelet/.test(location.hash)),
  )
  const price = await p.locator('section:has(h2:text("Demo pricing"))').textContent()
  check('price recomputed', /\$1,880/.test(price ?? ''), 'expected $1,880 for titanium+ceramic+bracelet')

  // Keyboard-only path.
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  let reached = false
  for (let i = 0; i < 50; i++) {
    await p.keyboard.press('Tab')
    // Must be a real config chip — <body>'s textContent matches anything.
    const onChip = await p.evaluate(() => {
      const el = document.activeElement
      return el?.tagName === 'BUTTON' && el.hasAttribute('aria-pressed') && (el.textContent ?? '').includes('Titanium')
    })
    if (onChip) {
      reached = true
      break
    }
  }
  check('keyboard reaches the chips', reached)
  await p.keyboard.press('Enter')
  await p.waitForTimeout(300)
  check('keyboard selects', await p.evaluate(() => document.activeElement?.getAttribute('aria-pressed') === 'true'))
  check('live region narrates', ((await p.locator('[aria-live="polite"]').textContent()) ?? '').includes('Titanium'))

  // Deep link + garbage.
  await p.goto(`${URL}?case=pvd&dial=silver&strap=rubber&bogus=<script>`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  check('deep link applies', (await p.locator('button[aria-pressed="true"]:has-text("Black PVD")').count()) === 1)
  check('garbage params ignored', (await p.locator('button[aria-pressed="true"]:has-text("Polished")').count()) === 1)

  // Context loss → fallback, panel still alive.
  await p.evaluate(() => {
    const c = document.querySelector('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await p.waitForTimeout(600)
  check('context loss → fallback', (await p.locator("text=3D preview isn't available").count()) === 1)
  check('panel survives fallback', (await p.locator('button:has-text("18k gold")').count()) === 1)
  await ctx.close()
}

// ---- Full-motion context: orbit fps + autorotate. ------------------------
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  p.on('pageerror', (e) => pageErrors.push(String(e)))
  await p.addInitScript(() => {
    window.__raf = 0
    const orig = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (fn) =>
      orig((t) => {
        window.__raf++
        fn(t)
      })
  })
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  const box = await p.locator('canvas').boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await p.evaluate(() => (window.__raf = 0))
  await p.mouse.move(cx, cy)
  await p.mouse.down()
  await p.mouse.move(cx + 250, cy - 60, { steps: 40 })
  await p.mouse.up()
  const fps = (await p.evaluate(() => window.__raf)) / 1.0
  // Sanity floor only: this environment renders on SwiftShader (software).
  check('orbit renders continuously', fps > 15, `~${fps.toFixed(0)} frames during a ~1s drag`)

  const beforeIdle = await p.locator('canvas').screenshot()
  await p.waitForTimeout(8000) // 6s arm + spin
  const afterIdle = await p.locator('canvas').screenshot()
  check('autorotate spins when idle', meanDiff(beforeIdle, afterIdle) > 1)
  await p.close()
}

// ---- No WebGL at all → fallback. ------------------------------------------
{
  const b2 = await chromium.launch({ ...LAUNCH, args: ['--disable-webgl', '--disable-webgl2'] })
  const p = await b2.newPage({ viewport: { width: 1440, height: 1000 } })
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  check('no-WebGL → fallback, no black box', (await p.locator("text=3D preview isn't available").count()) === 1)
  check('no-WebGL panel functional', (await p.locator('button:has-text("Steel bracelet")').count()) === 1)
  await b2.close()
}

// ---- Mobile viewport. ------------------------------------------------------
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  const box = await p.locator('canvas').boundingBox()
  check('mobile: canvas fits', !!box && box.width <= 390)
  check(
    'mobile: no horizontal scroll',
    await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  )
  await p.close()
}

check('zero page errors across all contexts', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
