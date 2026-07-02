import { Suspense, lazy, useEffect } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { About } from './components/About'
import { Lab } from './components/Lab'
import { Now } from './components/Now'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { useRoute } from './lib/router'

const GlobalioCaseStudy = lazy(() => import('./pages/GlobalioCaseStudy'))

export default function App() {
  const { caseSlug } = useRoute()

  // Landing back on home with a plain section hash (#work, #about…):
  // scroll to it once the sections exist.
  useEffect(() => {
    if (caseSlug) return
    const m = window.location.hash.match(/^#([a-z-]+)$/)
    if (!m) return
    requestAnimationFrame(() => {
      // Section anchors scroll to themselves; drawer slugs (#rex…) have no
      // element, so land on the Work section the drawer belongs to.
      const el = document.getElementById(m[1]) ?? document.getElementById('work')
      el?.scrollIntoView()
    })
  }, [caseSlug])

  if (caseSlug === 'globalio') {
    return (
      <>
        <Nav />
        <main aria-label="Case study">
          <Suspense
            fallback={
              <div className="grid min-h-svh place-items-center">
                <span className="coord">loading plate…</span>
              </div>
            }
          >
            <GlobalioCaseStudy />
          </Suspense>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-paper"
      >
        Skip to the work
      </a>
      <Nav />
      <main aria-label="Portfolio">
        <Hero />
        <Work />
        <About />
        <Lab />
        <Now />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
