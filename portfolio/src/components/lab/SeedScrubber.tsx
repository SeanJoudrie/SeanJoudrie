import { useMemo, useRef, useState } from 'react'
import { FLAG_W, FLAG_H, dayNumberFor, roundForDay } from '../../lib/daily'

/**
 * Experiment 02 · SYSTEMS — scrub the date, watch the Daily Challenge
 * regenerate. Same date → same seed → same round, on every device on Earth,
 * with no server involved. Past days show their answer; today and the
 * future stay unspoiled. Hold the arrows to fast-scrub.
 */
export default function SeedScrubber() {
  const today = useMemo(() => dayNumberFor(new Date()), [])
  const [day, setDay] = useState(today)
  // Direction of travel — the new round slides in from the arrow's side.
  const [dir, setDir] = useState<1 | -1>(1)
  const round = useMemo(() => roundForDay(day), [day])
  const spoiler = day < today

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
          <ScrubButton label="Previous day (hold to fast-scrub)" onStep={() => step(-1)}>←</ScrubButton>
          <span className="min-w-44 rounded-lg border border-line bg-paper px-3 py-2 text-center text-sm font-medium text-ink">
            {date}
          </span>
          <ScrubButton label="Next day (hold to fast-scrub)" onStep={() => step(1)}>→</ScrubButton>
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
            aria-label={spoiler ? `Flag of ${round.answer.name}` : 'Mystery flag'}
          >
            {round.answer.draw()}
          </svg>
          <ul className="flex flex-wrap gap-2">
            {round.options.map((f) => {
              const highlight = spoiler && f.name === round.answer.name
              return (
                <li
                  key={f.name}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    highlight ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2'
                  }`}
                >
                  {f.name}
                </li>
              )
            })}
          </ul>
        </div>
        <p className="coord mt-3">
          {spoiler
            ? 'Past round — answer shown.'
            : 'Answer hidden for today & the future — no spoilers.'}
        </p>
      </div>

      <p className="mt-3 max-w-lg text-sm leading-relaxed text-faint">
        No lookup table, no API — the date alone decides the puzzle, and each
        cycle deals every flag exactly once, so the rotation stays fair with
        no back-to-back repeats. Globalio runs its Daily Challenge on exactly
        this trick.
      </p>
    </div>
  )
}

/** Arrow button with press spring + hold-to-repeat fast scrubbing. */
function ScrubButton({
  children,
  label,
  onStep,
}: {
  children: React.ReactNode
  label: string
  onStep: () => void
}) {
  const hold = useRef<{ t?: number; i?: number }>({})
  const stepRef = useRef(onStep)
  stepRef.current = onStep

  const stop = () => {
    window.clearTimeout(hold.current.t)
    window.clearInterval(hold.current.i)
    hold.current = {}
  }
  const start = () => {
    stepRef.current()
    hold.current.t = window.setTimeout(() => {
      hold.current.i = window.setInterval(() => stepRef.current(), 140)
    }, 420)
  }

  return (
    <button
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          stepRef.current()
        }
      }}
      className="springy grid h-10 w-10 touch-none select-none place-items-center rounded-lg border border-line text-lg text-ink hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  )
}
