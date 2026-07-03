#!/usr/bin/env node
/**
 * Shell-redesign smoke — section order, equal-weight Work grid, trimmed Lab,
 * the live Meridian Range card (canvas mounts; drag orbits without
 * navigating; a clean click opens the configurator), and the theme switcher
 * (data-theme applies + persists across reload). Zero page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// 1. Section order: Hero → Range → About → Work → Lab.
const order = await p.evaluate(() =>
  Array.from(document.querySelectorAll('main section')).map((s) => s.id || s.getAttribute('aria-label') || ''),
)
const pos = (id) => order.indexOf(id)
check(
  'section order is Range → About → Work → Lab',
  pos('range') !== -1 && pos('range') < pos('about') && pos('about') < pos('work') && pos('work') < pos('skills'),
  order.join(' → '),
)

// 2. Work: four equal-weight cards, no featured double-wide.
const workCards = await p.locator('#work article').count()
check('Work shows 4 equal cards', workCards === 4, `${workCards} articles`)

// 3. Lab: two experiments (Codex Explorer cut).
const labArticles = await p.locator('#skills article').count()
const codex = await p.locator('#skills :text("Codex Explorer")').count()
check('Lab has 2 experiments, no Codex Explorer', labArticles === 2 && codex === 0, `${labArticles} articles`)

// 4. Meridian Range card goes live: scroll it into view → canvas mounts.
await p.locator('#range').scrollIntoViewIfNeeded()
await p.waitForTimeout(300)
let canvasOk = false
try {
  await p.waitForSelector('#range canvas', { timeout: 15000 })
  canvasOk = true
} catch {
  canvasOk = false
}
check('Meridian card mounts a live canvas', canvasOk)

if (canvasOk) {
  const box = await p.locator('#range canvas').boundingBox()
  // Drag to orbit — must NOT navigate.
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await p.mouse.down()
  await p.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 10, { steps: 8 })
  await p.mouse.up()
  await p.waitForTimeout(300)
  const hashAfterDrag = await p.evaluate(() => window.location.hash)
  check('dragging the watch orbits without navigating', !hashAfterDrag.startsWith('#/demos'), hashAfterDrag)

  // A clean click opens the full configurator.
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await p.waitForTimeout(700)
  check(
    'clicking the watch opens the configurator',
    (await p.evaluate(() => window.location.hash)) === '#/demos/meridian',
  )
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
}

// 5. Caption affordance under the live card.
check('customize caption present', (await p.locator('text=Click to customize').count()) >= 1)

// 6. Theme switcher: gear → Fatigues → data-theme applies and persists.
await p.locator('button[aria-label="Theme settings"]').click()
await p.waitForTimeout(250)
await p.locator('button:has-text("Fatigues")').click()
await p.waitForTimeout(250)
check(
  'preset applies data-theme',
  (await p.evaluate(() => document.documentElement.dataset.theme)) === 'fatigues',
)
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(500)
check(
  'theme persists across reload',
  (await p.evaluate(() => document.documentElement.dataset.theme)) === 'fatigues',
)
await p.evaluate(() => localStorage.removeItem('sj-theme'))

// 7. Scroll progress writes --reveal on revealed blocks.
const revealVar = await p.evaluate(() => {
  const el = document.querySelector('.reveal')
  return el ? el.style.getPropertyValue('--reveal') : ''
})
check('scroll progress writes --reveal', revealVar !== '', `--reveal="${revealVar}"`)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
