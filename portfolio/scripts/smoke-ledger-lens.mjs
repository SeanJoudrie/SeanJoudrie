#!/usr/bin/env node
/**
 * Ledger Lens smoke — runs behind the same regression gate as the other demos.
 * The extractor endpoint is STUBBED with a canned Anthropic SSE stream so the
 * test is deterministic and never calls the real API. Usage matches
 * smoke-aeroscale.mjs.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/ledger-lens`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

// A canned structured-output object; note the intentional total mismatch (says 20).
const OBJ = {
  merchant: { value: 'THE DAILY GRIND', confidence: 0.97 },
  date: { value: '2026-06-12', confidence: 0.9 },
  currency: { value: 'USD', confidence: 0.99 },
  lineItems: [
    { description: 'Cappuccino (L)', qty: 2, unitPrice: 4.75, amount: 9.5, category: 'food_drink', confidence: 0.95, uncertain: [] },
    { description: 'Almond croissant', qty: 1, unitPrice: 3.95, amount: 3.95, category: 'food_drink', confidence: 0.6, uncertain: ['description'] },
  ],
  subtotal: { value: 13.45, confidence: 0.9 },
  tax: { value: 0, confidence: 0.9 },
  total: { value: 20.0, confidence: 0.5 }, // wrong on purpose → must be flagged
}

// Build a minimal Anthropic SSE stream that emits the JSON as text deltas.
function sse() {
  const text = JSON.stringify(OBJ)
  const frames = []
  frames.push(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start' })}\n\n`)
  frames.push(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0 })}\n\n`)
  for (let i = 0; i < text.length; i += 40) {
    const chunk = text.slice(i, i + 40)
    frames.push(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: chunk } })}\n\n`)
  }
  frames.push(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
  return frames.join('')
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

// Stub the extractor: any request whose URL ends in /extract returns the canned SSE.
await p.route('**/extract', (route) =>
  route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse() }),
)

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)

check('empty state shows examples', (await p.locator('canvas').count()) >= 3)
check('claim line present', ((await p.locator('body').textContent()) ?? '').includes('your key never touches the browser'))

// Pick the first example → triggers the stubbed stream.
await p.locator('button[aria-label*="example receipt"]').first().click()
await p.waitForTimeout(600)

check('result table rendered', (await p.locator('section[aria-label="Extracted line items"]').count()) === 1)
check('merchant extracted', ((await p.locator('input[aria-label="Merchant"]').inputValue()) ?? '').includes('DAILY GRIND'))
check('two line items', (await p.locator('input[aria-label="Item description"]').count()) === 2)
check('low-confidence field flagged', (await p.locator('.ledger-flagged').count()) >= 1)

// Derived total must be $13.45 (not the model's wrong $20), and be flagged as a mismatch.
const totalsText = (await p.locator('dl').last().textContent()) ?? ''
check('total derived to $13.45', totalsText.includes('$13.45'))
check('total mismatch flagged', totalsText.includes('receipt said') && totalsText.includes('$20'))

// Edit a quantity → total recomputes live.
const qty = p.locator('input[aria-label="Quantity"]').first()
await qty.fill('3')
await qty.press('Enter')
await p.waitForTimeout(200)
check('editing qty recomputes total', ((await p.locator('dl').last().textContent()) ?? '').includes('$18.20'))

// Add + delete a row.
await p.click('button:has-text("Add row")')
await p.waitForTimeout(100)
check('add row works', (await p.locator('input[aria-label="Item description"]').count()) === 3)

// Export CSV downloads.
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Export CSV")')])
check('CSV export downloads', (await dl.suggestedFilename()).endsWith('.csv'))

// Paste-text path also reaches a result.
await p.click('button:has-text("Read another")')
await p.click('button[role="tab"]:has-text("Paste text")')
await p.fill('#ll-paste', 'THE DAILY GRIND\nCappuccino 2 4.75 9.50')
await p.click('button:has-text("Extract from text")')
await p.waitForTimeout(500)
check('text mode reaches a result', (await p.locator('section[aria-label="Extracted line items"]').count()) === 1)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
