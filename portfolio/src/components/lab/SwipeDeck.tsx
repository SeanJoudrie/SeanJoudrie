import { useRef, useState } from 'react'

/**
 * Experiment 03 · INTERACTION — REX's real loop, miniaturized: you and a
 * partner deciding together. The partner has already swiped; every time you
 * both like the same title, IT'S A MATCH. After ten decisions you get the
 * night's match list — that's the product.
 */

type DemoCard = { id: number; title: string; meta: string; hue: number }

const CARDS: DemoCard[] = [
  { id: 1, title: 'Space Opera', meta: 'Film · Sci-Fi', hue: 215 },
  { id: 2, title: 'Cozy Mystery', meta: 'TV · Crime', hue: 28 },
  { id: 3, title: 'Neon Thriller', meta: 'Film · Thriller', hue: 320 },
  { id: 4, title: 'Quiet Drama', meta: 'Film · Drama', hue: 150 },
  { id: 5, title: 'Heist Comedy', meta: 'Film · Comedy', hue: 45 },
  { id: 6, title: 'Deep-Sea Doc', meta: 'Doc · Nature', hue: 190 },
  { id: 7, title: 'Haunted Manor', meta: 'Film · Horror', hue: 265 },
  { id: 8, title: 'Slow-Burn Romance', meta: 'TV · Romance', hue: 350 },
  { id: 9, title: 'Desert Western', meta: 'Film · Western', hue: 20 },
  { id: 10, title: 'Time-Loop Indie', meta: 'Film · Sci-Fi', hue: 170 },
]

/** The partner already swiped — exactly three shared likes are possible. */
const PARTNER_LIKES = new Set([2, 4, 9])
const THRESHOLD = 90

