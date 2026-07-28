import { Suspense, useEffect, useRef, useState } from 'react'
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
      {near && !failed ? <Suspense fallback={thumb}>{render(() => setFailed(true))}</Suspense> : thumb}
    </div>
  )
}
