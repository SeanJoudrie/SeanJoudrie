#!/usr/bin/env node
/**
 * Resolve the hand-picked channel names in docs/ux/channels.candidates.json
 * to real YouTube channel ids, and write src/data/channels.json.
 *
 * A name is kept only when its channel id comes from a trusted source and
 * that channel's own public feed says the same name:
 *   1. Wikidata lists the id (P2397) on an item with that name, or
 *   2. YouTube's channel search shows a channel with exactly that name and
 *      50K+ subscribers (the biggest one, so copycats lose).
 * Anything else is dropped and reported, never guessed.
 *
 *   node scripts/channels.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchFeed, norm, parseFeed, searchChannels } from './lib/youtube.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const candidates = JSON.parse(readFileSync(join(root, 'docs/ux/channels.candidates.json'), 'utf8'))
const UA = 'algorithm-builder/1.0 (https://github.com/SeanJoudrie/SeanJoudrie)'

const same = (a, b) => {
  const x = norm(a)
  const y = norm(b)
  return x === y || (Math.min(x.length, y.length) >= 5 && (x.includes(y) || y.includes(x)))
}

async function get(url, type = 'json') {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      if (r.status === 404) return null
      if (r.ok) return type === 'json' ? r.json() : r.text()
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
  }
  return null
}

const feedTitle = async (id) => {
  const xml = await fetchFeed(id)
  return xml ? parseFeed(xml).title || null : null
}

async function fromYouTubeSearch(name) {
  const best = (await searchChannels(name)).filter((c) => norm(c.title) === norm(name) && c.subs >= 50_000).sort((a, b) => b.subs - a.subs)[0]
  if (!best) return null
  const title = await feedTitle(best.id)
  return title && norm(title) === norm(name) ? { id: best.id, name: title } : null
}

async function resolve(name) {
  return (await fromWikidata(name)) ?? (await fromYouTubeSearch(name))
}

async function fromWikidata(name) {
  const search = await get(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(name)}`)
  const ids = (search?.search ?? []).map((s) => s.id)
  if (!ids.length) return null
  const ents = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&ids=${ids.join('|')}`)
  for (const id of ids) {
    const e = ents?.entities?.[id]
    for (const c of e?.claims?.P2397 ?? []) {
      const cid = c.mainsnak?.datavalue?.value
      if (!/^UC[A-Za-z0-9_-]{22}$/.test(cid ?? '')) continue
      const title = await feedTitle(cid)
      if (title && same(title, name)) return { id: cid, name: title }
    }
  }
  return null
}

// Confirmed names are remembered, so a rerun only retries the misses
// (YouTube slows down bursts of requests).
const cachePath = join(root, 'docs/ux/channels.resolved.json')
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
const names = [...new Set(Object.entries(candidates).flatMap(([k, v]) => (k.startsWith('_') ? [] : v)))]
const found = new Map(names.filter((n) => cache[n]).map((n) => [n, cache[n]]))
const missed = []
// Saved as it goes, so a stopped run keeps what it confirmed.
const saveCache = () => writeFileSync(cachePath, JSON.stringify(Object.fromEntries([...found].sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n')
const todo = names.filter((n) => !found.has(n))
let next = 0
await Promise.all(
  Array.from({ length: 1 }, async () => {
    while (next < todo.length) {
      const n = todo[next++]
      const r = await resolve(n)
      if (r) {
        found.set(n, r)
        saveCache()
      } else missed.push(n)
      await new Promise((r) => setTimeout(r, 1500))
    }
  }),
)
saveCache()

// Topics that stay hand-picked (no "Popular this month" ranking) ride along for the site.
const out = { _handPickedOnly: candidates._handPickedOnly ?? [] }
for (const [topic, list] of Object.entries(candidates)) {
  if (topic.startsWith('_')) continue
  const seen = new Set()
  out[topic] = list.map((n) => found.get(n)).filter((c) => c && !seen.has(c.id) && seen.add(c.id))
}
writeFileSync(join(root, 'src/data/channels.json'), JSON.stringify(out, null, 1) + '\n')
const empty = Object.entries(out).filter(([k, v]) => !k.startsWith('_') && !v.length).map(([k]) => k)
console.log(`Confirmed ${found.size} of ${names.length} channels.`)
console.log(`Not confirmed (dropped): ${missed.sort().join('; ')}`)
console.log(`Topics with no channel yet (${empty.length}): ${empty.join(', ')}`)
