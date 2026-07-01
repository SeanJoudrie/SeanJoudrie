import { useEffect, useRef, useState } from 'react'

/**
 * Tracks how far an element has travelled through the viewport, returning a
 * 0→1 progress value. Used to drive scroll-linked SVG path drawing.
 *
 * progress = 0 when the element's top hits the bottom of the viewport,
 * 1 once the element has scrolled up by `span` of the viewport height.
 * Honors prefers-reduced-motion by pinning progress to 1 (fully drawn).
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  span = 0.85,
) {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // start drawing when the top reaches ~78% down the viewport
      const start = vh * 0.78
      const distance = vh * span
      const p = (start - rect.top) / distance
      setProgress(Math.min(1, Math.max(0, p)))
    }

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [span])

  return { ref, progress }
}
