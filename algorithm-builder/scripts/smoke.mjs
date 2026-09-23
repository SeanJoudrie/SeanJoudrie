// End-to-end run of the production build in Chromium. Every button in the app
// gets clicked at least once, on phone and desktop, light and dark:
//
//   phone-light-api     full flow against the REAL /api/search handler, which
//                       talks to a fake YouTube (scripts/fake-youtube in this
//                       file), so the key-configured path is proven end to end
//   desktop-dark-nokey  no API key: playlist falls back to search links
//   phone-dark-quota    fake YouTube runs out of quota mid-way
//   desktop-light-tips  TikTok, Instagram and X tip guides
//   phone-reduced       prefers-reduced-motion turns every animation off
//
// Each screen is checked for horizontal overflow, emoji / glyph icons / em
// dashes, console errors, and animations that don't use the shared timings.
// Run after `npm run build`:  npm run smoke
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { chromium } from 'playwright-core'

mkdirSync('shots', { recursive: true })
const failures = []
const check = (cond, msg) => {
  if (!cond) failures.push(msg)
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
}

/* ---------- Fake YouTube Data API ---------- */

let youtubeMode = 'ok'
let youtubeCalls = 0
const THUMB = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#2a78d6"/></svg>'
const fake = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/thumb.svg') {
    res.setHeader('content-type', 'image/svg+xml')
    return res.end(THUMB)
  }
  youtubeCalls++
  if (url.searchParams.get('key') !== 'test-key') {
    res.statusCode = 400
    return res.end(JSON.stringify({ error: { errors: [{ reason: 'keyInvalid' }] } }))
  }
  if (youtubeMode === 'quota') {
    res.statusCode = 403
    return res.end(JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }))
  }
  const q = url.searchParams.get('q')
  const before = url.searchParams.get('publishedBefore')
  const year = before ? Number(before.slice(0, 4)) - 3 : 2021
  const slug = q.replace(/[^a-z0-9]+/gi, '-')
  const item = (i, extra = {}) => ({
    id: { kind: 'youtube#video', videoId: `${slug}-${i}` },
    snippet: {
      title: `${q} &amp; more, part ${i}`,
      channelTitle: `Channel ${i}`,
      publishedAt: `${year}-06-01T00:00:00Z`,
      liveBroadcastContent: 'none',
      thumbnails: { medium: { url: `http://localhost:${FAKE_PORT}/thumb.svg` } },
      ...extra,
    },
  })
  const items = [
    item(0, { title: `Game of Thrones recap: ${q}` }), // turned down: must be filtered
    item(1, { liveBroadcastContent: 'live' }), // live: must be skipped
    item(2, { title: `${q} #shorts` }), // Shorts: must be skipped
    ...Array.from({ length: 7 }, (_, i) => item(i + 3)),
  ]
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ items }))
})
const FAKE_PORT = 4330
await new Promise((r) => fake.listen(FAKE_PORT, r))

/* ---------- App server (vite preview of the production build) ---------- */

let port = 4340
async function startApp(env) {
  const p = port++
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(p), '--strictPort'], {
    stdio: 'ignore',
    env: { ...process.env, ...env },
  })
  const base = `http://localhost:${p}/`
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(base)).ok) break
    } catch {
      /* not up yet */
    }
    if (i > 80) throw new Error('preview server did not start')
    await new Promise((r) => setTimeout(r, 250))
  }
  return { base, stop: () => child.kill() }
}

const API_ENV = { YOUTUBE_API_KEY: 'test-key', YOUTUBE_API_URL: `http://localhost:${FAKE_PORT}/youtube/v3/search` }

/* ---------- Helpers ---------- */

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
const DESKTOP = { viewport: { width: 1280, height: 900 } }
const ALLOWED_MS = new Set([240, 320, 4500, 1200]) // screen, data, blink, skeleton shimmer
// Colour/border hover fades are 150ms; a fade reversed mid-way reports a shorter duration.
const isHoverFade = (d) => d <= 150

async function newPage(name, opts) {
  const ctx = await browser.newContext({ ...opts, permissions: ['clipboard-read', 'clipboard-write'] })
  // Fonts come from Google; the test browser has no network, so skip them quietly.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text()) && errors.push(m.text()))
  return { ctx, page, errors }
}

