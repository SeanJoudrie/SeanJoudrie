import { useMemo, useState } from 'react'

/**
 * "Today's flag" — a one-guess warm-up powered by the same idea as Globalio's
 * Daily Challenge: a PRNG seeded from the date alone, so every visitor on
 * Earth gets the same flag today, with no backend. Flags are inline SVG.
 */

type Flag = { name: string; draw: (id: string) => React.ReactNode }

const W = 60
const H = 40

/** Vertical thirds */
const v3 = (a: string, b: string, c: string) => (
  <>
    <rect width={20} height={H} fill={a} />
    <rect x={20} width={20} height={H} fill={b} />
    <rect x={40} width={20} height={H} fill={c} />
  </>
)
/** Horizontal thirds */
const h3 = (a: string, b: string, c: string) => (
  <>
    <rect width={W} height={13.33} fill={a} />
    <rect y={13.33} width={W} height={13.34} fill={b} />
    <rect y={26.67} width={W} height={13.33} fill={c} />
  </>
)
/** Horizontal halves */
const h2 = (a: string, b: string) => (
  <>
    <rect width={W} height={H / 2} fill={a} />
    <rect y={H / 2} width={W} height={H / 2} fill={b} />
  </>
)
/** Nordic cross */
const nordic = (bg: string, cross: string, inner?: string) => (
  <>
    <rect width={W} height={H} fill={bg} />
    <rect x={16} width={inner ? 10 : 8} height={H} fill={cross} />
    <rect y={16} width={W} height={inner ? 10 : 8} fill={cross} />
    {inner && (
      <>
        <rect x={19} width={4} height={H} fill={inner} />
        <rect y={19} width={W} height={4} fill={inner} />
      </>
    )}
  </>
)

const FLAGS: Flag[] = [
  { name: 'France', draw: () => v3('#0055A4', '#fff', '#EF4135') },
  { name: 'Italy', draw: () => v3('#009246', '#fff', '#CE2B37') },
  { name: 'Ireland', draw: () => v3('#169B62', '#fff', '#FF883E') },
  { name: 'Nigeria', draw: () => v3('#008751', '#fff', '#008751') },
  { name: 'Germany', draw: () => h3('#000', '#DD0000', '#FFCE00') },
  { name: 'Netherlands', draw: () => h3('#AE1C28', '#fff', '#21468B') },
  { name: 'Austria', draw: () => h3('#ED2939', '#fff', '#ED2939') },
  { name: 'Poland', draw: () => h2('#fff', '#DC143C') },
  { name: 'Ukraine', draw: () => h2('#0057B7', '#FFD700') },
  {
    name: 'Japan',
    draw: () => (
      <>
        <rect width={W} height={H} fill="#fff" />
        <circle cx={30} cy={20} r={11} fill="#BC002D" />
      </>
    ),
  },
  { name: 'Sweden', draw: () => nordic('#006AA7', '#FECC02') },
  { name: 'Denmark', draw: () => nordic('#C8102E', '#fff') },
  { name: 'Finland', draw: () => nordic('#fff', '#002F6C') },
  { name: 'Norway', draw: () => nordic('#BA0C2F', '#fff', '#00205B') },
  { name: 'Iceland', draw: () => nordic('#02529C', '#fff', '#DC1E35') },
]

/** mulberry32 — the same class of tiny seeded PRNG Globalio's daily uses. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function todaysRound() {
  const now = new Date()
  const dayNumber = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2026, 0, 1)) / 86400000,
  )
  const rand = mulberry32(dayNumber + 20260101)
  const order = FLAGS.map((f, i) => ({ f, i, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.f)
  const answer = order[0]
  const options = [answer, order[1], order[2], order[3]]
    .map((f) => ({ f, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.f)
  return { answer, options, dayNumber }
}

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
          viewBox={`0 0 ${W} ${H}`}
          className="h-28 w-42 rounded-sm border border-line shadow-sm sm:h-32 sm:w-48"
          role="img"
          aria-label="Mystery flag"
        >
          {answer.draw('today')}
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
