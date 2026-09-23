import { describe, expect, it } from 'vitest'
import { norm, score } from '../lib/search'
import { channelsFor, CULPRIT_LIST, feedFor, findCulprit, isHandPickedOnly, recommend, withoutChannel, type Feed, GROUPS, inferProblems, POOL, poolFor, searchCulprits, searchLessOf, searchTopics, suggestFor, TOPIC_LIST, topicById } from './library'

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

  it('finds the right topic from everyday words, first', () => {
    const cases: [string, string][] = [
      ['lipstick', 'beauty-makeup'],
      ['lipstik', 'beauty-makeup'],
      ['matte lipstick', 'beauty-makeup'],
      ['mascara', 'beauty-makeup'],
      ['skincare', 'beauty-makeup'],
      ['nail art', 'beauty-makeup'],
      ['sourdough', 'baking'],
      ['air fryer', 'easy-recipes'],
      ['brisket', 'bbq-grilling'],
      ['ramen', 'asian-cooking'],
      ['tacos', 'mexican-food'],
      ['espresso', 'coffee-tea'],
      ['taylor swift', 'pop'],
      ['beethoven', 'classical'],
      ['ukulele', 'learn-an-instrument'],
      ['stardew valley', 'cozy-games'],
      ['catan', 'board-games'],
      ['wordle', 'puzzles-crosswords'],
      ['snl', 'sketch-comedy'],
      ['iphone', 'gadgets'],
      ['python', 'coding'],
      ['pyramids', 'ancient-history'],
      ['ww2', 'world-war-ii'],
      ['nba', 'basketball'],
      ['premier league', 'soccer'],
      ['pickleball', 'tennis'],
      ['bass fishing', 'fishing'],
      ['pilates', 'yoga-stretching'],
      ['anxiety', 'mental-health'],
      ['roth ira', 'investing-basics'],
      ['sharks', 'ocean-life'],
      ['owls', 'birds-birdwatching'],
      ['puppies', 'pets'],
      ['bible', 'faith-spirituality'],
      ['stoicism', 'philosophy'],
      ['toddlers', 'parenting'],
      ['learn spanish', 'languages'],
      ['sneakers', 'streetwear'],
      ['black holes', 'space'],
      ['tornadoes', 'earth-weather'],
      ['t rex', 'dinosaurs'],
      ['raised beds', 'gardening'],
      ['crochet', 'knitting-crochet'],
      ['watercolor', 'painting-drawing'],
      ['origami', 'paper-crafts'],
      ['bob ross', 'painting-drawing'],
      ['pressure washing', 'satisfying'],
      ['ms rachel', 'nursery-sing-alongs'],
      ['excavators', 'heavy-machinery'],
      ['harley davidson', 'motorcycles'],
    ]
    const wrong = cases.filter(([q, id]) => searchTopics(q)[0]?.id !== id).map(([q, id]) => `${q}: wanted ${id}, got ${searchTopics(q)[0]?.id}`)
    expect(wrong).toEqual([])
  })

  it('ranks a direct name above a related word', () => {
    // "Gardening" is a name; "garden tour" is only a related word elsewhere.
    expect(searchTopics('gardening')[0].id).toBe('gardening')
    expect(searchTopics('classic films')[0].id).toBe('classic-films')
  })

  it('does not match short words in the middle of other words', () => {
    expect(score('art', ['party'])).toBe(0)
    expect(score('art', ['Art history'])).toBe(85)
    expect(score('lip', ['red lipstick'])).toBe(70)
  })

  it('offers whole topics on "What is taking over", after known shows', () => {
    expect(searchLessOf('lipstick')[0]).toBe('Beauty & makeup')
    expect(searchLessOf('GOT')[0]).toBe('Game of Thrones')
    expect(searchLessOf('makeup')).toContain('Makeup drama')
    expect(searchLessOf('makeup')).toContain('Beauty & makeup')
  })

  it('never suggests the topic someone is sick of, even by a related word', () => {
    expect(suggestFor(['lipstick'], 20)).not.toContain('beauty-makeup')
    expect(suggestFor(['Taylor Swift'], 20)).not.toContain('pop')
  })

  it('normalizes and scores', () => {
    expect(norm('  Pokémon: Red!  ')).toBe('pokemon red')
    expect(score('xyz', ['Gardening'])).toBe(0)
    expect(score('garden', ['Gardening'])).toBe(80)
  })
})

