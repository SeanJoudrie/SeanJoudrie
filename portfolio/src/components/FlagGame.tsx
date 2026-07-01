import { useMemo, useState } from 'react'
import { FLAG_W, FLAG_H, todaysRound } from '../lib/daily'

/**
 * "Today's flag" — a one-guess warm-up powered by the same date-seeded
 * engine as Globalio's Daily Challenge (see src/lib/daily.ts). Every visitor
 * on Earth gets the same flag today, with no backend.
 */
export function FlagGame() {
  const { answer, options, dayNumber } = useMemo(todaysRound, [])
  const [picked, setPicked] = useState<string | null>(null)
  const done = picked !== null
  const correct = picked === answer.name

  return (
    <div className="rounded-xl border border-line bg-paper-2/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="annotation">Warm-up · today’s flag</span>
        <span className="coord">№ {String(dayNumber + 1).padStart(3, '0')}</span>
      </div>

      <div
        className={`mx-auto mt-5 w-fit ${done ? (correct ? 'flag-pop' : 'flag-shake') : ''}`}
        aria-hidden
      >
        <svg
          viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}
          className="h-28 w-42 rounded-sm border border-line shadow-sm sm:h-32 sm:w-48"
          role="img"
          aria-label="Mystery flag"
        >
          {answer.draw()}
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {options.map((f) => {
          const isAnswer = f.name === answer.name
          const isPicked = picked === f.name
          return (
            <button
              key={f.name}
              disabled={done}
              onClick={() => setPicked(f.name)}
              className={`springy rounded-lg border px-3 py-2.5 text-sm font-medium ${
                done
                  ? isAnswer
                    ? 'border-accent bg-accent text-paper'
                    : isPicked
                      ? 'border-line bg-paper-3 text-faint line-through'
                      : 'border-line text-faint'
                  : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
              }`}
            >
              {f.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex min-h-9 items-center justify-between gap-3" aria-live="polite">
        {done ? (
          <>
            <span className="stamp">
              {correct ? '✓ Correct' : `✗ ${answer.name}`}
            </span>
            <a
              href="https://globalio.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-accent hover:text-accent-deep"
            >
              Keep going — play Globalio ↗
            </a>
          </>
        ) : (
          <span className="text-sm text-faint">
            Same seed for everyone today — that’s how Globalio’s daily works.
          </span>
        )}
      </div>
    </div>
  )
}
