#!/usr/bin/env node
/**
 * Static-fallback smoke — the built HTML must be readable without running the
 * app (crawlers, link previews, AI assistants, JS off), and React must clear
 * that fallback the moment it mounts. Run against `vite preview`.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

// 1. The served HTML — no JavaScript involved — carries the real content.
const html = await fetch(`${BASE}/`).then((r) => r.text())
const text = html
  .split('<body>')[1]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

check('raw HTML carries real text', text.length > 4000, `${text.length} chars`)
check('names the person', text.includes('Sean Joudrie'))
check('carries the contact email', text.includes('sjoudrie@gmail.com'))
check('lists every project', ['Globalio', 'Flexyn', 'REX', 'Rap Sheet', 'Curio', 'AAR', 'Birdwatch', 'DroneDome'].every((p) => text.includes(p)))
check('links out to live work', html.includes('https://globalio.app'))
check('no unescaped data leaked markup', !text.includes('<'))

// 2. With JavaScript, the fallback is gone and the app owns #root.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(300)

check('fallback removed after mount', (await p.locator('[data-static-fallback]').count()) === 0)
check('app rendered in its place', (await p.locator('#root main').count()) > 0)
check('no page errors', pageErrors.length === 0, pageErrors[0] ?? '')

await browser.close()
console.log(failed ? `\n${failed} check(s) failed` : '\nstatic fallback OK')
process.exit(failed ? 1 : 0)
