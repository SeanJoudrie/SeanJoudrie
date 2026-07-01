import { timeline } from '../data/experience'
import type { TimelineItem } from '../data/experience'
import { Reveal } from './Reveal'
import { real } from '../data/site'

const kindLabel: Record<TimelineItem['kind'], string> = {
  service: 'Service',
  education: 'Education',
  work: 'Experience',
}

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal>
        <p className="eyebrow mb-4">Experience &amp; credentials</p>
        <h2 className="max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          Leadership and operational rigor — earned, not claimed.
        </h2>
      </Reveal>

      <ol className="mt-14 space-y-0">
        {timeline.map((item, i) => {
          const org = real(item.org)
          const period = real(item.period)
          return (
          <Reveal as="li" key={`${item.role}-${i}`} delay={i * 50}>
            <div className="grid gap-4 border-t border-navy-800 py-7 md:grid-cols-[180px_1fr] md:gap-10">
              <div className="flex items-start gap-3 md:flex-col md:gap-1">
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
                  {kindLabel[item.kind]}
                </span>
                {period && <span className="text-sm text-faint">{period}</span>}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {item.role}
                </h3>
                {org && <p className="mt-0.5 text-mute">{org}</p>}
                <ul className="mt-3 space-y-1.5">
                  {item.points.map((pt, j) => (
                    <li
                      key={j}
                      className="relative pl-5 text-mute before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/70"
                    >
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
          )
        })}
      </ol>
    </section>
  )
}
