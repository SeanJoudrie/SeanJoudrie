import { useCallback, useEffect, useState } from 'react'
import { projects, slug } from '../data/projects'
import type { Project } from '../data/projects'
import { ProjectCard } from './ProjectCard'
import { CaseStudyDrawer } from './CaseStudyDrawer'
import { GlobalioDemo } from './GlobalioDemo'
import { Reveal } from './Reveal'

const bySlug = (h: string) => projects.find((p) => slug(p.name) === h) ?? null

export function Work() {
  const [active, setActive] = useState<Project | null>(null)

  // Deep-linking: open the drawer if the URL hash matches a project slug,
  // and keep it in sync (shareable links like …/#flexyn).
  useEffect(() => {
    const apply = () => setActive(bySlug(location.hash.replace('#', '')))
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const open = useCallback((p: Project) => {
    setActive(p)
    history.replaceState(null, '', `#${slug(p.name)}`)
  }, [])

  const close = useCallback(() => {
    setActive(null)
    history.replaceState(null, '', location.pathname + location.search)
  }, [])

  return (
    <section id="work" className="border-y border-navy-800/70 bg-navy-950/40">
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
            designed, and shipped. Open any one for the full case study.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 70} as="div">
              <ProjectCard project={p} index={i} onOpen={() => open(p)} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <GlobalioDemo />
        </Reveal>
      </div>

      <CaseStudyDrawer project={active} onClose={close} />
    </section>
  )
}
