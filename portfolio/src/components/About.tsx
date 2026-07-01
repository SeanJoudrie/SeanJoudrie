import { Reveal } from './Reveal'
import { site } from '../data/site'

export function About() {
  return (
    <section id="about" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:gap-16">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="annotation whitespace-nowrap">About</span>
              <span className="dim-line flex-1" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Taste, systems, and the discipline to ship.
            </h2>

            <div className="mt-6 max-w-xl space-y-5 leading-relaxed text-ink-2">
              <p>
                I&apos;m a self-taught designer-builder with a psychology degree
                — I design for how people actually behave, then measure whether
                it worked. Everything in the index above I conceived, designed,
                and shipped myself, from the first sketch to the deployed build.
              </p>
              <p>
                I build with AI agents the way a director works a crew: the
                architecture, the taste, and the quality bar are mine — the
                typing is negotiable. That workflow took Globalio from an empty
                repo to a live game with 50+ modes in a week.
              </p>
              <p>
                The standard comes from the Army — I&apos;m a National Guard
                officer candidate, and &ldquo;good enough&rdquo; isn&apos;t a
                phrase that survives there.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <figure className="mx-auto max-w-[240px] md:ml-auto md:mr-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-paper-2">
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
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-5xl font-semibold text-faint">SJ</span>
                  </div>
                )}
              </div>
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
