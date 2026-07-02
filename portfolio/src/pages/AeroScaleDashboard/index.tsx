import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { DATASET, FY_LABEL } from './data'
import { fmtCompact, fmtInt, fmtMoney, fmtMonth, fmtSignedPct } from './format'
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
      className={`hero-in rounded-xl border border-aero-line bg-aero-card p-5 ${className}`}
      style={d(delay)}
    >
      <h2 className="aero-label">{label}</h2>
      {children}
    </section>
  )
}

/** Skeleton bar — replaced by real components phase by phase. */
function Bar({ className }: { className: string }) {
  const radius = className.includes('rounded') ? '' : 'rounded-md'
  return <div aria-hidden="true" className={`aero-skeleton motion-safe:animate-pulse ${radius} ${className}`} />
}

export default function AeroScaleDashboard() {
  // Full-year view for now — the timeframe filter rescopes these in phase 5.
  const months = DATASET.months
  const first = months[0]
  const last = months[months.length - 1]
  const prev = months[months.length - 2]

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
            <p className="mt-1 text-sm text-aero-ink-2">Trailing twelve months, everything derived from one seeded ledger.</p>
          </div>
          <p className="aero-label">Hand-rolled SVG · no chart libraries</p>
        </div>

        {/* Filter row — timeframe + tier chips land in phase 5. */}
        <div aria-hidden="true" className="hero-in mt-6 flex flex-wrap items-center gap-2" style={d(140)}>
          <div className="flex gap-1 rounded-lg border border-aero-line p-1">
            {['h-7 w-10 rounded-md', 'h-7 w-10 rounded-md', 'h-7 w-10 rounded-md', 'h-7 w-14 rounded-md'].map(
              (c, i) => (
                <Bar key={i} className={c} />
              ),
            )}
          </div>
          <span className="mx-1 h-4 w-px bg-aero-line" />
          {['h-9 w-24 rounded-full', 'h-9 w-28 rounded-full', 'h-9 w-24 rounded-full'].map((c, i) => (
            <Bar key={i} className={c} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Hero figure — ARR, the one number the page leads with. */}
          <StatTile
            hero
            label="Annual recurring revenue"
            value={fmtCompact(last.arr)}
            delta={{ label: fmtSignedPct(last.arr / first.arr - 1), up: last.arr >= first.arr, vs: fmtMonth(first.label) }}
            note={`LTV:CAC ${(last.ltv / last.cac).toFixed(1)}× · ${FY_LABEL} exit run-rate`}
            delay={180}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Monthly recurring revenue"
            value={fmtMoney(last.mrr)}
            delta={{ label: fmtSignedPct(last.mrr / prev.mrr - 1), up: last.mrr >= prev.mrr, vs: fmtMonth(prev.label) }}
            spark={months.map((m) => m.mrr)}
            delay={240}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Net revenue"
            value={fmtMoney(last.netRevenue)}
            delta={{
              label: fmtSignedPct(last.netRevenue / prev.netRevenue - 1),
              up: last.netRevenue >= prev.netRevenue,
              vs: fmtMonth(prev.label),
            }}
            note={`${fmtMonth(last.label)} · net of credits, plus services`}
            spark={months.map((m) => m.netRevenue)}
            delay={300}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <StatTile
            label="Active customers"
            value={fmtInt(last.customers)}
            delta={{
              label: fmtInt(Math.abs(last.customers - prev.customers)),
              up: last.customers >= prev.customers,
              vs: fmtMonth(prev.label),
            }}
            spark={months.map((m) => m.customers)}
            delay={360}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          />

          <Card label="Revenue trend" delay={460} className="col-span-12 lg:col-span-8">
            <Bar className="mt-4 h-72 w-full sm:h-80" />
          </Card>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
            <Card label={`Revenue by tier · ${fmtMonth(last.label)}`} delay={520} className="flex-none">
              <TierDonut row={last} />
            </Card>
            <Card label="Recent transactions" delay={580} className="flex-1">
              <Transactions transactions={DATASET.transactions} />
            </Card>
          </div>
        </div>

        <footer className="hero-in mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-aero-line pt-5" style={d(640)}>
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
