import { useMemo, useState } from 'react'
import codexData from '../../data/codexEurope.json'

/**
 * Experiment 01 · DATA — the Europe section of Globalio's codex, ripped
 * straight from the shipped app's data: overviews, subdivision flag grids,
 * full flag-history timelines with notes, and predecessor states. Flag
 * images resolve exactly the way the product resolves them (Globalio's CDN
 * first, Wikimedia Commons otherwise).
 */

type Subdivision = { name: string; img: string | null }
type HistoryEntry = { label: string; from: number; to: number | null; note: string; img: string }
type Predecessor = { name: string; era: string; note: string; img: string }
type Country = {
  code: string
  name: string
  capital: string
  flag: string
  overview: string | null
  subTitle: string
  subdivisions: Subdivision[]
  history: HistoryEntry[]
  predecessors: Predecessor[]
}

const europe = codexData as Country[]

const hideOnError = (ev: React.SyntheticEvent<HTMLImageElement>) =>
  ((ev.target as HTMLImageElement).style.visibility = 'hidden')

const era = (h: HistoryEntry) => `${h.from} — ${h.to ?? 'Present'}`

export default function CodexExplorer() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return europe
    return europe.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.capital.toLowerCase().includes(needle),
    )
  }, [q])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Europe — country or capital…"
          aria-label="Search the Europe section of the codex"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors duration-150 placeholder:text-faint focus:border-accent focus:outline-none sm:w-72"
        />
        <p className="coord" aria-live="polite">
          Europe · {rows.length} of {europe.length} — one region of 197 · data straight from the app
        </p>
      </div>

      <ul className="mt-3 max-h-[34rem] overflow-y-auto rounded-lg border border-line bg-paper">
        {rows.map((c) => {
          const isOpen = open === c.code
          return (
            <li key={c.code} className="border-b border-line/60 last:border-b-0">
              <button
                onClick={() => setOpen(isOpen ? null : c.code)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper-2/60 ${
                  isOpen ? 'bg-paper-2/60' : ''
                }`}
              >
                <img
                  src={c.flag}
                  alt=""
                  width={30}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  className="h-5 w-[30px] shrink-0 rounded-[2px] border border-line/60 object-cover"
                  onError={hideOnError}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="block truncate text-xs text-faint">🏛 {c.capital}</span>
                </span>
                <span
                  aria-hidden
                  className={`text-faint transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                >
                  ›
                </span>
              </button>
              {isOpen && <CountryPanel key={c.code} c={c} />}
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
        This is the production codex, one region of six — overviews,
        subdivision flags, full flag histories, and the vanished states tied
        to each country.
      </p>
    </div>
  )
}

/** One country, in the product's own layout. State resets per country. */
function CountryPanel({ c }: { c: Country }) {
  const [more, setMore] = useState(false)
  const [subsOpen, setSubsOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(true)
  const [predsOpen, setPredsOpen] = useState(false)
  const [hi, setHi] = useState(0)

  const h = c.history[hi]

  return (
    <div className="fade-in border-t border-line/60 bg-paper-2/40 px-3 py-4 sm:px-5">
      {/* Big flag plate */}
      <div className="grid place-items-center rounded-xl border border-line bg-paper px-4 py-6">
        <img
          src={c.flag}
          alt={`Flag of ${c.name}`}
          loading="lazy"
          decoding="async"
          className="h-28 max-w-full rounded-sm border border-line/50 object-contain shadow-sm sm:h-36"
          onError={hideOnError}
        />
      </div>

      {/* Overview */}
      {c.overview && (
        <div className="mt-4">
          <p className="annotation text-gold">Overview</p>
          <p className={`mt-1.5 text-sm leading-relaxed text-ink-2 ${more ? '' : 'line-clamp-4'}`}>
            {c.overview}
          </p>
          <button
            onClick={() => setMore((v) => !v)}
            className="mt-1 text-sm font-semibold text-gold transition-colors hover:text-accent"
          >
            {more ? 'read less' : 'read more'}
          </button>
        </div>
      )}

      {/* Subdivisions */}
      {c.subdivisions.length > 0 && (
        <>
          <PillRow
            label="Subdivisions"
            value={c.subTitle || `${c.subdivisions.length}`}
            open={subsOpen}
            onToggle={() => setSubsOpen((v) => !v)}
          />
          {subsOpen && (
            <div className="fade-in mt-3 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5">
              {c.subdivisions.map((s) => (
                <figure key={s.name} className="text-center">
                  <div className="grid h-12 place-items-center rounded-md border border-line/60 bg-paper px-1.5 py-1">
                    {s.img ? (
                      <img
                        src={s.img}
                        alt={`Flag of ${s.name}`}
                        loading="lazy"
                        decoding="async"
                        className="max-h-10 max-w-full object-contain"
                        onError={hideOnError}
                      />
                    ) : (
                      <span className="coord">no flag</span>
                    )}
                  </div>
                  <figcaption className="mt-1 truncate text-[0.7rem] text-ink-2">{s.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      {/* Flag history */}
      {c.history.length > 0 && (
        <>
          <PillRow
            label="Flag history"
            beta
            value={`${c.history.length} flag${c.history.length > 1 ? 's' : ''}`}
            open={histOpen}
            onToggle={() => setHistOpen((v) => !v)}
          />
          {histOpen && h && (
            <div className="fade-in mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-faint">
                  {hi + 1} / {c.history.length} · newest → oldest
                </span>
                <span className="flex gap-2">
                  <PagerButton label="Newer flag" disabled={hi === 0} onClick={() => setHi(hi - 1)}>‹</PagerButton>
                  <PagerButton label="Older flag" disabled={hi === c.history.length - 1} onClick={() => setHi(hi + 1)}>›</PagerButton>
                </span>
              </div>

              <div key={hi} className="seed-swap mt-3 overflow-hidden rounded-xl border border-line bg-paper">
                {hi === 0 && h.to === null && (
                  <p className="border-b border-line/60 bg-paper-2/60 py-2 text-center text-sm font-semibold text-gold">
                    ↑ Current flag
                  </p>
                )}
                <div className="grid place-items-center px-4 pb-2 pt-5">
                  <img
                    src={h.img}
                    alt={`${c.name} — ${h.label}`}
                    loading="lazy"
                    decoding="async"
                    className="h-24 max-w-full rounded-sm border border-line/50 object-contain shadow-sm sm:h-32"
                    onError={hideOnError}
                  />
                </div>
                <div className="px-4 pb-4 sm:px-5">
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-display text-lg font-semibold text-ink">{h.label}</h4>
                    <span className="rounded-full border border-gold/40 bg-paper-2/70 px-2.5 py-0.5 text-xs font-semibold text-gold">
                      {era(h)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{h.note}</p>
                </div>
              </div>

              {c.history.length > 1 && (
                <>
                  <p className="coord mt-3">Timeline — tap to jump</p>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {c.history.map((t, i) => (
                      <button
                        key={t.from + t.label}
                        onClick={() => setHi(i)}
                        aria-label={`${t.label}, ${era(t)}`}
                        className={`shrink-0 rounded-lg border p-1.5 pb-1 text-center transition-colors duration-150 ${
                          i === hi ? 'border-gold bg-paper' : 'border-line/60 bg-paper opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={t.img}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className={`h-9 w-14 rounded-[2px] object-cover ${i === hi ? '' : 'saturate-50'}`}
                          onError={hideOnError}
                        />
                        <span className="mt-0.5 block text-[0.65rem] text-faint">{t.from}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Predecessor & related states */}
      {c.predecessors.length > 0 && (
        <>
          <PillRow
            label="Predecessor & related states"
            value={`${c.predecessors.length}`}
            accent
            open={predsOpen}
            onToggle={() => setPredsOpen((v) => !v)}
          />
          {predsOpen && (
            <div className="fade-in mt-3 space-y-3">
              <p className="text-sm leading-snug text-accent/80">
                Vanished empires and states tied to this land’s history —
                featured in the Historical Flag game.
              </p>
              {c.predecessors.map((p) => (
                <div key={p.name} className="overflow-hidden rounded-xl border border-line bg-paper">
                  <div className="grid place-items-center px-4 pb-2 pt-4">
                    <img
                      src={p.img}
                      alt={`Flag of ${p.name}`}
                      loading="lazy"
                      decoding="async"
                      className="h-20 max-w-full rounded-sm border border-line/50 object-contain shadow-sm"
                      onError={hideOnError}
                    />
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-base font-semibold text-ink">{p.name}</h4>
                      <span className="rounded-full border border-accent/30 bg-paper-2/70 px-2.5 py-0.5 text-xs font-semibold text-accent/90">
                        {p.era}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PillRow({
  label,
  value,
  open,
  onToggle,
  beta,
  accent,
}: {
  label: string
  value: string
  open: boolean
  onToggle: () => void
  beta?: boolean
  accent?: boolean
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="mt-4 flex w-full items-center gap-2.5 rounded-xl border border-line bg-paper px-4 py-3 text-left transition-colors duration-150 hover:border-gold/60"
    >
      <span
        className={`text-xs font-bold uppercase tracking-[0.12em] ${accent ? 'text-accent/90' : 'text-gold'}`}
      >
        {label}
      </span>
      {beta && (
        <span className="rounded-full border border-gold/40 bg-paper-2 px-2 py-0.5 text-[0.65rem] font-semibold text-gold">
          Beta
        </span>
      )}
      <span className="flex-1 text-sm text-ink-2">{value}</span>
      <span
        aria-hidden
        className={`text-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      >
        ›
      </span>
    </button>
  )
}

function PagerButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="springy grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-lg text-ink transition-opacity hover:border-gold disabled:opacity-30"
    >
      {children}
    </button>
  )
}
