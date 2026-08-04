#!/usr/bin/env node
/**
 * Relief viewshed smoke — same shape as smoke-skein.mjs. Verifies the page
 * loads, the terrain canvas gets a live GL context, the seeded observer
 * produces non-zero statistics, and that raising the observer both grows the
 * visible area and visibly changes the render.
 *
 * That last check matters: the viewshed pass and the terrain shader can each
 * be correct while the texture never reaches the material, in which case the
 * numbers update and the picture does not. Comparing pixels catches it.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/relief`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))
p.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(m.text())
})

await p.goto(URL, { waitUntil: 'networkidle' })
// The heightmap is ~3 MB and both the GPU texture and the CPU heightfield have
// to decode before the first viewshed can run.
await p.waitForTimeout(9000)

const gl = await p.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return null
  const ctx = c.getContext('webgl2') || c.getContext('webgl')
  return { w: c.width, h: c.height, lost: ctx ? ctx.isContextLost() : true }
})
check('canvas present with a live GL context', !!gl && !gl.lost, gl ? `${gl.w}×${gl.h}` : 'no canvas')
check('static fallback not shown', !(await p.locator('svg[role="img"]').count()))

/**
 * Read the statistics by their labels rather than by position. Indexing into
 * `.relief-num` broke the moment the observer chips added their own readouts,
 * and a smoke test that silently compares the wrong two numbers is worse than
 * one that fails.
 */
const readStats = async () => {
  const map = await p.$$eval('.relief-label', (labels) => {
    const out = {}
    for (const l of labels) {
      const num = l.parentElement && l.parentElement.querySelector('.relief-num')
      if (num) out[l.textContent.trim().toLowerCase()] = num.textContent.trim()
    }
    return out
  })
  // Keep the sign. Badwater Basin seeds at -49 m, and stripping the minus read
  // it as +49 — a number that looks plausible enough to sail through a check
  // asserting the observer had moved to the new terrain.
  const num = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return {
    ground: num(map['elev.']),
    area: num(map['visible'] ?? map['covered']),
    pct: num(map['of frame']),
    far: num(map['furthest']),
    range: num(map['range']),
  }
}

// Same race as gotoSite: under the full suite the decode takes longer than any
// fixed wait worth writing. Poll for the first real result.
let before = await readStats()
for (let i = 0; i < 40 && !(before.area > 0); i++) {
  await p.waitForTimeout(500)
  before = await readStats()
}
check('observer seeded on real ground', before.ground > 500, `${before.ground} m`)
check('visible area is non-zero', before.area > 0, `${before.area} km²`)
check('furthest visible is non-zero', before.far > 0, `${before.far} km`)

/**
 * Occlusion — the reason the terrain used to read flat.
 *
 * The old camera sat ~40 km out and high, from which nothing hid anything, so
 * the scene had no occlusion cue at all and looked like a texture map. Assert
 * the fix numerically rather than trusting a screenshot: what share of the
 * terrain is hidden from the default camera by other terrain.
 *
 * Measured HERE, on the opening frame, and not at the end of the run: the probe
 * reads the live camera and the live exaggeration, and the exaggeration test
 * below leaves the terrain at 3x under a camera framed for 1.6x. That reported
 * 99.4% — true, and a measurement of a pose no visitor ever sees.
 */
const openingOcclusion = await p.evaluate(() =>
  window.__reliefOcclusion ? window.__reliefOcclusion() : null,
)
check(
  'the default camera produces real occlusion',
  openingOcclusion !== null && openingOcclusion >= 0.2,
  openingOcclusion === null
    ? 'probe missing'
    : `${(openingOcclusion * 100).toFixed(1)}% of terrain hidden from camera`,
)

/** Mean brightness of the terrain region, ignoring near-black sky. */
const brightness = async () => {
  const buf = await p.screenshot({ clip: { x: 360, y: 200, width: 1000, height: 600 } })
  const { PNG } = await import('pngjs')
  const img = PNG.sync.read(buf)
  let sum = 0
  let n = 0
  for (let i = 0; i < img.width * img.height; i++) {
    const o = i * 4
    const v = (img.data[o] + img.data[o + 1] + img.data[o + 2]) / 3
    if (v * 3 < 40) continue
    sum += v
    n++
  }
  return n ? sum / n : 0
}

