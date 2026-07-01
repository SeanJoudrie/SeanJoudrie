import { useEffect, useRef, useState } from 'react'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { useBodyLock } from '../hooks/useBodyLock'
import { site } from '../data/site'

const links = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Lab' },
  { id: 'contact', label: 'Contact' },
]

const sectionIds = links.map((l) => l.id)

export function Nav() {
  const active = useScrollSpy(sectionIds)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Mobile: header slides away on scroll-down, returns on scroll-up.
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const burgerRef = useRef<HTMLButtonElement | null>(null)
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)

  useBodyLock(open)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 12)
      if (y > 96 && y > lastY.current + 2) setHidden(true)
      else if (y < lastY.current - 2 || y <= 96) setHidden(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    firstLinkRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        burgerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    setOpen(false)
    burgerRef.current?.focus()
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-300 md:translate-y-0 ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${
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
            ref={burgerRef}
            className="p-1 text-ink md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Full-screen menu sheet (mobile) — opaque, scroll-locked, staggered. */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-paper md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Sean Joudrie<span className="text-accent">.</span>
            </span>
            <button className="p-1 text-ink" aria-label="Close menu" onClick={close}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
            {links.map((l, i) => (
              <a
                key={l.id}
                ref={i === 0 ? firstLinkRef : undefined}
                href={`#${l.id}`}
                onClick={close}
                className="menu-link flex items-baseline gap-4 py-2"
                style={{ '--stagger': `${60 + i * 55}ms` } as React.CSSProperties}
              >
                <span className="coord">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`font-display text-4xl font-semibold tracking-tight ${
                    active === l.id ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {l.label}
                </span>
              </a>
            ))}
            {site.hasResume && (
              <a
                href={site.resumeUrl}
                onClick={close}
                className="menu-link mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-ink/25 px-4 py-2.5 font-semibold text-ink"
                style={{ '--stagger': `${60 + links.length * 55}ms` } as React.CSSProperties}
              >
                Download Résumé →
              </a>
            )}
          </nav>

          <div
            className="menu-link flex items-center justify-between border-t border-line px-8 py-6 text-sm font-medium text-ink-2"
            style={{ '--stagger': `${120 + links.length * 55}ms` } as React.CSSProperties}
          >
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span className="flex gap-4">
              <a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              {site.linkedin && (
                <a href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
