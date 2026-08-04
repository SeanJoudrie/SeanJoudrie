/**
 * The whole scene, in the address bar.
 *
 * Everything here is a view of one elevation model under a handful of settings,
 * and without this none of it is addressable: you can find something worth
 * showing someone and have no way to show it to them. Encoding the state makes
 * every configuration a link, which is also what makes a screenshot
 * reproducible — the figures in a commit message can be re-derived rather than
 * taken on trust.
 *
 * Written into the hash, after the route, because the page is served from a
 * static host under a hash router: `#/demos/relief?site=…`. A query string
 * before the hash would be a different URL to the server and a reload away from
 * a 404.
 *
 * Deliberately lossy. Positions keep three decimals, which on a 20 km frame is
 * about 20 m — a third of one DEM cell, and far finer than anyone can click.
 * Anything at its default is omitted entirely, so the common link stays short
 * and reads as what was changed rather than as a dump of every setting.
 */

export type ShareState = {
  site: string
  observers: { u: number; v: number }[]
  height: number
  exaggeration: number
  water: number | null
  hour: number
  dateIdx: number
  refraction: boolean
  slope: boolean
  target: { u: number; v: number } | null
}

const n3 = (v: number) => Number(v.toFixed(3))
const pair = (p: { u: number; v: number }) => `${n3(p.u)},${n3(p.v)}`

const parsePair = (s: string) => {
  const [u, v] = s.split(',').map(Number)
  return Number.isFinite(u) && Number.isFinite(v) ? { u, v } : null
}

/** Serialise, omitting anything that matches the supplied defaults. */
export function encodeShare(s: ShareState, defaults: Pick<ShareState, 'height' | 'exaggeration' | 'refraction'>) {
  const q = new URLSearchParams()
  q.set('site', s.site)
  if (s.observers.length) q.set('o', s.observers.map(pair).join(';'))
  if (Math.abs(s.height - defaults.height) > 0.01) q.set('h', String(Math.round(s.height * 10) / 10))
  if (Math.abs(s.exaggeration - defaults.exaggeration) > 0.01) q.set('x', String(Math.round(s.exaggeration * 100) / 100))
  if (s.water !== null) q.set('w', String(Math.round(s.water)))
  q.set('t', String(Math.round(s.hour * 100) / 100))
  q.set('d', String(s.dateIdx))
  if (s.refraction !== defaults.refraction) q.set('k', s.refraction ? '1' : '0')
  if (s.slope) q.set('s', '1')
  if (s.target) q.set('g', pair(s.target))
  return q.toString()
}

export type ParsedShare = Partial<Omit<ShareState, 'observers' | 'target'>> & {
  observers?: { u: number; v: number }[]
  target?: { u: number; v: number } | null
}

/**
 * Read state out of a hash like `#/demos/relief?site=matterhorn&h=120`.
 *
 * Every field is optional and every field is validated: a link is untrusted
 * input, and a NaN reaching the exaggeration uniform would take the whole scene
 * down rather than fall back to a sane default.
 */
export function decodeShare(hash: string): ParsedShare {
  const qi = hash.indexOf('?')
  if (qi === -1) return {}
  const q = new URLSearchParams(hash.slice(qi + 1))
  const out: ParsedShare = {}

  const site = q.get('site')
  if (site) out.site = site

  const o = q.get('o')
  if (o) {
    const list = o.split(';').map(parsePair).filter((p): p is { u: number; v: number } => p !== null)
    if (list.length) out.observers = list
  }

  const num = (key: string, lo: number, hi: number) => {
    const raw = q.get(key)
    if (raw === null) return undefined
    const v = Number(raw)
    return Number.isFinite(v) && v >= lo && v <= hi ? v : undefined
  }

  const h = num('h', 0.5, 2000)
  if (h !== undefined) out.height = h
  const x = num('x', 0.5, 8)
  if (x !== undefined) out.exaggeration = x
  const w = num('w', -1000, 10000)
  if (w !== undefined) out.water = w
  const t = num('t', 0, 24)
  if (t !== undefined) out.hour = t
  const d = num('d', 0, 3)
  if (d !== undefined) out.dateIdx = Math.round(d)

  if (q.get('k') !== null) out.refraction = q.get('k') === '1'
  if (q.get('s') !== null) out.slope = q.get('s') === '1'

  const g = q.get('g')
  if (g) {
    const p = parsePair(g)
    if (p) out.target = p
  }
  return out
}
