import { FlagGame } from './FlagGame'
import { Reveal } from './Reveal'

/**
 * A palate-cleanser between the commissions and the index: today's flag from
 * Globalio. Moved out of the hero so the top of the page leads with the work.
 */
export function FlagBreak() {
  return (
    <section id="flag" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Warm-up</span>
            <span className="dim-line dim-draw flex-1" />
            <span className="coord whitespace-nowrap">today’s flag</span>
          </div>
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Since you’re here — <em className="text-accent">name today’s flag</em>.
          </h2>
          <p className="mt-3 max-w-xl text-ink-2">
            A daily one from Globalio, the geography game in the index below. One guess, one planet.
          </p>
        </Reveal>
        <div className="mx-auto mt-10 max-w-md">
          <FlagGame />
        </div>
      </div>
    </section>
  )
}
