import { useEffect, useRef } from 'react'
import { useBodyLock } from '../hooks/useBodyLock'

export type LightboxImage = { src: string; alt: string }

/**
 * Full-screen image viewer. Click anywhere / Esc / ✕ closes; focus returns
 * to whatever opened it. Zoom-in entrance, instant under reduced motion.
 */
export function Lightbox({ image, onClose }: { image: LightboxImage; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const opener = useRef<Element | null>(null)
  useBodyLock(true)

  useEffect(() => {
    opener.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      ;(opener.current as HTMLElement | null)?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="lightbox fixed inset-0 z-[90] grid place-items-center bg-ink/75 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <figure className="lightbox-img max-h-full">
        <img
          src={image.src}
          alt={image.alt}
          className="max-h-[82vh] max-w-[92vw] rounded-xl border border-paper/20 shadow-2xl"
        />
        <figcaption className="mt-3 text-center text-sm text-paper/80">{image.alt}</figcaption>
      </figure>
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close image viewer"
        className="springy absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg border border-paper/30 text-paper hover:border-paper hover:bg-paper/10"
      >
        ✕
      </button>
    </div>
  )
}
