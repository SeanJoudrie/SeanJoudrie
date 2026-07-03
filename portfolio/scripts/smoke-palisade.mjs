#!/usr/bin/env node
/**
 * Palisade data-grid smoke — same shape as smoke-aeroscale.mjs. Verifies
 * virtualization (scroll to the last row renders it), keyboard nav, edit +
 * commit, copy, sort, filter, CSV export wiring, and zero page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/palisade`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)

const grid = p.locator('div[role="grid"]')
check('grid mounts with 10,001 aria-rowcount', (await grid.getAttribute('aria-rowcount')) === '10001')
check('claim on screen', ((await p.locator('text=hand-rolled virtualization').count())) >= 1)

// DOM node budget: far fewer than 10k rows are rendered.
const domRows = await p.locator('div[role="row"]').count()
check('virtualized (few rows in DOM)', domRows < 200, `${domRows} rows in DOM`)

// Scroll to the bottom — the last shipment must render (virtualization works).
await grid.evaluate((el) => { el.scrollTop = el.scrollHeight })
await p.waitForTimeout(300)
check('scrolled to last row renders', (await p.locator('div[role="row"][aria-rowindex="10001"]').count()) === 1)

// Back to top, focus grid, keyboard nav moves the active descendant.
await grid.evaluate((el) => { el.scrollTop = 0 })
await grid.focus()
await p.keyboard.press('ArrowDown')
await p.keyboard.press('ArrowRight')
check('active descendant tracks keys', (await grid.getAttribute('aria-activedescendant')) === 'pal-cell-1-1')

// Edit the customer cell (col 1) via F2, type, Enter.
await p.keyboard.press('F2')
await p.waitForTimeout(80)
await p.keyboard.type('SMOKE TEST CO')
await p.keyboard.press('Enter')
await p.waitForTimeout(120)
check('edit committed', (await p.locator('div[role="grid"]').textContent() ?? '').includes('SMOKE TEST CO'))
check('edit counter shows', (await p.locator('text=edited').count()) >= 1)

// Copy the active cell (no throw) and confirm announcement.
await p.keyboard.press('Control+c')
await p.waitForTimeout(80)
check('copy announces', ((await p.locator('[aria-live="polite"]').textContent()) ?? '').toLowerCase().includes('copied'))

// Sort by the Status column header.
await p.locator('button[title="Sort by Status"]').click()
await p.waitForTimeout(150)
check('sort sets aria-sort', ['ascending', 'descending'].includes(
  await p.locator('div[role="columnheader"]:has-text("Status")').first().getAttribute('aria-sort') ?? ''))

// Filter Status to Delivered via the filter-row select.
await p.locator('select[aria-label="Filter Status"]').selectOption('Delivered')
await p.waitForTimeout(200)
check('filter reduces the row count', ((await p.locator('text=/\\/ 10,000 rows/').count())) >= 1)

// Export button is wired (triggers a download).
const dl = p.waitForEvent('download', { timeout: 3000 }).catch(() => null)
await p.locator('button:has-text("Export CSV")').click()
check('CSV export downloads', (await dl) !== null)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
