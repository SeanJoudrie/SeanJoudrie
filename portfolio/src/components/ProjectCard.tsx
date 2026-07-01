import type { Project } from '../data/projects'

export function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project
  index: number
  onOpen: () => void
}) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-label={`Open ${project.name} case study`}
      className="card-lift group relative cursor-pointer overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/60 hover:border-accent/40"
    >
      <div aria-hidden className="h-1 w-full" style={{ backgroundColor: project.accent }} />

      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="annotation">{num}</span>
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
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:border-navy-600 hover:text-ink"
              >
                Code
              </a>
            )}
          </div>
        </div>

        <p className="mt-5 text-lg font-medium text-ink">{project.hook}</p>
        <p className="mt-2 text-mute">{project.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-navy-800 bg-navy-950/60 px-2.5 py-1 text-xs font-medium text-faint"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-navy-800 pt-5">
          <span className="text-sm font-semibold text-accent transition-colors group-hover:text-accent-soft">
            Deep dive
          </span>
          <span
            aria-hidden
            className="text-accent transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </div>
    </article>
  )
}