/** Checks every screen: overflow, banned characters, animation timings. */
async function screen(page, label) {
  await page.waitForTimeout(60)
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > W + 0.5)
      .slice(0, 3)
      .map((el) => `${el.tagName}.${String(el.className?.baseVal ?? el.className).slice(0, 40)}`)
    const banned = document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✓✕↗▶—]/gu)
    const durations = document.getAnimations().map((a) => Math.round(Number(a.effect?.getTiming().duration) || 0))
    const h1 = document.querySelectorAll('h1').length
    return { W, sw: document.documentElement.scrollWidth, wide, banned, durations, h1 }
  })
  check(r.h1 === 1, `${label}: exactly one page heading (got ${r.h1})`)
  check(r.sw <= r.W, `${label}: fits the screen ${r.sw > r.W ? JSON.stringify(r.wide) : ''}`)
  check(!r.banned, `${label}: no emoji, glyph icons or em dashes ${r.banned ? r.banned.join(' ') : ''}`)
  const odd = r.durations.filter((d) => d > 0 && !ALLOWED_MS.has(d) && !isHoverFade(d))
  check(odd.length === 0, `${label}: animations use the shared timings ${odd.length ? odd.join(',') : ''}`)
  await page.screenshot({ path: `shots/${label}.png`, fullPage: true })
}

const total = (page) => page.getByText(/^Total \d+%$/).innerText()
const click = (loc) => loc.click()

/** Walk from landing to the mix step. */
async function toMix(page, { likes = ['Math', 'Science', 'Comedy'], turnDown = ['Game of Thrones'], tally = true } = {}) {
  await click(page.getByRole('button', { name: /Start my tune-up/ }))
  await click(page.getByRole('button', { name: /YouTube/ }))
  for (const l of likes) await click(page.getByRole('button', { name: l, exact: true }))
  await click(page.getByRole('button', { name: 'Next' }))
  await click(page.getByRole('button', { name: /Too much of one thing/ }))
  await click(page.getByRole('button', { name: 'Next' }))
  for (const t of turnDown) {
    await page.getByPlaceholder('e.g. Game of Thrones').fill(t)
    await page.keyboard.press('Enter')
  }
  await click(page.getByRole('button', { name: 'Next' }))
  if (tally) {
    for (let i = 0; i < 12; i++) await click(page.getByRole('button', { name: /^One more: Game of Thrones/ }))
    for (let i = 0; i < 4; i++) await click(page.getByRole('button', { name: /^One more: Stuff I actually want/ }))
  }
  await click(page.getByRole('button', { name: tally ? 'Next' : 'Skip', exact: true }))
  await page.getByRole('heading', { name: 'Build your mix' }).waitFor()
}

/* ---------- Run 1: phone, light, real API handler against fake YouTube ---------- */

