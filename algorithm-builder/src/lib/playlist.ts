import { WILDCARD_ID, WILDCARD_QUERIES } from '../data/topics'
import { apportion } from './mix'
import type { Mix, Video } from './types'

export const PLAYLIST_SIZE = 10

export interface Slot {
  key: string
  label: string
  category: string
  query: string
  count: number
}

/**
 * Turn the mix into search slots: how many of the playlist's videos each
 * sub-topic gets (largest remainder, so counts always add up to `size`).
 */
export function allocate(mix: Mix, size = PLAYLIST_SIZE, seed = Date.now()): Slot[] {
  const leaves = mix.categories.flatMap((c) =>
    c.children.map((k) => ({
      key: `${c.id}/${k.id}`,
      label: c.id === WILDCARD_ID ? 'Wildcard' : k.label,
      category: c.label,
      query: c.id === WILDCARD_ID ? WILDCARD_QUERIES[Math.abs(seed) % WILDCARD_QUERIES.length] : k.query || k.label,
      share: (c.weight / 100) * (k.weight / 100),
    })),
  )
  const counts = apportion(size, leaves.map((l) => l.share))
  return leaves
    .map((l, i) => ({ key: l.key, label: l.label, category: l.category, query: l.query, count: counts[i] }))
    .filter((s) => s.count > 0)
}

/**
 * A YouTube search URL that does the same job as the API when it's
 * unavailable (G-07). The `before:` operator narrows by upload date in
 * YouTube search (UNVERIFIED: undocumented; harmless if ignored).
 */
export function searchUrl(query: string, before: number | null): string {
  const q = before ? `${query} before:${before}-01-01` : query
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

/** Search URL for the tip-guide platforms, where there's no API at all. */
export function platformSearchUrl(platform: 'instagram' | 'tiktok' | 'x', query: string): string | null {
  const q = encodeURIComponent(query)
  if (platform === 'tiktok') return `https://www.tiktok.com/search?q=${q}`
  if (platform === 'x') return `https://x.com/search?q=${q}`
  return null
}

/**
 * Opens the videos as one unnamed queue. UNVERIFIED: this YouTube URL is
 * undocumented, so the UI also lists every video individually.
 */
export function playAllUrl(videos: Video[]): string {
  return `https://www.youtube.com/watch_videos?video_ids=${videos.map((v) => v.id).join(',')}`
}

export type SearchResult =
  | { status: 'ok'; items: Video[] }
  | { status: 'unconfigured' | 'quota' | 'error' | 'rate-limited' }

export async function searchVideos(query: string, before: number | null, signal?: AbortSignal): Promise<SearchResult> {
  // Static hosts (GitHub Pages) have no search server: go straight to links.
  if (import.meta.env.VITE_SEARCH_API === 'off') return { status: 'unconfigured' }
  const params = new URLSearchParams({ q: query })
  if (before) params.set('before', String(before))
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}api/search?${params}`, { signal })
    // No search server on this host (e.g. a static GitHub Pages build): use links.
    if (res.status === 404) return { status: 'unconfigured' }
    if (!res.ok && res.status !== 429 && res.status !== 503) return { status: 'error' }
    const body = (await res.json()) as SearchResult
    return body && typeof body === 'object' && 'status' in body ? body : { status: 'error' }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    return { status: 'error' }
  }
}

/** Drop anything that mentions a turned-down topic, and duplicates. */
export function filterVideos(videos: Video[], turnDown: string[], seen: Set<string>, limit = Infinity): Video[] {
  const bad = turnDown.map((t) => t.toLowerCase()).filter(Boolean)
  const out: Video[] = []
  for (const v of videos) {
    if (out.length >= limit) break
    if (seen.has(v.id)) continue
    const hay = `${v.title} ${v.channel}`.toLowerCase()
    if (bad.some((b) => hay.includes(b))) continue
    seen.add(v.id)
    out.push(v)
  }
  return out
}
