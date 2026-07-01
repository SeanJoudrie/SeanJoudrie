import { useState } from 'react'
import { Reveal } from './Reveal'
import { site } from '../data/site'

export function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  }

  return (
    <section id="contact" className="paper-wash">
      <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <Reveal>
          <p className="annotation mb-4">Contact</p>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Have something worth
            <br />
            building <em className="text-accent">well</em>?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-ink-2">
            Design, front-end, and product-build roles or freelance work.
            One email reaches me.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${site.email}`}
              className="springy rounded-lg bg-ink px-6 py-3 font-semibold text-paper hover:bg-accent"
            >
              {site.email}
            </a>
            <button
              onClick={copyEmail}
              className="springy rounded-lg border border-ink/25 px-4 py-3 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
              aria-live="polite"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-ink-2">
            {site.hasResume && (
              <a
                href={site.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                Résumé
              </a>
            )}
            {site.linkedin && (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                LinkedIn
              </a>
            )}
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              GitHub
            </a>
          </div>

          <p className="coord mt-8">{site.location} · {site.availability}</p>
        </Reveal>
      </div>
    </section>
  )
}
