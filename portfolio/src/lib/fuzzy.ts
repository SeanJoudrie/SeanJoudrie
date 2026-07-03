// portfolio/src/lib/fuzzy.ts
//
// A hand-rolled fuzzy subsequence matcher. No dependency — the point is the
// algorithm. Given a query and a target string it decides whether the query is
// a subsequence of the target and, if so, scores the quality of that match:
//
//   +1   base, per matched character
//   +5   contiguous-run bonus (this match sits right after the previous one)
//   +8   word-boundary / CamelCase-boundary bonus (start of a word)
//   +0..3 earliness bonus (matches near the front of the target score higher)
//   +0..10 density bonus (shorter targets that the query nearly fills)
//
// The matcher is greedy (first-occurrence). For a registry of ~16 short
// strings this is more than good enough and stays trivially fast; a full
// Needleman–Wunsch DP would be over-engineering here.

export type MatchResult = {
  matched: boolean
  score: number
  /** Indices in `target` that matched query characters (for highlighting). */
  positions: number[]
}

const BOUNDARY = /[\s\-_/.:,]/

function isWordBoundary(target: string, i: number): boolean {
  if (i === 0) return true
  const prev = target[i]! // char at i
  const before = target[i - 1]!
  if (BOUNDARY.test(before)) return true
  // CamelCase boundary: lower/digit followed by an uppercase letter.
  const beforeIsLower = before === before.toLowerCase() && before !== before.toUpperCase()
  const hereIsUpper = prev === prev.toUpperCase() && prev !== prev.toLowerCase()
  return beforeIsLower && hereIsUpper
}

export function fuzzyMatch(query: string, target: string): MatchResult {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return { matched: true, score: 0, positions: [] }
  if (q.length > target.length) return { matched: false, score: 0, positions: [] }

  const t = target.toLowerCase()
  const positions: number[] = []
  let score = 0
  let qi = 0
  let prevMatch = -2 // so the first match is never "contiguous"

  for (let ti = 0; ti < target.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue

    let charScore = 1
    if (prevMatch === ti - 1) charScore += 5 // contiguous run
    if (isWordBoundary(target, ti)) charScore += 8 // start-of-word / CamelCase
    charScore += Math.max(0, 3 - Math.floor(ti / 4)) // earliness

    score += charScore
    positions.push(ti)
    prevMatch = ti
    qi++
  }

  if (qi < q.length) return { matched: false, score: 0, positions: [] }

  // Density: reward targets the query nearly fills, so "lab" ranks "Lab"
  // above "Flag Lab Bench".
  score += Math.max(0, 10 - (target.length - q.length))
  return { matched: true, score, positions }
}

/** Split a label into segments for rendering, marking matched runs. */
export type Segment = { text: string; hit: boolean }

export function highlightSegments(label: string, positions: number[]): Segment[] {
  if (positions.length === 0) return [{ text: label, hit: false }]
  const hit = new Set(positions)
  const segs: Segment[] = []
  let buf = ''
  let bufHit = hit.has(0)
  for (let i = 0; i < label.length; i++) {
    const h = hit.has(i)
    if (h === bufHit) {
      buf += label[i]
    } else {
      if (buf) segs.push({ text: buf, hit: bufHit })
      buf = label[i]!
      bufHit = h
    }
  }
  if (buf) segs.push({ text: buf, hit: bufHit })
  return segs
}

// ---- Dev-only self-check (tree-shaken out of production builds) ----------
if (import.meta.env.DEV) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) console.error('[fuzzy] assertion failed:', msg)
  }
  // Empty query matches everything with score 0.
  assert(fuzzyMatch('', 'Work').matched, 'empty query matches')
  // Subsequence match.
  assert(fuzzyMatch('wk', 'Work').matched, '"wk" ⊆ "Work"')
  // Non-subsequence fails.
  assert(!fuzzyMatch('zzz', 'Work').matched, '"zzz" ⊄ "Work"')
  // Longer-than-target fails.
  assert(!fuzzyMatch('working', 'Work').matched, 'over-length fails')
  // Boundary/contiguous beats scattered: "cs" scores higher on "Case Study"
  // (both at word starts) than on "Chaos Slush".
  assert(
    fuzzyMatch('cs', 'Case Study').score > fuzzyMatch('cs', 'Chaos Slush').score,
    'word-boundary match outranks scattered match',
  )
  // Exact prefix outranks a mid-string match: "me" on "Meridian" > on "Home".
  assert(
    fuzzyMatch('me', 'Meridian').score > fuzzyMatch('me', 'Home').score,
    'earliness/boundary favors the prefix',
  )
  // Highlight positions land on the matched chars.
  const r = fuzzyMatch('mer', 'Meridian')
  assert(r.positions.join(',') === '0,1,2', 'positions track the match')
}
