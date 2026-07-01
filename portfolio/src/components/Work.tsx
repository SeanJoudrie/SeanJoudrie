import { projects } from '../data/projects'
import { ProjectCard } from './ProjectCard'
import { GlobalioDemo } from './GlobalioDemo'
import { Reveal } from './Reveal'

export function Work() {
  return (
    <section
      id="work"
      className="border-y border-navy-800/70 bg-navy-950/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Selected work</span>
            <span className="dim-line flex-1" />
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Four products. One operator behind all of them.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-mute">
            Across fitness, entertainment, games, and social — conceived,
            designed, and shipped. Evidence that I can take an idea all the way
            to a real, working product.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 70} as="div">
              <ProjectCard project={p} index={i} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <GlobalioDemo />
        </Reveal>
      </div>
    </section>
  )
}
