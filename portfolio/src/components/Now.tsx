import { Reveal } from './Reveal'
import { site } from '../data/site'

/**
 * A present-tense status beat between the credentials history and the contact
 * CTA. Intentionally low-maintenance — a short paragraph plus a single
 * "What I'm looking for" line. Update the copy (and site.nowUpdated) when life
 * changes; there's nothing here that goes stale on its own.
 */
export function Now() {
  return (
    <section
      id="now"
      className="border-t border-navy-800/70 bg-navy-950/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <Reveal>
            <p className="eyebrow mb-4">Now</p>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Where things stand today.
            </h2>
            <p className="mt-3 text-sm text-faint">Updated {site.nowUpdated}</p>
          </Reveal>

          <Reveal delay={80}>
            <div className="space-y-5 text-lg leading-relaxed text-mute">
              <p>
                Serving as an officer candidate in the Army National Guard while
                building products solo. Right now that means taking Flexyn toward
                an App Store release and sharpening REX&apos;s on-device
                recommendation engine — shipping, testing, and iterating in
                public.
              </p>
              <p>
                I&apos;m deliberately keeping one foot in operations and one in
                building, because the work I do best lives exactly at that seam:
                understand the people, design the system, lead the execution.
              </p>

              <div className="rounded-xl border border-navy-700 bg-navy-900/60 p-5">
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
                  What I&apos;m looking for
                </p>
                <p className="mt-2 text-base text-ink">
                  A program-analyst, operations, or project-management role where
                  judgment under pressure matters — and open to select freelance
                  builds on the side.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
