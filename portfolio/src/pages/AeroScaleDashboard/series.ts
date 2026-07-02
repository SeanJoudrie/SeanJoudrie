import type { MonthRow, TierId } from './data'
import { TIER_META, TIER_ORDER } from './data'

export type SeriesId = 'total' | TierId

export const SERIES: { id: SeriesId; name: string; color: string }[] = [
  { id: 'total', name: 'Total MRR', color: 'var(--color-aero-total)' },
  ...TIER_ORDER.map((id) => ({ id, name: TIER_META[id].name, color: TIER_META[id].color })),
]

export const seriesValue = (id: SeriesId, m: MonthRow) => (id === 'total' ? m.mrr : m.tiers[id].mrr)

/** Series value under a tier filter — the total rescopes to what's on. */
export const visValue = (id: SeriesId, m: MonthRow, active: ReadonlySet<TierId>): number =>
  id === 'total'
    ? TIER_ORDER.reduce((s, t) => s + (active.has(t) ? m.tiers[t].mrr : 0), 0)
    : active.has(id)
      ? m.tiers[id].mrr
      : 0

/** Net new MRR for a month — closing minus the tiers' opening balances. */
export const netNew = (m: MonthRow) =>
  m.mrr - TIER_ORDER.reduce((s, id) => s + m.tiers[id].openingMrr, 0)
