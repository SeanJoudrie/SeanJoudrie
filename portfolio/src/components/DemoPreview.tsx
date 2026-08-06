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
 * A Range card's live 3D slot. Mounts the real (auto-rotating) scene only while
 * the card is near the viewport and UNMOUNTS it once scrolled well past — so at
 * most a couple of heavy WebGL contexts are ever alive at once. Falls back to
 * the static thumbnail on devices without WebGL or after a lost context. A
 * clean click (press + release without a drag) opens the full demo.
 */
export function DemoPreview({
  href,
  label,
  thumb,
  render,
}: {
  href: string
  label: string
  thumb: ReactNode
  /** Renders the scene; call onFail on a lost GL context to drop to the thumb. */
  render: (onFail: () => void) => ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [failed, setFailed] = useState(false)
  const down = useRef<{ x: number; y: number } | null>(null)

  // Why `failed` latches at all: a device without WebGL, or one whose driver has
  // given up, will not do better on the next scroll — retrying forever would
  // just churn. But it must latch on FAILURES ONLY, and tearing our own scene
  // down is not one. Releasing a context fires `webglcontextlost` on the way
  // out, and every scene forwards that to onFail (see Cortex/Scene.tsx and
  // friends), so an unmount used to permanently mark the card broken: scroll
  // past a card and it came back as its thumbnail, for the life of the page.
  //
  // `wanted` is the discriminator — did we still want this scene when it
  // reported trouble? It is assigned during render, which is the only point
  // that is early enough: React renders with near=false, THEN commits the
  // unmount, THEN the child's cleanup fires the lost-context event. A layout
  // effect would run too late and a closure over `near` would be stale, because
  // the handler the scene registered captured the onFail it was mounted with.
  //
  // The lost-context event is dispatched as a queued task rather than inline,
  // which is still early enough: that task drains before the next frame, and an
  // IntersectionObserver cannot call back more than once per frame — so `near`
  // cannot have flipped true again by the time the event lands.
  const wanted = useRef(false)
  wanted.current = near
  const fail = useCallback(() => {
    if (wanted.current) setFailed(true)
  }, [])

  useEffect(() => {
    if (!webglOk()) {
      setFailed(true)
      return
    }
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '350px' })
    io.observe(el)
    return () => io.disconnect()
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
      {near && !failed ? <Suspense fallback={thumb}>{render(fail)}</Suspense> : thumb}
    </div>
  )
}
