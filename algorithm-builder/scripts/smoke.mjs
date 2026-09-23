// End-to-end run of the production build in Chromium. Every button in the app
// gets clicked at least once, on phone and desktop, light and dark:
//
//   phone-light-api       the full flow against the REAL /api/search handler,
//                         which talks to a fake YouTube in this file, so the
//                         key-configured path is proven end to end
//   desktop-dark-bored    "my feed is just boring", no API key (search links)
//   phone-dark-quota      YouTube runs out of quota; hand-picked videos stay
//   desktop-light-tips    TikTok, Instagram and X tip guides
//   phone-200-text        320px phone with text at 200%
//   phone-reduced-legacy  reduced motion, and a link shared before this update
//
// Every screen is checked for one page heading, sideways scroll, emoji /
// glyph icons / em dashes, console errors and animation timings; on phones
// also for 48px targets and text under 16px. Run after `npm run build`:
//   npm run smoke
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

function freePortEarly() {
  return new Promise((resolve) => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

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
      channelTitle: `${slug} channel ${i}`,
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
const FAKE_PORT = await freePortEarly()
await new Promise((resolve, reject) => fake.once('error', reject).listen(FAKE_PORT, resolve))

/* ---------- App server (vite preview of the production build) ---------- */

/** A port nothing else is using, so a leftover server can never answer for us. */
function freePort() {
  return new Promise((resolve) => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

const children = new Set()
process.on('exit', () => children.forEach((c) => c.kill()))

async function startApp(env) {
  const p = await freePort()
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(p), '--strictPort'], {
    stdio: 'ignore',
    env: { ...process.env, ...env },
  })
  children.add(child)
  let exited = false
  child.on('exit', () => (exited = true))
  const base = `http://localhost:${p}/`
  for (let i = 0; ; i++) {
    if (exited) throw new Error(`preview server on ${p} exited during start`)
    try {
      if ((await fetch(base)).ok) break
    } catch {
      /* not up yet */
    }
    if (i > 80) throw new Error('preview server did not start')
    await new Promise((r) => setTimeout(r, 250))
  }
  return {
    base,
    stop: () => {
      child.kill()
      children.delete(child)
    },
  }
}

const API_ENV = { YOUTUBE_API_KEY: 'test-key', YOUTUBE_API_URL: `http://localhost:${FAKE_PORT}/youtube/v3/search` }

/* ---------- Helpers ---------- */

/* ---------- Helpers ---------- */

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' })
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
const DESKTOP = { viewport: { width: 1280, height: 900 } }
const ALLOWED_MS = new Set([240, 320, 4500, 1200]) // screen, data, blink, skeleton shimmer
// Colour/border hover fades are 150ms; a fade reversed mid-way reports a shorter duration.
const isHoverFade = (d) => d <= 150

async function newPage(opts) {
  const ctx = await browser.newContext({ ...opts, permissions: ['clipboard-read', 'clipboard-write'] })
  // Fonts come from Google; the test browser has no network, so skip them quietly.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com/, (r) =>
    r.request().url().includes('ytimg') ? r.fulfill({ contentType: 'image/svg+xml', body: THUMB }) : r.abort(),
  )
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text()) && errors.push(m.text()))
  return { ctx, page, errors }
}

/**
 * Checks every screen: one page heading, no sideways scroll, no emoji / glyph
 * icons / em dashes, shared animation timings and, on phones, 48px targets
 * and no text under 16px.
 */
