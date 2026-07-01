import { useMemo, useState } from 'react'
import { codex, REGIONS } from '../../data/codex'
import type { CodexRegion } from '../../data/codex'

type SortKey = 'name' | 'capital' | 'code'

/**
 * Experiment 01 · DATA — a live excerpt of the codex that powers Globalio.
 * Search, facet, and sort all 197 sovereign entries; the production codex
 * layers 4,000+ entries (historical flags, subdivisions, languages) on this
 * spine.
 */
export default function CodexExplorer() {
  const [q, setQ] = useState('')
  const [region, setRegion] = useState<CodexRegion | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [asc, setAsc] = useState(true)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = codex.filter(
      (e) =>
        (!region || e.region === region) &&
        (!needle ||
          e.name.toLowerCase().includes(needle) ||
          e.capital.toLowerCase().includes(needle) ||
          e.code.includes(needle)),
    )
    return filtered.sort((a, b) => {
      const cmp = a[sortKey].localeCompare(b[sortKey])
      return asc ? cmp : -cmp
    })
  }, [q, region, sortKey, asc])

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v)
    else {
      setSortKey(k)
      setAsc(true)
    }
  }

  const arrow = (k: SortKey) => (sortKey === k ? (asc ? ' ↑' : ' ↓') : '')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search country, capital, or code…"
          aria-label="Search the codex"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none sm:w-64"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by region">
          <button
            onClick={() => setRegion(null)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              region === null ? 'border-accent bg-accent text-paper' : 'border-line text-ink-2 hover:border-accent hover:text-accent'
            }`}
          >
            All
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(region === r ? null : r)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                region === r ? 'border-accent bg-accent text-paper' : 'border-line text-ink-2 hover:border-accent hover:text-accent'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="coord mt-3" aria-live="polite">
        Showing {rows.length} of {codex.length} — an excerpt of the 4,000-entry production codex
      </p>

      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-line bg-paper">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-paper-2 text-ink">
            <tr>
              <th className="w-12 border-b border-line px-3 py-2" aria-label="Flag" />
              <Th label={`Country${arrow('name')}`} onClick={() => sortBy('name')} />
              <Th label={`Capital${arrow('capital')}`} onClick={() => sortBy('capital')} />
              <Th label={`Code${arrow('code')}`} onClick={() => sortBy('code')} className="hidden w-16 sm:table-cell" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.code} className="border-b border-line/60 last:border-b-0 hover:bg-paper-2/60">
                <td className="px-3 py-1.5">
                  <img
                    src={`https://flagcdn.com/w40/${e.code}.png`}
                    srcSet={`https://flagcdn.com/w80/${e.code}.png 2x`}
                    alt=""
                    width={24}
                    height={16}
                    loading="lazy"
                    decoding="async"
                    className="rounded-[2px] border border-line/60"
                    onError={(ev) => ((ev.target as HTMLImageElement).style.visibility = 'hidden')}
                  />
                </td>
                <td className="px-3 py-1.5 font-medium text-ink">{e.name}</td>
                <td className="px-3 py-1.5 text-ink-2">{e.capital}</td>
                <td className="hidden px-3 py-1.5 font-mono text-xs uppercase text-faint sm:table-cell">{e.code}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-faint">
                  Nothing in the codex matches “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <th className={`border-b border-line px-3 py-2 ${className}`}>
      <button
        onClick={onClick}
        className="font-semibold text-ink transition-colors hover:text-accent"
      >
        {label}
      </button>
    </th>
  )
}