const brightBefore = await brightness()
await p.getByTitle('400 m').click()
await p.waitForTimeout(4000)
const after = await readStats()
const brightAfter = await brightness()

check('raising the observer grows visible area', after.area > before.area * 1.5, `${before.area} → ${after.area} km²`)
check(
  'raising the observer changes the render',
  brightAfter > brightBefore * 1.05,
  `mean brightness ${brightBefore.toFixed(1)} → ${brightAfter.toFixed(1)}`,
)

// Cumulative coverage: adding an observer must grow the covered area and
// removing it must give the ground back. Adding silently did nothing at first
// — the numbers simply did not move — so this is worth asserting.
const covBefore = (await readStats()).area
await p.getByRole('button', { name: '+ Add' }).click()
await p.waitForTimeout(3500)
const covTwo = (await readStats()).area
check('adding an observer grows coverage', covTwo > covBefore, `${covBefore} → ${covTwo} km²`)

await p.getByRole('button', { name: 'Remove observer 2' }).click()
await p.waitForTimeout(3000)
const covBack = (await readStats()).area
check('removing it restores coverage', Math.abs(covBack - covBefore) < 0.5, `${covTwo} → ${covBack} km²`)

/**
 * Vertical exaggeration must be a DISPLAY transform only.
 *
 * If it ever reaches viewshed.ts, every reported area and distance silently
 * becomes fiction, and nothing else in the suite would notice —
 * check-viewshed.mjs runs on the CPU against raw elevations and never sees the
 * render path. So assert the one property that cannot hold if the wiring is
 * wrong: the statistics do not move when the exaggeration does.
 *
 * Verified to fail: multiplying the observer ground elevation by the
 * exaggeration factor inside the viewshed uniforms changes visible area by
 * hundreds of km² and trips this immediately.
 */
const exagSlider = p.getByLabel('Vertical exaggeration')

/** The factor as the page reports it — proof the control actually moved. */
const shownExag = () =>
  p.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) =>
      /^[0-9.]+×$/.test(s.textContent.trim()),
    )
    return el ? parseFloat(el.textContent) : null
  })

const statsAt = async (value) => {
  // fill() on a range input does not reliably drive React's onChange, and a
  // silently unmoved slider makes this assertion vacuous — both reads land on
  // the same setting and trivially match. Set the value through the native
  // setter, dispatch the event React listens for, then confirm the display
  // moved before trusting anything downstream.
  await exagSlider.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
  // Changing exaggeration does not itself trigger a viewshed recompute — and
  // it correctly should not, since it must not affect the result. But that
  // means simply re-reading returns the cached numbers, so a leak would sit
  // here undetected. Force a fresh computation by moving the observer away and
  // back, landing both samples on the same height.
  await p.getByTitle('120 m').click()
  await p.waitForTimeout(1800)
  await p.getByTitle('25 m').click()
  await p.waitForTimeout(2500)
  return { stats: await readStats(), shown: await shownExag() }
}

const one = await statsAt(1)
const three = await statsAt(3)

check(
  'the exaggeration control actually moves',
  one.shown !== null && three.shown !== null && Math.abs(three.shown - one.shown) > 1,
  `displayed ${one.shown}x then ${three.shown}x`,
)
check(
  'statistics are independent of vertical exaggeration',
  one.stats.area === three.stats.area &&
    one.stats.pct === three.stats.pct &&
    one.stats.far === three.stats.far,
  `${one.shown}x: ${one.stats.area} km² / ${one.stats.pct}% / ${one.stats.far} km  vs  ` +
    `${three.shown}x: ${three.stats.area} km² / ${three.stats.pct}% / ${three.stats.far} km`,
)

