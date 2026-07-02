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

/** The partner already swiped — these are their likes. Deterministic. */
const PARTNER_LIKES = new Set([1, 2, 4, 6, 8, 9])
const THRESHOLD = 90

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
        className="absolute inset-x-4 top-4 h-32 rounded-lg opacity-40"
        style={{ background: `radial-gradient(circle at 30% 20%, hsl(${card.hue} 60% 55%), transparent 70%)` }}
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-lg font-semibold leading-tight text-paper">{card.title}</p>
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-paper/70">{card.meta}</p>
      </div>
      {children}
    </div>
  )
}