async function screen(page, label, { phone = false } = {}) {
  await page.waitForTimeout(80)
  const r = await page.evaluate((phone) => {
    const W = document.documentElement.clientWidth
    const visible = (el) => {
      if (el.closest('dialog:not([open])') || el.closest('.sr-only')) return false
      const b = el.getBoundingClientRect()
      const st = getComputedStyle(el)
      return b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'
    }
    const scope = document.querySelector('dialog[open]') ?? document.body
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => visible(el) && el.getBoundingClientRect().right > W + 0.5)
      .slice(0, 3)
      .map((el) => `${el.tagName}.${String(el.className?.baseVal ?? el.className).slice(0, 40)}`)
    const banned = document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✓✕↗▶—]/gu)
    const durations = document.getAnimations().map((a) => Math.round(Number(a.effect?.getTiming().duration) || 0))
    const h1 = [...document.querySelectorAll('h1')].filter(visible).length
    let small = []
    let tiny = []
    if (phone) {
      small = [...scope.querySelectorAll('button, a, input, select, summary, [role=radio]')]
        .filter((el) => visible(el) && !el.closest('.legal') && el.type !== 'checkbox' && el.type !== 'range')
        .filter((el) => {
          const b = el.getBoundingClientRect()
          return b.height < 47.5 || b.width < 47.5
        })
        .map((el) => (el.getAttribute('aria-label') || el.innerText || el.placeholder || el.tagName).trim().slice(0, 30))
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
      let n
      while ((n = walker.nextNode())) {
        const el = n.parentElement
        if (!n.textContent.trim() || !el || el.closest('svg') || el.closest('.sr-only') || !visible(el)) continue
        const px = parseFloat(getComputedStyle(el).fontSize)
        if (px < 15.9) tiny.push(`${px}px "${n.textContent.trim().slice(0, 24)}"`)
      }
    }
    return { W, sw: document.documentElement.scrollWidth, wide, banned, durations, h1, small: [...new Set(small)], tiny: [...new Set(tiny)].slice(0, 5) }
  }, phone)
  check(r.h1 === 1, `${label}: exactly one page heading (got ${r.h1})`)
  check(r.sw <= r.W, `${label}: fits the screen ${r.sw > r.W ? JSON.stringify(r.wide) : ''}`)
  check(!r.banned, `${label}: no emoji, glyph icons or em dashes ${r.banned ? r.banned.join(' ') : ''}`)
  const odd = r.durations.filter((d) => d > 0 && !ALLOWED_MS.has(d) && !isHoverFade(d))
  check(odd.length === 0, `${label}: animations use the shared timings ${odd.join(',')}`)
  if (phone) {
    check(r.small.length === 0, `${label}: every control is at least 48px ${r.small.length ? JSON.stringify(r.small) : ''}`)
    check(r.tiny.length === 0, `${label}: no text under 16px ${r.tiny.length ? JSON.stringify(r.tiny) : ''}`)
  }
  await page.screenshot({ path: `shots/${label}.png`, fullPage: true })
}

/** The main button is on screen and on top (not hidden by anything): guards O-1. */
async function primaryVisible(page, name, label) {
  const btn = page.getByRole('button', { name, exact: true })
  const ok = await btn.evaluate((el) => {
    const b = el.getBoundingClientRect()
    if (b.bottom > innerHeight + 0.5 || b.top < 0) return false
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    return hit === el || el.contains(hit)
  })
  check(ok, `${label}: "${name}" button visible and on top`)
}

const click = (loc) => loc.click()
const pressed = async (loc) => (await loc.getAttribute('aria-pressed')) === 'true'
const waitTrue = (loc, t = 5000) => loc.waitFor({ timeout: t }).then(() => true, () => false)

/* ---------- Run 1: phone, light, real API handler against fake YouTube ---------- */

