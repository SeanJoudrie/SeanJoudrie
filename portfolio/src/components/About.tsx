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
          style={{ objectPosition: '50% 12%' }}
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
                {site.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Desktop: portrait column, top-aligned with the heading. */}
          <Reveal delay={80} className="hidden md:block">
            <figure className="parallax-1 ml-auto max-w-[240px]">
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