/** Illustrated poster art, one mini-scene per title. */
function PosterArt({ id, hue }: { id: number; hue: number }) {
  const lite = `hsl(${hue} 70% 72%)`
  const mid = `hsl(${hue} 55% 52%)`
  const glow = `hsl(${hue} 65% 62%)`
  const ink = 'rgba(6,8,14,0.55)'
  const scenes: Record<number, React.ReactNode> = {
    1: ( // Space Opera — ringed planet + rocket
      <>
        <circle cx="30" cy="34" r="15" fill={mid} />
        <ellipse cx="30" cy="36" rx="26" ry="6" fill="none" stroke={lite} strokeWidth="2.5" />
        <path d="M70 52 L78 30 L86 52 L78 47 Z" fill={lite} />
        <circle cx="62" cy="16" r="1.6" fill={lite} /><circle cx="82" cy="12" r="1.2" fill={lite} /><circle cx="14" cy="12" r="1.4" fill={lite} />
      </>
    ),
    2: ( // Cozy Mystery — teacup + magnifier
      <>
        <path d="M18 42 h30 v10 a15 8 0 0 1 -30 0 Z" fill={lite} />
        <path d="M48 44 q10 2 0 9" fill="none" stroke={lite} strokeWidth="2.5" />
        <path d="M27 36 q3 -6 0 -10 M37 36 q3 -6 0 -10" stroke={mid} strokeWidth="2" fill="none" />
        <circle cx="72" cy="30" r="11" fill="none" stroke={mid} strokeWidth="3.5" />
        <line x1="80" y1="39" x2="88" y2="49" stroke={mid} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    3: ( // Neon Thriller — skyline + neon sun
      <>
        <circle cx="50" cy="30" r="16" fill={glow} />
        <rect x="34" y="29" width="32" height="2.5" fill={ink} /><rect x="30" y="35" width="40" height="2.5" fill={ink} />
        <rect x="12" y="44" width="10" height="26" fill={mid} /><rect x="28" y="52" width="9" height="18" fill={lite} />
        <rect x="43" y="46" width="11" height="24" fill={mid} /><rect x="60" y="54" width="9" height="16" fill={lite} />
        <rect x="75" y="48" width="11" height="22" fill={mid} />
      </>
    ),
    4: ( // Quiet Drama — rainy window
      <>
        <rect x="26" y="14" width="48" height="52" rx="4" fill="none" stroke={lite} strokeWidth="3" />
        <line x1="50" y1="14" x2="50" y2="66" stroke={lite} strokeWidth="2.5" />
        <line x1="26" y1="40" x2="74" y2="40" stroke={lite} strokeWidth="2.5" />
        <g stroke={mid} strokeWidth="2" strokeLinecap="round">
          <line x1="34" y1="22" x2="31" y2="32" /><line x1="60" y1="20" x2="57" y2="30" />
          <line x1="42" y1="48" x2="39" y2="58" /><line x1="66" y1="50" x2="63" y2="60" />
        </g>
      </>
    ),
    5: ( // Heist Comedy — getaway car + flying bills
      <>
        <rect x="18" y="42" width="52" height="14" rx="6" fill={mid} />
        <path d="M28 42 l7 -9 h20 l7 9 Z" fill={mid} />
        <circle cx="32" cy="58" r="6" fill={ink} stroke={lite} strokeWidth="2" />
        <circle cx="58" cy="58" r="6" fill={ink} stroke={lite} strokeWidth="2" />
        <rect x="72" y="22" width="12" height="7" rx="1.5" fill={lite} transform="rotate(14 78 25)" />
        <rect x="60" y="12" width="12" height="7" rx="1.5" fill={lite} transform="rotate(-10 66 15)" />
      </>
    ),
    6: ( // Deep-Sea Doc — whale + bubbles
      <>
        <path d="M14 46 q22 -18 46 0 q8 6 -2 8 q-24 6 -44 -2 q-4 -2 0 -6 Z" fill={mid} />
        <path d="M60 44 l12 -8 l-2 12 Z" fill={mid} />
        <circle cx="30" cy="47" r="1.8" fill={ink} />
        <circle cx="70" cy="24" r="3" fill="none" stroke={lite} strokeWidth="2" />
        <circle cx="80" cy="16" r="2" fill="none" stroke={lite} strokeWidth="1.8" />
      </>
    ),
    7: ( // Haunted Manor — gabled house + moon
      <>
        <circle cx="76" cy="16" r="8" fill={lite} />
        <rect x="24" y="38" width="36" height="30" fill={mid} />
        <path d="M20 40 L42 20 L64 40 Z" fill={mid} />
        <rect x="52" y="26" width="10" height="42" fill={mid} />
        <rect x="34" y="48" width="7" height="9" fill={ink} /><rect x="46" y="48" width="7" height="9" fill={ink} />
        <path d="M14 22 l4 3 l4 -3 M70 34 l3.5 2.5 l3.5 -2.5" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    8: ( // Slow-Burn Romance — two hearts
      <>
        <path d="M38 30 c-7 -10 -22 -4 -22 6 c0 9 12 15 22 22 c10 -7 22 -13 22 -22 c0 -10 -15 -16 -22 -6z" fill={mid} />
        <path d="M64 24 c-4 -6 -13 -2 -13 4 c0 5 7 9 13 13 c6 -4 13 -8 13 -13 c0 -6 -9 -10 -13 -4z" fill={lite} />
        <circle cx="24" cy="16" r="1.5" fill={lite} /><circle cx="84" cy="48" r="1.5" fill={lite} />
      </>
    ),
    9: ( // Desert Western — sun + cacti
      <>
        <circle cx="70" cy="22" r="11" fill={glow} />
        <line x1="10" y1="62" x2="90" y2="62" stroke={lite} strokeWidth="2.5" />
        <path d="M28 62 v-26 M28 44 h-8 v-8 M28 40 h8 v-10" stroke={mid} strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M56 62 v-16 M56 52 h6 v-6" stroke={mid} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </>
    ),
    10: ( // Time-Loop Indie — clock caught in a loop
      <>
        <circle cx="50" cy="38" r="18" fill="none" stroke={lite} strokeWidth="3" />
        <line x1="50" y1="38" x2="50" y2="26" stroke={lite} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="38" x2="59" y2="42" stroke={lite} strokeWidth="3" strokeLinecap="round" />
        <path d="M76 38 a26 26 0 1 1 -8 -19" fill="none" stroke={mid} strokeWidth="2.5" strokeDasharray="4 4" />
        <path d="M76 30 l2 9 l-9 -2 Z" fill={mid} />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 100 80" className="absolute inset-x-3 top-3 h-36 w-auto" aria-hidden>
      {scenes[id]}
    </svg>
  )
}

export default function SwipeDeck() {
  const [top, setTop] = useState(0)
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const [leaving, setLeaving] = useState<{ dir: 1 | -1 } | null>(null)
  const [matchFlash, setMatchFlash] = useState<DemoCard | null>(null)
  const [matches, setMatches] = useState<DemoCard[]>([])
  const start = useRef<{ x: number; y: number } | null>(null)

  const done = top >= CARDS.length
  const card = CARDS[Math.min(top, CARDS.length - 1)]
  const next = CARDS[top + 1]
  const third = CARDS[top + 2]

  const commit = (dir: 1 | -1) => {
    if (leaving || done) return
    setMatchFlash(null) // speed-swipers don't wait out the celebration
    setLeaving({ dir })
    setDrag(null)
    const isMatch = dir === 1 && PARTNER_LIKES.has(card.id)
    window.setTimeout(() => {
      setLeaving(null)
      setTop((t) => t + 1)
      if (isMatch) {
        setMatches((m) => [...m, card])
        setMatchFlash(card)
        window.setTimeout(() => setMatchFlash(null), 1100)
      }
    }, 260)
  }

  const restart = () => {
    setTop(0)
    setMatches([])
    setMatchFlash(null)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving) return
    setMatchFlash(null)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current || leaving) return
    setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  }
  const onPointerUp = () => {
    if (!start.current) return
    start.current = null
    if (drag && Math.abs(drag.dx) > THRESHOLD) commit(drag.dx > 0 ? 1 : -1)
    else setDrag(null)
  }

  const dx = leaving ? leaving.dir * 420 : (drag?.dx ?? 0)
  const dy = leaving ? -30 : (drag?.dy ?? 0) * 0.35
  const rot = leaving ? leaving.dir * 22 : dx / 14
  const dragging = !!drag && !leaving

  // ---- Night's summary ----
  if (done && !matchFlash) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="fade-in rounded-xl border border-line bg-paper p-5">
          <p className="annotation text-gold">Tonight’s matches</p>
          {matches.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {matches.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-7 shrink-0 place-items-center rounded border border-line text-xs"
                    style={{ background: `linear-gradient(160deg, hsl(${m.hue} 35% 30%), hsl(${m.hue} 45% 16%))` }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-semibold text-ink">{m.title}</span>
                  <span className="text-accent" aria-hidden>♥</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-2">
              No overlap tonight — a rerun of ten more cards usually fixes that.
            </p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-faint">
            You both swiped; these are the overlaps. Two phones, one pick —
            that&apos;s REX.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={restart}
              className="springy rounded-lg border border-ink/25 px-4 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
            >
              Run it back
            </button>
            <a
              href="https://seanjoudrie.github.io/REX/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-accent hover:text-accent-deep"
            >
              Open the beta ↗
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-center text-sm text-faint">
        Your partner already swiped. Like something they liked —{' '}
        <span className="font-semibold text-ink-2">it’s a match.</span>
      </p>

      <div
        className="relative mx-auto h-72 w-52 select-none"
        role="group"
        aria-label="Swipe deck demo"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') commit(1)
          if (e.key === 'ArrowLeft') commit(-1)
        }}
      >
        {third && <Poster card={third} className="absolute inset-0 -rotate-3 scale-[0.94] opacity-60" />}
        {next && <Poster card={next} className="absolute inset-0 rotate-2 scale-[0.97] opacity-85" />}

        {!done && (
          <div
            className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
              opacity: leaving ? 0 : 1,
              transition: dragging
                ? 'none'
                : leaving
                  ? 'transform 260ms var(--ease-out), opacity 260ms ease'
                  : 'transform 450ms var(--spring)',
            }}
          >
            <Poster card={card} className="h-full w-full shadow-xl">
              <span
                aria-hidden
                className="absolute left-3 top-3 rounded border-2 border-paper px-1.5 font-mono text-sm font-bold text-paper"
                style={{ opacity: Math.max(0, Math.min(1, dx / THRESHOLD)) }}
              >
                LIKE
              </span>
              <span
                aria-hidden
                className="absolute right-3 top-3 rounded border-2 border-paper px-1.5 font-mono text-sm font-bold text-paper"
                style={{ opacity: Math.max(0, Math.min(1, -dx / THRESHOLD)) }}
              >
                PASS
              </span>
            </Poster>
          </div>
        )}

        {/* IT'S A MATCH — the whole point of the product. */}
        {matchFlash && (
          <div className="match-flash pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl border-2 border-accent bg-paper/95 p-4 text-center">
            <div>
              <p className="font-display text-3xl font-semibold italic text-accent">
                It’s a match!
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">{matchFlash.title}</p>
              <p className="mt-1 text-xs text-faint">You both liked it</p>
              <p aria-hidden className="mt-2 text-xl text-accent">♥</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={() => commit(-1)}
          aria-label="Pass"
          className="springy grid h-10 w-10 place-items-center rounded-full border border-line text-ink-2 hover:border-accent hover:text-accent"
        >
          ✕
        </button>
        <p className="min-w-56 text-center text-sm text-faint" aria-live="polite">
          {matchFlash
            ? `It’s a match — ${matchFlash.title}!`
            : `${top} of ${CARDS.length} decided · ${matches.length} match${matches.length === 1 ? '' : 'es'}`}
        </p>
        <button
          onClick={() => commit(1)}
          aria-label="Like"
          className="springy grid h-10 w-10 place-items-center rounded-full border border-accent/50 text-accent hover:bg-accent hover:text-paper"
        >
          ♥
        </button>
      </div>
    </div>
  )
}

function Poster({
  card,
  className = '',
  children,
}: {
  card: DemoCard
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-line ${className}`}
      style={{
        background: `linear-gradient(160deg, hsl(${card.hue} 35% 26%), hsl(${card.hue} 45% 14%))`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-4 top-4 h-32 rounded-lg opacity-30"
        style={{ background: `radial-gradient(circle at 30% 20%, hsl(${card.hue} 60% 55%), transparent 70%)` }}
      />
      <PosterArt id={card.id} hue={card.hue} />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-lg font-semibold leading-tight text-paper">{card.title}</p>
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-paper/70">{card.meta}</p>
      </div>
      {children}
    </div>
  )
}
