#!/usr/bin/env node
/**
 * Find channels worth adding: for each topic, ask YouTube's channel search
 * for the topic and its sub-topics, keep channels that are big enough,
 * active, mostly full-length and in English, and rank them by how they're
 * doing right now (median views per day of the last 60 days of uploads).
 *
 * Writes docs/ux/channels.discovered.json for a person to review. Nothing
 * here reaches the site until a name is copied into
 * docs/ux/channels.candidates.json and `npm run channels` confirms it.
 *
 * Topics listed under "_handPickedOnly" in the candidates file (politics,
 * news, religion, kids) are never searched: those stay hand-picked.
 *
 *   node scripts/discover.mjs            # resumes where it stopped
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchFeed, parseFeed, searchChannels, sleep } from './lib/youtube.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p, fallback) => (existsSync(join(root, p)) ? JSON.parse(readFileSync(join(root, p), 'utf8')) : fallback)
const taxonomy = read('src/data/taxonomy.json')
const candidates = read('docs/ux/channels.candidates.json')
const confirmed = read('src/data/channels.json', {})
// WORK_DIR lets a long run keep its progress outside the repo until it's done.
const outPath = join(process.env.WORK_DIR ?? join(root, 'docs/ux'), 'channels.discovered.json')
const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {}

const MIN_SUBS = 100_000
const PER_TOPIC = 6
const skip = new Set(candidates._handPickedOnly ?? [])
const known = new Set(
  Object.entries(confirmed)
    .filter(([k]) => !k.startsWith('_'))
    .flatMap(([, v]) => v)
    .map((c) => c.id),
)
// Mostly Latin letters in titles: a rough "in English" check.
const latin = (titles) => {
  const t = titles.join(' ').replace(/[\s\d\p{P}\p{S}]/gu, '')
  return t.length > 0 && (t.match(/[a-z]/gi) ?? []).length / t.length >= 0.9
}

const checked = new Map()
async function check(c) {
  if (checked.has(c.id)) return checked.get(c.id)
  const xml = await fetchFeed(c.id)
  const feed = xml ? parseFeed(xml) : null
  const ok = feed && feed.videos.length >= 3 && feed.stats.recent >= 1 && latin(feed.videos.map((v) => v.title))
  const row = ok ? { name: c.title, id: c.id, subs: c.subs, perDay: feed.stats.perDay, recent: feed.stats.recent, latest: feed.videos.slice(0, 3).map((v) => v.title) } : null
  checked.set(c.id, row)
  return row
}

for (const t of taxonomy.topics) {
  if (skip.has(t.id) || out[t.id]) continue
  const found = new Map()
  for (const q of [t.label, ...t.subtopics.slice(0, 2).map((s) => s.query)]) {
    for (const c of await searchChannels(q)) if (c.subs >= MIN_SUBS && !known.has(c.id)) found.set(c.id, c)
    await sleep(2000)
  }
  const rows = []
  for (const c of found.values()) {
    const row = await check(c)
    if (row) rows.push(row)
  }
  out[t.id] = rows.sort((a, b) => b.perDay - a.perDay).slice(0, PER_TOPIC)
  writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n')
  console.log(`${t.id}: ${out[t.id].map((r) => r.name).join(', ') || '(none)'}`)
}