describe('good channels', () => {
  it('only lists confirmed channel ids for real topics', () => {
    for (const t of TOPIC_LIST) for (const c of channelsFor(t.id)) expect(c.id, `${t.id}: ${c.name}`).toMatch(/^UC[A-Za-z0-9_-]{22}$/)
    expect(TOPIC_LIST.filter((t) => channelsFor(t.id).length > 0).length).toBeGreaterThanOrEqual(150)
  })

  it('has no emoji or em dashes in channel names or video titles (the site shows none)', async () => {
    const feed = (await import('./feed.json')).default as Feed
    const bad = /[\p{Extended_Pictographic}—]/u
    const names = TOPIC_LIST.flatMap((t) => channelsFor(t.id).map((c) => c.name))
    const titles = Object.values(feed.channels).flatMap((c) => [c.name, ...c.videos.map((v) => v.title)])
    expect([...names, ...titles].filter((x) => bad.test(x))).toEqual([])
  })

  it('takes turns between channels for videos', () => {
    const topic = TOPIC_LIST.find((t) => channelsFor(t.id).length >= 2)!
    const [c1, c2] = channelsFor(topic.id)
    const v = (id: string) => ({ id, title: id, published: '2026-09-01' })
    const feed = { fetched: '2026-09-23', channels: { [c1.id]: { name: 'One', videos: [v('1a'), v('1b')] }, [c2.id]: { name: 'Two', videos: [v('2a')] } } }
    expect(feedFor(topic.id, feed).map((x) => x.id)).toEqual(['1a', '2a', '1b'])
    expect(feedFor(topic.id, feed)[1].channel).toBe('Two')
  })

  it('recommends across topics, leaving out hidden ones and what they are sick of', () => {
    const list = recommend(['space', 'baking'], [], [], null)
    expect(list.length).toBeGreaterThan(3)
    expect(new Set(list.map((r) => r.channel.id)).size).toBe(list.length)
    // Takes turns: the first two are one from each topic.
    expect(list.slice(0, 2).map((r) => r.topic)).toEqual(['space', 'baking'])
    const first = channelsFor('space')[0]
    expect(recommend(['space'], [], [first.id], null).some((r) => r.channel.id === first.id)).toBe(false)
    expect(recommend(['space'], [first.name], [], null).some((r) => r.channel.id === first.id)).toBe(false)
  })

  it('ranks by how channels are doing now, and badges only a clear leader', () => {
    const [a, b, c] = channelsFor('space')
    const stats = (perDay: number, recent: number) => ({ name: 'x', videos: [{ id: 'v', title: 'Latest one', published: '2026-09-01' }], perDay, recent })
    const feed = { fetched: '2026-09-23', channels: { [a.id]: stats(1000, 3), [b.id]: stats(9000, 3), [c.id]: stats(2000, 3) } }
    const list = recommend(['space'], [], [], feed)
    expect(list[0].channel.id).toBe(b.id)
    expect(list[0].popular).toBe(true)
    expect(list[0].latest).toBe('Latest one')
    expect(list.filter((r) => r.popular)).toHaveLength(1)
    // Not a clear leader (under twice the middle): no badge.
    const close = { ...feed, channels: { ...feed.channels, [b.id]: stats(2500, 3) } }
    expect(recommend(['space'], [], [], close).some((r) => r.popular)).toBe(false)
  })

  it('drops the channel name from the end of a title', () => {
    expect(withoutChannel("Earth's Greatest Migrations | BBC Earth", 'BBC Earth')).toBe("Earth's Greatest Migrations")
    expect(withoutChannel('Big Cats - DW Documentary', 'DW Documentary')).toBe('Big Cats')
    expect(withoutChannel('BBC Earth', 'BBC Earth')).toBe('BBC Earth')
    expect(withoutChannel('Why (a+b) works | 3Blue1Brown', '3Blue1Brown')).toBe('Why (a+b) works')
  })

  it('keeps politics, news, religion, kids and health hand-picked', () => {
    for (const t of ['politics-explained', 'news-explained', 'faith-spirituality', 'nursery-sing-alongs', 'medicine']) expect(isHandPickedOnly(t), t).toBe(true)
    expect(isHandPickedOnly('space')).toBe(false)
    const list = channelsFor('news-explained')
    if (list.length >= 2) {
      const feed = { fetched: '2026-09-23', channels: Object.fromEntries(list.map((c, i) => [c.id, { name: c.name, videos: [], perDay: (i + 1) * 10_000, recent: 5 }])) }
      const rec = recommend(['news-explained'], [], [], feed)
      expect(rec.map((r) => r.channel.id)).toEqual(list.map((c) => c.id))
      expect(rec.some((r) => r.popular)).toBe(false)
    }
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
