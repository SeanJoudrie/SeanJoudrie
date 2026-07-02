import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

/**
 * A deliberately tiny hash router: `#/work/<slug>` renders a case-study page;
 * anything else renders home. Navigation wraps the DOM swap in a View
 * Transition when the browser supports it (and motion isn't reduced), so the
 * plate morphs into the page instead of cutting.
 */
export type Route = { caseSlug: string | null }

function parse(hash: string): Route {
  const m = hash.match(/^#\/work\/([a-z0-9-]+)$/)
  if (m) return { caseSlug: m[1] }
  // Legacy deep links from the drawer era.
  if (hash === '#globalio') return { caseSlug: 'globalio' }
  if (hash === '#rex') return { caseSlug: 'rex' }
  if (hash === '#flexyn') return { caseSlug: 'flexyn' }
  return { caseSlug: null }
}

let route: Route = parse(window.location.hash)
const subs = new Set<() => void>()

function set(hash: string) {
  const next = parse(hash)
  if (next.caseSlug === route.caseSlug) return
  route = next
  subs.forEach((f) => f())
}

window.addEventListener('hashchange', () => set(window.location.hash))
window.addEventListener('popstate', () => set(window.location.hash))

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => route,
  )
}

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => void }

export function navigate(to: string) {
  // Section anchors (#work, #rex…) manage their own scroll via App's
  // effect / the drawer — jumping to top first would double-scroll.
  const isSection = /^#[a-z-]+$/.test(to)
  const apply = () => {
    history.pushState(null, '', to)
    flushSync(() => set(to))
    if (!isSection) window.scrollTo(0, 0)
  }
  const svt = (document as DocWithVT).startViewTransition?.bind(document)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (svt && !reduced) svt(apply)
  else apply()
}
