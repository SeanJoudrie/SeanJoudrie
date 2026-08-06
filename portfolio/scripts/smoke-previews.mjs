#!/usr/bin/env node
/**
 * smoke-previews.mjs — the Range shelf's live 3D cards survive being scrolled past.
 *
 *   npm run build && npx vite preview
 *   PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/smoke-previews.mjs
 *
 * WHAT THIS GUARDS. Each live card mounts its real scene as it approaches and
 * then keeps it for the life of the page (see DemoPreview.tsx). Nothing stands
 * in for a scene: the SVG thumbnails that used to sit behind these cards are
 * deleted, so a card either shows its model or shows the card's own background.
 *
 * The history matters, because this suite was written against the opposite
 * design and the assertions were inverted deliberately rather than dropped.
 * Scenes used to unmount once scrolled well past, to hold the number of live
 * WebGL contexts down — and coming back they returned as a thumbnail and stayed
 * that way, because tearing a scene down fires `webglcontextlost` and the
 * wrapper read that as "this card can never render again." That churn was also
 * what pushed the page into the browser's 16-context budget and got live scenes
 * evicted. So the shape of the test is still a round trip, but leg 2 now asserts
 * the scene SURVIVES the trip rather than that it is released:
 *
 *   1. the scene mounts and is DRAWING     — a canvas, and pixels that move
 *   2. scrolling far away KEEPS it         — the canvas is still there
 *   3. scrolling back it is STILL DRAWING  — and no thumbnail ever appeared
 *
 * Leg 2 is the one that would have failed before this change, and leg 3's
 * "still" is the point: not "recovers", which is what the old design aspired to.
 *
 * LIVENESS IS MEASURED, NOT ASSUMED. A canvas element proves nothing — it can be
 * present and blank. Two element screenshots taken a frame apart must differ.
 * The scenes all auto-rotate, so a still frame means a dead context. (toDataURL
 * is no use here: these canvases do not preserve their drawing buffer.
 * Playwright captures the composited result, which is what the visitor sees.)
 *
 * CARDS ARE ADDRESSED BY ACCESSIBLE NAME, NOT BY INDEX. Meridian has its own
 * slot with its own lifecycle, and it mounts late — so an `nth(i)` walk over
 * "every orbitable slot" silently renumbers itself mid-run once Meridian
 * appears, and you end up asserting about a card you already tested. The
 * DemoPreview cards say "click to open the demo"; Meridian says "the
 * configurator". Each card is looked up by its full label.
 *
 * MERIDIAN IS STILL CHECKED SEPARATELY. It has its own slot with its own
 * lifecycle (Range.tsx), and it worked this way — load once, never unmount —
 * before the six cards did. When they were broken it was the only one that
 * survived, and that asymmetry is what identified the cause, so it stays under
 * test as the card whose behaviour the other six were changed to match.
 *
 * Every wait is a poll. Mount time depends on a lazy chunk, then a fetch, then
 * geometry being built on the GPU, and a fixed timeout for that has already
 * produced false greens elsewhere in this suite.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
/** The DemoPreview cards. Meridian is excluded by "demo" vs "configurator". */
const SLOT = '[role="img"][aria-label*="drag to orbit"][aria-label*="open the demo"]'
const MERIDIAN = '[role="img"][aria-label*="open the configurator"]'

let failures = 0
const ok = (msg) => console.log(`  ✓ ${msg}`)
const bad = (msg) => {
  failures++
  console.log(`  ✗ ${msg}`)
}

/**
 * Poll until fn() is truthy, or throw. Never a fixed wait for a condition.
 * The default budget is generous on purpose: a cold mount is a lazy chunk, a
 * fetch and a GPU upload, and the heaviest card (Riff) was measured missing a
 * 45 s window on a phone-sized viewport during a hot sweep — while mounting in
 * 5 s when given the machine to itself. A tight budget here would report the
 * bug this suite exists for when the real answer is "the CI box was busy."
 */
const until = async (label, fn, timeout = 75000, step = 250) => {
  const t0 = Date.now()
  for (;;) {
    const v = await fn()
    if (v) return v
    if (Date.now() - t0 > timeout) throw new Error(`timed out waiting for ${label}`)
    if (step) await new Promise((r) => setTimeout(r, step))
  }
}

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(`${e.message} @ ${(e.stack ?? '').split('\n')[1]?.trim()}`))

