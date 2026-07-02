import { site } from '../data/site'
import { FlagGame } from './FlagGame'

export function Hero() {
  return (
    <section id="top" className="paper-wash border-b border-line">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-24 sm:px-8 sm:pb-24 sm:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <div
              className="hero-in flex items-center gap-4"
              style={{ '--d': '0ms' } as React.CSSProperties}
            >
              <span className="annotation whitespace-nowrap">{site.tagline}</span>
              <span className="dim-line hidden flex-1 sm:block" />
              <span className="annotation hidden whitespace-nowrap sm:block">{site.availability}</span>
            </div>

            <h1
              className="hero-in mt-8 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl"
              style={{ '--d': '60ms' } as React.CSSProperties}
            >
              I design interfaces
              <br />
              you can <em className="text-accent">play</em>.
            </h1>

            <p
              className="hero-in mt-6 max-w-xl text-lg leading-relaxed text-ink-2"
              style={{ '--d': '120ms' } as React.CSSProperties}
            >
              Self-taught, from first sketch to shipped code. Most recently: a
              geography game with 50+ ways to play and a 4,000-entry codex —
              designed, built, and live in a week. Warm up with today’s flag
              while you’re here.
            </p>

            <p
              className="hero-in mt-4 text-sm font-medium text-faint"
              style={{ '--d': '160ms' } as React.CSSProperties}
            >
              Looking for: product / UI design &amp; design-engineer roles —
              full-time or contract.
            </p>

            <div
              className="hero-in mt-9 flex flex-wrap items-center gap-4"
              style={{ '--d': '200ms' } as React.CSSProperties}
            >
              <a
                href="#work"
                className="springy rounded-lg bg-ink px-6 py-3 font-semibold text-paper hover:bg-accent"
              >
                See the work
              </a>
              <a
                href="#contact"
                className="group px-1 py-3 font-semibold text-ink-2 transition-colors hover:text-ink"
              >
                Get in touch{' '}
                <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          </div>

          <div className="hero-in" style={{ '--d': '260ms' } as React.CSSProperties}>
            <FlagGame />
          </div>
        </div>
      </div>
    </section>
  )
}
