import { Reveal } from './Reveal'

/**
 * A two-line pulse between the story and the CTA — momentum, not a diary.
 * Update the copy when the headline work changes.
 */
export function Now() {
  return (
    <section aria-label="Currently" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Reveal>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="annotation whitespace-nowrap">
              <span className="text-accent">●</span> Now
            </span>
            <p className="max-w-2xl leading-relaxed text-ink-2">
              Taking <span className="font-semibold text-ink">Flexyn</span> from
              private beta toward public launch, and adding experiments to the
              Lab. The index grows from here.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
