import { describe, expect, it } from 'vitest'
import { parseFeed, tidy } from './youtube.mjs'

const entry = (id, { link = `https://www.youtube.com/watch?v=${id}`, title = 'A video', published = '2026-09-01T00:00:00+00:00', views = 10 } = {}) =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="${link}"/><published>${published}</published><media:statistics views="${views}"/></entry>`

describe('channel feed parsing', () => {
  const now = Date.parse('2026-09-23')
  it('keeps full-length videos and drops Shorts, unaired and old ones', () => {
    const xml = `<feed><title>Chan</title>${[
      entry('aaaaaaaaaaa', { title: 'Tom &amp; Jerry &quot;live&quot;' }),
      entry('bbbbbbbbbbb', { link: 'https://www.youtube.com/shorts/bbbbbbbbbbb' }),
      entry('ccccccccccc', { title: 'Quick one #shorts' }),
      entry('ddddddddddd', { views: 0 }),
      entry('eeeeeeeeeee', { published: '2020-01-01T00:00:00+00:00' }),
      entry('ggggggggggg', { title: 'Life on the spectrum (2/2)' }),
      entry('hhhhhhhhhhh', { title: 'The Big Story, Part 2' }),
      entry('fffffffffff'),
    ].join('')}</feed>`
    expect(parseFeed(xml, now).videos).toEqual([
      { id: 'aaaaaaaaaaa', title: 'Tom & Jerry "live"', published: '2026-09-01' },
      { id: 'fffffffffff', title: 'A video', published: '2026-09-01' },
    ])
  })

  it('keeps at most 2 per channel', () => {
    const xml = Array.from({ length: 8 }, (_, i) => entry(`vid${i}aaaaaaa`)).join('')
    expect(parseFeed(xml, now).videos).toHaveLength(2)
  })

  it('measures how a channel is doing right now', () => {
    const xml = [
      entry('aaaaaaaaaaa', { published: '2026-09-13T00:00:00+00:00', views: 10_000 }), // 10 days: 1,000/day
      entry('bbbbbbbbbbb', { published: '2026-09-03T00:00:00+00:00', views: 60_000 }), // 20 days: 3,000/day
      entry('ccccccccccc', { published: '2026-08-14T00:00:00+00:00', views: 80_000 }), // 40 days: 2,000/day
      entry('ddddddddddd', { published: '2026-01-01T00:00:00+00:00', views: 9_000_000 }), // too old to count
      entry('eeeeeeeeeee', { link: 'https://www.youtube.com/shorts/eeeeeeeeeee', views: 9_000_000 }), // a Short
    ].join('')
    expect(parseFeed(xml, now).stats).toEqual({ perDay: 2000, recent: 2 })
    expect(parseFeed('', now).stats).toEqual({ perDay: 0, recent: 0 })
  })
})

describe('tidy titles', () => {
  it('drops emoji and em dashes to match the site', () => {
    expect(tidy('Fall Baking 🍁 — Part 1')).toBe('Fall Baking - Part 1')
    expect(tidy('Coffee ☕️ time!')).toBe('Coffee time!')
    expect(tidy('Books 📖 |')).toBe('Books')
    expect(tidy('🇯🇵 Tokyo walk')).toBe('Tokyo walk')
    expect(tidy('Kurzgesagt – In a Nutshell')).toBe('Kurzgesagt – In a Nutshell')
  })
})