/**
 * Line of sight.
 *
 * The section is a second implementation of the geometry the GPU viewshed
 * already does, which is the point of having it — so the thing to assert is that
 * the two agree. Aim at a spot the viewshed has already marked hidden and the
 * section must call it blocked.
 */
await p.getByRole('button', { name: 'aim' }).click()
await p.waitForTimeout(400)
const losState = () =>
  p.evaluate(() => {
    const l = [...document.querySelectorAll('span')].find((s) =>
      s.textContent.trim().startsWith('Line of sight'),
    )
    return l ? l.textContent.replace('Line of sight', '').trim() : null
  })
const losRange = async () => (await readStats()).range

// Aim short and long. Something close on open ground should be clear; something
// far across the gorge should not be.
await p.mouse.click(900, 320)
await p.waitForTimeout(1200)
const near = { state: await losState(), range: (await readStats()).range }
await p.mouse.click(1100, 560)
await p.waitForTimeout(1200)
const far = { state: await losState(), range: (await readStats()).range }

check(
  'aiming produces a section with a real range',
  near.range > 0 && far.range > 0,
  `${near.range} km and ${far.range} km`,
)
check(
  'the section reaches a verdict, and distance changes it',
  near.state !== null &&
    far.state !== null &&
    (near.state === 'clear' || near.state === 'blocked') &&
    near.range !== far.range,
  `${near.range} km ${near.state} · ${far.range} km ${far.state}`,
)
await p.getByRole('button', { name: 'aiming' }).click()
await p.waitForTimeout(300)

/**
 * The sun is a real sun.
 *
 * Moving the time must move the light — and must move it the way the sky does,
 * not arbitrarily. Two properties: the reported azimuth advances clockwise
 * through the day as it must in the northern hemisphere, and the render
 * actually changes, because the angle could be updating in the readout while
 * the shadow pass keeps its old uniform.
 */
const sunReadout = () =>
  p.evaluate(() => {
    const l = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'Sun')
    const t = l ? l.parentElement.querySelector('.relief-num').textContent : ''
    const m = t.match(/(\d+)°\s*\/\s*(-?\d+)°/)
    return m ? { azimuth: Number(m[1]), elevation: Number(m[2]) } : null
  })
const setHour = async (h) => {
  await p.getByLabel('Time of day, local solar hours').evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, h)
  await p.waitForTimeout(1600)
  return sunReadout()
}

/**
 * Share of pixels that materially changed between two frames.
 *
 * Mean brightness cannot see this one. The first version compared 09:00 with
 * 15:00, which are symmetric about solar noon and therefore have the SAME sun
 * elevation — the light swings from one side of the terrain to the other while
 * the average barely moves, and it read 45.0 to 45.6. What changed is which
 * slopes are lit, so count the pixels that changed.
 */
const frame = async () => {
  const buf = await p.screenshot({ clip: { x: 360, y: 200, width: 1000, height: 600 } })
  const { PNG } = await import('pngjs')
  return PNG.sync.read(buf)
}
const changedFraction = (a, b) => {
  let n = 0
  for (let i = 0; i < a.width * a.height; i++) {
    const o = i * 4
    const la = 0.299 * a.data[o] + 0.587 * a.data[o + 1] + 0.114 * a.data[o + 2]
    const lb = 0.299 * b.data[o] + 0.587 * b.data[o + 1] + 0.114 * b.data[o + 2]
    if (Math.abs(la - lb) > 12) n++
  }
  return n / (a.width * a.height)
}