async function runFull() {
  const name = 'phone-light-api'
  const app = await startApp(API_ENV)
  const { ctx, page, errors } = await newPage(name, { ...PHONE, colorScheme: 'light' })
  youtubeMode = 'ok'
  youtubeCalls = 0
  await page.goto(app.base)
  await screen(page, `${name}-0-landing`)
  check((await page.getByRole('button', { name: /Continue where I left off/ }).count()) === 0, `${name}: no resume button on first visit`)

  // Footer: legal pages, back button, source link.
  await click(page.getByRole('link', { name: 'Privacy' }))
  check(await page.getByRole('heading', { name: 'Privacy policy' }).waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: privacy page opens`)
  await screen(page, `${name}-0-privacy`)
  await click(page.getByRole('button', { name: 'Back to the app' }))
  await click(page.getByRole('link', { name: 'Terms' }))
  check(await page.getByRole('heading', { name: 'Terms of use' }).waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: terms page opens`)
  await page.goBack() // browser back from a legal page returns to the app
  check(await page.getByRole('heading', { name: /Fix a feed/ }).waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: browser back closes the legal page`)
  const src = await page.getByRole('link', { name: 'Source on GitHub' }).getAttribute('href')
  check(src === 'https://github.com/SeanJoudrie/SeanJoudrie/tree/main/algorithm-builder', `${name}: source link points at the repo`)

  // Platform + likes: popular, more topics, search filter, custom add/remove, 7 cap.
  await click(page.getByRole('button', { name: /Start my tune-up/ }))
  await click(page.getByRole('button', { name: /YouTube/ }))
  check((await page.getByRole('button', { name: 'Architecture', exact: true }).count()) === 0, `${name}: less popular topics start hidden`)
  await click(page.getByRole('button', { name: /^More topics/ }))
  check((await page.getByRole('button', { name: 'Architecture', exact: true }).count()) === 1, `${name}: More topics reveals the rest`)
  await click(page.getByRole('button', { name: 'Show fewer topics' }))
  await page.getByPlaceholder(/Search or add/).fill('arch')
  check((await page.getByRole('button', { name: 'Architecture', exact: true }).count()) === 1, `${name}: typing filters the library`)
  await page.getByPlaceholder(/Search or add/).fill('Lego Technic')
  await page.keyboard.press('Enter')
  check((await page.getByRole('button', { name: 'Remove Lego Technic' }).count()) === 1, `${name}: custom topic added with Enter`)
  await click(page.getByRole('button', { name: 'Remove Lego Technic' }))
  check((await page.getByRole('button', { name: 'Remove Lego Technic' }).count()) === 0, `${name}: custom topic removed`)
  for (const l of ['Math', 'Science', 'Comedy', 'History', 'Music', 'Cooking', 'Gaming']) await click(page.getByRole('button', { name: l, exact: true }))
  check(await page.getByRole('button', { name: 'Fitness', exact: true }).isDisabled(), `${name}: picking stops at 7`)
  for (const l of ['Music', 'Cooking', 'Gaming']) await click(page.getByRole('button', { name: l, exact: true }))
  check(!(await page.getByRole('button', { name: 'Fitness', exact: true }).isDisabled()), `${name}: un-picking frees a slot`)
  await screen(page, `${name}-1-likes`)
  await click(page.getByRole('button', { name: 'Next' }))

  // Problems: toggle, free text auto-matches.
  await click(page.getByRole('button', { name: /Too much of one thing/ }))
  await page.getByLabel(/Or say it in your own words/).fill('my feed is all drama')
  check((await page.getByRole('button', { name: /It makes me angry/ }).getAttribute('aria-pressed')) === 'true', `${name}: free text picks a matching problem`)
  await click(page.getByRole('button', { name: /It makes me angry/ }))
  check((await page.getByRole('button', { name: /It makes me angry/ }).getAttribute('aria-pressed')) === 'false', `${name}: problems toggle off`)
  await click(page.getByRole('button', { name: 'Next' }))

  // Too much of: Enter, suggestion chip, duplicate, remove.
  await page.getByPlaceholder('e.g. Game of Thrones').fill('Game of Thrones')
  await page.keyboard.press('Enter')
  await page.getByPlaceholder('e.g. Game of Thrones').fill('game of thrones')
  await page.keyboard.press('Enter')
  await click(page.getByRole('button', { name: '+ Star Wars' }))
  check((await page.getByText('Turn down (2)').count()) === 1, `${name}: duplicates ignored, suggestions add`)
  await click(page.getByRole('button', { name: 'Remove Star Wars' }))
  check((await page.getByText('Turn down (1)').count()) === 1, `${name}: turn-down item removed`)
  await screen(page, `${name}-2-toomuch`)

  // Back gesture goes back one step, not off the site.
  await page.goBack()
  check(await page.getByRole('heading', { name: /What’s wrong with it/ }).waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: phone back gesture returns to the previous step`)
  await page.goForward()
  await page.getByRole('heading', { name: /Too much of what/ }).waitFor()
  await click(page.getByRole('button', { name: 'Next' }))

  // Tally: +, -, cap at 20.
  check((await page.getByRole('button', { name: 'Skip to my fix' }).count()) === 1, `${name}: Skip to my fix shown once (O-2)`)
  check((await page.getByRole('button', { name: 'Skip', exact: true }).count()) === 1, `${name}: tally offers Skip before counting`)
  for (let i = 0; i < 22; i++) await click(page.getByRole('button', { name: /^One more: Game of Thrones/ }))
  check((await page.getByText('20 of 20 counted').count()) === 1, `${name}: tally caps at 20`)
  for (let i = 0; i < 6; i++) await click(page.getByRole('button', { name: /^One less: Game of Thrones/ }))
  for (let i = 0; i < 3; i++) await click(page.getByRole('button', { name: /^One more: Stuff I actually want/ }))
  check((await page.getByText('17 of 20 counted').count()) === 1, `${name}: tally minus works`)
  await click(page.getByRole('button', { name: 'Next' }))

  // Mix builder.
  await page.getByRole('heading', { name: 'Build your mix' }).waitFor()
  check((await total(page)) === 'Total 100%', `${name}: mix starts at 100%`)
  await page.getByRole('slider').first().focus()
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight')
  check((await total(page)) === 'Total 100%', `${name}: keyboard slider keeps 100%`)
  await click(page.getByRole('button', { name: 'Lock Science' }))
  const sciBefore = await page.getByRole('slider').nth(1).inputValue()
  await page.getByRole('slider').nth(2).fill('50')
  check((await page.getByRole('slider').nth(1).inputValue()) === sciBefore, `${name}: locked slice doesn't move`)
  check(await page.getByRole('slider').nth(1).isDisabled(), `${name}: locked slider is disabled`)
  await click(page.getByRole('button', { name: 'Unlock Science' }))
  check(!(await page.getByRole('slider').nth(1).isDisabled()), `${name}: unlock re-enables it`)
  // Sunburst: tapping a slice (at a point actually on the ring) opens its sub-topics; Enter works too.
  const slice = page.getByRole('button', { name: /^Math: \d+%/ })
  await slice.evaluate((el) => el.closest('svg').scrollIntoView({ block: 'center' }))
  const pt = await slice.evaluate((el) => {
    const len = el.getTotalLength()
    const p = el.getPointAtLength(len * 0.25)
    const m = el.getScreenCTM()
    return { x: p.x * m.a + m.e, y: p.y * m.d + m.f, cx: m.e, cy: m.f }
  })
  // Nudge from the path's outline toward the ring's middle so the tap lands inside the slice.
  await page.mouse.click(pt.x + (pt.cx - pt.x) * 0.1, pt.y + (pt.cy - pt.y) * 0.1)
  check((await page.getByRole('heading', { name: 'Inside Math' }).count()) === 1, `${name}: tapping a pie slice opens its sub-topics`)
  await click(page.getByRole('button', { name: 'Close' }))
  await slice.focus()
  await page.keyboard.press('Enter')
  check((await page.getByRole('heading', { name: 'Inside Math' }).count()) === 1, `${name}: Enter on a pie slice opens its sub-topics`)
  await click(page.getByRole('button', { name: /Add a sub-topic/ }))
  await page.getByPlaceholder(/a show or creator in Math/).fill('Chess math')
  await page.keyboard.press('Enter')
  check((await page.getByText('Chess math', { exact: true }).count()) >= 1, `${name}: sub-topic added`)
  await click(page.getByRole('button', { name: 'Remove Chess math' }))
  check((await page.getByText('Chess math', { exact: true }).count()) === 0, `${name}: sub-topic removed`)
  await click(page.getByRole('button', { name: 'Close' }))
  check((await page.getByRole('heading', { name: 'Inside Math' }).count()) === 0, `${name}: sub-topic panel closes`)
  await click(page.getByRole('button', { name: 'Split' }).first())
  await click(page.getByRole('button', { name: 'Done' }))
  // Add and remove a whole topic.
  await click(page.getByRole('button', { name: '+ Add a topic' }))
  await page.getByPlaceholder(/Chess, Formula 1/).fill('Formula 1')
  await page.keyboard.press('Enter')
  check((await total(page)) === 'Total 100%', `${name}: adding a topic keeps 100%`)
  await click(page.getByRole('button', { name: 'Remove Formula 1' }))
  check((await total(page)) === 'Total 100%', `${name}: removing a topic keeps 100%`)
  await click(page.getByRole('button', { name: 'Remove History' }))
  check((await total(page)) === 'Total 100%', `${name}: removing a liked topic keeps 100%`)
  // Views + time capsule.
  await click(page.getByRole('radio', { name: 'Before 2015' }))
  check((await page.getByRole('radio', { name: 'Before 2015' }).getAttribute('aria-checked')) === 'true', `${name}: time capsule selects`)
  await screen(page, `${name}-3-mix-pie`)
  await click(page.getByRole('radio', { name: 'Bars' }))
  await click(page.getByRole('button', { name: /^Comedy: \d+%/ }))
  check((await page.getByRole('heading', { name: 'Inside Comedy' }).count()) === 1, `${name}: tapping a bar opens its sub-topics`)
  await screen(page, `${name}-4-mix-bars`)
  await click(page.getByRole('radio', { name: 'Numbers' }))
  check((await page.getByRole('table').count()) === 1, `${name}: numbers view is a table`)
  await click(page.getByRole('radio', { name: 'Pie' }))

  // Tuning survives going back to the likes and adding one.
  const mathWeight = await page.getByRole('slider').first().inputValue()
  await click(page.getByRole('button', { name: 'Back' }))
  await click(page.getByRole('button', { name: 'Back' }))
  await click(page.getByRole('button', { name: 'Back' }))
  await click(page.getByRole('button', { name: 'Back' }))
  await page.getByRole('heading', { name: /What do you actually want/ }).waitFor()
  check((await page.getByRole('button', { name: 'History', exact: true }).getAttribute('aria-pressed')) === 'false', `${name}: removing a topic in the mix un-picks it`)
  await click(page.getByRole('button', { name: 'Fitness', exact: true }))
  for (let i = 0; i < 4; i++) await click(page.getByRole('button', { name: 'Next' }))
  await page.getByRole('heading', { name: 'Build your mix' }).waitFor()
  check((await page.getByText('Fitness', { exact: true }).count()) >= 1, `${name}: new like joins the mix`)
  check(Number(await page.getByRole('slider').first().inputValue()) >= Number(mathWeight) - 15, `${name}: earlier tuning is kept (Math ${mathWeight} → ${await page.getByRole('slider').first().inputValue()})`)
  check((await total(page)) === 'Total 100%', `${name}: still 100% after adding a like`)
  await click(page.getByRole('button', { name: /Looks good/ }))

  // Results: checklist, playlist from the real handler, links, save, reset.
  await page.getByText('Step 1.').waitFor()
  check((await page.getByText('Delete “Game of Thrones” videos from your watch history').count()) === 1, `${name}: checklist leads with deletion`)
  const boxes = page.getByRole('checkbox')
  await boxes.first().check()
  await boxes.nth(1).check()
  await boxes.nth(1).uncheck()
  check((await page.getByText(/^1 of \d+ done$/).count()) === 1, `${name}: checklist check and uncheck`)
  for (const a of await page.locator('a[target="_blank"]').all()) {
    const href = await a.getAttribute('href')
    if (!/^https:\/\//.test(href ?? '')) check(false, `${name}: external link has a real URL (${href})`)
    if ((await a.getAttribute('rel')) !== 'noopener noreferrer') check(false, `${name}: external link is safe (${href})`)
  }
  await page.getByRole('link', { name: /Play all on YouTube/ }).waitFor({ timeout: 10000 })
  const cards = page.locator('a[href^="https://www.youtube.com/watch?v="]')
  check((await cards.count()) === 10, `${name}: real handler returns a 10-video playlist (got ${await cards.count()})`)
  check((await page.getByText(/Game of Thrones recap/).count()) === 0, `${name}: turned-down videos filtered out`)
  check((await page.getByText(/#shorts/).count()) === 0, `${name}: Shorts filtered out`)
  check((await page.locator('a[href*="-1"]').filter({ hasText: 'part 1' }).count()) === 0, `${name}: live streams skipped`)
  check((await page.getByText(/& more, part/).count()) > 0, `${name}: titles are decoded (&amp; → &)`)
  const years = await cards.evaluateAll((els) => els.map((e) => Number(e.textContent.match(/· (\d{4}) ·/)?.[1])))
  check(years.every((y) => y < 2015), `${name}: time capsule reaches YouTube (${[...new Set(years)].join(',')})`)
  const playAll = await page.getByRole('link', { name: /Play all on YouTube/ }).getAttribute('href')
  check(playAll.split('video_ids=')[1].split(',').length === 10, `${name}: Play all carries all 10 videos`)
  check(await page.locator('img').first().evaluate((i) => i.complete && i.naturalWidth > 0), `${name}: thumbnails load`)
  await screen(page, `${name}-5-results`)

  // Edit mix and back: no second round of searches (session cache).
  const callsBefore = youtubeCalls
  await click(page.getByRole('button', { name: 'Edit mix' }))
  await click(page.getByRole('button', { name: /Looks good/ }))
  await page.getByRole('link', { name: /Play all on YouTube/ }).waitFor()
  check(youtubeCalls === callsBefore, `${name}: coming back reuses searches (${youtubeCalls - callsBefore} extra calls)`)

  // Copy link and calendar file.
  await click(page.getByRole('button', { name: 'Copy my recipe link' }))
  check(await page.getByRole('button', { name: 'Link copied' }).waitFor({ timeout: 3000 }).then(() => true, () => false), `${name}: copy button confirms`)
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  check(copied.includes('#r='), `${name}: clipboard holds the recipe link`)
  const [dl] = await Promise.all([page.waitForEvent('download'), click(page.getByRole('button', { name: 'Add tune-up to calendar' }))])
  const ics = readFileSync(await dl.path(), 'utf8')
  check(dl.suggestedFilename() === 'feed-tune-up.ics' && ics.includes('BEGIN:VEVENT') && ics.replace(/\r\n /g, '').includes('#r='), `${name}: calendar file downloads with the link`)

  // Reopen the recipe link: tune-up and before/after.
  const p2 = await ctx.newPage()
  await p2.goto(copied)
  check(await p2.getByText('Welcome back. Tune-up time.').waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: recipe link reopens results`)
  await click(p2.getByRole('button', { name: 'Count my homepage again' }))
  for (let i = 0; i < 4; i++) await click(p2.getByRole('button', { name: /^One more: Game of Thrones/ }))
  check((await p2.getByText(/Down 10 of 20/).count()) === 1, `${name}: before/after comparison`)
  check((await p2.locator('h1').count()) === 1, `${name}: one page heading on results`)
  await screen(p2, `${name}-6-tuneup`)
  await p2.close()

  // Start over clears everything; no stale "Continue".
  await click(page.getByRole('button', { name: 'Start over' }))
  await page.getByRole('heading', { name: /Fix a feed/ }).waitFor()
  check((await page.getByRole('button', { name: /Continue where I left off/ }).count()) === 0, `${name}: Start over removes the resume button`)
  check(!page.url().includes('#r='), `${name}: Start over clears the link`)
  await page.reload()
  check((await page.getByRole('button', { name: /Continue where I left off/ }).count()) === 0, `${name}: nothing saved after Start over`)

  // Resume works after leaving mid-flow.
  await toMix(page, { tally: false })
  await page.goto(app.base)
  await click(page.getByRole('button', { name: /Continue where I left off/ }))
  check(await page.getByText('Step 1.').waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: Continue resumes to results`)
  await click(page.getByRole('button', { name: new RegExp('Algorithm Builder') }).first())
  check(await page.getByRole('heading', { name: /Fix a feed/ }).waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: logo returns home`)

  // Phone: the action bar stays on screen.
  await click(page.getByRole('button', { name: /Start my tune-up/ }))
  await click(page.getByRole('button', { name: /YouTube/ }))
  const bar = await page.getByRole('button', { name: 'Next' }).boundingBox()
  check(bar && bar.y + bar.height <= 844, `${name}: Next button visible without scrolling`)

  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 2: desktop, dark, no API key ---------- */

async function runNoKey() {
  const name = 'desktop-dark-nokey'
  const app = await startApp({ YOUTUBE_API_KEY: '' })
  const { ctx, page, errors } = await newPage(name, { ...DESKTOP, colorScheme: 'dark' })
  await page.goto(app.base)
  await screen(page, `${name}-0-landing`)
  await toMix(page)
  await screen(page, `${name}-1-mix`)
  await click(page.getByRole('radio', { name: 'Before 2010' }))
  await click(page.getByRole('button', { name: /Looks good/ }))
  await page.getByText(/Pick the video that looks best/).waitFor()
  const links = page.locator('a[href^="https://www.youtube.com/results?search_query="]')
  check((await links.count()) > 0, `${name}: search-link fallback (${await links.count()} links)`)
  check((await links.first().getAttribute('href')).includes('before%3A2010'), `${name}: fallback links carry the time capsule`)
  check((await page.getByText(/search is busy/).count()) === 0, `${name}: no error message when there's simply no key`)
  await screen(page, `${name}-2-results`)
  // Desktop-only "Skip to my fix" button.
  await click(page.getByRole('button', { name: 'Start over' }))
  await click(page.getByRole('button', { name: /Start my tune-up/ }))
  await click(page.getByRole('button', { name: /YouTube/ }))
  await click(page.getByRole('button', { name: 'Next' }))
  await click(page.getByRole('button', { name: 'Skip to my fix' }))
  check(await page.getByText('Step 1.').waitFor({ timeout: 5000 }).then(() => true, () => false), `${name}: Skip to my fix jumps to results`)
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 3: phone, dark, YouTube quota runs out ---------- */

async function runQuota() {
  const name = 'phone-dark-quota'
  const app = await startApp(API_ENV)
  const { ctx, page, errors } = await newPage(name, { ...PHONE, colorScheme: 'dark' })
  youtubeMode = 'quota'
  await page.goto(app.base)
  await toMix(page, { likes: ['Cooking', 'Fitness'] })
  await click(page.getByRole('button', { name: /Looks good/ }))
  await page.getByText(/Pick the video that looks best/).waitFor({ timeout: 10000 })
  check((await page.getByText(/search is busy/).count()) === 1, `${name}: quota shows the friendly busy message`)
  check((await page.locator('a[href^="https://www.youtube.com/results?search_query="]').count()) > 0, `${name}: quota falls back to search links`)
  await screen(page, `${name}-results`)
  youtubeMode = 'ok'
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 4: desktop, light, tip-guide platforms ---------- */

async function runTips() {
  const name = 'desktop-light-tips'
  const app = await startApp({})
  const { ctx, page, errors } = await newPage(name, { ...DESKTOP, colorScheme: 'light' })
  for (const [label, host, word] of [
    ['TikTok', 'tiktok.com/search', 'long-press'],
    ['X / Twitter', 'x.com/search', 'Mute the words'],
    ['Instagram Reels', null, 'Not interested'],
  ]) {
    await page.goto(app.base)
    await click(page.getByRole('button', { name: /Start my tune-up/ }))
    await click(page.getByRole('button', { name: new RegExp(label.replace('/', '\\/')) }))
    await click(page.getByRole('button', { name: 'Math', exact: true }))
    await click(page.getByRole('button', { name: 'Next' }))
    await click(page.getByRole('button', { name: 'Next' }))
    await page.getByPlaceholder('e.g. Game of Thrones').fill('Lego')
    await page.keyboard.press('Enter')
    await click(page.getByRole('button', { name: 'Skip to my fix' }))
    await page.getByText('Seed your feed').waitFor()
    check((await page.getByText(new RegExp(word)).count()) > 0, `${name}: ${label} checklist uses its own wording`)
    const n = host ? await page.locator(`a[href*="${host}"]`).count() : await page.locator('a[href*="instagram.com"]').count()
    check(host ? n > 0 : n === 0, `${name}: ${label} search ${host ? 'links go to the app' : 'terms shown without fake links'}`)
    await screen(page, `${name}-${label.split(' ')[0].toLowerCase()}`)
    await click(page.getByRole('button', { name: 'Start over' }))
  }
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 5: phone, reduced motion ---------- */

async function runReducedMotion() {
  const name = 'phone-reduced'
  const app = await startApp({})
  const { ctx, page, errors } = await newPage(name, { ...PHONE, reducedMotion: 'reduce' })
  await page.goto(app.base)
  await toMix(page, { tally: false })
  await page.getByRole('slider').first().fill('60')
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  check(running === 0, `${name}: nothing animates with reduced motion (${running} running)`)
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

try {
  await runFull()
  await runNoKey()
  await runQuota()
  await runTips()
  await runReducedMotion()
} catch (e) {
  failures.push(String(e).split('\n')[0])
  console.error(e)
} finally {
  await browser.close()
  fake.close()
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')
process.exit(0)
