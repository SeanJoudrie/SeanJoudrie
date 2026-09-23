import { beforeEach, describe, expect, it, vi } from 'vitest'
import { _reset, handleSearch } from './search'

const ok = (items: unknown[]) =>
  vi.fn(async () => new Response(JSON.stringify({ items }), { status: 200 })) as unknown as typeof fetch

const item = { id: { videoId: 'abc' }, snippet: { title: 'Fish &amp; chips', channelTitle: 'Chan', publishedAt: '2015-01-01T00:00:00Z', thumbnails: { medium: { url: 'https://i.ytimg.com/x.jpg' } } } }

describe('handleSearch', () => {
  beforeEach(() => _reset())

  it('reports unconfigured without a key', async () => {
    const r = await handleSearch(new URLSearchParams({ q: 'math' }), { client: 'a' })
    expect(r.body).toEqual({ status: 'unconfigured' })
  })

  it('rejects empty queries', async () => {
    const r = await handleSearch(new URLSearchParams({ q: ' ' }), { client: 'a', apiKey: 'k' })
    expect(r.status).toBe(400)
  })

  it('maps results, adds the time-capsule filter, and caches', async () => {
    const f = ok([item])
    const p = new URLSearchParams({ q: 'math', before: '2020' })
    const r = await handleSearch(p, { client: 'a', apiKey: 'k', fetchImpl: f })
    expect(r.body).toEqual({
      status: 'ok',
      items: [{ id: 'abc', title: 'Fish & chips', channel: 'Chan', published: '2015-01-01T00:00:00Z', thumb: 'https://i.ytimg.com/x.jpg' }],
    })
    const called = new URL(String((f as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]))
    expect(called.searchParams.get('publishedBefore')).toBe('2020-01-01T00:00:00Z')
    expect(called.searchParams.get('type')).toBe('video')
    await handleSearch(p, { client: 'a', apiKey: 'k', fetchImpl: f })
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('backs off after a quota error', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }), { status: 403 })) as unknown as typeof fetch
    const r1 = await handleSearch(new URLSearchParams({ q: 'a' }), { client: 'a', apiKey: 'k', fetchImpl: f })
    const r2 = await handleSearch(new URLSearchParams({ q: 'b' }), { client: 'a', apiKey: 'k', fetchImpl: f })
    expect(r1.body.status).toBe('quota')
    expect(r2.body.status).toBe('quota')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('rate-limits a single client', async () => {
    const f = ok([])
    let last
    for (let i = 0; i < 31; i++) last = await handleSearch(new URLSearchParams({ q: `q${i}` }), { client: 'x', apiKey: 'k', fetchImpl: f, now: 1000 })
    expect(last!.status).toBe(429)
  })
})