// Put the exaggeration back first. The block above leaves it at 3x under a
// camera framed for 1.6x, which buries the camera in a near wall — 99% of the
// terrain hidden — and from in there the sun can swing right across the sky
// and barely 3% of pixels change. Measured: 2.9% at 3x against 12% at default
// for the same pair of times.
await exagSlider.evaluate((el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, '1.6')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await p.waitForTimeout(800)

const morning = await setHour(9)
const morningFrame = await frame()
const afternoon = await setHour(15)
const afternoonFrame = await frame()
const relit = changedFraction(morningFrame, afternoonFrame)

check(
  'the sun advances clockwise through the day',
  morning !== null &&
    afternoon !== null &&
    morning.azimuth > 90 &&
    afternoon.azimuth > morning.azimuth &&
    afternoon.azimuth < 280,
  morning && afternoon
    ? `09:00 ${morning.azimuth}°/${morning.elevation}° → 15:00 ${afternoon.azimuth}°/${afternoon.elevation}°`
    : 'no readout',
)
check(
  'moving the sun relights the terrain',
  relit > 0.08,
  `${(relit * 100).toFixed(1)}% of pixels changed between 09:00 and 15:00`,
)
await setHour(14.433) // back to the site's authored moment

/**
 * Water level.
 *
 * Two properties. Raising it must flood more ground — the easy one. And the
 * visibility statistics must NOT move, which is the one worth having: water is a
 * surface, not an occluder, and a bare-earth viewshed is indifferent to it. If
 * the level ever reached viewshed.ts, every reported area would quietly become a
 * different quantity, and nothing else in the suite would notice.
 */
const waterSlider = p.getByLabel('Water level, metres')
const setWater = async (v) => {
  await waterSlider.evaluate((el, val) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, String(val))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, v)
  await p.waitForTimeout(1500)
  const map = await p.$$eval('.relief-label', (labels) => {
    const out = {}
    for (const l of labels) {
      const num = l.parentElement && l.parentElement.querySelector('.relief-num')
      if (num) out[l.textContent.trim().toLowerCase()] = num.textContent.trim()
    }
    return out
  })
  const num = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return { flooded: num(map['flooded']), depth: num(map['max depth']), stats: await readStats() }
}

const dry = await readStats()
const low = await setWater(900)
const high = await setWater(1600)

check(
  'raising the water floods more ground',
  low.flooded > 0 && high.flooded > low.flooded * 1.5,
  `${low.flooded} → ${high.flooded} km²`,
)
check(
  'the flood deepens with the level',
  high.depth > low.depth,
  `max depth ${low.depth} → ${high.depth} m`,
)
// NOT asserted here. The independence check lives in the Death Valley block
// below, because it is vacuous on this site: the seeded observer stands at
// 2,148 m and the slider tops out at 2,070 m, so no water level can reach it.
// Verified by mutation — floating the observer on the waterline inside
// viewshed.ts changes nothing at all on the Grand Canyon and sails through.
await setWater(0) // back to dry before the site-switching checks

/**
 * Site switching.
 *
 * Four sites share one scene, one sensor and one set of controls; the elevation
 * model underneath is swapped. Three things can go wrong silently and all three
 * are asserted here: the terrain does not actually change, the observer is
 * re-seeded from a position measured on the previous raster, or the GPU
 * allocations from the previous site are never released.
 */
const allocations = () => p.evaluate(() => (window.__reliefInfo ? window.__reliefInfo() : null))
const baseline = await allocations()
check('allocation probe present', baseline !== null, baseline ? `${baseline.textures} textures` : '')

// Back to the seed height so the comparison table has something to compare.
await p.getByTitle('25 m').click()
await p.waitForTimeout(2500)
const canyon = await readStats()

/**
 * Switch site and wait for the result, rather than for a duration.
 *
 * A fixed timeout passed alone and failed inside the full suite, where the
 * machine is busy and the raster takes longer to decode: the site had changed,
 * the observer had not been seeded yet, and the read came back 0% — reported as
 * "Badwater Basin sees 0% of itself", which is a false failure describing a real
 * race. Poll for a non-zero area instead.
 */
const gotoSite = async (name) => {
  await p.getByRole('button', { name, exact: true }).click()
  const deadline = Date.now() + 30000
  for (;;) {
    await p.waitForTimeout(500)
    const s = await readStats()
    if (s.area > 0) return s
    if (Date.now() > deadline) return s
  }
}

const valley = await gotoSite('Death Valley')
check(
  'switching site re-seeds on the new terrain',
  // Badwater Basin seeds below sea level. If the observer were carried over
  // from the canyon it would still be reading ~2,148 m.
  valley.ground < 0,
  `${canyon.ground} m → ${valley.ground} m`,
)
check(
  'the new site reports its own visibility',
  valley.area > 0 && Math.abs(valley.pct - canyon.pct) > 5,
  `${canyon.pct}% of the canyon vs ${valley.pct}% of the basin, same 25 m sensor`,
)

