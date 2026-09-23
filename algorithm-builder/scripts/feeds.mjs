#!/usr/bin/env node
/**
 * Fetch the latest full-length uploads from every confirmed channel in
 * src/data/channels.json, using YouTube's public channel feeds (no API key,
 * no quota), and write src/data/feed.json. Each channel also gets how it's
 * doing right now (median views per day of its last 60 days of uploads, and
 * uploads in the last 30 days), which the site uses for "Popular this month".
 *
 * A channel whose feed can't be read keeps its last good entry, so a failed
 * run never empties the site. Runs before every deploy and weekly.
 *
 *   node scripts/feeds.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchFeed, parseFeed, tidy } from './lib/youtube.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'src/data/feed.json')

const channels = JSON.parse(readFileSync(join(root, 'src/data/channels.json'), 'utf8'))
const old = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { channels: {} }
const ids = [
  ...new Map(
    Object.entries(channels)
      .filter(([k]) => !k.startsWith('_'))
      .flatMap(([, v]) => v)
      .map((c) => [c.id, c.name]),
  ).entries(),
]

const result = {}
let fresh = 0
let kept = 0
let next = 0
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < ids.length) {
      const [id, name] = ids[next++]
      const xml = await fetchFeed(id)
      const feed = xml ? parseFeed(xml) : null
      if (feed?.videos.length) {
        result[id] = { name: tidy(name), videos: feed.videos, perDay: feed.stats.perDay, recent: feed.stats.recent }
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
