import { describe, expect, it } from 'vitest'
import { norm, score } from '../lib/search'
import { CULPRIT_LIST, findCulprit, GROUPS, inferProblems, POOL, poolFor, searchCulprits, searchTopics, suggestFor, TOPIC_LIST, topicById } from './library'

describe('taxonomy integrity', () => {
  it('has 200+ topics in 15-20 groups with unique ids', () => {
    expect(TOPIC_LIST.length).toBeGreaterThanOrEqual(200)
    expect(GROUPS.length).toBeGreaterThanOrEqual(15)
    expect(GROUPS.length).toBeLessThanOrEqual(20)
    expect(new Set(TOPIC_LIST.map((t) => t.id)).size).toBe(TOPIC_LIST.length)
  })

  it('gives every topic 1-4 sub-topics with real search words', () => {
    for (const t of TOPIC_LIST) {
      expect(t.subtopics.length, t.id).toBeGreaterThanOrEqual(1)
      expect(t.subtopics.length, t.id).toBeLessThanOrEqual(4)
      for (const s of t.subtopics) expect(s.query.trim().length, `${t.id}/${s.label}`).toBeGreaterThan(2)
    }
  })

  it('has 150+ culprits, each with alternatives that exist', () => {
    expect(CULPRIT_LIST.length).toBeGreaterThanOrEqual(150)
    expect(new Set(CULPRIT_LIST.map((c) => c.id)).size).toBe(CULPRIT_LIST.length)
    for (const c of CULPRIT_LIST) {
      expect(c.alternatives.length, c.id).toBeGreaterThan(0)
      for (const a of c.alternatives) expect(topicById(a), `${c.id} → ${a}`).toBeTruthy()
    }
  })
})

describe('video pool integrity', () => {
  it('only points at real topics, has no duplicates, and every id looks like a YouTube id', () => {
    expect(new Set(POOL.map((v) => v.id)).size).toBe(POOL.length)
    for (const v of POOL) {
      expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/)
      for (const t of v.topics) expect(topicById(t), `${v.id} → ${t}`).toBeTruthy()
      expect(v.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('filters by the "older videos" year', () => {
    const all = poolFor('classic-films', null)
    const old = poolFor('classic-films', 1930)
    expect(all.length).toBeGreaterThan(old.length)
    expect(old.every((v) => v.year !== null && v.year < 1930)).toBe(true)
  })
})

describe('search', () => {
  it('matches nicknames, accents and typos', () => {
    expect(searchCulprits('GOT')[0].id).toBe('game-of-thrones')
    expect(searchCulprits('thrones')[0].id).toBe('game-of-thrones')
    expect(searchCulprits('pokemon')[0].id).toBe('pokemon')
    expect(searchTopics('gardning')[0].id).toBe('gardening')
    expect(searchTopics('hymns')[0].id).toBe('gospel-worship')
    expect(searchTopics('church music')[0].id).toBe('gospel-worship')
  })

  it('normalizes and scores', () => {
    expect(norm('  Pokémon: Red!  ')).toBe('pokemon red')
    expect(score('xyz', ['Gardening'])).toBe(0)
    expect(score('garden', ['Gardening'])).toBe(80)
  })
})

describe('suggestions and inference', () => {
  it('suggests alternatives and never the same franchise back', () => {
    const s = suggestFor(['Game of Thrones'])
    expect(s).toHaveLength(3)
    expect(s).not.toContain('fantasy')
    for (const id of s) expect(topicById(id)).toBeTruthy()
  })

  it('falls back to sensible defaults for unknown or empty input', () => {
    expect(suggestFor([])).toEqual(['documentaries', 'nature-relaxing', 'easy-recipes'])
    expect(suggestFor(['my neighbour Steve'])).toHaveLength(3)
  })

  it('works out the problem from what was named', () => {
    expect(inferProblems(['Game of Thrones'], false)).toEqual(['one-topic'])
    expect(inferProblems(['Political commentary'], false)).toEqual(['one-topic', 'rage-bait'])
    expect(inferProblems([], true)).toEqual(['stale'])
    expect(findCulprit('House of the Dragon')?.id).toBe('game-of-thrones')
  })
})
