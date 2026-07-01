import { useEffect, useRef, useState } from 'react'
import { site } from '../data/site'
import { CountUp } from './CountUp'

const metrics = [
  { value: 4.5, decimals: 1, suffix: '×', label: 'YoY revenue growth' },
  { value: 50, suffix: '%+', label: 'MoM store traffic' },
  { value: 3.7, decimals: 1, label: 'GPA · B.A. Psychology' },
  { value: 4, label: 'products shipped' },
]

export function Hero() {
  // subtle parallax on the drafting grid
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [y, setY] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      setY(window.scrollY * 0.15)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="top" className="relative overflow-hidden border-b border-navy-800/70">
      <div
        ref={gridRef}
        aria-hidden
        className="blueprint-grid pointer-events-none absolute inset-x-0 -top-20 bottom-0"
        style={{ transform: `translateY(${y}px)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
        <div className="flex items-center gap-4">
          <span className="annotation whitespace-nowrap">Fig. 01 — {site.location}</span>
          <span className="intro-line h-px flex-1 bg-accent/50" />
          <span className="annotation whitespace-nowrap">Open to Boston · Remote</span>
        </div>

        <h1 className="mt-10 max-w-4xl font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-6xl">
          Operations that hold up under pressure —{' '}
          <span className="text-accent">and the systems I build to run them.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mute">
          Program and operations leadership with a psychology degree, real B2B
          results, and a builder’s hands. U.S. Army National Guard officer
          candidate. I understand people, design the system, and lead the
          execution.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#work"
            className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
          >
            View the work
          </a>
          {site.hasResume && (
            <a
              href={site.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-navy-600 px-6 py-3.5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Download résumé
            </a>
          )}
          <a
            href="#contact"
            className="group rounded-xl px-2 py-3.5 font-semibold text-mute transition-colors hover:text-ink"
          >
            Get in touch{' '}
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        {/* credential + count-up metrics band */}
        <div className="mt-16 border-t border-navy-800/70 pt-8">
          <p className="annotation">
            <span className="text-accent">●</span> U.S. Army National Guard · Officer Candidate
          </p>
          <dl className="mt-6 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <dd className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                  <CountUp value={m.value} decimals={m.decimals ?? 0} suffix={m.suffix ?? ''} />
                </dd>
                <dt className="annotation mt-2">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
