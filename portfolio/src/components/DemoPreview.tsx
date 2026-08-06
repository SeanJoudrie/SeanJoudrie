import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { navigate } from '../lib/router'

function webglOk(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * A Range card's live 3D slot. The scene mounts as the card approaches and then
 * STAYS mounted for the life of the page. A clean click (press + release without
 * a drag) opens the full demo.
 *
 * This used to unmount the scene once you scrolled well past, to keep the number
 * of live WebGL contexts down, and fall back to a hand-drawn SVG thumbnail in
 * the meantime. Both are gone on purpose. The thumbnails were a stand-in for the
 * real thing and read as one — a card that shows a schematic where a model was a
 * moment ago looks broken, whatever the reason. And the churn was self-defeating:
 * every mount/unmount cycle asked the browser for another context, which is what
 * pushed the page into its 16-context budget and got live scenes evicted in the
 * first place. Six cards mounted once and left alone is a steady seven contexts
 * with Meridian, which is both fewer than the churn peaked at and predictable.
 *
 * Keeping them mounted is only affordable because they do not all keep DRAWING.
 * Seven simultaneous render loops measured the whole page down to 2 fps, so each
 * scene takes an `active` flag and switches its frameloop to 'demand' when its
 * card is off screen: geometry and context retained, nothing rendered. Meridian
 * has always worked this way, which is why it was the one card that never broke.
 *
 * There is no fallback element at all now. Before the scene mounts the slot is
 * simply the card's own dark background, which is what "nothing standing in for
 * it" means.
 */
export function DemoPreview({
  href,
  label,
  render,
}: {
  href: string
  label: string
  /**
   * Renders the scene. Call onFail on a lost GL context to remount it; pass
   * `active` straight through so the scene idles while the card is off screen.
   */
  render: (p: { onFail: () => void; active: boolean }) => ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  /** Whether the card is actually on screen. Off screen, the scene stops drawing. */
  const [inView, setInView] = useState(false)
  /** Remount count after a lost context. Bounded, so a dead GPU cannot churn. */
  const [attempt, setAttempt] = useState(0)
  const down = useRef<{ x: number; y: number } | null>(null)

  // A browser keeps a budget of live WebGL contexts (Chrome: 16 per renderer)
  // and evicts the oldest to make room. Now that nothing unmounts, the page sits
  // well inside that budget — but an eviction, a driver reset or a backgrounded
  // tab can still take a context away, and the scene reports it through onFail.
  // That is recoverable, so remount rather than give up; the bound is there so a
  // genuinely broken GPU does not spin.
  const RETRIES = 3
  const fail = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    // Nothing to fall back to, so a device without WebGL simply gets an empty
    // slot rather than a fake picture of one.
    if (!webglOk()) return
    const el = wrap.current
    if (!el) return
    // Load once, well before the card arrives, and stop watching. The margin is
    // deliberately larger than a viewport so the scene is already drawing by the
    // time the card is worth looking at.
    const load = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setMounted(true)
        load.disconnect()
      },
      { rootMargin: '600px' },
    )
    // A second, tighter observer drives whether the scene draws. Seven mounted
    // scenes all rendering at once measured the whole page down to 2 fps, so
    // this is not a nicety — it is what makes keeping them mounted affordable.
    const view = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 })
    load.observe(el)
    view.observe(el)
    return () => {
      load.disconnect()
      view.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrap}
      className="relative h-full w-full cursor-pointer"
      role="img"
      aria-label={`${label} — drag to orbit, click to open the demo`}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        const d = down.current
        down.current = null
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) navigate(href)
      }}
    >
      {mounted && attempt <= RETRIES && (
        // Keyed on the attempt so a lost context gets a genuinely fresh scene
        // rather than a re-render of the dead one.
        <Suspense fallback={null} key={attempt}>
          {render({ onFail: fail, active: inView })}
        </Suspense>
      )}
    </div>
  )
}
