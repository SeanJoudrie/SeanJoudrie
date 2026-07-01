import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/projects'
import { useBodyLock } from '../hooks/useBodyLock'

/**
 * Right-side case-study drawer. Slides in over the page (no route change),
 * locks scroll, closes on Esc / overlay click / the close button. The last
 * project is cached so content stays visible through the slide-out.
 */
export function CaseStudyDrawer({
  project,
  onClose,
}: {
  project: Project | null
  onClose: () => void
}) {
  const open = !!project
  const [cached, setCached] = useState<Project | null>(project)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useBodyLock(open)

  useEffect(() => {
    if (project) setCached(project)
  }, [project])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const p = cached

  return (
    <div className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`}>
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-navy-950/75 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={p ? `${p.name} case study` : undefined}
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-navy-800 bg-navy-900 shadow-2xl outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {p && (
          <div>
            <div aria-hidden className="h-1 w-full" style={{ backgroundColor: p.accent }} />
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-800 bg-navy-900/90 px-6 py-4 backdrop-blur sm:px-8">
              <span className="annotation">Case study</span>
              <button
                onClick={onClose}
                className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:border-accent hover:text-accent"
              >
                Close ✕
              </button>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <h3 className="font-display text-3xl font-bold tracking-tight text-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-faint">{p.role}</p>
              <p className="mt-5 text-lg font-medium text-ink">{p.hook}</p>
              <p className="mt-2 text-mute">{p.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {p.stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-navy-800 bg-navy-950/60 px-2.5 py-1 text-xs font-medium text-faint"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
                  >
                    Live ↗
                  </a>
                )}
                {p.repoUrl && (
                  <a
                    href={p.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    Code
                  </a>
                )}
              </div>

              <dl className="mt-8 space-y-6">
                <Row label="The problem" body={p.caseStudy.problem} accent={p.accent} />
                <Row label="What I built" body={p.caseStudy.built} accent={p.accent} />
                <Row label="Outcome" body={p.caseStudy.outcome} accent={p.accent} />
              </dl>

              {p.shots && p.shots.length > 0 && (
                <div className="mt-8">
                  <span className="annotation">Screens</span>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {p.shots.map((s) => (
                      <img
                        key={s}
                        src={s}
                        alt={`${p.name} screen`}
                        loading="lazy"
                        decoding="async"
                        className="w-full rounded-lg border border-navy-800"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div className="border-l-2 pl-4" style={{ borderColor: accent }}>
      <dt className="annotation" style={{ color: accent }}>
        {label}
      </dt>
      <dd className="mt-1.5 leading-relaxed text-mute">{body}</dd>
    </div>
  )
}
