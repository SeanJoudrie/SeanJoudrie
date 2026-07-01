import { useEffect, useState } from 'react'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { site } from '../data/site'

const links = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

const sectionIds = links.map((l) => l.id)

export function Nav() {
  const active = useScrollSpy(sectionIds)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-line bg-paper/90 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-ink"
          aria-label="Sean Joudrie — home"
        >
          Sean Joudrie<span className="text-accent">.</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                data-active={active === l.id}
                className={`nav-link text-sm font-medium transition-colors ${
                  active === l.id ? 'text-accent' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
          {site.hasResume && (
            <li>
              <a
                href={site.resumeUrl}
                className="springy rounded-lg border border-ink/25 px-3.5 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
              >
                Résumé
              </a>
            </li>
          )}
        </ul>

        <button
          className="text-ink md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-line bg-paper/95 px-5 pb-4 pt-2 backdrop-blur md:hidden">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-2 py-2.5 text-base font-medium ${
                  active === l.id ? 'text-accent' : 'text-ink-2'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
          {site.hasResume && (
            <li>
              <a
                href={site.resumeUrl}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-base font-semibold text-accent"
              >
                Download Résumé →
              </a>
            </li>
          )}
        </ul>
      )}
    </header>
  )
}
