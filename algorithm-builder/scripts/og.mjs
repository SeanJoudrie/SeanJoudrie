// Renders the social preview (public/og.png, 1200x630) and the home-screen
// icon (public/apple-touch-icon.png, 180x180) from plain HTML, so they can be
// regenerated whenever the brand changes:  node scripts/og.mjs
import { chromium } from 'playwright-core'

const mascot = `
<svg viewBox="0 0 160 160" width="W" height="W"><g stroke-linejoin="round" stroke-linecap="round">
<ellipse cx="80" cy="96" rx="46" ry="44" fill="#f3d9b1" stroke="#1d2126" stroke-width="5"/>
<path d="M52 118 Q80 132 108 118 L106 136 Q80 146 54 136 Z" fill="#3d6fb8" stroke="#1d2126" stroke-width="4"/>
<path d="M38 76 a42 40 0 0 1 84 0 z" fill="#f26b1d" stroke="#1d2126" stroke-width="5"/>
<rect x="28" y="72" width="104" height="12" rx="6" fill="#f26b1d" stroke="#1d2126" stroke-width="5"/>
<path d="M80 38 v34" stroke="#1d2126" stroke-width="4"/>
<circle cx="65" cy="99" r="5.5" fill="#1d2126"/><circle cx="95" cy="99" r="5.5" fill="#1d2126"/>
<path d="M70 113 q10 8 20 0" fill="none" stroke="#1d2126" stroke-width="4"/></g></svg>`

// Static two-ring chart: same geometry and palette as the app's sunburst.
function ring() {
  const cats = [
    { w: 30, c: '#2a78d6', kids: [60, 40] },
    { w: 25, c: '#eb6834', kids: [50, 30, 20] },
    { w: 20, c: '#1baf7a', kids: [55, 45] },
    { w: 20, c: '#eda100', kids: [100] },
    { w: 5, c: '#8f8c85', kids: [100] },
  ]
  const arc = (r0, r1, a0, a1) => {
    const g = 0.012, s = a0 + g / 2, e = a1 - g / 2, L = e - s > Math.PI ? 1 : 0
    const p = (r, a) => `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`
    return `M ${p(r1, s)} A ${r1} ${r1} 0 ${L} 1 ${p(r1, e)} L ${p(r0, e)} A ${r0} ${r0} 0 ${L} 0 ${p(r0, s)} Z`
  }
  const tints = [100, 70, 50]
  let a = 0, out = ''
  for (const c of cats) {
    const a1 = a + (c.w / 100) * Math.PI * 2
    out += `<path d="${arc(40, 72, a, a1)}" fill="${c.c}"/>`
    let k0 = a
    c.kids.forEach((k, i) => {
      const k1 = k0 + ((a1 - a) * k) / 100
      out += `<path d="${arc(76, 104, k0, k1)}" fill="color-mix(in oklab, ${c.c} ${tints[i]}%, #ffffff)"/>`
      k0 = k1
    })
    a = a1
  }
  return `<svg viewBox="-110 -110 220 220" width="420" height="420">${out}
    <text text-anchor="middle" y="4" font-family="Bricolage Grotesque" font-weight="700" font-size="24" fill="#1d2126">100%</text>
    <text text-anchor="middle" y="20" font-family="Public Sans" font-size="9" fill="#676d74">your feed</text></svg>`
}

const fonts = `<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Public+Sans:wght@400;600&display=block" rel="stylesheet">`

const og = `<!doctype html><html><head>${fonts}<style>
  body{margin:0;width:1200px;height:630px;background:#faf6ee;font-family:'Public Sans',sans-serif;color:#1d2126;display:flex;align-items:center;box-sizing:border-box;padding:64px 72px;gap:48px}
  .l{flex:1;display:flex;flex-direction:column;height:100%;justify-content:space-between}
  h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:72px;line-height:1.02;letter-spacing:-0.01em;margin:0}
  p{font-size:28px;line-height:1.4;color:#474d55;margin:24px 0 0;max-width:560px}
  .b{display:flex;align-items:center;gap:16px;font-family:'Bricolage Grotesque';font-weight:700;font-size:32px}
  .card{background:#fff;border:1px solid #e3dccd;border-radius:12px;padding:24px}
</style></head><body>
  <div class="l"><div><h1>Fix a feed that’s stuck on one topic.</h1>
  <p>Two minutes, no login. The exact settings to change, plus a playlist matched to your mix.</p></div>
  <div class="b">${mascot.replaceAll('W', '64')} Algorithm Builder</div></div>
  <div class="card">${ring()}</div>
</body></html>`

const icon = `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#faf6ee;display:grid;place-items:center">${mascot.replaceAll('W', '150')}</body></html>`

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', proxy })
const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await ctx.newPage()
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(og, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const loaded = await page.evaluate(() => document.fonts.check('700 72px "Bricolage Grotesque"'))
if (!loaded) console.warn('Warning: brand font did not load; image uses a fallback font')
await page.screenshot({ path: 'public/og.png' })
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(icon)
await page.screenshot({ path: 'public/apple-touch-icon.png' })
await browser.close()
console.log('wrote public/og.png and public/apple-touch-icon.png')
