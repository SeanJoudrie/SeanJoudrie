import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  CATEGORIES,
  type Category,
  type EditLine,
  type EditModel,
  type LineField,
  blankLine,
  cents,
  derivedSubtotal,
  derivedTotal,
  fieldFlagged,
  lineAmount,
  rowMismatch,
} from './schema'
import { fmtMoney } from './format'
import { download, toCSV, toJSON } from './export'

export function ResultsTable({ initial }: { initial: EditModel }) {
  const [model, setModel] = useState<EditModel>(initial)
  const [announce, setAnnounce] = useState('')

  const cur = model.currency
  const sub = derivedSubtotal(model.lines)
  const tot = derivedTotal(model.lines, model.tax)
  const subMismatch = Math.abs(sub - model.modelSubtotal) > 0.01
  const totMismatch = Math.abs(tot - model.modelTotal) > 0.01

  const patchLine = (id: string, patch: Partial<EditLine>) =>
    setModel((m) => ({ ...m, lines: m.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))

  // Editing a field also confirms it (clears its flag).
  const editField = (l: EditLine, f: LineField, patch: Partial<EditLine>) =>
    patchLine(l.id, { ...patch, confirmed: Array.from(new Set([...l.confirmed, f])) })

  const addRow = () => {
    setModel((m) => ({ ...m, lines: [...m.lines, blankLine()] }))
    setAnnounce('Row added.')
  }
  const delRow = (id: string) => {
    setModel((m) => ({ ...m, lines: m.lines.filter((l) => l.id !== id) }))
    setAnnounce('Row deleted. Totals recalculated.')
  }

  const flagStyle: CSSProperties = { color: 'var(--color-ledger-flag)' }

  return (
    <section aria-label="Extracted line items" className="rounded-xl border border-ledger-line bg-ledger-card p-5">
      {/* Header fields */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <HeaderField label="Merchant" flagged={model.conf.merchant < 0.75} value={model.merchant} onChange={(v) => setModel((m) => ({ ...m, merchant: v }))} />
        <HeaderField label="Date" flagged={model.conf.date < 0.75} value={model.date} onChange={(v) => setModel((m) => ({ ...m, date: v }))} />
        <HeaderField label="Currency" flagged={model.conf.currency < 0.75} value={model.currency} onChange={(v) => setModel((m) => ({ ...m, currency: v.toUpperCase().slice(0, 3) }))} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="ledger-label border-b border-ledger-line text-left">
              <th className="py-2 pr-3 font-inherit">Description</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Unit</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 pl-2 text-right"><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {model.lines.map((l) => {
              const amt = lineAmount(l)
              const mismatch = rowMismatch(l)
              return (
                <tr key={l.id} className="ledger-row-in border-b border-ledger-line/60">
                  <td className="py-1 pr-3">
                    <Cell
                      value={l.description}
                      flagged={fieldFlagged(l, 'description')}
                      ariaLabel="Item description"
                      onCommit={(v) => editField(l, 'description', { description: v })}
                    />
                  </td>
                  <td className="py-1 px-2 text-right">
                    <NumCell value={l.qty} flagged={fieldFlagged(l, 'qty')} ariaLabel="Quantity" onCommit={(v) => editField(l, 'qty', { qty: v })} />
                  </td>
                  <td className="py-1 px-2 text-right">
                    <NumCell value={l.unitPrice} flagged={fieldFlagged(l, 'unitPrice')} ariaLabel="Unit price" onCommit={(v) => editField(l, 'unitPrice', { unitPrice: cents(v) })} />
                  </td>
                  <td className="ledger-num py-1 px-2 text-right" title={mismatch ? `Model said ${fmtMoney(l.modelAmount, cur)} — recomputed from qty × unit` : undefined}>
                    <span style={mismatch && !l.confirmed.includes('amount') ? flagStyle : undefined}>{fmtMoney(amt, cur)}</span>
                    {mismatch && !l.confirmed.includes('amount') && (
                      <button
                        onClick={() => editField(l, 'amount', {})}
                        className="ml-1 align-middle text-[0.65rem]"
                        style={flagStyle}
                        aria-label={`Amount differs from the receipt; confirm the recomputed ${fmtMoney(amt, cur)}`}
                        title="Confirm recomputed amount"
                      >
                        ⚠
                      </button>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <select
                      value={l.category}
                      aria-label="Category"
                      onChange={(e) => editField(l, 'category', { category: e.target.value as Category })}
                      className={`rounded border border-ledger-line bg-ledger-card-2 px-1.5 py-1 text-xs text-ledger-ink ${fieldFlagged(l, 'category') ? 'ledger-flagged' : ''}`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.replace('_', ' / ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pl-2 text-right">
                    <button
                      onClick={() => delRow(l.id)}
                      aria-label={`Delete row: ${l.description || 'untitled item'}`}
                      className="rounded px-1.5 py-1 text-ledger-muted transition-colors hover:text-ledger-bad"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="springy mt-3 rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
        + Add row
      </button>

      {/* Totals — derived, with mismatch flags */}
      <dl className="ledger-num mt-5 ml-auto max-w-xs space-y-1 text-sm">
        <TotalRow label="Subtotal" value={fmtMoney(sub, cur)} mismatch={subMismatch} hint={subMismatch ? `receipt said ${fmtMoney(model.modelSubtotal, cur)}` : undefined} />
        <TotalRow
          label="Tax"
          value={
            <input
              value={model.tax}
              type="number"
              step="0.01"
              aria-label="Tax amount"
              onChange={(e) => setModel((m) => ({ ...m, tax: cents(Number(e.target.value) || 0) }))}
              className="ledger-num w-24 rounded border border-ledger-line bg-ledger-card-2 px-2 py-0.5 text-right text-ledger-ink"
            />
          }
        />
        <TotalRow label="Total" value={fmtMoney(tot, cur)} strong mismatch={totMismatch} hint={totMismatch ? `receipt said ${fmtMoney(model.modelTotal, cur)}` : undefined} />
      </dl>

      {/* Export */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-ledger-line pt-4">
        <button
          onClick={() => download(`ledger-lens-${model.date || 'receipt'}.csv`, toCSV(model), 'text/csv')}
          className="springy rounded-lg bg-ledger-mint px-4 py-2 font-semibold text-ledger-bg"
        >
          Export CSV
        </button>
        <button
          onClick={() => download(`ledger-lens-${model.date || 'receipt'}.json`, toJSON(model), 'application/json')}
          className="springy rounded-lg border border-ledger-line px-4 py-2 font-semibold text-ledger-ink hover:border-ledger-mint"
        >
          Export JSON
        </button>
      </div>

      <p className="ledger-label mt-4">
        Totals are recomputed from the line items — the model's arithmetic is never trusted. A ⚠ marks a value the model wasn't sure of, or a printed amount that disagrees with qty × unit.
      </p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </section>
  )
}

function HeaderField({ label, value, flagged, onChange }: { label: string; value: string; flagged: boolean; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="ledger-label">{label}</span>
      <input
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-lg border border-ledger-line bg-ledger-card-2 px-2.5 py-1.5 text-sm text-ledger-ink ${flagged ? 'ledger-flagged' : ''}`}
      />
    </label>
  )
}

/** Editable text cell — Enter/blur commits, Escape reverts. */
function Cell({ value, flagged, ariaLabel, onCommit }: { value: string; flagged: boolean; ariaLabel: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(value)
  return (
    <input
      value={v}
      aria-label={ariaLabel}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setV(value)
      }}
      className={`w-full rounded bg-transparent px-1.5 py-1 text-ledger-ink hover:bg-ledger-card-2 focus:bg-ledger-card-2 ${flagged ? 'ledger-flagged' : ''}`}
    />
  )
}

/** Editable numeric cell. */
function NumCell({ value, flagged, ariaLabel, onCommit }: { value: number; flagged: boolean; ariaLabel: string; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value))
  return (
    <input
      value={v}
      type="number"
      step="0.01"
      inputMode="decimal"
      aria-label={ariaLabel}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Number(v)
        if (Number.isFinite(n) && n !== value) onCommit(n)
        else setV(String(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setV(String(value))
      }}
      className={`ledger-num w-16 rounded bg-transparent px-1 py-1 text-right text-ledger-ink hover:bg-ledger-card-2 focus:bg-ledger-card-2 ${flagged ? 'ledger-flagged' : ''}`}
    />
  )
}

function TotalRow({ label, value, strong, mismatch, hint }: { label: string; value: React.ReactNode; strong?: boolean; mismatch?: boolean; hint?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? 'border-t border-ledger-line pt-1 text-base' : ''}`}>
      <dt className={strong ? 'font-semibold text-ledger-ink' : 'text-ledger-ink-2'}>{label}</dt>
      <dd className="flex items-center gap-2" style={mismatch ? { color: 'var(--color-ledger-flag)' } : undefined}>
        {mismatch && hint && <span className="text-[0.65rem]" title={hint}>⚠ {hint}</span>}
        <span className={strong ? 'font-semibold' : ''} style={strong && !mismatch ? { color: 'var(--color-ledger-mint)' } : undefined}>
          {value}
        </span>
      </dd>
    </div>
  )
}
