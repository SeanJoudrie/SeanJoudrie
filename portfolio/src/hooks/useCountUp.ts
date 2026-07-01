import { useEffect, useRef, useState } from 'react'

/**
 * Counts a number up to `target` once the element scrolls into view.
 * Eased (ease-out cubic). Honors prefers-reduced-motion by jumping to target.
 */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(
  target: number,
  duration = 1200,
) {
  const ref = useRef<T | null>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target)
      return
    }

    let raf = 0
    let start = 0
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          io.disconnect()
          const step = (ts: number) => {
            if (!start) start = ts
            const t = Math.min(1, (ts - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            setVal(target * eased)
            if (t < 1) raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
        })
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [target, duration])

  return { ref, val }
}
