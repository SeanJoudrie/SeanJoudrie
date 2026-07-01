import { Suspense, lazy } from 'react'
import { Reveal } from './Reveal'

const CodexExplorer = lazy(() => import('./lab/CodexExplorer'))
const SeedScrubber = lazy(() => import('./lab/SeedScrubber'))

/**
 * The Lab — skills demonstrated, not listed. Each experiment is a live,
 * touchable widget labeled with the skill it proves. New experiments get
 * appended here as the index grows.
 */
const EXPERIMENTS = [
  {
    n: '01',
    skill: 'Data',
    title: 'Codex Explorer',
    caption:
      'Search, facet, and sort the 197-country spine of Globalio’s codex — live, instant, keyboard-friendly. The production codex layers 4,000+ entries on top of this.',
    Demo: CodexExplorer,
  },
  {
    n: '02',
    skill: 'Systems',
    title: 'Daily Seed Scrubber',
    caption:
      'One date in, one identical puzzle out — for every player on Earth, with zero backend. Scrub the timeline and watch determinism do the work.',
    Demo: SeedScrubber,
  },
]

const FIELD_KIT: { label: string; items: string }[] = [
  { label: 'Design', items: 'interface systems · typography · motion · brand-in-product' },
  { label: 'Build', items: 'React + TypeScript · Tailwind · Supabase / Postgres / RLS · PWA / offline / WebRTC' },
  { label: 'Data', items: 'schema & modeling · deterministic systems · analytics' },
  { label: 'Direct', items: 'AI-agent workflows · product scoping · shipping solo, end to end' },
]

export function Lab() {
  return (
    <section id="skills" className="border-b border-line bg-paper-2/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">The Lab</span>
            <span className="dim-line flex-1" />
            <span className="coord whitespace-nowrap">{EXPERIMENTS.length} experiments</span>
          </div>
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Don’t take my word for it — <em className="text-accent">use</em> it.
          </h2>
          <p className="mt-3 max-w-xl text-ink-2">
            Working demonstrations, extracted from the products in the index.
            More land here as the index grows.
          </p>
        </Reveal>

        <div className="mt-10 space-y-6">
          {EXPERIMENTS.map((ex, i) => (
            <Reveal key={ex.n} delay={i * 60}>
              <article className="rounded-xl border border-line bg-paper-2/60 p-5 sm:p-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="coord">Experiment {ex.n}</span>
                  <span className="annotation text-gold">{ex.skill}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                  {ex.title}
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">{ex.caption}</p>
                <div className="mt-5">
                  <Suspense
                    fallback={
                      <div className="grid h-40 place-items-center rounded-lg border border-line bg-paper">
                        <span className="coord">loading experiment…</span>
                      </div>
                    }
                  >
                    <ex.Demo />
                  </Suspense>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Field kit — the scannable version, for recruiters in a hurry. */}
        <Reveal>
          <div className="mt-10 rounded-xl border border-line bg-paper p-5 sm:p-6">
            <span className="annotation">Field kit</span>
            <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {FIELD_KIT.map((g) => (
                <div key={g.label} className="flex gap-3 text-sm">
                  <dt className="w-14 shrink-0 font-display font-semibold text-ink">{g.label}</dt>
                  <dd className="leading-relaxed text-ink-2">{g.items}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
