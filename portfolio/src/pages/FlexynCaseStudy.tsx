import { Suspense, lazy } from 'react'
import { Reveal } from '../components/Reveal'
import { navigate } from '../lib/router'

const FlexynShowcase = lazy(() => import('../components/flexyn/FlexynShowcase.jsx'))

export function FlexynCaseStudy() {
  return (
    <article className="pt-20 sm:pt-28">
      <header className="paper-wash border-b border-line">
        <div className="mx-auto max-w-4xl px-5 pb-12 sm:px-8 sm:pb-16">
          <button
            onClick={() => navigate('#work')}
            className="hero-in coord transition-colors hover:text-accent"
            style={{ '--d': '0ms' } as React.CSSProperties}
          >
            ← Index of works
          </button>

          <div
            className="hero-in mt-6 flex items-center gap-3"
            style={{ '--d': '40ms' } as React.CSSProperties}
          >
            <span className="coord">Plate 02 · Case study</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-faint">
              In build · private beta
            </span>
          </div>

          <h1
            className="hero-in mt-4 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl"
            style={{ '--d': '80ms' } as React.CSSProperties}
          >
            Flexyn
          </h1>
          <p
            className="hero-in mt-3 font-display text-xl italic text-ink-2 sm:text-2xl"
            style={{ '--d': '120ms' } as React.CSSProperties}
          >
            One app, eight systems.
          </p>

          <ul
            className="hero-in mt-6 flex flex-wrap gap-2"
            style={{ '--d': '160ms' } as React.CSSProperties}
          >
            {['8 interlocking systems', '110+ SQL migrations', '430+ unit tests', 'Ships in 15 languages'].map(
              (f) => (
                <li
                  key={f}
                  className="rounded-md border border-line bg-paper px-2.5 py-1 text-sm font-medium text-ink-2"
                >
                  {f}
                </li>
              ),
            )}
          </ul>

          <p
            className="hero-in mt-6 max-w-2xl leading-relaxed text-ink-2"
            style={{ '--d': '200ms' } as React.CSSProperties}
          >
            Flexyn is a fitness companion PWA I&apos;m building as co-founder —
            React, Supabase, and a lot of opinions about what makes a habit
            stick. It&apos;s the next flagship of this index, in private beta
            now. Swipe through the systems that make it work.
          </p>
        </div>
      </header>

      {/* The showcase — full-width stage, its own scoped styles */}
      <Reveal>
        <Suspense
          fallback={
            <div className="grid h-96 place-items-center">
              <span className="coord">loading showcase…</span>
            </div>
          }
        >
          <FlexynShowcase />
        </Suspense>
        <p className="coord mt-2 pb-4 text-center">
          screens re-created faithfully for this showcase — the app is in private beta
        </p>
      </Reveal>

      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <section className="border-t border-line py-12 sm:py-16">
            <div className="flex items-center gap-4">
              <span className="annotation whitespace-nowrap">Where it stands</span>
              <span className="dim-line dim-draw flex-1" />
            </div>
            <div className="mt-6 grid gap-10 md:grid-cols-2">
              <p className="leading-relaxed text-ink-2">
                Every system above is built and working in the beta — the
                retention engine, voice logging with PR celebrations, the social
                Hub, six competition formats, nutrition, recovery, the AI coach,
                and a Web Push pipeline that fans out from Postgres triggers in
                fifteen languages. Row-Level Security guards every table.
              </p>
              <p className="leading-relaxed text-ink-2">
                It&apos;s deliberately not public yet: the current sprint is
                beta feedback, polish, and launch planning — the same
                ship-when-it&apos;s-right discipline as everything else on this
                index. When it opens, this page gets the live link first.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 py-10">
            <button
              onClick={() => navigate('#work')}
              className="springy rounded-lg border border-ink/25 px-5 py-2.5 font-semibold text-ink hover:border-accent hover:text-accent"
            >
              ← Back to the index
            </button>
            <button
              onClick={() => navigate('#/work/globalio')}
              className="text-sm font-semibold text-accent transition-colors hover:text-accent-deep"
            >
              Next expedition: Globalio →
            </button>
          </div>
        </Reveal>
      </div>
    </article>
  )
}

export default FlexynCaseStudy
