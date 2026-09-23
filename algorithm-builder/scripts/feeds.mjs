#!/usr/bin/env node
/**
 * Fetch the latest full-length uploads from every confirmed channel in
 * src/data/channels.json, using YouTube's public channel feeds (no API key,
 * no quota), and write src/data/feed.json.
 *
 * Shorts, premieres and live streams that haven't aired (0 views) are left
 * out. A channel whose feed can't be read keeps its last good videos, so a
 * failed run never empties the site. Runs before every deploy and weekly.
 *
 *   node scripts/feeds.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'src/data/feed.json')
const PER_CHANNEL = 5
const MAX_AGE_DAYS = 730

const channels = JSON.parse(readFileSync(join(root, 'src/data/channels.json'), 'utf8'))
const old = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { channels: {} }
const ids = [...new Map(Object.values(channels).flat().map((c) => [c.id, c.name])).entries()]

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

export function parseFeed(xml, now = Date.now()) {
  const out = []
  for (const e of xml.split('<entry>').slice(1)) {
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1]
    const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ''
    const title = decode(e.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? ''
    const views = Number(e.match(/<media:statistics views="(\d+)"/)?.[1] ?? '0')
    if (!id || !title || link.includes('/shorts/') || /#shorts?\b/i.test(title) || views === 0) continue
    // Start people at the start of a series, not "Part 2".
    if (/\(([2-9])\s*\/\s*\d\)|\bpart\s*([2-9]|ii+)\b/i.test(title)) continue
    if (now - Date.parse(published) > MAX_AGE_DAYS * 86_400_000) continue
    out.push({ id, title, published: published.slice(0, 10) })
    if (out.length >= PER_CHANNEL) break
  }
  return out
}

async function fetchFeed(id) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`)
      // A real channel's feed can answer 404 now and then: retry it like any failure.
      if (r.ok) return await r.text()
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
  }
  return null
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = {}
  let fresh = 0
  let kept = 0
  let next = 0
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < ids.length) {
        const [id, name] = ids[next++]
        const xml = await fetchFeed(id)
        const videos = xml ? parseFeed(xml) : null
        if (videos?.length) {
          result[id] = { name, videos }
          fresh++
        } else if (old.channels[id]) {
          result[id] = old.channels[id]
          kept++
        }
      }
    }),
  )
  const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(outPath, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), channels: sorted }) + '\n')
  const videos = Object.values(sorted).reduce((n, c) => n + c.videos.length, 0)
  console.log(`${fresh} channels fresh, ${kept} kept from last run, ${ids.length - fresh - kept} with nothing. ${videos} videos.`)
}
