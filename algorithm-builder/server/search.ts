/**
 * /api/search — the only server code. It keeps the YouTube API key secret,
 * caches every answer for 24h (quota: 100 search calls/day by default), and
 * rate-limits per client. Shared by the Netlify function and the Vite dev
 * server.
 *
 * Returns { status: 'ok', items } or a status the UI turns into plain YouTube
 * search links, so the app never shows a dead end.
 */

export interface Video {
  id: string
  title: string
  channel: string
  published: string
  thumb: string
}

export type SearchBody =
  | { status: 'ok'; items: Video[] }
  | { status: 'unconfigured' | 'quota' | 'error' | 'rate-limited' | 'bad-request' }

export interface SearchResponse {
  status: number
  body: SearchBody
  headers: Record<string, string>
}

const DAY_MS = 24 * 60 * 60 * 1000
const cache = new Map<string, { at: number; items: Video[] }>()
const hits = new Map<string, number[]>()
const RATE = { windowMs: 60_000, max: 30 }
let quotaOutUntil = 0

function rateLimited(client: string, now: number): boolean {
  const recent = (hits.get(client) ?? []).filter((t) => now - t < RATE.windowMs)
  recent.push(now)
  hits.set(client, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > RATE.max
}

const json = (status: number, body: SearchBody, extra: Record<string, string> = {}): SearchResponse => ({
  status,
  body,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
})

/** Midnight Pacific is when YouTube resets quota; wait an hour as a safe bound. */
const QUOTA_BACKOFF_MS = 60 * 60 * 1000

export async function handleSearch(
  params: URLSearchParams,
  opts: { apiKey?: string; client: string; now?: number; fetchImpl?: typeof fetch; apiUrl?: string },
): Promise<SearchResponse> {
  const now = opts.now ?? Date.now()
  const q = (params.get('q') ?? '').trim().slice(0, 120)
  const beforeRaw = params.get('before')
  const before = beforeRaw && /^\d{4}$/.test(beforeRaw) ? Number(beforeRaw) : null
  if (!q) return json(400, { status: 'bad-request' })
  if (!opts.apiKey) return json(200, { status: 'unconfigured' })

  const key = `${q.toLowerCase()}|${before ?? ''}`
  const cached = cache.get(key)
  if (cached && now - cached.at < DAY_MS) {
    return json(200, { status: 'ok', items: cached.items }, { 'cache-control': 'public, max-age=3600, s-maxage=86400' })
  }
  if (rateLimited(opts.client, now)) return json(429, { status: 'rate-limited' })
  if (now < quotaOutUntil) return json(503, { status: 'quota' })

  // apiUrl exists for end-to-end tests against a fake YouTube; production uses the default.
  const url = new URL(opts.apiUrl || 'https://www.googleapis.com/youtube/v3/search')
  url.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '10',
    q,
    safeSearch: 'moderate',
    relevanceLanguage: 'en',
    // Keep relevance order: the docs warn other orders plus date filters can
    // return incomplete results.
    order: 'relevance',
    key: opts.apiKey,
    ...(before ? { publishedBefore: `${before}-01-01T00:00:00Z` } : {}),
  }).toString()

  try {
    const res = await (opts.fetchImpl ?? fetch)(url)
    const data = (await res.json()) as YouTubeSearch
    if (!res.ok) {
      const reason = data.error?.errors?.[0]?.reason ?? ''
      if (/quota|rateLimit/i.test(reason)) {
        quotaOutUntil = now + QUOTA_BACKOFF_MS
        return json(503, { status: 'quota' })
      }
      return json(502, { status: 'error' })
    }
    const items: Video[] = (data.items ?? [])
      // Skip live streams and upcoming premieres: they can't be watched as a playlist.
      .filter((it) => it.id?.videoId && it.snippet && (it.snippet.liveBroadcastContent ?? 'none') === 'none')
      .map((it) => ({
        id: it.id!.videoId!,
        title: decode(it.snippet!.title ?? ''),
        channel: decode(it.snippet!.channelTitle ?? ''),
        published: it.snippet!.publishedAt ?? '',
        thumb: it.snippet!.thumbnails?.medium?.url ?? it.snippet!.thumbnails?.default?.url ?? '',
      }))
    cache.set(key, { at: now, items })
    if (cache.size > 2000) cache.delete(cache.keys().next().value!)
    return json(200, { status: 'ok', items }, { 'cache-control': 'public, max-age=3600, s-maxage=86400' })
  } catch {
    return json(502, { status: 'error' })
  }
}

/** The API returns HTML-escaped titles. */
function decode(s: string): string {
  // &amp; goes last so "&amp;lt;" becomes "&lt;", not "<".
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
}

interface YouTubeSearch {
  items?: {
    id?: { videoId?: string }
    snippet?: {
      title?: string
      channelTitle?: string
      publishedAt?: string
      liveBroadcastContent?: string
      thumbnails?: { default?: { url?: string }; medium?: { url?: string } }
    }
  }[]
  error?: { errors?: { reason?: string }[] }
}

/** Test hook. */
export function _reset(): void {
  cache.clear()
  hits.clear()
  quotaOutUntil = 0
}