// Element screenshots wait for the element to hold still, and this page scrolls
// smoothly — so a card gliding into place times the capture out. Jump instead.
await page.addStyleTag({ content: 'html, body, * { scroll-behavior: auto !important }' }).catch(() => {})
await page.goto(BASE, { waitUntil: 'load', timeout: 60000 })
await page.addStyleTag({ content: 'html, body, * { scroll-behavior: auto !important }' })

/** Does this card currently hold a canvas with a real drawing buffer? */
const hasCanvas = (label) =>
  page.evaluate((l) => {
    const c = document.querySelector(`[aria-label="${l}"]`)?.querySelector('canvas')
    return !!c && c.width > 0 && c.height > 0
  }, label)

/**
 * Is this card's scene actually drawing? Compare successive frames of just that
 * card until they differ, up to a budget.
 *
 * The window has to be generous, and an earlier draft got this wrong: it took
 * two shots 400 ms apart and called anything else dead. Under software rendering
 * with every scene mounted the page was measured at 2 fps — a frame every ~500 ms
 * — so that version reported four healthy, visibly rotating cards as frozen. The
 * failure it produced looked exactly like the real bug, which is the dangerous
 * kind of wrong instrument.
 */
const isDrawing = async (label, budgetMs = 12000) => {
  if (!(await hasCanvas(label))) return false
  const el = page.locator(`[aria-label="${label}"]`)
  // Wait for the card to hold still first: an element screenshot refuses to
  // capture a moving target, and a failed capture used to eat the whole budget.
  for (let i = 0; i < 40; i++) {
    const a = await el.boundingBox()
    await page.waitForTimeout(150)
    const b2 = await el.boundingBox()
    if (a && b2 && a.y === b2.y) break
  }
  // The budget is counted in SUCCESSFUL comparisons, not wall time. A capture can
  // lose a race with a scroll or a slow frame, and one that timed out inside a
  // wall-clock budget is what previously reported a visibly spinning guitar as
  // frozen — the timeout was longer than the budget it was spending.
  const grab = async () => {
    try {
      return await el.screenshot({ timeout: 6000 })
    } catch {
      return null
    }
  }
  const samples = Math.ceil(budgetMs / 600)
  let prev = null
  for (let i = 0; i < samples * 2; i++) {
    const shot = await grab()
    if (shot) {
      if (prev && !shot.equals(prev)) return true
      prev = shot
    }
    await page.waitForTimeout(600)
  }
  return false
}

/**
 * Who owns each live canvas right now. A canvas sitting inside a card slot is a
 * scene doing its job, and now that scenes are kept for the life of the page
 * that count only ever climbs to the number of cards — so counting canvases
 * alone says nothing about leaking. An ORPHAN is a canvas attached to no slot at
 * all: nobody will ever unmount it, and that is what a leak looks like.
 */
const owners = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('canvas')].map(
      (c) => c.closest('[role="img"]')?.getAttribute('aria-label')?.split('—')[0].trim() ?? 'ORPHAN',
    ),
  )

const labels = await page.locator(SLOT).evaluateAll((ns) => ns.map((n) => n.getAttribute('aria-label')))
console.log(`[previews] ${labels.length} live demo cards`)
if (labels.length === 0) bad('no live card slots found — the selector or the shelf changed')

