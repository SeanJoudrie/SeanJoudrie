import { Suspense, lazy, useState } from 'react'
import { Reveal } from '../components/Reveal'
import { Lightbox } from '../components/Lightbox'
import type { LightboxImage } from '../components/Lightbox'
import { navigate } from '../lib/router'

const SeedScrubber = lazy(() => import('../components/lab/SeedScrubber'))
const CodexExplorer = lazy(() => import('../components/lab/CodexExplorer'))

const SEED_CODE = `// date → seed → identical round, everywhere
const day = Math.floor((Date.UTC(y, m, d) - EPOCH) / 86400000)
const rand = mulberry32(day + SEED_BASE)

const order = FLAGS
  .map(f => ({ f, k: rand() }))
  .sort((a, b) => a.k - b.k)

const answer = order[0]           // today's flag
const options = shuffle(order.slice(0, 4), rand)`

const CODEX_SHAPE = `CodexEntry {
  name        "France"
  code        "fr"
  capital     "Paris"
  region      Europe
  flags[]     current + historical (Bourbon, Tricolore…)
  languages[] script-tagged, so distractors never leak
  facts[]     per-entry trivia surfaced in play
}
// 197 sovereign entries at the spine — 4,000+ entries
// across the historical / subdivision / language layers`

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

export function GlobalioCaseStudy() {
  const [zoom, setZoom] = useState<LightboxImage | null>(null)
  return (
    <article className="pt-20 sm:pt-28">
      {/* Opening plate */}
      <header className="border-b border-line paper-wash">
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
            <span className="coord">Plate 01 · Case study</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live
            </span>
          </div>

          <h1
            className="vt-gio-title hero-in mt-4 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl"
            style={{ '--d': '80ms' } as React.CSSProperties}
          >
            Globalio
          </h1>
          <p
            className="hero-in mt-3 font-display text-xl italic text-ink-2 sm:text-2xl"
            style={{ '--d': '120ms' } as React.CSSProperties}
          >
            A geography game the whole planet plays together.
          </p>

          <ul
            className="hero-in mt-6 flex flex-wrap gap-2"
            style={{ '--d': '160ms' } as React.CSSProperties}
          >
            {['50+ game modes', '4,000+ codex entries', '197 countries', 'Solo, in one week'].map(
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
              href="https://globalio.app"
              target="_blank"
              rel="noopener noreferrer"
              className="springy rounded-lg bg-accent px-5 py-2.5 font-semibold text-paper hover:bg-accent-deep"
            >
              Play it live ↗
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
              A daily geography game only works if <em className="text-ink">everyone plays the
              same puzzle</em> — that&apos;s what makes it shareable. The obvious way is a server
              handing out the day&apos;s challenge. The bet was that a server isn&apos;t needed at
              all: the date itself can be the source of truth.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                'Solo — one person owns product, design, and build.',
                'Zero backend — no accounts, no API, works offline.',
                'Ship in days, not months — scope ruthlessly, cut nothing that matters.',
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

        {/* Decision 1 — the seed */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="02" title="Decision — the seed" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The date is the server.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              A tiny seeded PRNG (mulberry32) turns today&apos;s date into today&apos;s puzzle —
              deterministically, on every device on Earth. Same date in, same round out. No
              lookup table to maintain, no API to pay for, nothing to go down. It&apos;s the
              engine behind this site&apos;s hero warm-up too. Try it:
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper p-4 font-mono text-[0.8rem] leading-relaxed text-ink-2">
              {SEED_CODE}
            </pre>
            <div className="mt-6">
              <Suspense fallback={<Fallback />}>
                <SeedScrubber />
              </Suspense>
            </div>
          </section>
        </Reveal>

        {/* Decision 2 — the codex */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="03" title="Decision — the codex" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The data is the difficulty.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              A quiz is only as good as its wrong answers. The codex is structured so
              distractors are always plausible — similar flags, same region, same script —
              and never leak the answer. A script-detection engine keeps a question about a
              Cyrillic-script country from offering three Latin-script distractors that give
              it away. The spine is 197 sovereign entries; historical flags, subdivisions,
              and languages layer 4,000+ entries on top.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-line bg-paper p-4 font-mono text-[0.8rem] leading-relaxed text-ink-2">
              {CODEX_SHAPE}
            </pre>
            <div className="mt-6">
              <Suspense fallback={<Fallback />}>
                <CodexExplorer />
              </Suspense>
            </div>
          </section>
        </Reveal>

        {/* Decision 3 — the interface */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="04" title="Decision — the interface" />
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Warm paper, not quiz-app blue.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              Every geography quiz looks like a pub trivia machine. Globalio is set like an
              atlas instead — cream paper, an editorial serif, plate-like cards — so learning
              feels like collecting, not testing. The design system carried so well that this
              portfolio is set in the same language.
            </p>
            <div className="vt-gio-shots mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  src: 'shots/globalio-today.webp',
                  cap: 'The Today screen — a daily ritual loop (challenge, expedition, gacha pull), not a menu.',
                },
                {
                  src: 'shots/globalio-france.webp',
                  cap: 'The codex in product — historical flags with era timelines; the data layer made collectible.',
                },
                {
                  src: 'shots/globalio-progress.webp',
                  cap: 'The Progress Map — every flag you learn lights its country, forever. Long-term retention as cartography.',
                },
              ].map((s, i) => (
                <figure key={s.src}>
                  <button
                    onClick={() => setZoom({ src: s.src, alt: s.cap })}
                    aria-label={`View Globalio screen ${i + 1} larger`}
                    className="plate-lift block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line shadow-sm"
                  >
                    <img src={s.src} alt="" loading="lazy" decoding="async" className="w-full" />
                  </button>
                  <figcaption className="mt-2 text-sm leading-relaxed text-faint">
                    {s.cap}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </Reveal>

        {/* What shipped + honest ledger */}
        <Reveal>
          <section className="border-b border-line py-12 sm:py-16">
            <SectionLabel n="05" title="Shipped — and the honest ledger" />
            <div className="mt-6 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">What shipped</h3>
                <ul className="mt-3 space-y-2 text-ink-2">
                  {[
                    'Live at globalio.app — free, no sign-up, installable PWA that works offline.',
                    '50+ ways to play: Flagle, Flag Bracket, Build-the-Flag, Odd One Out, Sketch the Flag, Spot the Error, Flag Outline, quizzes and more.',
                    'Daily rituals: the shared Daily Challenge, a ten-flag Daily Expedition, a Flag Gacha collection pull, and a flag fun-fact — a reason to return every day.',
                    'A 2,000-flag codex across all 197 countries — subdivisions, historical states, and identity flags, each with era timelines and did-you-know facts.',
                    'The Progress Map — every flag you learn lights its country up, permanently.',
                    'Live event programming — a World Cup 2026 mode ("48 nations, one summer").',
                    '197 static, crawlable country pages generated from the codex for SEO.',
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
                  Ship analytics on day one — a game this replayable deserves real retention
                  numbers, and I launched without them. And the first pass at the codex mixed
                  presentation into the data; separating them cleanly is what made 50+ modes
                  possible, and I&apos;d start there next time.
                </p>
                <p className="mt-3 leading-relaxed text-ink-2">
                  Built in a week by directing AI agents against a spec I owned — the
                  architecture, the data model, and every design call above were the human
                  parts. That workflow is the sixth thing this project demonstrates.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Route out */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 py-10">
            <button
              onClick={() => navigate('#work')}
              className="springy rounded-lg border border-ink/25 px-5 py-2.5 font-semibold text-ink hover:border-accent hover:text-accent"
            >
              ← Back to the index
            </button>
            <button
              onClick={() => navigate('#/work/rex')}
              className="text-sm font-semibold text-accent transition-colors hover:text-accent-deep"
            >
              Next expedition: REX →
            </button>
          </div>
        </Reveal>
      </div>
      {zoom && <Lightbox image={zoom} onClose={() => setZoom(null)} />}
    </article>
  )
}

export default GlobalioCaseStudy
