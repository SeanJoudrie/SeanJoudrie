import { useEffect, useState } from 'react'

/** A thin gold bar at the top of the page tracking scroll progress. */
export function ScrollProgressBar() {
  const [p, setP] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setP(max > 0 ? el.scrollTop / max : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[70] h-0.5">
      <div
        className="h-full w-full origin-left bg-accent"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  )
}
