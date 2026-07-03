import { fmtPct } from './format'

/** Document-level confidence indicator. Green when high, amber when the visitor
 *  should double-check. Purely visual + an aria-label for the value. */
export function ConfidenceMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value))
  const low = v < 0.75
  const color = low ? 'var(--color-ledger-flag)' : 'var(--color-ledger-mint)'
  return (
    <div className="flex items-center gap-2" aria-label={`Overall extraction confidence ${fmtPct(v)}`}>
      <span className="ledger-label">Confidence</span>
      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-ledger-card-2">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${v * 100}%`, background: color }} />
      </span>
      <span className="ledger-num text-xs" style={{ color }}>
        {fmtPct(v)}
      </span>
    </div>
  )
}
