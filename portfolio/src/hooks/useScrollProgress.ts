import { useEffect, useRef } from 'react'

/** 21 steps ≈ every 5% of visibility — smooth enough to scrub, cheap enough
    to never touch a scroll handler. */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20)

/**
 * Scroll-linked reveal progress. Writes the element's visible fraction as a
 * `--reveal: 0..1` custom property (consumed by the .reveal / .parallax-*
 * CSS), updated only on IntersectionObserver ratio steps — no per-frame
 * scroll work. Elements taller than the viewport use "how much of the
 * viewport do I fill" instead, so they still reach 1. Reduced motion pins
 * everything at 1.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--reveal', '1')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const viewportH = e.rootBounds?.height ?? window.innerHeight
          const fill =
            viewportH > 0
              ? e.intersectionRect.height / Math.min(viewportH, Math.max(1, e.boundingClientRect.height))
              : 1
          const p = Math.min(1, Math.max(e.intersectionRatio, fill))
          ;(e.target as HTMLElement).style.setProperty('--reveal', p.toFixed(3))
        }
      },
      { threshold: THRESHOLDS },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}
