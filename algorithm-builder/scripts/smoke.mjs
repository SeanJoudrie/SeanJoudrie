// End-to-end smoke run: walks the whole two-minute flow in a real browser,
// once with a (stubbed) YouTube API and once without, then reopens the recipe
// link. Screenshots land in ./shots. Run after `npm run build`:
//   npm run smoke
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PORT = 4318
const BASE = `http://localhost:${PORT}/`
mkdirSync('shots', { recursive: true })

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
server.on('exit', (code) => code && console.error(`preview server exited (${code})`))
for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {
    /* not up yet */
  }
  if (i > 60) throw new Error('preview server did not start')
  await new Promise((r) => setTimeout(r, 250))
}

const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'
const browser = await chromium.launch({ executablePath }).catch(() => chromium.launch())
const failures = []
const check = (cond, msg) => {
  if (!cond) failures.push(msg)
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
}

const thumb =
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="68"><rect width="120" height="68" fill="#2a78d6"/></svg>')

async function stubApi(page, mode) {
  let n = 0
  await page.route('**/api/search**', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q')
    if (mode === 'none') return route.fulfill({ json: { status: 'unconfigured' } })
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `vid${n++}`,
      title: i === 0 ? `Game of Thrones recap ${q}` : `${q} — part ${i}`,
      channel: `Channel ${i}`,
      published: '2014-05-01T00:00:00Z',
      thumb,
    }))
    return route.fulfill({ json: { status: 'ok', items } })
  })
}

async function shot(page, path) {
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > W + 0.5)
      .slice(0, 3)
      .map((el) => `${el.tagName}.${String(el.className?.baseVal ?? el.className).slice(0, 50)}`)
    return { W, sw: document.documentElement.scrollWidth, wide }
  })
  check(r.sw <= r.W, `${path}: no horizontal overflow ${r.sw > r.W ? JSON.stringify(r) : ''}`)
  await page.screenshot({ path: `shots/${path}.png`, fullPage: true })
}

async function runFlow({ name, viewport, scheme, api }) {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && errors.push(m.text()))
  await stubApi(page, api)
  await page.goto(BASE)
  await shot(page, `${name}-0-landing`)

  await page.getByRole('button', { name: /Start my tune-up/ }).click()
  await page.getByRole('button', { name: /YouTube/ }).click()
  await page.getByRole('button', { name: /Math/ }).click()
  await page.getByRole('button', { name: /Science/ }).click()
  await page.getByRole('button', { name: /Comedy/ }).click()
  await page.getByPlaceholder('Add your own').fill('Lego Technic')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await shot(page, `${name}-1-likes`)
  await page.getByRole('button', { name: 'Next' }).click()

  await page.getByRole('button', { name: /Too much of one thing/ }).click()
  await page.getByRole('button', { name: /Only new stuff/ }).click()
  await page.getByRole('button', { name: 'Next' }).click()

  await page.getByPlaceholder('e.g. Game of Thrones').fill('Game of Thrones')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: '+ Star Wars' }).click()
  check((await page.getByText('Turn down (2)').count()) === 1, `${name}: turn-down list holds 2 items`)
  await page.getByRole('button', { name: 'Next' }).click()

  for (let i = 0; i < 14; i++) await page.getByRole('button', { name: /One more: Game of Thrones/ }).click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /One more: Stuff I actually want/ }).click()
  check((await page.getByText('17 of 20 counted').count()) === 1, `${name}: tally counts`)
  await page.getByRole('button', { name: 'Next' }).click()

  // Mix: sliders always total 100.
  const total = () => page.getByText(/^Total \d+%$/).innerText()
  check((await total()) === 'Total 100%', `${name}: mix starts at 100%`)
  const math = page.getByRole('slider').first()
  await math.focus()
  for (let i = 0; i < 15; i++) await page.keyboard.press('ArrowRight')
  check((await total()) === 'Total 100%', `${name}: still 100% after dragging`)
  await page.getByRole('button', { name: /Lock Science/ }).click()
  await page.getByRole('slider').nth(2).fill('40')
  check((await total()) === 'Total 100%', `${name}: still 100% with a lock`)
  await page.getByRole('button', { name: 'Split' }).first().click()
  check((await page.getByText(/^Inside Math$/).count()) === 1, `${name}: sub-topic editor opens`)
  await page.getByRole('radio', { name: 'Before 2015' }).click()
  await shot(page, `${name}-2-mix-pie`)
  await page.getByRole('radio', { name: 'Bars' }).click()
  await shot(page, `${name}-3-mix-bars`)
  await page.getByRole('radio', { name: 'Numbers' }).click()
  check((await page.getByRole('table').count()) === 1, `${name}: numbers view is a table`)
  await page.getByRole('radio', { name: 'Pie' }).click()
  await page.getByRole('button', { name: /Looks good/ }).click()

  // Results
  await page.getByText('Step 1.').waitFor()
  check((await page.getByText('Delete “Game of Thrones” videos from your watch history').count()) === 1, `${name}: checklist leads with deletion`)
  await page.getByRole('checkbox').first().check()
  check((await page.getByText(/^1 of \d+ done$/).count()) === 1, `${name}: checklist progress`)
  if (api === 'ok') {
    await page.getByRole('link', { name: /Play all on YouTube/ }).waitFor()
    const cards = await page.locator('a[href^="https://www.youtube.com/watch?v="]').count()
    check(cards === 10, `${name}: 10 videos in the playlist (got ${cards})`)
    check((await page.getByText(/Game of Thrones recap/).count()) === 0, `${name}: turned-down videos filtered out`)
  } else {
    await page.getByText(/Pick the video that looks best/).waitFor()
    const links = await page.locator('a[href^="https://www.youtube.com/results?search_query="]').count()
    check(links > 0, `${name}: search-link fallback (${links} links)`)
    const href = await page.locator('a[href^="https://www.youtube.com/results?search_query="]').first().getAttribute('href')
    check(href.includes('before%3A2015'), `${name}: fallback carries the time capsule`)
  }
  await shot(page, `${name}-4-results`)

  // Recipe link reopens the same session.
  const url = page.url()
  check(url.includes('#r='), `${name}: URL carries the recipe`)
  const p2 = await ctx.newPage()
  await stubApi(p2, api)
  await p2.goto(url)
  check((await p2.getByText('Welcome back. Tune-up time.').count()) === 1, `${name}: recipe link reopens results`)
  check((await p2.getByText(/Turning down:/).innerText()).length > 0, `${name}: recipe keeps the turn-down list`)
  await p2.getByRole('button', { name: 'Count my homepage again' }).click()
  for (let i = 0; i < 4; i++) await p2.getByRole('button', { name: /One more: Game of Thrones/ }).click()
  check((await p2.getByText(/Down 10 of 20/).count()) === 1, `${name}: before/after comparison`)
  await shot(p2, `${name}-5-tuneup`)

  check(errors.length === 0, `${name}: no console errors ${errors.length ? JSON.stringify(errors) : ''}`)
  await ctx.close()
}

try {
  await runFlow({ name: 'phone-light-api', viewport: { width: 390, height: 844 }, scheme: 'light', api: 'ok' })
  await runFlow({ name: 'desktop-dark-fallback', viewport: { width: 1280, height: 900 }, scheme: 'dark', api: 'none' })
} catch (e) {
  failures.push(String(e))
  console.error(e)
} finally {
  await browser.close()
  server.kill()
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('\nAll smoke checks passed')
process.exit(0)
