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
// Hero leads into About (who), then Range (the commissioned proofs), then the
// Index of works, then the Lab. This assertion predated that reordering and
// still expected Range before About.
check(
  'section order is About → Range → Work → Lab',
  pos('about') !== -1 && pos('about') < pos('range') && pos('range') < pos('work') && pos('work') < pos('skills'),
  order.join(' → '),
)

// 2. Work: equal-weight cards, no featured double-wide (grows as projects land).
const workCards = await p.locator('#work article').count()
check('Work shows the project cards', workCards >= 4, `${workCards} articles`)

// 3. Lab: two experiments (Codex Explorer cut).
const labArticles = await p.locator('#skills article').count()
const codex = await p.locator('#skills :text("Codex Explorer")').count()
check('Lab has 2 experiments, no Codex Explorer', labArticles === 2 && codex === 0, `${labArticles} articles`)

// 4. Meridian Range card goes live: scroll it into view → canvas mounts.
await p.locator('#range').scrollIntoViewIfNeeded()
await p.waitForTimeout(300)
const meridianCard = p.locator('#range article').filter({ hasText: 'Meridian' }).first()
// Previews only mount within ~350 px of the viewport, so bring the card itself
// into view rather than relying on where the section top happens to land.
await meridianCard.scrollIntoViewIfNeeded()
await p.waitForTimeout(400)
let canvasOk = false
try {
  await meridianCard.locator('canvas').waitFor({ timeout: 15000 })
  canvasOk = true
} catch {
  canvasOk = false
}
check('Meridian card mounts a live canvas', canvasOk)

if (canvasOk) {
  const box = await meridianCard.locator('canvas').first().boundingBox()
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

/**
 * 7. Scroll reveal leaves nothing faded.
 *
 * This asserted that an inline `--reveal` dial was being written, which is the
 * mechanism the reveal rewrite deliberately deleted: an IntersectionObserver
 * used to write a 0..1 ratio that CSS interpolated opacity from, and since the
 * observer gives no guarantee of a callback at an element's resting position, a
 * fast scroll could strand whole sections at 12% opacity. A one-way `.reveal-on`
 * latch replaced it. The old assertion has been failing ever since, against code
 * that is working correctly.
 *
 * So assert the outcome instead: after scrolling the page, no block is left
 * faded. Two things this needs, both learned the hard way:
 *
 *   - Reduced motion must be emulated OFF and the page reloaded. Headless Chrome
 *     reports `reduce`, under which useReveal latches immediately and the
 *     `.reveal { opacity: 0.12 }` rule is not in the cascade at all — the whole
 *     mechanism is bypassed and the check cannot fail. Verified: with the
 *     default media state, stripping every `.reveal-on` class from the document
 *     left all 31 opacities at 1.
 *
 *   - A settle window. Latching can lag a second or more behind the scroll while
 *     the lazy 3D previews are mounting and the observer is re-firing on reflow.
 *     Measured at 1.2 s, up to 17 blocks are still mid-fade on a loaded run; by
 *     6 s it is consistently zero, on this code and on the code before it.
 */
await p.emulateMedia({ reducedMotion: 'no-preference' })
await p.reload({ waitUntil: 'networkidle' })
// 200 px steps, not viewport-sized jumps. The page grows by hundreds of pixels
// as the lazy previews mount, and a coarse programmatic scroll can outrun that
// growth and skip a block entirely — which strands it, since nothing scrolls
// again afterwards to give the observer a second chance. That is a property of
// the probe, not of the site: a reader scrolls in small continuous increments,
// and a jump straight to the bottom latches everything cleanly. Measured both.
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 200) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 50))
  }
  window.scrollTo(0, document.body.scrollHeight)
})
// Poll to a deadline rather than sampling at one instant. Latching genuinely
// lags the scroll — the observer re-fires as the lazy previews reflow the page
// — so a fixed wait tests machine load, not correctness. A single sample at 4 s
// failed one run in five against code that settles fine. What matters, and what
// a permanent regression could never satisfy, is that it reaches zero at all.
const fadedNow = () =>
  p.evaluate(() =>
    [...document.querySelectorAll('.reveal')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.9)
      .map((el) => (el.textContent || '').trim().slice(0, 24)),
  )
const settleDeadline = Date.now() + 20000
let faded = await fadedNow()
while (faded.length && Date.now() < settleDeadline) {
  await p.waitForTimeout(500)
  faded = await fadedNow()
}
const revealTotal = await p.evaluate(() => document.querySelectorAll('.reveal').length)
check(
  'every reveal block settles opaque',
  faded.length === 0,
  faded.length ? `still faded: ${faded.slice(0, 3).join(' | ')}` : `all ${revealTotal} blocks opaque`,
)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
