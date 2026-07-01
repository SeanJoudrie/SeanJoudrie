import { useCallback, useEffect, useRef, useState } from 'react'
import { projects, slug } from '../data/projects'
import type { Project } from '../data/projects'
import { CaseStudyDrawer } from './CaseStudyDrawer'
import { Reveal } from './Reveal'
import { PlateMotif } from './PlateMotif'

const bySlug = (h: string) => projects.find((p) => slug(p.name) === h) ?? null

export function Work() {
  const [active, setActive] = useState<Project | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // Deep-linking: open the drawer if the URL hash matches a project slug,
  // and keep it in sync (shareable links like …/#globalio).
  useEffect(() => {
    const apply = () => setActive(bySlug(location.hash.replace('#', '')))
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const open = useCallback((p: Project, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? null
    setActive(p)
    history.replaceState(null, '', `#${slug(p.name)}`)
  }, [])

  const close = useCallback(() => {
    setActive(null)
    history.replaceState(null, '', location.pathname + location.search)
    openerRef.current?.focus()
  }, [])

  const [flagship, ...rest] = projects

  return (
    <section id="work" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-28">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Index of works</span>
            <span className="dim-line flex-1" />
            <span className="coord whitespace-nowrap">{projects.length} entries</span>
          </div>
        </Reveal>

        {/* Plate 01 — flagship */}
        <Reveal>
          <FeaturedPlate project={flagship} onOpen={open} />
        </Reveal>

        {/* Plates 02–04 */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.name} delay={i * 60} as="div">
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

function FeaturedPlate({
  project: p,
  onOpen,
}: {
  project: Project
  onOpen: (p: Project, opener?: HTMLElement | null) => void
}) {
  return (
    <article className="mt-8 overflow-hidden rounded-xl border border-line bg-paper-2/50">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="coord">Plate {p.plate}</span>
            <StatusChip status={p.status} live={!!p.liveUrl} />
          </div>

          <h3 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {p.name}
          </h3>
          <p className="mt-2 font-display text-xl italic text-ink-2">{p.hook}</p>
          <p className="mt-4 max-w-lg leading-relaxed text-ink-2">{p.description}</p>

          {p.facts && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {p.facts.map((f) => (
                <li
                  key={f}
                  className="rounded-md border border-line bg-paper px-2.5 py-1 text-sm font-medium text-ink-2"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="springy w-full rounded-lg bg-accent px-5 py-3 text-center font-semibold text-paper hover:bg-accent-deep sm:w-auto sm:py-2.5"
              >
                Play it live ↗
              </a>
            )}
            <button
              onClick={(e) => onOpen(p, e.currentTarget)}
              className="springy w-full rounded-lg border border-ink/25 px-5 py-3 text-center font-semibold text-ink hover:border-accent hover:text-accent sm:w-auto sm:py-2.5"
            >
              Case study →
            </button>
          </div>
        </div>

        {/* Real product — three screens fanned like specimen plates */}
        {p.shots && (
          <div className="relative mx-auto flex min-h-[22rem] w-full max-w-md items-center justify-center sm:min-h-[26rem]">
            {p.shots.slice(0, 3).map((s, i) => (
              <img
                key={s}
                src={s}
                alt={`${p.name} — screen ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="plate-lift absolute max-h-[88%] w-36 rounded-xl border border-line bg-paper object-cover object-top shadow-lg sm:w-44"
                style={{
                  transform: `rotate(${(i - 1) * 7}deg) translateX(${(i - 1) * 58}%)`,
                  zIndex: i === 1 ? 2 : 1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
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
        className="block w-full cursor-pointer border-b border-line"
      >
        {p.screenshot ? (
          <img
            src={p.screenshot}
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

        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
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
