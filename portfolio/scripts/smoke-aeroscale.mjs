#!/usr/bin/env node
/**
 * AeroScale dashboard smoke — the regression gate the Meridian work runs
 * behind (shared ticker, shared tokens). Same usage as smoke-meridian.mjs.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/aeroscale`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
})
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(3200)

check('hero ARR ticked to $2.4M', ((await p.locator('section:has(h2:text("Annual recurring revenue"))').textContent()) ?? '').includes('$2.4M'))
check('chart drew', (await p.locator('svg[role="img"][aria-label*="Monthly recurring revenue"]').count()) === 1)

await p.click('button[role="radio"]:has-text("Q2")')
await p.waitForTimeout(900)
check('Q2 rescopes the page', ((await p.locator('section:has(h2:text("Annual recurring revenue"))').textContent()) ?? '').includes('Q2 FY26'))
check('timeframe rides the URL', await p.evaluate(() => location.hash.includes('tf=q2')))

// Keyboard hover layer.
await p.locator('div[tabindex="0"][aria-label*="Interactive"]').focus()
await p.keyboard.press('End')
await p.waitForTimeout(300)
check('keyboard tooltip announces', (((await p.locator('div[aria-live="polite"]').textContent()) ?? '').length ?? 0) > 0)

// Tier toggle keeps colors and rescopes.
await p.click('button[aria-pressed="true"]:has-text("Enterprise")')
await p.waitForTimeout(800)
check('tier filter rescopes donut', (await p.locator('li:has-text("Enterprise")').count()) <= 2)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
