import { useScrollProgress } from '../hooks/useScrollProgress'
import type { CSSProperties } from 'react'

const STAGES = [
  {
    n: '01',
    title: 'Understand people',
    body: 'Start from how humans actually behave — a psychology degree, not a process diagram that wishes they would.',
    at: 0.2,
  },
  {
    n: '02',
    title: 'Design the system',
    body: 'Build the thing around them — operations, product, and code that hold together under real load.',
    at: 0.55,
  },
  {
    n: '03',
    title: 'Lead the execution',
    body: 'Run it under pressure until it delivers — teams held to a standard, and measurable results.',
    at: 0.9,
  },
]

export function System() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>(0.6)
  const drawVar = { '--draw': progress } as CSSProperties

  return (
    <section id="system" className="border-b border-navy-800/70 bg-navy-950/40">
      <div ref={ref} className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <span className="annotation">Fig. 02 — Operating model</span>
        <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          Understand people, design the system, lead the execution.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-mute">
          The same spine runs through everything I do — in an operations role or
          building a product from scratch.
        </p>

        {/* desktop: horizontal drawn line behind three nodes */}
        <div className="relative mt-20 hidden md:block">
          <svg
            aria-hidden
            viewBox="0 0 1000 60"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-[6px] h-16 w-full"
            style={drawVar}
          >
            <path
              className="draw-path"
              pathLength={1}
              d="M 166 12 L 833 12"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
            />
          </svg>

          <div className="relative grid grid-cols-3 gap-8">
            {STAGES.map((s) => {
              const lit = progress >= s.at - 0.15
              return (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <span
                    className="node-dot grid h-7 w-7 place-items-center rounded-full border-2 transition-colors duration-300"
                    style={{
                      borderColor: lit ? 'var(--color-accent)' : 'var(--color-navy-600)',
                      background: lit ? 'var(--color-accent)' : 'transparent',
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: lit ? 'var(--color-navy-950)' : 'var(--color-navy-600)' }}
                    />
                  </span>
                  <StageCard s={s} lit={lit} className="mt-6" />
                </div>
              )
            })}
          </div>
        </div>

        {/* mobile: vertical rail */}
        <div className="mt-14 md:hidden">
          <div className="relative pl-8">
            <span
              aria-hidden
              className="absolute left-[11px] top-2 w-0.5 rounded bg-accent/50"
              style={{ height: `calc(${Math.round(progress * 100)}% - 8px)` }}
            />
            <span aria-hidden className="absolute left-[11px] top-2 h-full w-0.5 rounded bg-navy-700 -z-10" />
            <div className="space-y-10">
              {STAGES.map((s) => {
                const lit = progress >= s.at - 0.2
                return (
                  <div key={s.n} className="relative">
                    <span
                      className="absolute -left-8 top-1 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors"
                      style={{
                        borderColor: lit ? 'var(--color-accent)' : 'var(--color-navy-600)',
                        background: lit ? 'var(--color-accent)' : 'var(--color-navy-950)',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: lit ? 'var(--color-navy-950)' : 'var(--color-navy-600)' }}
                      />
                    </span>
                    <StageCard s={s} lit={lit} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StageCard({
  s,
  lit,
  className = '',
}: {
  s: (typeof STAGES)[number]
  lit: boolean
  className?: string
}) {
  return (
    <div
      className={`transition-opacity duration-500 ${lit ? 'opacity-100' : 'opacity-45'} ${className}`}
    >
      <span className="annotation">{s.n}</span>
      <h3 className="mt-1 font-display text-xl font-semibold text-ink">{s.title}</h3>
      <p className="mt-2 text-mute">{s.body}</p>
    </div>
  )
}
