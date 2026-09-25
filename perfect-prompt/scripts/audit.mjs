// Measures every version of a lab specimen the same way, so prompts are
// compared on numbers rather than taste.
//   npm run audit -- <slug>
// Prints a table and writes public/lab/<slug>/audit.json.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run audit -- <slug>')
const LAB = path.resolve('public/lab')
const dir = path.join(LAB, slug)
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let file = path.join(LAB, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!file.startsWith(LAB) || !fs.existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}/${slug}`

// Flesch-Kincaid grade, with a simple syllable count. Good enough to compare versions.
const syllables = (w) => {
  w = w.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  return Math.max(1, (w.match(/[aeiouy]{1,2}/g) ?? []).length)
}
const grade = (text) => {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim())
  const words = text.match(/[A-Za-z’']+/g) ?? []
  if (!words.length) return 0
  const syl = words.reduce((s, w) => s + syllables(w), 0)
  return 0.39 * (words.length / sents.length) + 11.8 * (syl / words.length) - 15.59
}

const headOf = (v) => fs.readFileSync(path.join(dir, v, 'index.html'), 'utf8').match(/<head>([\s\S]*?)<\/head>/)?.[1]
  .replace(/<!--[\s\S]*?-->/g, '').replace(/<link[^>]*stylesheet[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' })
const versions = fs.readdirSync(dir).filter((v) => fs.existsSync(path.join(dir, v, 'index.html')))
const out = {}
for (const v of versions) {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' })
  await page.goto(`${base}/${v}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const m = await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('.sr-only') }
    const all = [...document.body.querySelectorAll('*')].filter(visible)
    const textEls = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    const minFont = Math.min(...textEls.map((el) => parseFloat(getComputedStyle(el).fontSize)))
    // Skip links only appear on keyboard focus, so they don't count as tap targets.
    const targets = all.filter((el) => el.matches('a[href], button') && !/^skip to/i.test(el.textContent.trim()))
    const minTarget = Math.min(...targets.map((el) => { const r = el.getBoundingClientRect(); return Math.min(r.height, r.width) }))
    const radii = new Set(all.map((el) => getComputedStyle(el).borderTopLeftRadius).filter((r) => r !== '0px' && !r.includes('%') && parseFloat(r) < 999))
    const pills = all.some((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 999)
    const offGrid = new Set()
    for (const el of all) {
      const s = getComputedStyle(el)
      for (const p of ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'rowGap', 'columnGap']) {
        const n = parseFloat(s[p])
        if (n && Math.abs(n / 4 - Math.round(n / 4)) > 0.01) offGrid.add(`${n}px`)
      }
    }
    const cta = [...document.querySelectorAll('a, button')].find((el) => /fix my feed/i.test(el.textContent))
    const ctaBottom = cta ? cta.getBoundingClientRect().bottom + scrollY : null
    const ctas = [...document.querySelectorAll('a, button')].filter((el) => /fix my feed/i.test(el.textContent)).length
    const hero = [...document.querySelectorAll('main h1 ~ p')].slice(0, 2).map((p) => p.textContent.trim()).join(' ')
    const pageText = document.querySelector('main').innerText
    const animated = all.filter((el) => getComputedStyle(el).animationName !== 'none').length
    const blink = document.querySelectorAll('.anim-blink').length
    return { minFont, minTarget, radii: [...radii], pills, offGrid: [...offGrid], ctaBottom, ctas, hero, pageText, animated, blink, words: pageText.split(/\s+/).filter(Boolean).length }
  })
  await page.setViewportSize({ width: 320, height: 667 })
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  const ctaHref = await page.evaluate(() => [...document.querySelectorAll('a, button')].find((el) => /fix my feed/i.test(el.textContent))?.getAttribute('href') ?? null)
  await page.close()
  out[v] = {
    ctaAboveFold: m.ctaBottom !== null && m.ctaBottom <= 667,
    ctaBottom: Math.round(m.ctaBottom),
    ctaCount: m.ctas,
    ctaHref,
    minFontPx: m.minFont,
    minTargetPx: Math.round(m.minTarget),
    radii: m.radii,
    pillShapes: m.pills,
    offGridSpacing: m.offGrid,
    horizontalScrollAt320: hScroll,
    heroText: m.hero,
    heroGrade: Math.round(grade(m.hero) * 10) / 10,
    mainWords: m.words,
    blinkKept: m.blink > 0,
    headUnchanged: headOf(v) === headOf('before'),
  }
}
await browser.close()
server.close()
fs.writeFileSync(path.join(dir, 'audit.json'), JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify(out, null, 2))
