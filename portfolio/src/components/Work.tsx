import { useCallback, useEffect, useRef, useState } from 'react'
import { projects, slug } from '../data/projects'
import type { Project } from '../data/projects'
import { CaseStudyDrawer } from './CaseStudyDrawer'
import { Reveal } from './Reveal'
import { PlateMotif } from './PlateMotif'
import { navigate } from '../lib/router'

/** Projects with a dedicated case-study page skip the drawer. */
const hasPage = (name: string) => ['globalio', 'rex', 'flexyn'].includes(slug(name))

const bySlug = (h: string) =>
  projects.find((p) => slug(p.name) === h && !hasPage(p.name)) ?? null

export function Work() {
  const [active, setActive] = useState<Project | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // Deep-linking: open the drawer if the URL hash matches a project slug,
  // and keep it in sync (shareable links like …/#rap-sheet).
  useEffect(() => {
    const apply = () => setActive(bySlug(location.hash.replace('#', '')))
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const open = useCallback((p: Project, opener?: HTMLElement | null) => {
    if (hasPage(p.name)) {
      navigate(`#/work/${slug(p.name)}`)
      return
    }
    openerRef.current = opener ?? null
    setActive(p)
    history.replaceState(null, '', `#${slug(p.name)}`)
  }, [])

  const close = useCallback(() => {
    setActive(null)
    history.replaceState(null, '', location.pathname + location.search)
    openerRef.current?.focus()
  }, [])

  return (
    <section id="work" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Index of works</span>
            <span className="dim-line dim-draw flex-1" />
            <span className="coord whitespace-nowrap">{projects.length} entries</span>
          </div>
        </Reveal>

        {/* Every shipped product at equal weight — the Range shelf above
            carries the spotlight; this is the index. */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 60} as="div" className="reveal-settle">
              <Plate project={p} onOpen={open} />
            </Reveal>
          ))}
        </div>
      </div>

      <CaseStudyDrawer project={active} onClose={close} />
    </section>
  )
}

function StatusChip({ status, live }: { status: string; live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${
        live ? 'border-accent/40 text-accent' : 'border-line text-faint'
      }`}
    >
      {live && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {status}
    </span>
  )
}

function Plate({
  project: p,
  onOpen,
}: {
  project: Project
  onOpen: (p: Project, opener?: HTMLElement | null) => void
}) {
  return (
    <article className="plate-lift group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper-2/50">
      {/* Imagery slot: real capture when it lands, designed motif until then */}
      <button
        onClick={(e) => onOpen(p, e.currentTarget)}
        aria-label={`Open ${p.name} case study`}
        className="parallax-2 block w-full cursor-pointer border-b border-line"
      >
        {p.screenshot ? (
          <img
            src={p.screenshot}
            alt={`${p.name} — interface`}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover object-top"
          />
        ) : p.shots?.[0] ? (
          <img
            src={p.shots[0]}
            alt={`${p.name} — interface`}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover object-top"
          />
        ) : (
          <PlateMotif name={p.name} />
        )}
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="coord">Plate {p.plate}</span>
          <StatusChip status={p.status} live={!!p.liveUrl} />
        </div>

        <h3
          className={`mt-3 font-display text-2xl font-semibold tracking-tight text-ink ${
            slug(p.name) === 'globalio' ? 'vt-gio-title' : ''
          }`}
        >
          {p.name}
        </h3>
        <p className="mt-1.5 leading-relaxed text-ink-2">{p.hook}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <button
            onClick={(e) => onOpen(p, e.currentTarget)}
            className="text-sm font-semibold text-accent transition-colors hover:text-accent-deep"
          >
            Case study →
          </button>
          <span className="flex gap-3 text-sm font-medium">
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
              >
                Live ↗
              </a>
            )}
            {p.repoUrl && (
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
              >
                Code
              </a>
            )}
          </span>
        </div>
      </div>
    </article>
  )
}
