/**
 * Shared helpers for the channel scripts: YouTube's public channel feeds and
 * its channel search page. No API key, no quota. Both are read gently (callers
 * run one request at a time with pauses) and retried when YouTube throttles.
 */

export const norm = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, '')

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/**
 * The site shows no emoji or em dashes (docs/UX_AUDIT.md), so titles and
 * names from YouTube are cleaned to match: "Fall Baking 🍁 — Part 1" →
 * "Fall Baking - Part 1".
 */
export const tidy = (s) =>
  s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/[—―]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?:;)])/g, '$1')
    .replace(/(\s*[-|]\s*)+$/g, '')
    .trim()

const DAY = 86_400_000
const MAX_AGE_DAYS = 730
// The site shows one video per channel; the second is a spare if the first is filtered out.
const PER_CHANNEL = 2

/**
 * Read a channel feed (its latest 15 uploads).
 * - `videos`: up to 2 full-length videos worth showing: no Shorts, nothing
 *   unaired (0 views), no "Part 2", nothing over 2 years old.
 * - `stats`: how the channel is doing right now, from every full-length
 *   upload in the last 60 days: `perDay` is the median views per day since
 *   upload, `recent` how many came out in the last 30 days.
 */
export function parseFeed(xml, now = Date.now()) {
  const videos = []
  const rates = []
  let recent = 0
  const title = tidy(decode(xml.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''))
  for (const e of xml.split('<entry>').slice(1)) {
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1]
    const link = e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ''
    const name = tidy(decode(e.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''))
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? ''
    const views = Number(e.match(/<media:statistics views="(\d+)"/)?.[1] ?? '0')
    if (!id || !name || link.includes('/shorts/') || /#shorts?\b/i.test(name) || views === 0) continue
    const age = (now - Date.parse(published)) / DAY
    if (age <= 60) rates.push(views / Math.max(1, age))
    if (age <= 30) recent++
    // Start people at the start of a series, not "Part 2".
    if (/\(([2-9])\s*\/\s*\d\)|\bpart\s*([2-9]|ii+)\b/i.test(name)) continue
    if (age > MAX_AGE_DAYS || videos.length >= PER_CHANNEL) continue
    videos.push({ id, title: name, published: published.slice(0, 10) })
  }
  rates.sort((a, b) => a - b)
  const perDay = rates.length ? Math.round(rates[Math.floor(rates.length / 2)]) : 0
  return { title, videos, stats: { perDay, recent } }
}

export async function fetchFeed(id) {
  for (let i = 0; i < 3; i++) {
    try {
      // A real channel's feed can answer 404 now and then: retry it like any failure.
      const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`)
      if (r.ok) return await r.text()
    } catch {
      /* retry */
    }
    await sleep(1500 * (i + 1))
  }
  return null
}

const count = (t = '') => {
  const m = t.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?\s*subscribers/i)
  return m ? Number(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]?.toUpperCase()] ?? 1) : 0
}

/** Channels YouTube's own channel search shows for `query`: [{ id, title, subs }]. */
export async function searchChannels(query) {
  // YouTube throttles bursts by sending a page without results: wait and retry.
  let data = null
  for (let i = 0; i < 4 && !data; i++) {
    if (i) await sleep(15_000 * i)
    try {
      const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`, {
        headers: { 'User-Agent': 'Mozilla/5.0', Cookie: 'SOCS=CAI; CONSENT=YES+1' },
      })
      const html = r.ok ? await r.text() : ''
      const m = html.includes('"channelRenderer":') ? html.match(/var ytInitialData = (\{.*?\});<\/script>/) : null
      if (m) data = JSON.parse(m[1])
    } catch {
      /* retry */
    }
  }
  const found = []
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      const c = o.channelRenderer
      if (c && /^UC[\w-]{22}$/.test(c.channelId ?? '')) {
        const texts = [c.subscriberCountText?.simpleText, c.videoCountText?.simpleText]
        found.push({ id: c.channelId, title: c.title?.simpleText ?? '', subs: Math.max(...texts.map(count)) })
      }
      Object.values(o).forEach(walk)
    }
  }
  walk(data)
  return found
}
