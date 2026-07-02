import { useMemo, useState } from 'react'
import { FLAG_W, FLAG_H, dayNumberFor, roundForDay } from '../../lib/daily'

/**
 * Experiment 02 · SYSTEMS — scrub the date, watch the Daily Challenge
 * regenerate. Same date → same seed → same round, on every device on Earth,
 * with no server involved. This is the exact engine behind the hero warm-up
 * and Globalio's daily.
 */
export default function SeedScrubber() {
  const today = useMemo(() => dayNumberFor(new Date()), [])
  const [day, setDay] = useState(today)
  // Direction of travel — the new round slides in from the arrow's side.
  const [dir, setDir] = useState<1 | -1>(1)
  const round = useMemo(() => roundForDay(day), [day])

  const step = (d: 1 | -1) => {
    setDir(d)
    setDay((v) => v + d)
  }
  const backToToday = () => {
    setDir(today > day ? 1 : -1)
    setDay(today)
  }

  const date = useMemo(() => {
    const d = new Date(Date.UTC(2026, 0, 1) + day * 86400000)
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
  }, [day])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <ScrubButton label="Previous day" onClick={() => step(-1)}>←</ScrubButton>
          <span className="min-w-44 rounded-lg border border-line bg-paper px-3 py-2 text-center text-sm font-medium text-ink">
            {date}
          </span>
          <ScrubButton label="Next day" onClick={() => step(1)}>→</ScrubButton>
        </div>
        {day !== today && (
          <button
            onClick={backToToday}
            className="fade-in text-sm font-semibold text-accent hover:text-accent-deep"
          >
            Back to today
          </button>
        )}
      </div>

      <p className="coord mt-3">
        day {round.dayNumber >= 0 ? '+' : ''}{round.dayNumber} → seed {round.seed} → mulberry32 → the round below
      </p>

      <div className="mt-4 rounded-lg border border-line bg-paper p-4">
        <div
          key={day}
          className="seed-swap flex flex-wrap items-center gap-5"
          style={{ '--dx': `${dir * 10}px` } as React.CSSProperties}
        >
          <svg
            viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}
            className="h-16 w-24 shrink-0 rounded-sm border border-line shadow-sm"
            role="img"
            aria-label={`Flag of ${round.answer.name}`}
          >
            {round.answer.draw()}
          </svg>
          <ul className="flex flex-wrap gap-2">
            {round.options.map((f) => (
              <li
                key={f.name}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  f.name === round.answer.name
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-ink-2'
                }`}
              >
                {f.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 max-w-lg text-sm leading-relaxed text-faint">
        No lookup table, no API — the date alone decides the puzzle, so every
        player’s round matches and the game works offline. Globalio runs its
        Daily Challenge on exactly this trick.
      </p>
    </div>
  )
}

function ScrubButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="springy grid h-9 w-9 place-items-center rounded-lg border border-line text-ink hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  )
}
