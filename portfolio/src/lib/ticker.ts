import { useLayoutEffect, useRef } from 'react'

/**
 * The page's single rAF loop. Every tween on the dashboard — number
 * tickers, chart morphs — registers a frame task here, so one callback
 * drives them all and nothing ever runs on its own interval.
 */
type FrameTask = (now: number) => boolean

const tasks = new Set<FrameTask>()
let raf = 0

function loop(now: number) {
  for (const t of Array.from(tasks)) if (t(now)) tasks.delete(t)
  raf = tasks.size ? requestAnimationFrame(loop) : 0
}

/** Register a per-frame task (return true when done). Returns unsubscribe. */
export function addTask(t: FrameTask): () => void {
  tasks.add(t)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    tasks.delete(t)
    if (!tasks.size && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/**
 * Animated number that never re-renders React: writes formatted text
 * straight to the node. Counts from zero on first mount, then from the
 * *current* value on every retarget — a filter change tweens the delta,
 * it doesn't reload the page. Reduced motion sets the value outright.
 */
export function useCountUp(target: number, format: (n: number) => string, duration = 900) {
  const ref = useRef<HTMLSpanElement>(null)
  const valRef = useRef(0)
  const fmtRef = useRef(format)
  fmtRef.current = format

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = valRef.current
    if (reduced || from === target) {
      valRef.current = target
      el.textContent = fmtRef.current(target)
      return
    }
    el.textContent = fmtRef.current(from)
    const t0 = performance.now()
    return addTask((now) => {
      const p = Math.min(1, (now - t0) / duration)
      const v = from + (target - from) * easeOutExpo(p)
      valRef.current = v
      el.textContent = fmtRef.current(v)
      return p >= 1
    })
  }, [target, duration])

  return ref
}
