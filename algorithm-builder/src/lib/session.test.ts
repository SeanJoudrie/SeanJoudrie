import { describe, expect, it } from 'vitest'
import { buildChecklist } from './checklist'
import { sum } from './mix'
import { allocate, filterVideos, searchUrl } from './playlist'
import { decodeRecipe, encodeRecipe, initialMix, likeFor, newSession, pctFromTally, reconcileMix, tallyFromPct } from './session'

describe('initialMix', () => {
  it('splits likes evenly with a 5% wildcard, summing to 100', () => {
    const mix = initialMix(['math-explained', 'stand-up', 'Game theory'])
    expect(mix.categories.map((c) => c.weight)).toEqual([32, 32, 31, 5])
    expect(sum(mix.categories)).toBe(100)
    for (const c of mix.categories) expect(sum(c.children)).toBe(100)
  })

  it('falls back to a starter mix', () => {
    expect(initialMix([]).categories.map((c) => c.id)).toEqual(['documentaries', 'nature-relaxing', 'easy-recipes', 'wildcard'])
  })
})

describe('recipe links', () => {
  it('round-trips a full session', () => {
    const s = {
      ...newSession('tiktok'),
      likes: ['math', 'Lego Technic'],
      problems: ['one-topic' as const],
      note: 'all “Star Wars” — every day',
      turnDown: ['Star Wars'],
      mix: { ...initialMix(['math', 'Lego Technic']), before: 2020 },
      baseline: { date: '2026-09-23', wanted: 3, sickOf: 14, other: 3 },
    }
    expect(decodeRecipe(encodeRecipe(s))).toEqual(JSON.parse(JSON.stringify(s)))
  })

  it('is URL-safe', () => {
    expect(encodeRecipe(newSession())).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rejects garbage and repairs bad weights', () => {
    expect(decodeRecipe('not-a-recipe')).toBeNull()
    const s = newSession()
    s.mix.categories[0].weight = 90 // now sums to 140
    const back = decodeRecipe(encodeRecipe(s))!
    expect(sum(back.mix.categories)).toBe(100)
  })
})

describe('allocate', () => {
  it('always fills exactly 10 slots in proportion to the mix', () => {
    const mix = initialMix(['math', 'science', 'comedy'])
    const slots = allocate(mix, 10, 1)
    expect(slots.reduce((a, s) => a + s.count, 0)).toBe(10)
    expect(slots.every((s) => s.count > 0)).toBe(true)
  })

  it('gives a 90% slice nine videos', () => {
    const mix = initialMix(['math'])
    mix.categories = [
      { ...mix.categories[0], weight: 90, children: [{ id: 'a', label: 'A', weight: 100 }] },
      { ...mix.categories[1], weight: 10 },
    ]
    expect(allocate(mix, 10, 1).map((s) => s.count)).toEqual([9, 1])
  })
})

describe('filterVideos', () => {
  it('drops turned-down topics and duplicates', () => {
    const v = (id: string, title: string) => ({ id, title, channel: 'c', published: '', thumb: '' })
    const seen = new Set<string>()
    const out = filterVideos([v('1', 'Math is fun'), v('2', 'GAME OF THRONES ending'), v('1', 'Math is fun')], ['Game of Thrones'], seen)
    expect(out.map((x) => x.id)).toEqual(['1'])
  })
})

describe('searchUrl', () => {
  it('adds the time-capsule operator', () => {
    expect(searchUrl('math', 2020)).toBe('https://www.youtube.com/results?search_query=math%20before%3A2020-01-01')
  })
})

describe('buildChecklist', () => {
  it('leads with deletion for each turned-down topic on YouTube', () => {
    const items = buildChecklist('youtube', ['Game of Thrones', 'Star Wars'], [])
    expect(items[0].text).toBe('Delete Game of Thrones videos from your history.')
    expect(items[1].text).toBe('Delete Star Wars videos from your history.')
    expect(items.some((i) => i.id === 'yt-quarantine')).toBe(true)
  })

  it('uses platform-specific wording elsewhere', () => {
    expect(buildChecklist('tiktok', ['Lego'], [])[0].detail).toContain('Press and hold')
    expect(buildChecklist('x', ['Lego'], []).some((i) => i.id === 'x-mute')).toBe(true)
  })
})

describe('reconcileMix', () => {
  it('keeps tuned weights when a like is added', () => {
    const mix = initialMix(['math-explained', 'stand-up'])
    mix.categories = [
      { ...mix.categories[0], weight: 70 },
      { ...mix.categories[1], weight: 25 },
      mix.categories[2],
    ]
    const out = reconcileMix(mix, ['math-explained', 'stand-up', 'world-history'])
    expect(out.categories.map((c) => c.id)).toEqual(['math-explained', 'stand-up', 'world-history', 'wildcard'])
    expect(sum(out.categories)).toBe(100)
    expect(out.categories[0].weight).toBeGreaterThan(out.categories[1].weight)
  })

  it('drops unliked categories and keeps topics added in the mix step', () => {
    const mix = initialMix(['math-explained', 'stand-up'])
    mix.categories.splice(2, 0, { id: 'added-chess', label: 'Chess', weight: 10, children: [{ id: 'a', label: 'Chess', weight: 100 }] })
    const out = reconcileMix(mix, ['math-explained'])
    expect(out.categories.map((c) => c.id)).toEqual(['math-explained', 'added-chess', 'wildcard'])
    expect(sum(out.categories)).toBe(100)
  })

  it('returns the same mix when nothing changed', () => {
    const mix = initialMix(['math-explained', 'Lego Technic'])
    expect(reconcileMix(mix, ['math-explained', 'Lego Technic'])).toBe(mix)
  })

  it('keeps categories from links shared before the library changed', () => {
    // A v1 recipe from the first release: 'science' and 'comedy' were topic ids then.
    const legacy = {
      ...newSession(),
      likes: ['science', 'comedy'],
      mix: {
        before: null,
        categories: [
          { id: 'science', label: 'Science', weight: 60, children: [{ id: 'space', label: 'Space', weight: 100, query: 'space science explained' }] },
          { id: 'comedy', label: 'Comedy', weight: 35, children: [{ id: 'stand-up', label: 'Stand-up', weight: 100, query: 'stand up comedy special clip' }] },
          { id: 'wildcard', label: 'Something I’d never click', weight: 5, children: [{ id: 'wildcard-all', label: 'Random but good', weight: 100 }] },
        ],
      },
    }
    const back = decodeRecipe(encodeRecipe(legacy))!
    expect(reconcileMix(back.mix, back.likes)).toBe(back.mix)
    expect(back.mix.categories.map((c) => c.weight)).toEqual([60, 35, 5])
  })

  it('maps categories back to likes', () => {
    const mix = initialMix(['math-explained', 'Lego Technic'])
    expect(mix.categories.map(likeFor)).toEqual(['math-explained', 'Lego Technic', null])
  })
})

describe('homepage estimate', () => {
  it('round-trips each answer through the saved shape', () => {
    for (const pct of [90, 50, 25, 10]) expect(pctFromTally(tallyFromPct(pct, '2026-09-23'))).toBe(pct)
  })
  it('reads old exact counts as a share', () => {
    expect(pctFromTally({ date: '2026-09-01', wanted: 3, sickOf: 14, other: 3 })).toBe(70)
  })
})
