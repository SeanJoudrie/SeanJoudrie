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
  }
}

const before = await readStats()
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

const gotoSite = async (name) => {
  await p.getByRole('button', { name, exact: true }).click()
  await p.waitForTimeout(7000)
  return readStats()
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

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(failed ? `\nrelief: ${failed} check(s) failed` : '\nrelief: all checks passed')
process.exit(failed ? 1 : 0)
