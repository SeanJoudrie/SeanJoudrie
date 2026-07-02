import type { Transaction } from './data'
import { TIER_META } from './data'
import { fmtMoney } from './format'

const KIND_LABEL = { new: 'New logo', expansion: 'Expansion', renewal: 'Renewal' } as const

/** High-value closes sampled from the ledger's final month. */
export function Transactions({ transactions, limit = 6 }: { transactions: Transaction[]; limit?: number }) {
  const shown = transactions.slice(0, limit)
  return (
    <div>
      <ul className="mt-1 divide-y divide-aero-line">
        {shown.map((t) => (
          <li key={t.company} className="flex items-center gap-3 py-2.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 flex-none rounded-full"
              style={{ background: TIER_META[t.tier].color }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-aero-ink">{t.company}</p>
              <p className="text-xs text-aero-muted">
                {TIER_META[t.tier].name} · {KIND_LABEL[t.kind]}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-medium tabular-nums text-aero-ink">
                {fmtMoney(t.mrr)}
                <span className="text-aero-muted">/mo</span>
              </p>
              <p className="font-mono text-xs text-aero-muted">{t.when}</p>
            </div>
          </li>
        ))}
      </ul>
      {transactions.length > limit && (
        <p className="mt-2 font-mono text-xs text-aero-muted">+{transactions.length - limit} more this month in the ledger</p>
      )}
    </div>
  )
}
