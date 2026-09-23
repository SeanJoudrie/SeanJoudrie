import { describe, expect, it } from 'vitest'
import { parseFeed } from './feeds.mjs'

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
    expect(parseFeed(xml, now)).toEqual([
      { id: 'aaaaaaaaaaa', title: 'Tom & Jerry "live"', published: '2026-09-01' },
      { id: 'fffffffffff', title: 'A video', published: '2026-09-01' },
    ])
  })

  it('keeps at most 5 per channel', () => {
    const xml = Array.from({ length: 8 }, (_, i) => entry(`vid${i}aaaaaaa`)).join('')
    expect(parseFeed(xml, now)).toHaveLength(5)
  })
})
