import { Suspense, lazy, useEffect } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { About } from './components/About'
import { Lab } from './components/Lab'
import { Range } from './components/Range'
import { Now } from './components/Now'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { useRoute } from './lib/router'

const GlobalioCaseStudy = lazy(() => import('./pages/GlobalioCaseStudy'))
const RexCaseStudy = lazy(() => import('./pages/RexCaseStudy'))
const AeroScaleDashboard = lazy(() => import('./pages/AeroScaleDashboard'))

export default function App() {
  const { caseSlug, demoSlug } = useRoute()

  // Landing back on home with a plain section hash (#work, #about…):
  // scroll to it once the sections exist.
  useEffect(() => {
    if (caseSlug || demoSlug) return
    const m = window.location.hash.match(/^#([a-z-]+)$/)
    if (!m) return
    requestAnimationFrame(() => {
      // Section anchors scroll to themselves; drawer slugs (#rex…) have no
      // element, so land on the Work section the drawer belongs to.
      const el = document.getElementById(m[1]) ?? document.getElementById('work')
      el?.scrollIntoView()
    })
  }, [caseSlug, demoSlug])

  // Demos are standalone products — they bring their own chrome, so the
  // portfolio nav and footer stay out of the frame.
  if (demoSlug === 'aeroscale') {
    return (
      <main aria-label="AeroScale UI demo">
        <Suspense
          fallback={
            <div className="grid min-h-svh place-items-center bg-aero-bg">
              <span className="coord text-aero-muted">loading demo…</span>
            </div>
          }
        >
          <AeroScaleDashboard />
        </Suspense>
      </main>
    )
  }

  if (caseSlug === 'globalio' || caseSlug === 'rex') {
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
            {caseSlug === 'globalio' ? <GlobalioCaseStudy /> : <RexCaseStudy />}
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
        <Range />
        <Now />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
