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

/** How well a normalized query matches one normalized field (0 = no match). */
function fieldScore(q: string, f: string): number {
  if (!f) return 0
  if (f === q) return 100
  if (f.startsWith(q)) {
    // "car" → "cars" beats "car" → "card games"; a whole word beats part of one.
    if (f.length - q.length <= 2) return 90
    return f[q.length] === ' ' ? 85 : 80
  }
  if (` ${f} `.includes(` ${q} `)) return 75
  // Starts a later word ("lip" → "red lipstick"), never mid-word ("art" ↛ "party").
  if (` ${f}`.includes(` ${q}`)) return 70
  // Every query word matches some word in the field, allowing small typos.
  const fw = f.split(' ')
  const qw = q.split(' ')
  const near = (w: string) => fw.some((x) => x.startsWith(w) || distance(w, x, allowedTypos(w)) <= allowedTypos(w))
  if (qw.every(near)) return 40
  // Extra words around a strong one ("matte lipstick" → "lipstick").
  if (qw.length > 1 && qw.some((w) => w.length >= 4 && fw.length === 1 && distance(w, fw[0], allowedTypos(w)) <= allowedTypos(w))) return 30
  return 0
}

/**
 * Score how well `query` matches an item (0 = no match). `fields` are its
 * names; `related` are looser words ("lipstick" for Beauty & makeup), which
 * count a little less so a direct name always ranks first.
 */
export function score(query: string, fields: string[], related: string[] = []): number {
  const q = norm(query)
  if (!q) return 0
  let best = 0
  for (const f of fields) best = Math.max(best, fieldScore(q, norm(f)))
  if (best === 100) return best
  for (const f of related) best = Math.max(best, Math.round(fieldScore(q, norm(f)) * 0.9))
  return best
}

export function rank<T>(query: string, items: T[], fields: (t: T) => string[], limit = 12, related: (t: T) => string[] = () => []): T[] {
  return items
    .map((it, i) => ({ it, i, s: score(query, fields(it), related(it)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.it)
}
