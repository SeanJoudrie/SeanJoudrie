import { useEffect, useRef, useState } from 'react'

/**
 * Reveal-on-scroll. Adds the `.reveal-on` class once the element enters the
 * viewport. Honors prefers-reduced-motion by revealing immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) {
      setShown(true)
      return
    }

    // threshold 0 — latch as soon as ANY pixel of the block is on screen.
    // A higher threshold means a block taller than the viewport, or one you
    // fly past, can fail to qualify and stay faded. Only the boolean is read,
    // never a ratio, and it is latched once and never cleared.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, shown }
}
