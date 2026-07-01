import { site } from '../data/site'

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-navy-800/70"
    >
      {/* subtle structural grid, not a blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #16355e 1px, transparent 1px), linear-gradient(to bottom, #16355e 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(120% 80% at 0% 0%, black, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(120% 80% at 0% 0%, black, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
        <p className="eyebrow mb-6">Human-Systems Design</p>

        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          I design systems and teams that hold up{' '}
          <span className="text-accent">under real-world pressure</span>.
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mute">
          Psychology, military leadership, and product engineering — pointed at
          one thing: understanding how people actually behave, then building and
          leading the systems around them. I conceive, design, and ship.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#work"
            className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
          >
            View work
          </a>
          {site.hasResume ? (
            <a
              href={site.resumeUrl}
              className="rounded-xl border border-navy-600 px-6 py-3.5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Download résumé
            </a>
          ) : (
            <a
              href="#contact"
              className="rounded-xl border border-navy-600 px-6 py-3.5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Get in touch
            </a>
          )}
          {site.hasResume && (
            <a
              href="#contact"
              className="rounded-xl px-2 py-3.5 font-semibold text-mute transition-colors hover:text-ink"
            >
              Contact →
            </a>
          )}
        </div>

        {/* credibility strip */}
        <div className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-navy-800/70 pt-8 sm:grid-cols-3">
          <Cred k="U.S. Army National Guard" v="Officer Candidate · BCT complete" />
          <Cred k="B.A. Psychology" v="Business Analytics minor · 3.7 GPA" />
          <Cred k="4 shipped products" v="Solo & co-founding builder" />
        </div>
      </div>
    </section>
  )
}

function Cred({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-sm font-semibold text-ink">{k}</div>
      <div className="mt-0.5 text-sm text-faint">{v}</div>
    </div>
  )
}
