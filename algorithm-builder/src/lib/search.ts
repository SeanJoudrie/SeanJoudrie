/**
 * Forgiving search for topics and "show me less of" entries: matches labels
 * and nicknames ("GOT" → Game of Thrones), ignores accents and case, and
 * tolerates small typos ("gardning" → Gardening).
 */

export function norm(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Levenshtein distance, stopping early once it exceeds `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

const allowedTypos = (w: string) => (w.length >= 7 ? 2 : w.length >= 4 ? 1 : 0)

/** Score how well `query` matches any of `fields` (0 = no match). */
export function score(query: string, fields: string[]): number {
  const q = norm(query)
  if (!q) return 0
  let best = 0
  for (const f of fields.map(norm)) {
    if (!f) continue
    if (f === q) return 100
    if (f.startsWith(q)) best = Math.max(best, 80)
    else if (f.includes(q)) best = Math.max(best, 60)
    else {
      // Every query word matches some word in the field, allowing small typos.
      const fw = f.split(' ')
      const ok = q.split(' ').every((w) => fw.some((x) => x.startsWith(w) || distance(w, x, allowedTypos(w)) <= allowedTypos(w)))
      if (ok) best = Math.max(best, 40)
    }
  }
  return best
}

export function rank<T>(query: string, items: T[], fields: (t: T) => string[], limit = 12): T[] {
  return items
    .map((it, i) => ({ it, i, s: score(query, fields(it)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.it)
}
