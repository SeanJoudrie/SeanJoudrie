import { site } from '../data/site'

const specs = [
  { k: 'Service', v: 'Army National Guard · Officer Candidate' },
  { k: 'Education', v: 'B.A. Psychology · 3.7 GPA' },
  { k: 'Impact', v: '4.5× YoY revenue · 50%+ traffic growth' },
  { k: 'Built', v: '4 shipped products' },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-navy-800/70">
      {/* drafting-paper grid */}
      <div aria-hidden className="blueprint-grid pointer-events-none absolute inset-0" />
      {/* one soft gold wash, top-left, masked — structure not blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
        {/* fig annotation + drawn rule */}
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
            className="rounded-xl px-2 py-3.5 font-semibold text-mute transition-colors hover:text-ink"
          >
            Get in touch →
          </a>
        </div>

        {/* spec sheet — mono keys, like a drawing's title block */}
        <dl className="mt-16 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6 border-t border-navy-800/70 pt-8 sm:grid-cols-4">
          {specs.map((s) => (
            <div key={s.k}>
              <dt className="annotation">{s.k}</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
