import { useState } from 'react'
import type { Project } from '../data/projects'

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false)
  const detailId = `case-${project.name.replace(/\s+/g, '-').toLowerCase()}`
  const fig = `Fig. ${String(index + 1).padStart(2, '0')}`

  return (
    <article className="card-lift group relative overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/60 hover:border-accent/40">
      <div aria-hidden className="h-1 w-full" style={{ backgroundColor: project.accent }} />

      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="annotation">{fig}</span>
          <span className="annotation" style={{ color: project.accent }}>
            {project.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
              {project.name}
            </h3>
            <p className="mt-1 text-sm text-faint">{project.role}</p>
          </div>
          <div className="flex gap-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-navy-600 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Live ↗
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:border-navy-600 hover:text-ink"
              >
                Code
              </a>
            )}
          </div>
        </div>

        <p className="mt-5 text-lg font-medium text-ink">{project.hook}</p>
        <p className="mt-2 text-mute">{project.description}</p>

        {project.screenshot && (
          <img
            src={project.screenshot}
            alt={`${project.name} interface`}
            loading="lazy"
            decoding="async"
            className="mt-6 w-full rounded-xl border border-navy-800"
          />
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-navy-800 bg-navy-950/60 px-2.5 py-1 font-mono text-xs font-medium text-faint"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 border-t border-navy-800 pt-5">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailId}
            className="flex w-full items-center justify-between text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
          >
            <span>{open ? 'Hide case study' : 'Read the case study'}</span>
            <span className="annotation" style={{ color: 'inherit' }}>
              {open ? '[ − ]' : '[ + ]'}
            </span>
          </button>
        </div>

        <div
          id={detailId}
          className="grid transition-all duration-500 ease-out"
          style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <dl className="mt-5 space-y-4 text-sm leading-relaxed">
              <CaseRow n="A" label="The problem" body={project.caseStudy.problem} />
              <CaseRow n="B" label="What I built" body={project.caseStudy.built} />
              <CaseRow n="C" label="Outcome" body={project.caseStudy.outcome} />
            </dl>
          </div>
        </div>
      </div>
    </article>
  )
}

function CaseRow({ n, label, body }: { n: string; label: string; body: string }) {
  return (
    <div>
      <dt className="annotation text-accent">
        {n} · {label}
      </dt>
      <dd className="mt-1 text-mute">{body}</dd>
    </div>
  )
}
