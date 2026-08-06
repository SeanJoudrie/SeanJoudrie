#!/usr/bin/env node
/**
 * smoke-previews.mjs — the Range shelf's live 3D cards survive being scrolled past.
 *
 *   npm run build && npx vite preview
 *   PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/smoke-previews.mjs
 *
 * WHAT THIS GUARDS. Each live card mounts its real scene only while it is near
 * the viewport and unmounts it once scrolled well past, so at most a couple of
 * WebGL contexts are ever alive (see DemoPreview.tsx). That unmount is the
 * feature. The bug this suite exists for is what used to happen on the way
 * BACK: the card returned as its static SVG thumbnail and stayed that way for
 * the life of the page, because tearing a scene down fires `webglcontextlost`,
 * which the wrapper read as "this card can never render again."
 *
 * So the shape of the test is a round trip, and all three legs are asserted:
 *
 *   1. the scene mounts and is DRAWING     — a canvas, and pixels that move
 *   2. scrolling far away UNMOUNTS it      — the canvas is gone (the feature)
 *   3. scrolling back mounts it AGAIN      — a canvas, and pixels that move
 *
 * Leg 2 matters as much as leg 3: without it, "the canvas is still there" would
 * pass a build that never released a context at all, which is the failure this
 * design was chosen to avoid.
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
 * MERIDIAN IS THE CONTROL, and it is deliberately NOT held to leg 2: its loader
 * observer disconnects after the first intersection (Range.tsx), so its scene
 * never unmounts and therefore never trips the latch. When the six cards were
 * broken, Meridian was the one that still worked — that asymmetry is what
 * identified the cause, so it is worth keeping under test.
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

await page.goto(BASE, { waitUntil: 'load', timeout: 60000 })

/** Does this card currently hold a canvas with a real drawing buffer? */
const hasCanvas = (label) =>
  page.evaluate((l) => {
    const c = document.querySelector(`[aria-label="${l}"]`)?.querySelector('canvas')
    return !!c && c.width > 0 && c.height > 0
  }, label)

/** Two frames of the card, a moment apart. Different bytes = actually drawing. */
const isDrawing = async (label) => {
  if (!(await hasCanvas(label))) return false
  const el = page.locator(`[aria-label="${label}"]`)
  const a = await el.screenshot()
  // Not a wait for readiness — just long enough for the next rendered frame.
  await page.waitForTimeout(400)
  const b = await el.screenshot()
  return !a.equals(b)
}

/**
 * Who owns each live canvas right now. A canvas sitting inside a card slot is a
 * scene doing its job — the count of those legitimately rises and falls with
 * what is near the viewport, so counting canvases alone says nothing about
 * leaking. An ORPHAN is a canvas attached to no slot at all: nobody will ever
 * unmount it, and that is what a leak looks like.
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
  let live = false
  try {
    live = await until(`${name} to draw`, () => isDrawing(label), 20000, 0)
  } catch {
    /* reported below */
  }
  live ? ok(`${name} mounts and draws`) : bad(`${name} mounted but never drew a frame`)

  // ── leg 2: scrolling away releases it ─────────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  let released = false
  try {
    await until(`${name} to unmount`, async () => !(await hasCanvas(label)), 15000)
    released = true
    ok(`${name} releases its context when scrolled past`)
  } catch {
    bad(`${name} kept its context alive off screen — the memory ceiling is gone`)
  }

  // ── leg 3: and it comes BACK ──────────────────────────────────────────────
  // Up to two return passes, because "never permanently stuck" is the property
  // that matters and a pass is what a person does. Sweeping every card in one
  // run is far harder on the browser's context budget than any real visit: the
  // browser evicts the oldest live context to make room, the card retries a
  // bounded number of times (DemoPreview.tsx), and under this much pressure it
  // can spend them all. Leaving the viewport resets that budget, so a second
  // pass is a fair test of the same guarantee — and a card that needs one is
  // reported, not hidden, so a regression that makes it the norm is visible.
  let back = false
  let passes = 0
  for (; passes < 2 && !back; passes++) {
    if (passes > 0) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await until(`${name} to unmount again`, async () => !(await hasCanvas(label)), 15000).catch(() => {})
    }
    await el.scrollIntoViewIfNeeded()
    try {
      await until(`${name} to remount`, () => hasCanvas(label), 75000)
      back = await until(`${name} to draw again`, () => isDrawing(label), 20000, 0)
    } catch {
      /* try once more, then report */
    }
  }
  if (back && passes === 1) ok(`${name} comes back live after scrolling away and returning`)
  else if (back) ok(`${name} comes back live — on the second return pass`)
  else bad(`${name} fell back to its placeholder and never recovered`)
  results.push({ name, mounted: true, live, released, back })
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
    const alive = await until('Meridian to draw again', () => isDrawing(mLabel), 20000, 0)
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

console.log(`[previews] ${results.filter((r) => r.back).length}/${results.length} cards survived the round trip`)
await browser.close()

if (failures) {
  console.log(`\npreviews: ${failures} check${failures === 1 ? '' : 's'} FAILED`)
  process.exit(1)
}
console.log('\npreviews: all checks passed')
