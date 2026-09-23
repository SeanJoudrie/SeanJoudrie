import { describe, expect, it } from 'vitest'
import { COPY, summarize } from './copy'
import { PLAYBOOKS, SIGNALS } from './data/playbooks'
import { buildChecklist } from './lib/checklist'

/** Flesch-Kincaid grade, the same formula the UX audit used. */
function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  return Math.max(1, (w.match(/[aeiouy]{1,2}/g) ?? []).length)
}
function grade(text: string): { grade: number; words: number } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length || 1
  const words = text.match(/[A-Za-z][A-Za-z'’-]*|\d+/g) ?? []
  if (!words.length) return { grade: 0, words: 0 }
  const syl = words.reduce((a, w) => a + syllables(w), 0)
  return { grade: 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59, words: words.length }
}

/** Every string in COPY, with functions called on realistic sample values. */
function collect(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (typeof node === 'function') {
    const n = node.length
    const args = [['Game of Thrones', 'Star Wars'], [2, 3], [50, 90]]
    const sample = (node as (...a: unknown[]) => unknown)(...Array.from({ length: n }, (_, i) => (typeof args[0][i] === 'string' && node.toString().includes('x') ? args[0][i] : 2015)))
    collect(sample, out)
  } else if (Array.isArray(node)) node.forEach((x) => collect(x, out))
  else if (node && typeof node === 'object') Object.values(node).forEach((x) => collect(x, out))
  return out
}

const strings = [
  ...collect(COPY),
  // summarize() is left out: it's made of the user's own topic names.
  ...(['youtube', 'instagram', 'tiktok', 'x'] as const).flatMap((p) =>
    [...buildChecklist(p, ['Game of Thrones'], ['one-topic', 'rage-bait']), ...buildChecklist(p, [], ['stale'])].flatMap((i) => [i.text, i.detail ?? '', i.link?.label ?? '']),
  ),
  ...Object.values(PLAYBOOKS).flatMap((ts) => ts.map((t) => t.text)),
  ...SIGNALS.more,
  ...SIGNALS.less,
].filter(Boolean)

describe('plain language', () => {
  it('collects the whole copy deck', () => {
    expect(strings.length).toBeGreaterThan(120)
  })

  it('keeps every sentence at a 6th-grade reading level or below', () => {
    // Very short labels (5 words or fewer) are exempt: the formula is noise on them.
    const hard = strings.map((s) => ({ s, ...grade(s) })).filter((x) => x.words > 5 && x.grade > 6)
    expect(hard.map((h) => `${h.grade.toFixed(1)}: ${h.s}`)).toEqual([])
  })

  it('keeps sentences short (about 12 words or fewer)', () => {
    const long = strings.flatMap((s) => s.split(/(?<=[.!?])\s+/)).filter((s) => (s.match(/\S+/g) ?? []).length > 14)
    expect(long).toEqual([])
  })

  it('never uses retired jargon', () => {
    const banned = /\b(algorithm|mix|slices?|wildcard|recipe|tune-?up|rehab|culprits?|time capsule|lock(ed)?|split|incognito)\b/i
    expect(strings.filter((s) => banned.test(s))).toEqual([])
  })

  it('has no em dashes', () => {
    expect(strings.filter((s) => s.includes('—'))).toEqual([])
  })
})

describe('summarize', () => {
  it('reads like a sentence', () => {
    expect(
      summarize([
        { label: 'Cooking', weight: 45 },
        { label: 'Gardening', weight: 30 },
        { label: 'History', weight: 20 },
        { label: 'Surprise me', weight: 5, surprise: true },
      ]),
    ).toBe('Mostly Cooking. Some Gardening and History. A few surprises.')
    expect(
      summarize([
        { label: 'Nature', weight: 32 },
        { label: 'News', weight: 32 },
        { label: 'History', weight: 31 },
        { label: 'Surprise me', weight: 5, surprise: true },
      ]),
    ).toBe('Mostly Nature, News and History. A few surprises.')
    expect(summarize([{ label: 'Math', weight: 100 }])).toBe('Mostly Math.')
  })
})
