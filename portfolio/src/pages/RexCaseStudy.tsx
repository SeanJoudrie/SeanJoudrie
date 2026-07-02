import { Suspense, lazy, useState } from 'react'
import { Reveal } from '../components/Reveal'
import { Lightbox } from '../components/Lightbox'
import type { LightboxImage } from '../components/Lightbox'
import { navigate } from '../lib/router'

const SwipeDeck = lazy(() => import('../components/lab/SwipeDeck'))

const TASTE_SHAPE = `TasteModel {                    // lives on-device, never uploaded
  vector      weights per genre / era / tone
  affinity    per-person & per-studio scores
  update(swipe)   → nudge weights, decay stale ones
  score(title)    → rank the next deck, client-side
}
// The TMDB key never ships to the browser — every request
// goes through a Supabase Edge Function proxy with rate
// limiting and a CORS allowlist.`

function Fallback() {
  return (
    <div className="grid h-40 place-items-center rounded-lg border border-line bg-paper">
      <span className="coord">loading experiment…</span>
    </div>
  )
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="annotation whitespace-nowrap">
        {n} · {title}
      </span>
      <span className="dim-line dim-draw flex-1" />
    </div>
  )
}

export function RexCaseStudy() {
  const [zoom, setZoom] = useState<LightboxImage | null>(null)
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
            <span className="coord">Plate 03 · Case study</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live beta
            </span>
          </div>

          <h1
            className="hero-in mt-4 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl"
            style={{ '--d': '80ms' } as React.CSSProperties}
          >
            REX
          </h1>
          <p
            className="hero-in mt-3 font-display text-xl italic text-ink-2 sm:text-2xl"
            style={{ '--d': '120ms' } as React.CSSProperties}
          >
            Swipe to decide what to watch — then go watch it.
          </p>

          <ul
            className="hero-in mt-6 flex flex-wrap gap-2"
            style={{ '--d': '160ms' } as React.CSSProperties}
          >
            {['On-device taste model', 'Two-phone match sessions', 'Server-side key proxy', 'PWA · offline shell'].map(
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

          <div
            className="hero-in mt-8 flex flex-wrap gap-3"
            style={{ '--d': '200ms' } as React.CSSProperties}
          >
            <a
              href="https://seanjoudrie.github.io/REX/"
              target="_blank"
              rel="noopener noreferrer"
              className="springy rounded-lg bg-accent px-5 py-2.5 font-semibold text-paper hover:bg-accent-deep"
            >
              Open the beta ↗
            </a>
            <a
              href="https://github.com/SeanJoudrie/REX"
              target="_blank"
              rel="noopener noreferrer"
              className="springy rounded-lg border border-ink/25 px-5 py-2.5 font-semibold text-ink hover:border-accent hover:text-accent"
            >
              Source code
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* The bet */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="01" title="The bet" />
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
              Discovery apps fail because they optimize for <em className="text-ink">browsing</em>,
              and browsing is the problem — you open them bored and leave bored. REX bets that the
              product should get you to a <em className="text-ink">confident pick fast</em>, then
              get out of the way. Three moves, one decision: right saves it, left passes, up marks
              it watched.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                'Decide together — matching two people’s taste is the headline feature, not an extra.',
                'Learn privately — taste stays on the device, not on a server.',
                'Free data, safely — TMDB powers it, but the key never touches the client.',
              ].map((c) => (
                <li
                  key={c}
                  className="relative pl-5 text-ink-2 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/70"
                >
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* Decision 1 — the gesture */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="02" title="Decision — the match" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Two phones, one pick.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              The real moment REX is built for is two people on a couch. Both swipe;
              every shared like is a match, and ten cards in you have the night&apos;s
              shortlist instead of an argument. A swipe is a forced choice — that&apos;s
              the point. Try the loop (your partner here has already swiped):
            </p>
            <div className="mt-8">
              <Suspense fallback={<Fallback />}>
                <SwipeDeck />
              </Suspense>
            </div>
          </section>
        </Reveal>

        {/* Decision 2 — the model */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="03" title="Decision — the taste model" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The algorithm belongs to the user.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              Every swipe nudges a taste vector — genres, eras, tone, people — scored entirely
              client-side. No account, no tracking, nothing uploaded: close the tab and your
              taste is still yours. After enough swipes the &ldquo;Mirror&rdquo; renders a
              shareable portrait of that taste. The same model powers two-phone
              &ldquo;match&rdquo; sessions: both people swipe, REX surfaces the overlap.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper p-4 font-mono text-[0.8rem] leading-relaxed text-ink-2">
              {TASTE_SHAPE}
            </pre>
          </section>
        </Reveal>

        {/* Decision 3 — the interface */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="04" title="Decision — the interface" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Teach in one screen, then disappear.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              The whole product is learnable in one modal — three gestures, one promise
              (&ldquo;build your own algorithm&rdquo;). A pixel mascot keeps waiting states
              human, and the Mirror turns a progress bar into a reason to keep going.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  src: 'shots/rex-onboarding.webp',
                  cap: 'Onboarding — the entire product taught in three moves, before any content loads.',
                },
                {
                  src: 'shots/rex-discover.webp',
                  cap: 'Rex the mascot fronts every waiting state — personality where most apps put a spinner.',
                },
                {
                  src: 'shots/rex-mirror.webp',
                  cap: 'The Mirror — swipe 12 more titles and it renders a portrait of your taste. Progress as motivation.',
                },
              ].map((s, i) => (
                <figure key={s.src}>
                  <button
                    onClick={() => setZoom({ src: s.src, alt: s.cap })}
                    aria-label={`View REX screen ${i + 1} larger`}
                    className="plate-lift block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line shadow-sm"
                  >
                    <img src={s.src} alt="" loading="lazy" decoding="async" className="w-full" />
                  </button>
                  <figcaption className="mt-2 text-sm leading-relaxed text-faint">{s.cap}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Shipped + honest ledger */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="05" title="Shipped — and the honest ledger" />
            <div className="mt-6 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">What shipped</h3>
                <ul className="mt-3 space-y-2 text-ink-2">
                  {[
                    'Live beta — swipe deck, watchlist, ratings, filters by service, genre, and year.',
                    'On-device recommendation engine with the Mirror taste portrait.',
                    'Real-time two-phone match sessions.',
                    'Supabase Edge Function proxy — rate-limited, CORS-allowlisted, key never exposed.',
                    'PWA with offline app shell and poster caching.',
                  ].map((x) => (
                    <li
                      key={x}
                      className="relative pl-5 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/70"
                    >
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  What I&apos;d do differently
                </h3>
                <p className="mt-3 leading-relaxed text-ink-2">
                  The taste model improved with every iteration, but I built the UI around it
                  before instrumenting <em>whether picks got faster</em> — the product&apos;s
                  whole thesis. Next: measure time-to-pick from day one. And the match session
                  deserves to be the front door, not a feature behind the deck — deciding
                  together is the moment people actually reach for an app like this.
                </p>
                <p className="mt-3 leading-relaxed text-ink-2">
                  Still cooking: it&apos;s a beta on a github.io URL on purpose — the
                  recommendation engine, multiplayer, and privacy model all work end to end,
                  and the polish pass comes before a domain does.
                </p>
              </div>
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
              onClick={() => navigate('#/work/flexyn')}
              className="text-sm font-semibold text-accent transition-colors hover:text-accent-deep"
            >
              Next expedition: Flexyn →
            </button>
          </div>
        </Reveal>
      </div>
      {zoom && <Lightbox image={zoom} onClose={() => setZoom(null)} />}
    </article>
  )
}

export default RexCaseStudy
