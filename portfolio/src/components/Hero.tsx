import { site } from '../data/site'

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
              designed, built, and live in a week.
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

          {/* Lead straight into the story — a compact card that opens About. */}
          <a
            href="#about"
            className="hero-in group block"
            style={{ '--d': '260ms' } as React.CSSProperties}
            aria-label="About Sean Joudrie"
          >
            <div className="parallax-1 mx-auto max-w-[320px] rounded-xl border border-line bg-paper-2/60 p-6 transition-colors group-hover:border-accent/50">
              <span className="annotation">About</span>
              <p className="mt-4 font-display text-2xl font-semibold leading-snug tracking-tight text-ink">
                Taste, systems, and the discipline to ship.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Self-taught designer-builder with a psychology degree and an Army standard —
                I design for how people behave, then ship it solo.
              </p>
              <span className="coord mt-5 inline-flex items-center gap-2 text-accent">
                Read about me
                <span className="transition-transform group-hover:translate-y-0.5">↓</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
