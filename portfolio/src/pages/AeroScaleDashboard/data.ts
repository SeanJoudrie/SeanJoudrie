import { mulberry32 } from '../../lib/rand'

/**
 * The AeroScale ledger — every number on the dashboard derives from this one
 * seeded simulation, so the figures cross-check by construction: tiers sum to
 * MRR, ARR is exactly MRR × 12, and churn removes the revenue it reports.
 *
 * The *growth plan* is authored (MRR $100k → $200k over the fiscal year, with
 * three narrative beats: the Enterprise launch in October, a February churn
 * spike with recovery, and a Q4 seasonal bump); the simulation then walks the
 * plan month by month as ledger events — new logos, expansion, contraction,
 * churn — with seeded jitter on every component. Same seed, same story, on
 * every device. Invariants are checked in dev by data.assert.ts.
 */

export type TierId = 'starter' | 'pro' | 'ent'

export type TierMonth = {
  openingMrr: number
  mrr: number
  customers: number
  newLogos: number
  churnedLogos: number
  newMrr: number
  expansionMrr: number
  contractionMrr: number
  churnedMrr: number
}

export type MonthRow = {
  label: string
  tiers: Record<TierId, TierMonth>
  mrr: number
  arr: number
  /** Blended revenue churn for the month (decimal, e.g. 0.021). */
  churnRate: number
  customers: number
  netRevenue: number
  ltv: number
  cac: number
}

export type TxKind = 'new' | 'expansion' | 'renewal'
export type Transaction = {
  company: string
  tier: TierId
  kind: TxKind
  mrr: number
  when: string
}

export type Dataset = { months: MonthRow[]; transactions: Transaction[] }

export const FY_LABEL = 'FY 2026'
export const AERO_SEED = 20260630

export type TfId = 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'fy'
/** Month-index ranges (inclusive) into the fiscal year Jul '25 – Jun '26. */
export const TIMEFRAMES: { id: TfId; label: string; range: [number, number] }[] = [
  { id: 'q1', label: 'Q1', range: [0, 2] },
  { id: 'q2', label: 'Q2', range: [3, 5] },
  { id: 'q3', label: 'Q3', range: [6, 8] },
  { id: 'q4', label: 'Q4', range: [9, 11] },
  { id: 'h1', label: 'H1', range: [0, 5] },
  { id: 'fy', label: 'FY', range: [0, 11] },
]

export const TIER_ORDER: TierId[] = ['starter', 'pro', 'ent']

export const TIER_META: Record<
  TierId,
  { name: string; arpa: number; churnX: number; expansion: number; contraction: number; color: string }
> = {
  // churnX skews the blended churn schedule across tiers (self-serve churns
  // hardest, Enterprise barely); expansion/contraction are monthly % of MRR.
  starter: { name: 'Starter', arpa: 79, churnX: 1.7, expansion: 0.004, contraction: 0.005, color: 'var(--color-aero-starter)' },
  pro: { name: 'Professional', arpa: 299, churnX: 1.0, expansion: 0.012, contraction: 0.004, color: 'var(--color-aero-pro)' },
  ent: { name: 'Enterprise', arpa: 1750, churnX: 0.5, expansion: 0.022, contraction: 0.003, color: 'var(--color-aero-ent)' },
}

const N = 12
const LABELS = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26']
const ENT_LAUNCH = 3 // Oct '25
const GROSS_MARGIN = 0.82

/* The authored plan. Endpoints carry no jitter so the headline lands where
   the case study says it does. */
const SEASONAL = [1, 1, 1, 1.015, 1.03, 1.02, 1, 0.985, 0.99, 1, 1, 1] // Q4 bump, Feb slowdown
const CHURN_PLAN = [0.023, 0.022, 0.022, 0.021, 0.021, 0.02, 0.02, 0.037, 0.027, 0.02, 0.019, 0.019]

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

function targetShares(m: number): Record<TierId, number> {
  const ent = m < ENT_LAUNCH ? 0 : 0.06 + 0.39 * easeOut((m - ENT_LAUNCH) / (N - 1 - ENT_LAUNCH))
  const starter = (0.36 - 0.16 * (m / (N - 1))) * (1 - ent * 0.35)
  return { starter, pro: 1 - starter - ent, ent }
}

