import { useEffect, useState } from 'react'

/**
 * First-load cold open: name rises + a gold rule draws, ~1.2s, then fades out.
 * Skippable by any input (click / key / scroll / touch) and shown only once
 * per session. Reduced-motion users get a near-instant dismiss.
 */
export function ColdOpen() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('sj-intro')
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem('sj-intro', '1')
    } catch {
      /* ignore */
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const done = () => setShow(false)
    const t = window.setTimeout(done, reduced ? 450 : 1600)
    const onKey = () => done()
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', done, { passive: true, once: true })
    window.addEventListener('touchstart', done, { passive: true, once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="coldopen" onClick={() => setShow(false)} role="presentation">
      <div className="coldopen__inner">
        <div className="coldopen__name text-3xl sm:text-5xl">
          Sean Joudrie<span className="text-accent">.</span>
        </div>
        <div className="coldopen__rule" />
        <p className="coldopen__tag annotation">Human-Systems Design</p>
      </div>
      <button
        className="coldopen__skip annotation text-faint transition-colors hover:text-ink"
        onClick={() => setShow(false)}
      >
        Skip →
      </button>
    </div>
  )
}
