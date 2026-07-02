import { useRef, useState } from 'react'

/**
 * Experiment 03 · INTERACTION — REX's core gesture, miniaturized. Drag the
 * top card: rotation follows the hand, release past the threshold commits
 * (right = save, left = pass), otherwise it springs back. Buttons and arrow
 * keys do the same, so the demo is keyboard- and reduced-motion-friendly.
 */

type DemoCard = { id: number; title: string; meta: string; hue: number }

const CARDS: DemoCard[] = [
  { id: 1, title: 'Space Opera', meta: 'Film · Sci-Fi', hue: 215 },
  { id: 2, title: 'Cozy Mystery', meta: 'TV · Crime', hue: 28 },
  { id: 3, title: 'Neon Thriller', meta: 'Film · Thriller', hue: 320 },
  { id: 4, title: 'Quiet Drama', meta: 'Film · Drama', hue: 150 },
]

const THRESHOLD = 90

export default function SwipeDeck() {
  const [top, setTop] = useState(0)
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const [leaving, setLeaving] = useState<{ dir: 1 | -1 } | null>(null)
  const [verdict, setVerdict] = useState<string>('Drag the top card — or use ← → keys.')
  const [saved, setSaved] = useState(0)
  const start = useRef<{ x: number; y: number } | null>(null)

  const card = CARDS[top % CARDS.length]
  const next = CARDS[(top + 1) % CARDS.length]
  const third = CARDS[(top + 2) % CARDS.length]

  const commit = (dir: 1 | -1) => {
    if (leaving) return
    setLeaving({ dir })
    setDrag(null)
    setVerdict(dir === 1 ? `Saved “${card.title}” to the watchlist ✓` : `Passed on “${card.title}” ✕`)
    if (dir === 1) setSaved((s) => s + 1)
    window.setTimeout(() => {
      setLeaving(null)
      setTop((t) => t + 1)
    }, 280)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving) return
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

  return (
    <div>
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
        {/* stack behind */}
        <Poster card={third} className="absolute inset-0 -rotate-3 scale-[0.94] opacity-60" />
        <Poster card={next} className="absolute inset-0 rotate-2 scale-[0.97] opacity-85" />

        {/* top card */}
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
                ? 'transform 280ms var(--ease-out), opacity 280ms ease'
                : 'transform 450ms var(--spring)',
          }}
        >
          <Poster card={card} className="h-full w-full shadow-xl">
            {/* verdict glyphs fade in with drag distance */}
            <span
              aria-hidden
              className="absolute left-3 top-3 rounded border-2 border-paper px-1.5 font-mono text-sm font-bold text-paper"
              style={{ opacity: Math.max(0, Math.min(1, dx / THRESHOLD)) }}
            >
              SAVE
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
          {verdict}
        </p>
        <button
          onClick={() => commit(1)}
          aria-label="Save to watchlist"
          className="springy grid h-10 w-10 place-items-center rounded-full border border-accent/50 text-accent hover:bg-accent hover:text-paper"
        >
          ♥
        </button>
      </div>
      <p className="coord mt-2 text-center">watchlist: {saved}</p>
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
