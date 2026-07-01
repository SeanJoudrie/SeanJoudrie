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
      // Minimal focus containment: keep Tab inside the panel.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
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
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={p ? `${p.name} case study` : undefined}
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-line bg-paper shadow-2xl outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {p && (
          <div>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-6 py-4 backdrop-blur sm:px-8">
              <span className="annotation">Case study · Plate {p.plate}</span>
              <button
                onClick={onClose}
                className="springy rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent"
              >
                Close ✕
              </button>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <h3 className="font-display text-4xl font-semibold tracking-tight text-ink">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-faint">{p.role}</p>
              <p className="mt-5 font-display text-xl italic text-ink-2">{p.hook}</p>
              <p className="mt-3 leading-relaxed text-ink-2">{p.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {p.stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-line bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="springy rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-paper hover:bg-accent-deep"
                  >
                    Open live ↗
                  </a>
                )}
                {p.repoUrl && (
                  <a
                    href={p.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="springy rounded-lg border border-ink/25 px-4 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
                  >
                    Source code
                  </a>
                )}
              </div>

              <dl className="mt-9 space-y-7">
                <Row label="The problem" body={p.caseStudy.problem} />
                <Row label="What I built" body={p.caseStudy.built} />
                <Row label="Outcome" body={p.caseStudy.outcome} />
              </dl>

              {p.shots && p.shots.length > 0 && (
                <div className="mt-9">
                  <span className="annotation">Screens</span>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                    {p.shots.map((s, i) => (
                      <img
                        key={s}
                        src={s}
                        alt={`${p.name} — screen ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full rounded-lg border border-line"
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

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-l-2 border-accent/60 pl-4">
      <dt className="annotation text-gold">{label}</dt>
      <dd className="mt-1.5 leading-relaxed text-ink-2">{body}</dd>
    </div>
  )
}
