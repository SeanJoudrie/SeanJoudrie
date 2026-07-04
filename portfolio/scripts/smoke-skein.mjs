#!/usr/bin/env node
/**
 * Skein link-analysis smoke — same shape as smoke-palisade.mjs. Verifies the
 * page loads, the graph renders typed nodes, timeline scrubbing changes the
 * visible (non-dimmed) node count, clicking a node opens the detail panel and
 * highlights the map, clicking a map port filters the graph, and there are zero
 * page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/skein`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(700) // let the force sim settle

const graph = p.locator('svg[data-skein="graph"]')
check('graph mounts', (await graph.count()) === 1)
check('claim on screen', (await p.locator('text=Scrub the timeline and watch the network surface').count()) >= 1)

const totalNodes = await p.locator('svg[data-skein="graph"] [data-node-id]').count()
check('graph renders many typed nodes', totalNodes >= 40, `${totalNodes} nodes`)

// full window: count non-dimmed nodes (opacity via inline style is not queryable,
// so we read the live count chip instead — it reflects derived.activeNodeCount).
const readCount = async () => {
  const txt = (await p.locator('text=/\\d+ entities/').first().textContent()) ?? ''
  return parseInt(txt.match(/(\d+)\s+entities/)?.[1] ?? '0', 10)
}
const fullCount = await readCount()
check('full-window active count is high', fullCount >= 40, `${fullCount} active`)

// Scrub: click the "Wave I" quick-range chip → the window narrows → fewer active.
await p.getByRole('button', { name: 'Wave I', exact: true }).click()
await p.waitForTimeout(300)
const waveCount = await readCount()
check('timeline scrub reduces active node count', waveCount < fullCount, `${waveCount} < ${fullCount}`)

// back to full span for the selection tests; the window change reheats the
// force sim, so wait for it to cool (~3s) — clicking a still-drifting node
// can miss between position-read and pointer-down.
await p.getByRole('button', { name: 'Full span', exact: true }).click()
await p.waitForTimeout(3500)

// Click a node → detail panel populates. Mid-settle, some nodes sit outside
// the SVG's clipped box (their bbox still reports the transformed position),
// so pick one whose center is actually visible inside the graph pane.
await p.locator('svg[data-skein="graph"]').scrollIntoViewIfNeeded()
await p.waitForTimeout(200)
const pt = await p.evaluate(() => {
  const svg = document.querySelector('svg[data-skein="graph"]')
  const sr = svg.getBoundingClientRect()
  // clamp to the VIEWPORT intersection — chip clicks may have scrolled the page
  const x0 = Math.max(sr.x, 0) + 24
  const x1 = Math.min(sr.right, window.innerWidth) - 24
  const y0 = Math.max(sr.y, 0) + 24
  const y1 = Math.min(sr.bottom, window.innerHeight) - 24
  for (const g of svg.querySelectorAll('[data-node-id]')) {
    const r = g.getBoundingClientRect()
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    if (cx > x0 && cx < x1 && cy > y0 && cy < y1) {
      return { x: cx, y: cy }
    }
  }
  return null
})
check('a node is visible inside the graph pane', !!pt)
if (pt) await p.mouse.click(pt.x, pt.y)
await p.waitForTimeout(200)
const detail = p.locator('[data-skein="graph"]') // sanity: graph still there
check('graph still present after select', (await detail.count()) === 1)
// note: .skein-label uppercases via CSS and Playwright matches rendered text
check('detail panel shows a link count', (await p.locator('text=/link.* in window/i').count()) >= 1)

// Click a map port → graph filters (active count drops or map shows a filter clear).
const port = p.locator('svg[data-skein="map"] [data-loc-id]').first()
await port.click({ force: true })
await p.waitForTimeout(300)
check('map click sets a location filter', (await p.locator('text=clear filter').count()) >= 1)
const filteredCount = await readCount()
check('map filter narrows the graph', filteredCount <= fullCount, `${filteredCount} ≤ ${fullCount}`)

// Entity list keyboard path exists.
check('accessible entity list present', (await p.locator('#skein-entity-list[role="listbox"]').count()) === 1)
check('graph exposes an aria-label equivalent', ((await graph.getAttribute('aria-label')) ?? '').includes('keyboard-navigable'))

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
