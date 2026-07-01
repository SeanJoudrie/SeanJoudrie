import { useEffect } from 'react'

/** Locks page scroll while `locked` is true (e.g. when a drawer is open). */
export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}