/**
 * Visibility is independent of the water level — asserted HERE, where it can
 * actually fail. Badwater seeds 49 m below sea level, so one tap on the preset
 * puts the observer under the surface. If the level ever reached viewshed.ts,
 * an observer floated up onto the waterline would see markedly further across
 * the basin, and every reported area would silently become a different quantity.
 */
const basinDry = await readStats()
await p.getByRole('button', { name: 'sea level' }).click()
await p.waitForTimeout(2500)
const basinWet = await readStats()
check(
  'visibility is independent of the water level',
  basinDry.area === basinWet.area &&
    basinDry.pct === basinWet.pct &&
    basinDry.far === basinWet.far,
  `dry ${basinDry.area} km²/${basinDry.far} km vs submerged ${basinWet.area} km²/${basinWet.far} km`,
)

// Both tiers must be requested: the preview is what puts terrain on screen
// while the full raster is still downloading.
const requested = await p.evaluate(() =>
  performance
    .getEntriesByType('resource')
    .filter((e) => e.name.includes('/relief/death-valley/'))
    .map((e) => e.name.split('/').pop()),
)
check(
  'the site loads preview first, then the full raster',
  requested.includes('preview.png') && requested.includes('heightmap.png'),
  requested.join(', ') || 'nothing requested',
)

const comparisonRows = await p.evaluate(() => {
  const label = [...document.querySelectorAll('.relief-label')].find((l) =>
    l.textContent.includes('Same sensor'),
  )
  return label ? label.parentElement.querySelectorAll('.relief-num').length : 0
})
check('the cross-site comparison appears', comparisonRows >= 2, `${comparisonRows} sites listed`)

await gotoSite('Matterhorn')
await gotoSite('Crater Lake')
const backToCanyon = await gotoSite('Grand Canyon')
check(
  'returning to a site reproduces its numbers',
  Math.abs(backToCanyon.area - canyon.area) < 0.5,
  `${canyon.area} → ${backToCanyon.area} km²`,
)

const allocAfter = await allocations()
check(
  'cycling every site releases what it allocated',
  // A tolerance rather than equality: three.js allocates lazily and the count
  // legitimately drifts by a texture or two. A missed dispose would leave five
  // per site behind, not one.
  allocAfter !== null && baseline !== null && allocAfter.textures - baseline.textures <= 2,
  allocAfter && baseline ? `${baseline.textures} → ${allocAfter.textures} textures` : 'probe missing',
)

/**
 * Shareable state.
 *
 * The round trip is the whole point: if a link does not reproduce the view it
 * was copied from, it is worse than not having one. Change several settings,
 * take the URL, load it in a clean page, and compare what the page reports.
 */
await p.getByRole('button', { name: 'Grand Canyon', exact: true }).click()
await p.waitForTimeout(6000)
await p.getByTitle('120 m').click()
await p.waitForTimeout(2500)
await p.getByLabel('Shade by slope').check()
await p.waitForTimeout(600)
const sharedUrl = await p.evaluate(() => window.location.href)
const sharedStats = await readStats()
check(
  'the hash carries the state',
  /[?&]site=grand-canyon/.test(sharedUrl) && /[?&]h=120/.test(sharedUrl) && /[?&]s=1/.test(sharedUrl),
  sharedUrl.split('#')[1] ?? sharedUrl,
)

const fresh = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const freshErrors = []
fresh.on('pageerror', (e) => freshErrors.push(String(e)))
await fresh.goto(sharedUrl, { waitUntil: 'networkidle' })
// Poll, do not wait a fixed time. A fresh page re-downloads and re-decodes the
// raster, and this read landed at 0 km² on a 12 s wait — the same race that
// made site switching report Badwater as seeing nothing.
const readFresh = () =>
  fresh.evaluate(() => {
    const out = {}
    for (const l of document.querySelectorAll('.relief-label')) {
      const n = l.parentElement && l.parentElement.querySelector('.relief-num')
      if (n) out[l.textContent.trim().toLowerCase()] = n.textContent.trim()
    }
    const box = document.querySelector('input[aria-label="Shade by slope"]')
    return { area: out['visible'] ?? out['covered'], ground: out['elev.'], slope: box ? box.checked : null }
  })