export function buildDataset(seed: number = AERO_SEED): Dataset {
  const rand = mulberry32(seed)
  /** Multiplicative jitter: 1 ± amt. */
  const jit = (amt: number) => 1 + (rand() - 0.5) * 2 * amt

  const targets = Array.from({ length: N }, (_, m) => {
    const base = 100_000 * Math.pow(2, m / (N - 1))
    // Endpoints get only a whisper of noise — the headline must land on the
    // authored story, but an MRR of exactly $200,000 would read as fake.
    const noise = m === 0 || m === N - 1 ? jit(0.004) : jit(0.012)
    return base * SEASONAL[m] * noise
  })

  // Opening state: the company existed before the window, so month one is
  // ordinary trading, not a cold start.
  const pre = targets[0] / 1.04
  const preShares = { starter: 0.365, pro: 0.635, ent: 0 }
  const state = {} as Record<TierId, { mrr: number; customers: number }>
  for (const id of TIER_ORDER) {
    const mrr = pre * preShares[id]
    state[id] = { mrr, customers: Math.round(mrr / TIER_META[id].arpa) || 0 }
  }

  const months: MonthRow[] = []
  for (let m = 0; m < N; m++) {
    const shares = targetShares(m)

    // Normalize the per-tier churn skews so the blend follows the plan.
    let skew = 0
    let opening = 0
    for (const id of TIER_ORDER) {
      skew += state[id].mrr * TIER_META[id].churnX
      opening += state[id].mrr
    }
    const churnNorm = CHURN_PLAN[m] / (skew / opening)

    const tiers = {} as Record<TierId, TierMonth>
    let churnedTotal = 0
    for (const id of TIER_ORDER) {
      const meta = TIER_META[id]
      const openingMrr = state[id].mrr

      const churnedMrr = openingMrr * churnNorm * meta.churnX * jit(0.15)
      const expansionMrr = openingMrr * meta.expansion * jit(0.25)
      const contractionMrr = openingMrr * meta.contraction * jit(0.25)
      const newMrr = Math.max(0, targets[m] * shares[id] - openingMrr - expansionMrr + contractionMrr + churnedMrr)
      const mrr = openingMrr + newMrr + expansionMrr - contractionMrr - churnedMrr

      const newLogos = newMrr > 0 ? Math.max(1, Math.round(newMrr / (meta.arpa * jit(0.1)))) : 0
      const churnedLogos = Math.min(
        Math.max(state[id].customers - 1, 0),
        Math.round(churnedMrr / meta.arpa),
      )
      const customers = state[id].customers + newLogos - churnedLogos

      tiers[id] = { openingMrr, mrr, customers, newLogos, churnedLogos, newMrr, expansionMrr, contractionMrr, churnedMrr }
      state[id] = { mrr, customers }
      churnedTotal += churnedMrr
    }

    const mrr = TIER_ORDER.reduce((s, id) => s + tiers[id].mrr, 0)
    const customers = TIER_ORDER.reduce((s, id) => s + tiers[id].customers, 0)
    const churnRate = churnedTotal / opening

    // LTV over trailing-3-month churn, so one bad month dents it without
    // whiplashing it; CAC is tuned to hold a healthy ratio near 4.2×.
    const trailing =
      (churnRate + (months[m - 1]?.churnRate ?? churnRate) + (months[m - 2]?.churnRate ?? churnRate)) / 3
    const ltv = (mrr / customers) * (GROSS_MARGIN / trailing)
    const cac = ltv / (4.2 + (rand() - 0.5) * 0.6)

    // Recognized revenue net of credits, plus Enterprise implementation fees.
    const netRevenue = mrr * (1 - 0.025 * jit(0.3)) + tiers.ent.newLogos * 1500

    months.push({ label: LABELS[m], tiers, mrr, arr: mrr * 12, churnRate, customers, netRevenue, ltv, cac })
  }

  return { months, transactions: buildTransactions(rand) }
}

const COMPANIES = [
  'Halcyon Freight', 'Vantage Metrics', 'Copperline Systems', 'Northbeam Robotics', 'Ridgeline Health',
  'Quorum Analytics', 'Bluewater Logistics', 'Fernworks', 'Stackpoint Labs', 'Meridian Grid',
  'Oakfast Capital', 'Cascade Yield', 'Ironvale Manufacturing', 'Latticework HQ', 'Signal & Porter',
  'Truenorth Dispatch', 'Emberline Energy', 'Harborview Clinics',
]

function buildTransactions(rand: () => number): Transaction[] {
  // Recent, high-value first: a sample of June's closes and renewals.
  const names = COMPANIES.map((name) => ({ name, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 10)
    .map((x) => x.name)

  const txs: Transaction[] = []
  let day = 28 - Math.floor(rand() * 3)
  for (const company of names) {
    const r = rand()
    const tier: TierId = r < 0.25 ? 'starter' : r < 0.62 ? 'pro' : 'ent'
    const kr = rand()
    // Starter is self-serve: signups and renewals, no negotiated expansions.
    const kind: TxKind = tier === 'starter' ? (kr < 0.6 ? 'new' : 'renewal') : kr < 0.45 ? 'new' : kr < 0.75 ? 'expansion' : 'renewal'
    const scale = kind === 'expansion' ? 0.45 : 1
    const mrr = TIER_META[tier].arpa * scale * (1 + (rand() - 0.5) * 0.7)
    txs.push({ company, tier, kind, mrr, when: `Jun ${day}` })
    day -= 1 + Math.floor(rand() * 3)
    if (day < 1) day = 1
  }
  return txs.sort((a, b) => b.mrr - a.mrr)
}

/** The dashboard's single, deterministic instance. */
export const DATASET: Dataset = buildDataset()

if (import.meta.env?.DEV) {
  // Dev-only: the assert module stays out of the production chunk.
  void import('./data.assert').then(({ assertInvariants }) => assertInvariants(DATASET))
}
