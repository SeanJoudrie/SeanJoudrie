import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Chart } from './Chart'
import type { MonthRow, TfId, TierId } from './data'
import { DATASET, TIER_ORDER, TIMEFRAMES } from './data'
import { TierChips, TimeframeControl } from './Filters'
import { fmtCompact, fmtInt, fmtMoney, fmtMonth, fmtSignedPct } from './format'
import { visValue } from './series'
import { StatTile } from './StatTile'
import { TierDonut } from './TierDonut'
import { Transactions } from './Transactions'
import './theme.css'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Wordmark spark — a miniature of the revenue line the chart will draw. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect width="20" height="20" rx="5" fill="var(--color-aero-pro)" opacity="0.2" />
      <polyline
        points="4,13.5 8.5,9 11.5,11.5 16,5.5"
        fill="none"
        stroke="var(--color-aero-starter)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Card({
  label,
  delay,
  className = '',
  children,
}: {
  label: string
  delay: number
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`hero-in flex flex-col rounded-xl border border-aero-line bg-aero-card p-5 ${className}`}
      style={d(delay)}
    >
      <h2 className="aero-label">{label}</h2>
      {children}
    </section>
  )
}

export default function AeroScaleDashboard() {
  const months = DATASET.months

  const [tf, setTf] = useState<TfId>(() => {
    const m = window.location.hash.match(/[?&]tf=(q1|q2|q3|q4|h1|fy)\b/)
    return (m?.[1] as TfId) ?? 'fy'
  })
  const [active, setActive] = useState<ReadonlySet<TierId>>(() => new Set(TIER_ORDER))
  const [preview, setPreview] = useState<TierId | null>(null)

  // The view is shareable: the timeframe rides in the hash.
  useEffect(() => {
    const base = '#/demos/aeroscale'
    history.replaceState(null, '', tf === 'fy' ? base : `${base}?tf=${tf}`)
  }, [tf])

  const timeframe = TIMEFRAMES.find((t) => t.id === tf) ?? TIMEFRAMES[TIMEFRAMES.length - 1]
  const [rs, re] = timeframe.range
  const slice = months.slice(rs, re + 1)
  const first = slice[0]
  const last = slice[slice.length - 1]
  const prev = months[re - 1]
  const tfName = tf === 'fy' ? 'FY 2026' : `${timeframe.label} FY26`

  // Everything below the filter row answers to the same slice + tiers.
  const mrrOf = (m: MonthRow) => visValue('total', m, active)
  const custOf = (m: MonthRow) => TIER_ORDER.reduce((s, id) => s + (active.has(id) ? m.tiers[id].customers : 0), 0)
  const transactions = DATASET.transactions.filter((t) => active.has(t.tier))

  useEffect(() => {
    document.body.classList.add('aero-page')
    const prev = document.title
    document.title = 'AeroScale UI — Revenue overview'
    return () => {
      document.body.classList.remove('aero-page')
      document.title = prev
    }
  }, [])

  return (
    <div className="aero-root min-h-svh bg-aero-bg text-aero-ink">
      <header className="sticky top-0 z-10 border-b border-aero-line bg-aero-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <button
            onClick={() => navigate('#work')}
            className="hero-in font-mono text-xs tracking-wide text-aero-muted transition-colors hover:text-aero-ink"
            style={d(0)}
          >
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-aero-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">AeroScale UI</span>
            <span className="rounded-full border border-aero-starter/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-aero-starter">
              Demo
            </span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-aero-muted sm:block" style={d(80)}>
            Seeded dataset · FY 2026
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="hero-in flex flex-wrap items-end justify-between gap-3" style={d(100)}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Revenue overview</h1>
            <p className="mt-1 text-sm text-aero-ink-2">Fiscal year 2026, every number derived from one seeded ledger.</p>
          </div>
          <p className="aero-label">Hand-rolled SVG · no chart libraries</p>
        </div>

        {/* The one filter row — it scopes every card below it. */}
        <div className="hero-in mt-6 flex flex-wrap items-center gap-3" style={d(140)}>
          <TimeframeControl value={tf} onChange={setTf} />
          <span aria-hidden="true" className="hidden h-4 w-px bg-aero-line sm:block" />
          <TierChips
            active={active}
            onToggle={(id) =>
              setActive((cur) => {
                const next = new Set(cur)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
            onPreview={setPreview}
          />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Hero figure — ARR, the one number the page leads with. */}
          <StatTile
            hero
            label="Annual recurring revenue"
            value={mrrOf(last) * 12}
            format={fmtCompact}
            delta={{
              label: fmtSignedPct(mrrOf(last) / mrrOf(first) - 1),
              up: mrrOf(last) >= mrrOf(first),
              vs: fmtMonth(first.label),
            }}
            note={`LTV:CAC ${(last.ltv / last.cac).toFixed(1)}× · ${tfName} exit run-rate`}
            delay={180}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Monthly recurring revenue"
            value={mrrOf(last)}
            format={fmtMoney}
            delta={{ label: fmtSignedPct(mrrOf(last) / mrrOf(prev) - 1), up: mrrOf(last) >= mrrOf(prev), vs: fmtMonth(prev.label) }}
            spark={slice.map(mrrOf)}
            delay={240}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Net revenue"
            value={last.netRevenue}
            format={fmtMoney}
            delta={{
              label: fmtSignedPct(last.netRevenue / prev.netRevenue - 1),
              up: last.netRevenue >= prev.netRevenue,
              vs: fmtMonth(prev.label),
            }}
            note={`${fmtMonth(last.label)} · net of credits, plus services`}
            spark={slice.map((m) => m.netRevenue)}
            delay={300}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Active customers"
            value={custOf(last)}
            format={fmtInt}
            delta={{
              label: fmtInt(Math.abs(custOf(last) - custOf(prev))),
              up: custOf(last) >= custOf(prev),
              vs: fmtMonth(prev.label),
            }}
            spark={slice.map(custOf)}
            delay={360}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />

          <Card label="Revenue trend · monthly MRR" delay={460} className="col-span-12 lg:col-span-8">
            <Chart months={months} range={timeframe.range} active={active} preview={preview} />
          </Card>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
            <Card label={`Revenue by tier · ${fmtMonth(last.label)}`} delay={520} className="flex-none">
              <div key={`${tf}-${[...active].sort().join('.')}`} className="aero-fade">
                <TierDonut row={last} active={active} />
              </div>
            </Card>
            <Card label="Recent transactions" delay={580} className="flex-1">
              <Transactions transactions={transactions} />
            </Card>
          </div>
        </div>

        {/* The case-study strip — what a reviewer should know is under the hood. */}
        <section
          aria-label="How this demo is built"
          className="hero-in mt-8 grid gap-5 rounded-xl border border-aero-line bg-aero-card p-5 sm:grid-cols-3"
          style={d(620)}
        >
          <div>
            <h2 className="aero-label">Hand-rolled SVG</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-aero-ink-2">
              Scales, ticks, paths, the dash-offset draw-on and the resample-and-tween timeframe morphs are computed
              from scratch — this page adds zero dependencies.
            </p>
          </div>
          <div>
            <h2 className="aero-label">One seeded ledger</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-aero-ink-2">
              Every figure derives from a single deterministic simulation of logos, expansion and churn. Dev-mode
              asserts hold ARR = MRR × 12, tier sums, churn bands and LTV:CAC.
            </p>
          </div>
          <div>
            <h2 className="aero-label">One rAF loop</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-aero-ink-2">
              Tickers and chart morphs share a single frame loop writing straight to the DOM — React never renders at
              60Hz, and every animation has a reduced-motion path.
            </p>
          </div>
        </section>

        <footer className="hero-in mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-aero-line pt-5" style={d(680)}>
          <p className="font-mono text-xs text-aero-muted">
            Fictional company, deterministic data — built for Sean Joudrie's portfolio.
          </p>
          <button
            onClick={() => navigate('#work')}
            className="font-mono text-xs text-aero-muted transition-colors hover:text-aero-ink"
          >
            Back to the portfolio →
          </button>
        </footer>
      </div>
    </div>
  )
}