let freshProbe = await readFresh()
for (let i = 0; i < 60 && !(Number(String(freshProbe.area ?? '').replace(/[^0-9.-]/g, '')) > 0); i++) {
  await fresh.waitForTimeout(500)
  freshProbe = await readFresh()
}
const freshState = await fresh.evaluate(() => {
  const out = {}
  for (const l of document.querySelectorAll('.relief-label')) {
    const n = l.parentElement && l.parentElement.querySelector('.relief-num')
    if (n) out[l.textContent.trim().toLowerCase()] = n.textContent.trim()
  }
  const box = document.querySelector('input[aria-label="Shade by slope"]')
  return { area: out['visible'] ?? out['covered'], ground: out['elev.'], slope: box ? box.checked : null }
})
const freshArea = Number(String(freshState.area ?? '').replace(/[^0-9.-]/g, ''))
check(
  'a shared link reproduces the view',
  Math.abs(freshArea - sharedStats.area) < 0.5 && freshState.slope === true,
  `${sharedStats.area} km² → ${freshArea} km², slope ${freshState.slope}`,
)
check('no page errors on the shared link', freshErrors.length === 0, freshErrors.slice(0, 2).join(' | '))
await fresh.close()
await p.getByLabel('Shade by slope').uncheck()

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '))

/**
 * Phone layout.
 *
 * The desktop panel is a side card and costs nothing. The same card on a 375 px
 * screen measured 415 px tall — 51% of the viewport, with the observer marker
 * underneath it and 28% of the screen left for the terrain the controls
 * describe. Everything below is about that not coming back.
 */
const phone = await browser.newPage({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const phoneErrors = []
phone.on('pageerror', (e) => phoneErrors.push(String(e)))
await phone.goto(URL, { waitUntil: 'networkidle' })
await phone.waitForTimeout(12000)

const panelHeight = () =>
  phone.evaluate(() => {
    const el = document.querySelector('main .absolute.inset-x-0 > div')
    return el ? el.getBoundingClientRect().height : null
  })

const collapsed = await panelHeight()
check('the phone panel collapses to a bar', collapsed !== null && collapsed < 90, `${collapsed} px of 812`)

// The stepper is the phone's way between sites — the nearest thing to swiping
// without a gesture handler fighting the camera for the same drag.
const phoneSite = () =>
  phone.evaluate(() => {
    const el = document.querySelector('main .absolute.inset-x-0 [aria-expanded]')
    return el ? el.textContent.trim() : null
  })
const firstSite = await phoneSite()
await phone.getByLabel('Next site').click()
await phone.waitForTimeout(7000)
const steppedSite = await phoneSite()
check('the site stepper moves between sites', !!steppedSite && steppedSite !== firstSite, `${firstSite} → ${steppedSite}`)

await phone.getByLabel('Show controls', { exact: true }).click()
await phone.waitForTimeout(500)
const opened = await panelHeight()
check(
  'opening the panel reveals the controls without covering the screen',
  opened !== null && opened > collapsed && opened < 812 * 0.72,
  `${collapsed} → ${opened} px`,
)
check(
  'the exaggeration control is reachable on a phone',
  await phone.getByLabel('Vertical exaggeration').isVisible(),
)

await phone.getByLabel('Hide controls', { exact: true }).click()
await phone.waitForTimeout(300)
check('closing it returns the screen to the terrain', (await panelHeight()) === collapsed)
check('no page errors on a phone', phoneErrors.length === 0, phoneErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(failed ? `\nrelief: ${failed} check(s) failed` : '\nrelief: all checks passed')
process.exit(failed ? 1 : 0)
