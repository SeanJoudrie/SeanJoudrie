import { useMemo, useState } from 'react'
import { europe, CODEX_TOTALS } from '../../data/codex'

/**
 * Experiment 01 · DATA — the Europe section of Globalio's codex, in the
 * shape the product uses: every country opens into subdivisions and a
 * flag-history timeline. One region as a taste; the full codex is 197
 * countries and 4,000+ entries.
 */
export default function CodexExplorer() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>('fr')
  // Only ever-opened panels render their images — keeps ~150 flag
  // thumbnails from fetching while collapsed.
  const [seen, setSeen] = useState<Set<string>>(() => new Set(['fr']))

  const toggle = (code: string) => {
    setOpen((cur) => (cur === code ? null : code))
    setSeen((s) => (s.has(code) ? s : new Set(s).add(code)))
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return europe
    return europe.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.capital.toLowerCase().includes(needle) ||
        c.history.some((h) => h.name.toLowerCase().includes(needle)),
    )
  }, [q])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Europe — country, capital, or era…"
          aria-label="Search the Europe section of the codex"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors duration-150 placeholder:text-faint focus:border-accent focus:outline-none sm:w-72"
        />
        <p className="coord" aria-live="polite">
          Europe · {rows.length} of {CODEX_TOTALS.europe} countries — one region of{' '}
          {CODEX_TOTALS.countries}, {CODEX_TOTALS.entries} entries in production
        </p>
      </div>

      <ul className="mt-3 max-h-[26rem] overflow-y-auto rounded-lg border border-line bg-paper">
        {rows.map((c) => {
          const isOpen = open === c.code
          return (
            <li key={c.code} className="border-b border-line/60 last:border-b-0">
              <button
                onClick={() => toggle(c.code)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper-2/60 ${
                  isOpen ? 'bg-paper-2/60' : ''
                }`}
              >
                <img
                  src={`https://flagcdn.com/w40/${c.code}.png`}
                  srcSet={`https://flagcdn.com/w80/${c.code}.png 2x`}
                  alt=""
                  width={26}
                  height={18}
                  loading="lazy"
                  decoding="async"
                  className="rounded-[2px] border border-line/60"
                  onError={(ev) => ((ev.target as HTMLImageElement).style.visibility = 'hidden')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="block truncate text-xs text-faint">{c.capital}</span>
                </span>
                <span className="hidden rounded-md border border-line bg-paper-2/70 px-2 py-0.5 text-xs font-medium text-ink-2 sm:block">
                  {c.subdiv}
                </span>
                <span className="coord">{c.history.length} era{c.history.length > 1 ? 's' : ''}</span>
                <span
                  aria-hidden
                  className={`text-faint transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                >
                  ›
                </span>
              </button>

              {/* Expanding codex entry — grid-rows trick keeps it transform-free. */}
              <div
                className="codex-expand grid"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  {seen.has(c.code) && (
                  <div className="border-t border-line/60 bg-paper-2/40 px-4 py-3 pl-12">
                    <p className="annotation text-gold">Subdivisions</p>
                    <p className="mt-1 text-sm text-ink-2">{c.subdiv}</p>
                    <p className="annotation mt-3 text-gold">Flag history</p>
                    <ol className="mt-2 space-y-2.5">
                      {c.history.map((h) => (
                        <li key={h.name} className="flex items-center gap-3 text-sm">
                          <img
                            src={h.img}
                            srcSet={`${h.img.replace('/120px-', '/240px-').replace('/w80/', '/w160/')} 2x`}
                            alt={`${h.name} flag`}
                            width={44}
                            height={30}
                            loading="lazy"
                            decoding="async"
                            className="h-[30px] w-11 shrink-0 rounded-[2px] border border-line/70 bg-paper-2 object-contain shadow-sm"
                            onError={(ev) => ((ev.target as HTMLImageElement).style.visibility = 'hidden')}
                          />
                          <span className="coord w-24 shrink-0">{h.era}</span>
                          <span className="leading-snug text-ink-2">{h.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="px-3 py-6 text-center text-faint">
            <span className="fade-in block">Nothing in Europe matches “{q}”.</span>
          </li>
        )}
      </ul>

      <p className="mt-3 max-w-lg text-sm leading-relaxed text-faint">
        Every country in the production codex opens like this — subdivisions,
        historical and identity flags, languages with script tags. Europe is
        one of six regions.
      </p>
    </div>
  )
}
