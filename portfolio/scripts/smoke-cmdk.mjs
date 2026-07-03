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

// 1. ⌘K opens.
await p.keyboard.press('Meta+k')
await p.waitForTimeout(350)
check('⌘K opens the palette', (await dialog().count()) === 1)

// 2. Esc closes.
await p.keyboard.press('Escape')
await p.waitForTimeout(450)
check('Esc closes the palette', (await dialog().count()) === 0)

// 3. Ctrl+K opens.
await p.keyboard.press('Control+k')
await p.waitForTimeout(350)
check('Ctrl+K opens the palette', (await dialog().count()) === 1)
await p.keyboard.press('Escape')
await p.waitForTimeout(450)

// 4. "/" opens when focus is not in a field.
await p.keyboard.press('/')
await p.waitForTimeout(350)
check('"/" opens outside inputs', (await dialog().count()) === 1)

// 5. "/" inside the palette's own input just types a slash (no second dialog).
await p.keyboard.type('/')
await p.waitForTimeout(150)
check('"/" in a field types literally', (await input().inputValue()) === '/' && (await dialog().count()) === 1)

// 6. Typing filters + highlights: "watch" → exactly one option, Meridian, with a <mark>.
await input().fill('watch')
await p.waitForTimeout(200)
const opts = p.locator('[role="option"]')
check('"watch" filters to one option', (await opts.count()) === 1)
check('…and it is Meridian', ((await opts.first().textContent()) ?? '').includes('Meridian'))

// 7. Enter routes: "aero" → #/demos/aeroscale. (Title match → highlighted.)
await input().fill('aero')
await p.waitForTimeout(200)
check('match highlight <mark> renders', (await p.locator('[role="option"] mark').count()) >= 1)
await p.keyboard.press('Enter')
await p.waitForTimeout(700)
check('"aero" + Enter opens AeroScale', (await p.evaluate(() => window.location.hash)) === '#/demos/aeroscale')

// Back home for the rest.
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// 8. Section jump: "contact" → #contact.
await p.keyboard.press('Meta+k')
await p.waitForTimeout(300)
await input().fill('contact')
await p.waitForTimeout(200)
await p.keyboard.press('Enter')
await p.waitForTimeout(500)
check('"contact" + Enter jumps to #contact', (await p.evaluate(() => window.location.hash)) === '#contact')

// 9. Copy email: toast + clipboard content; palette stays open.
await p.keyboard.press('Meta+k')
await p.waitForTimeout(300)
await input().fill('copy email')
await p.waitForTimeout(200)
await p.keyboard.press('Enter')
await p.waitForTimeout(300)
check('copy-email toasts', ((await dialog().textContent()) ?? '').includes('Copied'))
check('clipboard holds the email', (await p.evaluate(() => navigator.clipboard.readText())) === 'sjoudrie@gmail.com')
await p.keyboard.press('Escape')
await p.waitForTimeout(450)

// 10. Survey grid toggles on via the palette; Esc clears it.
await p.keyboard.press('Meta+k')
await p.waitForTimeout(300)
await input().fill('survey')
await p.waitForTimeout(200)
await p.keyboard.press('Enter')
await p.waitForTimeout(500)
check('survey grid turns on', await p.evaluate(() => document.documentElement.classList.contains('survey-grid')))
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
check('Esc clears the survey grid', await p.evaluate(() => !document.documentElement.classList.contains('survey-grid')))

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
