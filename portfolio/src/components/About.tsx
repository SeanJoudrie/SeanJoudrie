import { Reveal } from './Reveal'
import { site } from '../data/site'

function Portrait({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-paper-2 ${className}`}>
      {site.photo ? (
        <img
          src={site.photo}
          alt="Sean Joudrie"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition: '50% 22%' }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span className="font-display text-4xl font-semibold text-faint">SJ</span>
        </div>
      )}
    </div>
  )
}

export function About() {
  return (
    <section id="about" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-28">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-16">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="annotation whitespace-nowrap">About</span>
              <span className="dim-line dim-draw flex-1" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Taste, systems, and the discipline to ship.
            </h2>

            <div className="mt-6 max-w-xl leading-relaxed text-ink-2">
              {/* Mobile: the portrait rides beside the first lines — small,
                  high on the page, a stamp rather than a poster. */}
              <figure className="float-right mb-2 ml-4 w-24 md:hidden">
                <Portrait className="aspect-[4/5]" />
                <figcaption className="coord mt-1.5 text-center leading-snug">
                  Army NG · OC
                </figcaption>
              </figure>
              <div className="space-y-5">
                <p>
                  I&apos;m a self-taught designer-builder with a psychology
                  degree — I design for how people actually behave, then measure
                  whether it worked. Everything in the index above I conceived,
                  designed, and shipped myself, from the first sketch to the
                  deployed build.
                </p>
                <p>
                  I build with AI agents the way a director works a crew: the
                  architecture, the taste, and the quality bar are mine — the
                  typing is negotiable. That workflow took Globalio from an
                  empty repo to a live game with 50+ modes in a week, and
                  it&apos;s how the next dozen apps on this index will get
                  built.
                </p>
                <p>
                  The standard comes from the Army — I&apos;m a National Guard
                  officer candidate, and &ldquo;good enough&rdquo; isn&apos;t a
                  phrase that survives there.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Desktop: portrait column, top-aligned with the heading. */}
          <Reveal delay={80} className="hidden md:block">
            <figure className="ml-auto max-w-[240px]">
              <Portrait className="aspect-[4/5]" />
              <figcaption className="coord mt-3 text-center">
                Wakefield, MA · U.S. Army National Guard OC
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