const results = []
for (const label of labels) {
  const name = label.split('—')[0].trim()
  const el = page.locator(`[aria-label="${label}"]`)

  // ── leg 1: it comes alive at all ──────────────────────────────────────────
  await el.scrollIntoViewIfNeeded()
  try {
    await until(`${name} to mount`, () => hasCanvas(label))
  } catch {
    bad(`${name} never mounted a scene`)
    results.push({ name, mounted: false })
    continue
  }
  const live = await isDrawing(label)
  live ? ok(`${name} mounts and draws`) : bad(`${name} mounted but never drew a frame`)

  // ── leg 2: scrolling far away does NOT take it away ───────────────────────
  // Polled for a while rather than sampled once: the old behaviour unmounted a
  // second or two after the card left the margin, so a single immediate read
  // would have passed the very build this replaces.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  let kept = true
  for (let i = 0; i < 20; i++) {
    if (!(await hasCanvas(label))) {
      kept = false
      break
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  kept
    ? ok(`${name} keeps its scene while scrolled well past`)
    : bad(`${name} lost its scene off screen — it should stay mounted now`)

  // ── leg 3: and it is still drawing when you come back ─────────────────────
  await el.scrollIntoViewIfNeeded()
  const back = await isDrawing(label)
  back
    ? ok(`${name} is still live after scrolling away and returning`)
    : bad(`${name} was not drawing when scrolled back to`)

  results.push({ name, mounted: true, live, kept, back })
}

// ── the control: Meridian, which never unmounts, must also survive ──────────
if (await page.locator(MERIDIAN).count()) {
  const mLabel = await page.locator(MERIDIAN).first().getAttribute('aria-label')
  const mEl = page.locator(`[aria-label="${mLabel}"]`)
  await mEl.scrollIntoViewIfNeeded()
  try {
    await until('Meridian to mount', () => hasCanvas(mLabel))
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1200)
    await mEl.scrollIntoViewIfNeeded()
    const alive = await isDrawing(mLabel)
    alive ? ok('Meridian survives the same round trip (the control)') : bad('Meridian went dead too')
  } catch {
    bad('Meridian never came back — the control failed, so suspect the harness')
  }
}

// ── the memory ceiling, measured across repeated sweeps ─────────────────────
// The property is that contexts do not GROW without bound as you scroll the
// shelf up and down. Comparing "at the top" against "midway" measures nothing —
// different positions legitimately have different numbers of cards near the
// viewport. So this compares like with like: the count at the top of the page,
// settled, after one sweep against the same count after three more. Settled
// means "unchanged across consecutive reads", because a count sampled while
// scenes are still mounting is a transient, and an earlier draft of this check
// failed on exactly that.
const settled = async () => {
  let last = -1
  let same = 0
  for (let i = 0; i < 80; i++) {
    const n = (await owners()).length
    same = n === last ? same + 1 : 0
    last = n
    if (same >= 3) break
    await new Promise((r) => setTimeout(r, 250))
  }
  return owners()
}
const sweep = async () => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await settled()
  await page.evaluate(() => window.scrollTo(0, 0))
  return settled()
}
const afterFirst = await sweep()
let afterMore = afterFirst
for (let i = 0; i < 3; i++) afterMore = await sweep()
console.log(`[previews] canvases at the top, settled — after 1 sweep [${afterFirst}], after 4 sweeps [${afterMore}]`)
const orphanFirst = afterFirst.filter((o) => o === 'ORPHAN').length
const orphanMore = afterMore.filter((o) => o === 'ORPHAN').length
if (orphanMore <= orphanFirst)
  ok(`repeated sweeps leave no orphaned contexts behind — ${orphanMore} ≤ ${orphanFirst}`)
else bad(`orphaned canvases accumulated across sweeps — ${orphanFirst} → ${orphanMore}`)

// One known error is reported but not failed on, and it is named rather than
// filtered by shape: drei's CameraControls resolves its DOM element as
// `domElement || events.connected || gl.domElement`, and during a teardown all
// three can be gone, so it calls connect(null). It is intermittent, it lives in
// a dependency, it predates the fix this suite was written for (it was in the
// very first run against unfixed code), and it does not stop a card from coming
// back — every card still passes its round trip when this fires. Anything else
// is a failure. If this ever stops appearing, delete the exemption.
const KNOWN = (e) => e.includes("reading 'addEventListener'") && e.includes('Object.connect')
const known = errors.filter(KNOWN)
const unexpected = errors.filter((e) => !KNOWN(e))
if (known.length) console.log(`  ! ${known.length} known drei teardown error(s) — connect(null) in CameraControls, tracked separately`)
if (unexpected.length === 0) ok('no unexpected page errors')
else bad(`page errors: ${unexpected.join(' | ')}`)

// Nothing may stand in for a scene. The old fallbacks were inline <svg>, so an
// svg inside a card slot means a thumbnail came back from the dead.
const standIns = await page.evaluate(() =>
  [...document.querySelectorAll('[role="img"][aria-label*="drag to orbit"]')].filter((s) => s.querySelector('svg'))
    .length,
)
if (standIns === 0) ok('no thumbnail ever stands in for a scene')
else bad(`${standIns} card(s) are showing a stand-in image instead of a scene`)

console.log(`[previews] ${results.filter((r) => r.back).length}/${results.length} cards survived the round trip`)
await browser.close()

if (failures) {
  console.log(`\npreviews: ${failures} check${failures === 1 ? '' : 's'} FAILED`)
  process.exit(1)
}
console.log('\npreviews: all checks passed')
