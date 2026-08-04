#!/usr/bin/env node
/**
 * Atlas Command Palette (⌘K) smoke — same shape as the other smoke-*.mjs.
 * Verifies triggers (⌘K, Ctrl+K, guarded "/"), fuzzy filter + highlight,
 * Enter routing, copy-email, the survey-grid easter egg, ARIA wiring, and
 * zero page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
})
const pageErrors = []
const p = await ctx.newPage()
p.on('pageerror', (e) => pageErrors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })

const dialog = () => p.locator('[role="dialog"][aria-label="Command palette"]')
const input = () => p.locator('[role="combobox"][aria-label="Command palette search"]')

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

/**
 * Wait for the palette to reach a state rather than for a duration.
 *
 * These were fixed 350 and 450 ms waits, which pass on an idle machine and fail
 * about one run in four inside the full suite — measured on an unchanged
 * checkout, so it was the timing and not a regression. The close is animated and
 * the open is a lazy chunk; both take however long they take.
 */
const until = async (fn, ms = 5000) => {
  const deadline = Date.now() + ms
  for (;;) {
    if (await fn()) return true
    if (Date.now() > deadline) return false
    await p.waitForTimeout(50)
  }
}
const settle = (want) => until(async () => (await dialog().count()) === want)

/**
 * Open the palette from whatever state the previous step left it in.
 *
 * The chord is a TOGGLE, and steps that navigate leave the palette closed —
 * sometimes. Pressing it blind therefore opened the palette about half the time
 * and closed it the other half, which showed up downstream as a toast that never
 * appeared. Close first, confirm closed, then open.
 */
const openPalette = async () => {
  await p.keyboard.press('Escape')
  await settle(0)
  await p.keyboard.press('Meta+k')
  return settle(1)
}

// 1. ⌘K opens.
await p.keyboard.press('Meta+k')
check('⌘K opens the palette', await settle(1))

// 2. Esc closes.
await p.keyboard.press('Escape')
check('Esc closes the palette', await settle(0))

// 3. Ctrl+K opens.
await p.keyboard.press('Control+k')
check('Ctrl+K opens the palette', await settle(1))
await p.keyboard.press('Escape')
// The next check asserts the palette OPENS, so it has to start closed — without
// waiting for that, a slow close leaves the dialog up and "/" appears to have
// worked when it did nothing.
await settle(0)

// 4. "/" opens when focus is not in a field.
await p.keyboard.press('/')
check('"/" opens outside inputs', await settle(1))

// 5. "/" inside the palette's own input types a slash rather than re-firing the
//    shortcut. Opened with the keyboard chord and the field explicitly cleared
//    first, because the "/" that OPENS the palette sometimes lands in the input
//    too, depending on when focus arrives — this read "//" on four runs out of
//    five and an empty string on the fifth. The old fixed wait passed only by
//    landing before focus. What is being tested is the keydown handler, so
//    remove the ambiguity rather than time it.
await openPalette()
await input().fill('')
await p.keyboard.type('/')
check(
  '"/" in a field types literally',
  await until(async () => (await input().inputValue()) === '/'),
)
check('"/" in a field opens no second dialog', (await dialog().count()) === 1)

// 6. Typing filters + highlights: "watch" → exactly one option, Meridian, with a <mark>.
await input().fill('watch')
const opts = p.locator('[role="option"]')
// Filtering is a render away, not a fixed 200 ms away.
check('"watch" filters to one option', await until(async () => (await opts.count()) === 1))
check('…and it is Meridian', ((await opts.first().textContent()) ?? '').includes('Meridian'))

// 7. Enter routes: "aero" → #/demos/aeroscale. (Title match → highlighted.)
await input().fill('aero')
check(
  'match highlight <mark> renders',
  await until(async () => (await p.locator('[role="option"] mark').count()) >= 1),
)
await p.keyboard.press('Enter')
check(
  '"aero" + Enter opens AeroScale',
  await until(async () => (await p.evaluate(() => window.location.hash)) === '#/demos/aeroscale'),
)

// Back home for the rest.
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// 8. Section jump: "contact" → #contact.
await openPalette()
await input().fill('contact')
await until(async () => (await p.locator('[role="option"]').count()) >= 1)
await p.keyboard.press('Enter')
check(
  '"contact" + Enter jumps to #contact',
  await until(async () => (await p.evaluate(() => window.location.hash)) === '#contact'),
)

// 9. Copy email: toast + clipboard content; palette stays open.
await openPalette()
await input().fill('copy email')
await until(async () => (await p.locator('[role="option"]').count()) >= 1)
await p.keyboard.press('Enter')
check(
  'copy-email toasts',
  await until(async () => ((await dialog().textContent()) ?? '').includes('Copied')),
)
check('clipboard holds the email', (await p.evaluate(() => navigator.clipboard.readText())) === 'sjoudrie@gmail.com')
await p.keyboard.press('Escape')
await p.waitForTimeout(450)

// 10. Survey grid toggles on via the palette; Esc clears it.
await openPalette()
await input().fill('survey')
await until(async () => (await p.locator('[role="option"]').count()) >= 1)
const surveyOn = () => p.evaluate(() => document.documentElement.classList.contains('survey-grid'))
await p.keyboard.press('Enter')
check('survey grid turns on', await until(surveyOn))
// The palette closes on its own after the command runs; Escape has to reach the
// grid's own handler, not be swallowed closing a dialog that is still up.
await settle(0)
await p.keyboard.press('Escape')
check('Esc clears the survey grid', await until(async () => !(await surveyOn())))

// 11. ARIA wiring while open.
await p.keyboard.press('Meta+k')
await p.waitForTimeout(350)
check('combobox present', (await input().count()) === 1)
check('listbox present', (await p.locator('#cmdk-listbox[role="listbox"]').count()) === 1)
check('an option is aria-selected', (await p.locator('[role="option"][aria-selected="true"]').count()) === 1)
await p.keyboard.press('Escape')
await p.waitForTimeout(450)

// 12. Zero page/console errors across the run.
check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))

await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
