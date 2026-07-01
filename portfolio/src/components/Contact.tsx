import { Reveal } from './Reveal'
import { site } from '../data/site'

export function Contact() {
  return (
    <section
      id="contact"
      className="border-t border-navy-800/70 bg-navy-950/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <p className="annotation mb-4">Contact</p>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Let&apos;s build something that holds up.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-mute">
            Open to analyst, operations, project-management, and product roles —
            and to freelance builds. If you need someone who understands people,
            builds the system, and leads the execution, reach out.
          </p>
          <p className="mx-auto mt-4 annotation text-faint">
            {site.location} · Open to Boston / Remote · Actively looking
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:${site.email}`}
              className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
            >
              {site.email}
            </a>
            {site.hasResume && (
              <a
                href={site.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-navy-600 px-6 py-3.5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Download résumé
              </a>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-mute">
            {site.linkedin && (
              <>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  LinkedIn
                </a>
                <span aria-hidden className="text-navy-700">
                  ·
                </span>
              </>
            )}
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              GitHub
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
