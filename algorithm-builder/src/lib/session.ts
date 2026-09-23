import { MAX_CATEGORIES, TOPICS, WILDCARD_ID } from '../data/topics'
import { apportion, evenly } from './mix'
import type { Category, Mix, Platform, ProblemId, Session, SubTopic, Tally } from './types'

export const DEFAULT_WILDCARD = 5
const STARTER_LIKES = ['comedy', 'science']

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'topic'
  )
}

function categoryFor(like: string): Category {
  const preset = TOPICS.find((t) => t.id === like)
  if (preset) {
    const children: SubTopic[] = preset.children.map((c) => ({
      id: slugify(c.label),
      label: c.label,
      query: c.query,
      weight: 0,
    }))
    return { id: preset.id, label: preset.label, weight: 0, children: evenly(children) }
  }
  // A custom chip (F-04 style free text): its own category with one sub-topic.
  const id = `custom-${slugify(like)}`
  return { id, label: like, weight: 0, children: [{ id: `${id}-all`, label: like, weight: 100 }] }
}

export function wildcardCategory(weight: number): Category {
  return {
    id: WILDCARD_ID,
    label: 'Something I’d never click',
    weight,
    children: [{ id: 'wildcard-all', label: 'Random but good', weight: 100 }],
  }
}

/** Starting mix: likes split evenly, a small wildcard slice (F-06, F-10). */
export function initialMix(likes: string[]): Mix {
  const picked = (likes.length ? likes : STARTER_LIKES).slice(0, MAX_CATEGORIES)
  const cats = picked.map(categoryFor)
  const parts = apportion(100 - DEFAULT_WILDCARD, cats.map(() => 1))
  const categories = [...cats.map((c, i) => ({ ...c, weight: parts[i] })), wildcardCategory(DEFAULT_WILDCARD)]
  return { categories, before: null }
}

export function newSession(platform: Platform = 'youtube'): Session {
  return {
    v: 1,
    platform,
    likes: [],
    problems: [],
    note: '',
    turnDown: [],
    mix: initialMix([]),
    baseline: null,
    followUp: null,
  }
}

/* ---------- Recipe links (F-18) ----------
 * The whole session lives in the URL hash, so it never reaches a server and
 * bookmarking it is the "account". Short keys keep the link compact. */

type Packed = {
  v: 1
  p: Platform
  l: string[]
  pr: ProblemId[]
  n?: string
  t: string[]
  b: number | null
  c: [string, string, number, 0 | 1, [string, string, number, 0 | 1, string?][]][]
  t0?: [string, number, number, number]
  t1?: [string, number, number, number]
}

const packTally = (t: Tally | null) => (t ? ([t.date, t.wanted, t.sickOf, t.other] as [string, number, number, number]) : undefined)
const unpackTally = (t?: [string, number, number, number]): Tally | null =>
  Array.isArray(t) && t.length === 4 ? { date: String(t[0]), wanted: num(t[1], 20), sickOf: num(t[2], 20), other: num(t[3], 20) } : null

export function encodeRecipe(s: Session): string {
  const packed: Packed = {
    v: 1,
    p: s.platform,
    l: s.likes,
    pr: s.problems,
    n: s.note || undefined,
    t: s.turnDown,
    b: s.mix.before,
    c: s.mix.categories.map((c) => [
      c.id,
      c.label,
      c.weight,
      c.locked ? 1 : 0,
      c.children.map((k) => {
        const row: [string, string, number, 0 | 1, string?] = [k.id, k.label, k.weight, k.locked ? 1 : 0]
        if (k.query) row.push(k.query)
        return row
      }),
    ]),
    t0: packTally(s.baseline),
    t1: packTally(s.followUp),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(packed))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const PLATFORMS: Platform[] = ['youtube', 'instagram', 'tiktok', 'x']
const PROBLEM_IDS: ProblemId[] = ['one-topic', 'too-new', 'rage-bait', 'no-discovery', 'stale']

function num(x: unknown, max: number): number {
  const n = Math.round(Number(x))
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0
}
const str = (x: unknown, max = 80) => String(x ?? '').slice(0, max)

/** Decode a recipe. Anything malformed returns null; weights are re-normalized. */
export function decodeRecipe(code: string): Session | null {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
    const p = JSON.parse(new TextDecoder().decode(bytes)) as Packed
    if (p.v !== 1 || !Array.isArray(p.c) || p.c.length === 0) return null
    const categories: Category[] = p.c.slice(0, MAX_CATEGORIES + 1).map((c) => ({
      id: str(c[0]),
      label: str(c[1]),
      weight: num(c[2], 100),
      locked: c[3] === 1 || undefined,
      children: (Array.isArray(c[4]) && c[4].length ? c[4] : [[`${str(c[0])}-all`, str(c[1]), 100, 0]]).slice(0, 8).map((k) => ({
        id: str(k[0]),
        label: str(k[1]),
        weight: num(k[2], 100),
        locked: k[3] === 1 || undefined,
        query: k[4] ? str(k[4], 120) : undefined,
      })),
    }))
    const fix = <T extends { weight: number }>(xs: T[]) => {
      const parts = apportion(100, xs.map((x) => x.weight))
      return xs.map((x, i) => ({ ...x, weight: parts[i] }))
    }
    return {
      v: 1,
      platform: PLATFORMS.includes(p.p) ? p.p : 'youtube',
      likes: Array.isArray(p.l) ? p.l.map((x) => str(x)).slice(0, 12) : [],
      problems: Array.isArray(p.pr) ? p.pr.filter((x) => PROBLEM_IDS.includes(x)) : [],
      note: str(p.n, 280),
      turnDown: Array.isArray(p.t) ? p.t.map((x) => str(x)).filter(Boolean).slice(0, 8) : [],
      mix: {
        categories: fix(categories).map((c) => ({ ...c, children: fix(c.children) })),
        before: p.b == null ? null : num(p.b, 2100) || null,
      },
      baseline: unpackTally(p.t0),
      followUp: unpackTally(p.t1),
    }
  } catch {
    return null
  }
}

export function recipeUrl(s: Session, base = location.origin + location.pathname): string {
  return `${base}#r=${encodeRecipe(s)}`
}

/* ---------- Browser storage (F-25) ---------- */

const KEY = 'algorithm-builder:session'

export function loadLocal(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? decodeRecipe(raw) : null
  } catch {
    return null
  }
}

export function saveLocal(s: Session): void {
  try {
    localStorage.setItem(KEY, encodeRecipe(s))
  } catch {
    /* private mode or storage blocked: the recipe link is the backup */
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
