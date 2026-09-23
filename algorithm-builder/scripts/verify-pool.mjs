// Re-checks every hand-picked video in src/data/pool.json against YouTube's
// public oEmbed endpoint: 200 means the video is real and public. Fails
// (exit 1) if any video is gone, so dead links never ship.
//
//   npm run verify:pool            check only
//   npm run verify:pool -- --update  also refresh titles, channels and the checked date
//
// Run it at least every 30 days (YouTube's refresh rule for stored data) and
// whenever pool.json changes. Never add an id that didn't come from a real
// source; this script is the gate.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../src/data/pool.json', import.meta.url)
const update = process.argv.includes('--update')
const pool = JSON.parse(readFileSync(FILE, 'utf8'))
const today = new Date().toISOString().slice(0, 10)

async function check(v) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.id}`)}`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 200) return { ok: true, data: await res.json() }
      if (res.status >= 400 && res.status < 500) return { ok: false, status: res.status }
    } catch {
      /* network blip: retry */
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
  }
  return { ok: false, status: 'network' }
}

const failed = []
for (let i = 0; i < pool.length; i += 4) {
  const batch = pool.slice(i, i + 4)
  const results = await Promise.all(batch.map(check))
  results.forEach((r, j) => {
    const v = batch[j]
    if (!r.ok) return failed.push(`${v.id} (${r.status}) ${v.title}`)
    if (update) Object.assign(v, { title: r.data.title, channel: r.data.author_name, checked: today })
  })
}

if (update && !failed.length) writeFileSync(FILE, JSON.stringify(pool, null, 1) + '\n')
console.log(`${pool.length - failed.length}/${pool.length} videos verified${update && !failed.length ? ' and refreshed' : ''}`)
if (failed.length) {
  console.error(`Gone or private:\n- ${failed.join('\n- ')}`)
  process.exit(1)
}
