// Screenshots every version of every lab specimen, desktop and phone.
//   npm run shoot              all specimens
//   npm run shoot -- <slug>    one specimen
// Writes public/lab/<slug>/shots/<version>-desktop.png and -mobile.png.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const LAB = path.resolve('public/lab')
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }

const server = http.createServer((req, res) => {
  let file = path.join(LAB, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(LAB)) return res.writeHead(403).end()
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}`

const only = process.argv[2]
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' })
for (const slug of fs.readdirSync(LAB)) {
  if (only && slug !== only) continue
  const dir = path.join(LAB, slug)
  if (!fs.statSync(dir).isDirectory()) continue
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true })
  for (const version of fs.readdirSync(dir)) {
    if (!fs.existsSync(path.join(dir, version, 'index.html'))) continue
    for (const [width, height, tag] of [[1280, 900, 'desktop'], [390, 844, 'mobile']]) {
      const page = await browser.newPage({ viewport: { width, height } })
      await page.goto(`${base}/${slug}/${version}/`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(800) // let entrance animations finish
      await page.screenshot({ path: path.join(dir, 'shots', `${version}-${tag}.png`), fullPage: true })
      await page.close()
      console.log(`${slug}/${version} ${tag}`)
    }
  }
}
await browser.close()
server.close()