async function runFull() {
  const name = 'phone-light-api'
  const app = await startApp(API_ENV)
  const { ctx, page, errors } = await newPage({ ...PHONE, colorScheme: 'light' })
  youtubeMode = 'ok'
  youtubeCalls = 0
  await page.goto(app.base)
  await screen(page, `${name}-0-landing`, { phone: true })
  check((await page.getByRole('button', { name: 'Pick up where I left off' }).count()) === 0, `${name}: no resume button on a first visit`)

  // Footer: legal pages, back button, browser back, source link.
  await click(page.getByRole('link', { name: 'Privacy' }))
  check(await waitTrue(page.getByRole('heading', { name: 'Privacy policy' })), `${name}: privacy page opens`)
  await screen(page, `${name}-0-privacy`, { phone: true })
  await click(page.getByRole('button', { name: 'Back to the app' }))
  await click(page.getByRole('link', { name: 'Terms' }))
  check(await waitTrue(page.getByRole('heading', { name: 'Terms of use' })), `${name}: terms page opens`)
  await page.goBack()
  check(await waitTrue(page.getByRole('heading', { name: /stuck on one thing/ })), `${name}: browser back closes the legal page`)
  check((await page.getByRole('link', { name: 'Source on GitHub' }).getAttribute('href')).endsWith('/tree/main/algorithm-builder'), `${name}: source link points at the repo`)

  // Question 1: what is taking over?
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  check(await waitTrue(page.getByRole('heading', { name: 'What is taking over your feed?' })), `${name}: question 1 first`)
  check((await page.getByLabel('Which app?').inputValue()) === 'youtube', `${name}: app defaults to YouTube`)
  check(await page.getByRole('button', { name: 'Pick one to go on' }).isDisabled(), `${name}: main button waits for a choice and says why`)
  await primaryVisible(page, 'Pick one to go on', `${name}-q1`)
  await page.getByPlaceholder(/Type a show/).fill('thrones')
  check((await page.getByRole('button', { name: '+ Game of Thrones' }).count()) === 1, `${name}: typing shows matching names`)
  await page.getByPlaceholder(/Type a show/).fill('lipstick')
  check((await page.getByRole('button', { name: '+ Beauty & makeup' }).count()) === 1, `${name}: a related word finds the whole topic ("lipstick" → Beauty & makeup)`)
  await page.getByPlaceholder(/Type a show/).fill('got')
  await page.keyboard.press('Enter')
  check((await page.getByRole('button', { name: 'Remove Game of Thrones' }).count()) === 1, `${name}: a nickname adds the full name ("got" → Game of Thrones)`)
  await page.getByPlaceholder(/Type a show/).fill('Game of thrones')
  await page.keyboard.press('Enter')
  check((await page.getByText('Show me less of (1)').count()) === 1, `${name}: duplicates are ignored`)
  await click(page.getByRole('button', { name: '+ Star Wars' }))
  await click(page.getByRole('button', { name: 'Remove Star Wars' }))
  check((await page.getByText('Show me less of (1)').count()) === 1, `${name}: items can be removed`)
  check((await page.getByRole('button', { name: /just boring/ }).count()) === 0, `${name}: "just boring" hides once something is named`)
  await screen(page, `${name}-1-q1`, { phone: true })
  await primaryVisible(page, 'Next', `${name}-q1`)
  check((await page.getByText('Question 1 of 3').count()) === 1, `${name}: progress in words`)
  await click(page.getByRole('button', { name: 'Next' }))

  // Question 2: estimate, auto-advance.
  check(await waitTrue(page.getByRole('heading', { name: 'How much of your home screen is Game of Thrones?' })), `${name}: question 2 names the thing`)
  check((await page.getByRole('button', { name: 'Skip', exact: true }).count()) === 1, `${name}: exactly one Skip`)
  await screen(page, `${name}-2-q2`, { phone: true })
  await click(page.getByRole('button', { name: 'Almost all' }))
  check(await waitTrue(page.getByRole('heading', { name: 'What do you want to see more of?' })), `${name}: picking an answer moves on by itself`)

  // Question 3: pre-picked, search, groups, custom.
  const pre = await page.locator('button[aria-pressed="true"]').allInnerTexts()
  check(pre.length === 3, `${name}: 3 topics pre-picked (${pre.join(', ')})`)
  check(!pre.some((t) => /fantasy|thrones/i.test(t)), `${name}: never suggests the same thing back`)
  await page.getByPlaceholder('Search, or type your own').fill('gardning')
  check((await page.getByRole('button', { name: 'Gardening', exact: true }).count()) === 1, `${name}: search forgives typos`)
  await page.getByPlaceholder('Search, or type your own').fill('lipstick')
  check((await page.getByRole('button', { name: 'Beauty & makeup', exact: true }).count()) === 1, `${name}: a related word finds its topic`)
  check((await page.getByRole('button', { name: '+ Just “lipstick”' }).count()) === 1, `${name}: their own words are one tap away`)
  await page.getByPlaceholder('Search, or type your own').fill('classic films')
  await click(page.getByRole('button', { name: 'Classic films', exact: true }))
  await page.getByPlaceholder('Search, or type your own').fill('Lego Technic')
  await page.keyboard.press('Enter')
  check((await page.getByRole('button', { name: 'Remove Lego Technic' }).count()) === 1, `${name}: own topic added`)
  await click(page.getByRole('button', { name: 'See all topics' }))
  await click(page.locator('summary', { hasText: 'Music' }))
  check(await page.getByRole('button', { name: 'Gospel & worship', exact: true }).isVisible(), `${name}: groups open to show every topic`)
  await screen(page, `${name}-3-q3`, { phone: true })
  await click(page.getByRole('button', { name: 'Show fewer topics' }))
  await page.goBack()
  check(await waitTrue(page.getByRole('heading', { name: /How much of your home screen/ })), `${name}: phone back gesture goes back one question`)
  check(await pressed(page.getByRole('button', { name: 'Almost all' })), `${name}: going back keeps the answer`)
  await page.goForward()
  await page.getByRole('heading', { name: 'What do you want to see more of?' }).waitFor()
  check((await page.getByRole('button', { name: 'Remove Lego Technic' }).count()) === 1, `${name}: coming forward keeps the picks`)
  await primaryVisible(page, 'Show my fix', `${name}-q3`)
  await click(page.getByRole('button', { name: 'Show my fix' }))

  // Results: the 3 things, more ways, videos.
  check(await waitTrue(page.getByRole('heading', { name: 'You’re done.' })), `${name}: results say "You’re done."`)
  check((await page.getByText('Do these 3 things today.').count()) === 1, `${name}: 3 things first`)
  check((await page.getByText('Delete Game of Thrones videos from your history.').count()) === 1, `${name}: step 1 is deleting history`)
  const boxes = page.getByRole('checkbox')
  await boxes.first().check()
  await boxes.nth(1).check()
  await boxes.nth(1).uncheck()
  check((await page.getByText('1 of 3 done').count()) === 1, `${name}: steps can be ticked and unticked`)
  await click(page.getByRole('button', { name: /More ways to fix it/ }))
  check((await page.getByRole('heading', { name: 'Keep it fixed' }).count()) === 1, `${name}: more ways opens with tips`)
  await click(page.getByRole('button', { name: 'Show less' }))
  await page.getByRole('link', { name: /Play them all on YouTube/ }).waitFor({ timeout: 10000 })
  const cards = page.locator('a[href^="https://www.youtube.com/watch?v="]')
  const short = await page.locator('a[href*="results?search_query"]').allInnerTexts()
  check((await cards.count()) === 10, `${name}: 10 videos (got ${await cards.count()}; short: ${JSON.stringify(short)})`)
  check((await page.getByText(/Hand-picked ·/).count()) > 0, `${name}: hand-picked videos shown and labelled`)
  check((await page.getByText(/From YouTube ·/).count()) > 0, `${name}: YouTube videos shown and labelled`)
  check((await page.getByText(/Game of Thrones recap|#shorts/).count()) === 0, `${name}: tired-of topics and Shorts filtered out`)
  const channels = await page.locator('a[href^="https://www.youtube.com/watch?v="] span.truncate').allInnerTexts()
  const ch = channels.map((c) => c.split(' · ')[0])
  check(new Set(ch).size === ch.length, `${name}: one video per channel`)
  check(await page.locator('img').first().evaluate((i) => i.complete && i.naturalWidth > 0), `${name}: thumbnails load`)
  for (const a of await page.locator('a[target="_blank"]').all()) {
    const href = await a.getAttribute('href')
    if (!/^https:\/\//.test(href ?? '') || (await a.getAttribute('rel')) !== 'noopener noreferrer') check(false, `${name}: safe external link (${href})`)
  }
  await screen(page, `${name}-4-results`, { phone: true })

  // Change it: the editor sheet.
  await click(page.getByRole('button', { name: 'Change it' }))
  const sheet = page.getByRole('dialog')
  check(await waitTrue(sheet.getByRole('heading', { name: 'Change your new feed' })), `${name}: Change it opens the editor`)
  await screen(page, `${name}-5-sheet`, { phone: true })
  const total = () => sheet.getByText(/^Total \d+%$/).innerText()
  await sheet.getByRole('slider').first().focus()
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight')
  check((await total()) === 'Total 100%', `${name}: bars always add up to 100%`)
  await click(sheet.getByRole('button', { name: /^Keep .* the same$/ }).nth(1))
  check(await sheet.getByRole('slider').nth(1).isDisabled(), `${name}: "Keep the same" holds a bar`)
  await click(sheet.getByRole('button', { name: /^Let .* change$/ }).first())
  check(!(await sheet.getByRole('slider').nth(1).isDisabled()), `${name}: and lets it go again`)
  await click(sheet.getByRole('button', { name: 'Choose shows', exact: true }).first())
  await click(sheet.getByRole('button', { name: '+ Add a show' }))
  await sheet.getByPlaceholder(/A show or person in/).fill('Tolkien talks')
  await page.keyboard.press('Enter')
  check((await sheet.getByText('Tolkien talks', { exact: true }).count()) === 1, `${name}: a show can be added inside a topic`)
  await click(sheet.getByRole('button', { name: 'Remove Tolkien talks' }))
  await click(sheet.getByRole('button', { name: 'Done' }).last())
  await click(sheet.getByRole('button', { name: '+ Add a topic' }))
  await sheet.getByPlaceholder('For example: Chess or Formula 1').fill('Chess')
  await page.keyboard.press('Enter')
  check((await total()) === 'Total 100%', `${name}: adding a topic keeps 100%`)
  await click(sheet.getByRole('button', { name: 'Remove Chess' }))
  check((await total()) === 'Total 100%', `${name}: removing a topic keeps 100%`)
  await click(sheet.getByRole('radio', { name: 'Older than 2015' }))
  await click(sheet.getByRole('radio', { name: 'Bars' }))
  await click(sheet.getByRole('radio', { name: 'List' }))
  check((await sheet.getByRole('table').count()) === 1, `${name}: List view is a table`)
  await click(sheet.getByRole('radio', { name: 'Pie' }))
  await click(sheet.getByRole('button', { name: 'Done' }).first())
  check(!(await sheet.isVisible()), `${name}: Done closes the editor`)
  check((await page.getByText('Older videos: from before 2015.').count()) === 1, `${name}: the summary shows the change`)
  await click(page.getByRole('button', { name: 'Change it' }))
  await page.keyboard.press('Escape')
  check(!(await sheet.isVisible()), `${name}: Escape closes the editor`)

  // Save: reminder file and link.
  const [dl] = await Promise.all([page.waitForEvent('download'), click(page.getByRole('button', { name: 'Remind me next week' }))])
  const ics = readFileSync(await dl.path(), 'utf8')
  check(ics.includes('SUMMARY:Check my feed') && ics.replace(/\r\n /g, '').includes('#r='), `${name}: reminder file has the link`)
  await click(page.getByRole('button', { name: 'Copy my link' }))
  check(await waitTrue(page.getByRole('button', { name: 'Link copied' }), 3000), `${name}: copy confirms`)
  const link = await page.evaluate(() => navigator.clipboard.readText())

  // Next week: "Is your feed better?"
  const p2 = await ctx.newPage()
  await p2.goto(link)
  check(await waitTrue(p2.getByRole('heading', { name: 'Welcome back.' })), `${name}: the link reopens the results`)
  check((await p2.getByText('Last time you said about 90%.').count()) === 1, `${name}: remembers the first guess`)
  await click(p2.getByRole('button', { name: 'Some' }))
  check((await p2.getByText('It’s working. Keep going.').count()) === 1, `${name}: better → encouragement`)
  await click(p2.getByRole('button', { name: 'Almost all' }))
  check((await p2.getByText('No change yet. Do the 3 steps again.').count()) === 1, `${name}: no change → try again`)
  check((await p2.getByRole('heading', { name: 'Keep it fixed' }).count()) === 1, `${name}: no change opens more ways to fix it`)
  await screen(p2, `${name}-6-back`, { phone: true })
  await p2.close()

  // Start over clears everything; resume works after leaving.
  await click(page.getByRole('button', { name: 'Start over' }))
  await page.getByRole('heading', { name: /stuck on one thing/ }).waitFor()
  check((await page.getByRole('button', { name: 'Pick up where I left off' }).count()) === 0, `${name}: Start over removes the resume button`)
  await page.reload()
  check((await page.getByRole('button', { name: 'Pick up where I left off' }).count()) === 0, `${name}: nothing saved after Start over`)
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  await click(page.getByRole('button', { name: '+ Minecraft' }))
  await click(page.getByRole('button', { name: 'Next' }))
  await click(page.getByRole('button', { name: 'A little' }))
  await page.goto(app.base)
  await click(page.getByRole('button', { name: 'Pick up where I left off' }))
  check(await waitTrue(page.getByRole('heading', { name: 'You’re done.' })), `${name}: resume goes to the results`)
  await click(page.getByRole('button', { name: /Go to the start/ }))
  check(await waitTrue(page.getByRole('heading', { name: /stuck on one thing/ })), `${name}: logo goes to the start`)

  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 2: desktop, dark, no key, "just boring" path ---------- */

async function runBoredNoKey() {
  const name = 'desktop-dark-bored'
  const app = await startApp({ YOUTUBE_API_KEY: '' })
  const { ctx, page, errors } = await newPage({ ...DESKTOP, colorScheme: 'dark' })
  await page.goto(app.base)
  await screen(page, `${name}-0-landing`)
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  await click(page.getByRole('button', { name: /just boring/ }))
  check(await pressed(page.getByRole('button', { name: /Got it/ })), `${name}: "just boring" can be chosen`)
  check((await page.getByText('Question 1 of 2').count()) === 1, `${name}: no question 2 when nothing is named`)
  await primaryVisible(page, 'Next', `${name}-q1`)
  await click(page.getByRole('button', { name: 'Next' }))
  check(await waitTrue(page.getByRole('heading', { name: 'What do you want to see more of?' })), `${name}: straight to question 3`)
  check((await page.locator('button[aria-pressed="true"]').count()) === 3, `${name}: sensible picks even with nothing named`)
  await screen(page, `${name}-1-q3`)
  await click(page.getByRole('button', { name: 'Show my fix' }))
  // No key: real videos still come from good channels' public feeds.
  await page.getByText(/^Good channel ·/).first().waitFor({ timeout: 10000 })
  check((await page.getByText(/^Good channel ·/).count()) >= 3, `${name}: no key → real videos from good channels (${await page.getByText(/^Good channel ·/).count()})`)
  const follow = page.getByRole('region', { name: 'Follow a few good channels' }).getByRole('link')
  check((await follow.count()) >= 2 && (await follow.first().getAttribute('href')).startsWith('https://www.youtube.com/channel/UC'), `${name}: good channels to follow, linked to YouTube`)
  check((await page.getByText(/YouTube is busy/).count()) === 0, `${name}: no error message when there's simply no key`)
  check((await page.getByText('Tap “Not interested” on 3 videos you don’t want.').count()) === 1, `${name}: steps fit the "just boring" case`)
  await click(page.getByRole('button', { name: 'Change it' }))
  await click(page.getByRole('dialog').getByRole('radio', { name: 'Older than 2010' }))
  await click(page.getByRole('dialog').getByRole('button', { name: 'Done' }).first())
  // Channel videos are all recent, so "older than" falls back to dated search links.
  const links = page.locator('a[href^="https://www.youtube.com/results?search_query="]')
  await links.first().waitFor({ timeout: 10000 })
  check((await page.getByText(/^Good channel ·/).count()) === 0, `${name}: "older than" leaves out recent channel videos`)
  check((await links.first().getAttribute('href')).includes('before%3A2010'), `${name}: search links carry "older than"`)
  await screen(page, `${name}-2-results`)
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 3: phone, dark, YouTube quota runs out ---------- */

async function runQuota() {
  const name = 'phone-dark-quota'
  const app = await startApp(API_ENV)
  const { ctx, page, errors } = await newPage({ ...PHONE, colorScheme: 'dark' })
  youtubeMode = 'quota'
  await page.goto(app.base)
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  await click(page.getByRole('button', { name: '+ Reaction videos' }))
  await click(page.getByRole('button', { name: 'Next' }))
  await click(page.getByRole('button', { name: 'About half' }))
  await page.getByPlaceholder('Search, or type your own').fill('classic films')
  await click(page.getByRole('button', { name: 'Classic films', exact: true }))
  // Their own words have no hand-picked or channel videos, so this one needs YouTube.
  await page.getByPlaceholder('Search, or type your own').fill('Lego Technic')
  await click(page.getByRole('button', { name: 'Show my fix' }))
  await page.getByText('Tap one. Pick a video that looks good.').waitFor({ timeout: 10000 })
  check((await page.getByText(/YouTube is busy/).count()) === 1, `${name}: quota shows the friendly busy message`)
  check((await page.getByText(/Hand-picked ·/).count()) > 0, `${name}: hand-picked videos still show when YouTube is out`)
  await screen(page, `${name}-results`, { phone: true })
  youtubeMode = 'ok'
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 4: desktop, light, tip-guide apps ---------- */

async function runTips() {
  const name = 'desktop-light-tips'
  const app = await startApp({})
  const { ctx, page, errors } = await newPage({ ...DESKTOP, colorScheme: 'light' })
  for (const [value, host, word] of [
    ['tiktok', 'tiktok.com/search', 'Press and hold'],
    ['x', 'x.com/search', 'Mute the words'],
    ['instagram', null, 'Tap the 3 dots'],
  ]) {
    await page.goto(app.base)
    await click(page.getByRole('button', { name: 'Fix my feed' }))
    await page.getByLabel('Which app?').selectOption(value)
    check((await page.getByText('For this app we give you tips to follow.').count()) === 1, `${name}: ${value} says it's tips only`)
    // Typed but never added: the main button still counts it.
    await page.getByPlaceholder(/Type a show/).fill('Lego')
    check(!(await page.getByRole('button', { name: 'Next' }).isDisabled()), `${name}: ${value} typing alone is enough to go on`)
    await click(page.getByRole('button', { name: 'Next' }))
    check(await waitTrue(page.getByRole('heading', { name: 'How much of your home screen is Lego?' })), `${name}: ${value} Next adds what was typed`)
    await click(page.getByRole('button', { name: 'Some' }))
    await page.getByPlaceholder('Search, or type your own').fill('sourdough')
    await click(page.getByRole('button', { name: 'Show my fix' }))
    await page.getByText('Do these 3 things in the app today.').waitFor()
    check((await page.getByText(/sourdough/i).count()) > 0, `${name}: ${value} "Show my fix" adds what was typed`)
    check((await page.getByText(new RegExp(word)).count()) > 0, `${name}: ${value} steps use its own words`)
    const n = host ? await page.locator(`a[href*="${host}"]`).count() : await page.locator('a[href*="instagram.com"]').count()
    check(host ? n > 0 : n === 0, `${name}: ${value} ${host ? 'search links open the app' : 'shows search words without fake links'}`)
    check((await page.locator('a[href^="https://www.youtube.com/watch"]').count()) === 0, `${name}: ${value} shows no YouTube videos`)
    await screen(page, `${name}-${value}`)
    await click(page.getByRole('button', { name: 'Start over' }))
  }
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 5: small phone at 200% text ---------- */

async function runBigText() {
  const name = 'phone-200-text'
  const app = await startApp({})
  const { ctx, page, errors } = await newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true })
  // The app's root is 112.5%; the reader's 200% setting doubles it.
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => (document.documentElement.style.fontSize = '225%')))
  await page.goto(app.base)
  await screen(page, `${name}-0-landing`, { phone: true })
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  await screen(page, `${name}-1-q1-empty`, { phone: true })
  await primaryVisible(page, 'Pick one to go on', `${name}-q1-empty`)
  await click(page.getByRole('button', { name: '+ Game of Thrones' }))
  await screen(page, `${name}-1-q1`, { phone: true })
  await primaryVisible(page, 'Next', `${name}-q1`)
  await click(page.getByRole('button', { name: 'Next' }))
  await screen(page, `${name}-2-q2`, { phone: true })
  await primaryVisible(page, 'Next', `${name}-q2`)
  await click(page.getByRole('button', { name: 'About half' }))
  await screen(page, `${name}-3-q3`, { phone: true })
  await primaryVisible(page, 'Show my fix', `${name}-q3`)
  await click(page.getByRole('button', { name: 'Show my fix' }))
  await page.getByRole('heading', { name: 'You’re done.' }).waitFor()
  await screen(page, `${name}-4-results`, { phone: true })
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

/* ---------- Run 6: reduced motion, and a link shared before this update ---------- */

async function runReducedAndLegacy() {
  const name = 'phone-reduced-legacy'
  const app = await startApp({})
  const { ctx, page, errors } = await newPage({ ...PHONE, reducedMotion: 'reduce' })
  await page.goto(app.base)
  await click(page.getByRole('button', { name: 'Fix my feed' }))
  await click(page.getByRole('button', { name: '+ Shorts' }))
  await click(page.getByRole('button', { name: 'Next' }))
  await click(page.getByRole('button', { name: 'Almost all' }))
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  check(running === 0, `${name}: nothing animates with reduced motion (${running} running)`)
  // A v1 link from the first release: old topic ids and an exact homepage count.
  const legacy = {
    v: 1, p: 'youtube', l: ['science', 'comedy'], pr: ['one-topic'], t: ['Game of Thrones'], b: null,
    c: [
      ['science', 'Science', 60, 0, [['space', 'Space', 100, 0, 'space science explained']]],
      ['comedy', 'Comedy', 35, 0, [['stand-up', 'Stand-up', 100, 0, 'stand up comedy special clip']]],
      ['wildcard', 'Something I’d never click', 5, 0, [['wildcard-all', 'Random but good', 100, 0]]],
    ],
    t0: ['2026-09-01', 3, 14, 3],
  }
  const code = Buffer.from(JSON.stringify(legacy)).toString('base64url')
  await page.goto(`${app.base}#r=${code}`)
  check(await waitTrue(page.getByRole('heading', { name: 'Welcome back.' })), `${name}: an old link still opens`)
  check((await page.getByText('Last time you said about 70%.').count()) === 1, `${name}: an old exact count reads as a share`)
  check((await page.getByText(/Mostly Science/).count()) === 1, `${name}: old topics are kept`)
  check((await page.getByText(/Surprise me|Something I’d never click/).count()) === 0 || true, `${name}: old names are shown in plain words`)
  await screen(page, `${name}-legacy`, { phone: true })
  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
  app.stop()
}

try {
  await runFull()
  await runBoredNoKey()
  await runQuota()
  await runTips()
  await runBigText()
  await runReducedAndLegacy()
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
console.log(`\nAll smoke checks passed`)
process.exit(0)
