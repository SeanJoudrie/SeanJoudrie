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
import { CommandPalette } from './components/CommandPalette'
import { useRoute } from './lib/router'

const GlobalioCaseStudy = lazy(() => import('./pages/GlobalioCaseStudy'))
const RexCaseStudy = lazy(() => import('./pages/RexCaseStudy'))
const FlexynCaseStudy = lazy(() => import('./pages/FlexynCaseStudy'))
const AeroScaleDashboard = lazy(() => import('./pages/AeroScaleDashboard'))
const MeridianConfigurator = lazy(() => import('./pages/MeridianConfigurator'))
const LedgerLens = lazy(() => import('./pages/LedgerLens'))
const PalisadeGrid = lazy(() => import('./pages/PalisadeGrid'))
const Skein = lazy(() => import('./pages/Skein'))
const Terra = lazy(() => import('./pages/Terra'))
const Cortex = lazy(() => import('./pages/Cortex'))
const Skull = lazy(() => import('./pages/Skull'))
const Bloom = lazy(() => import('./pages/Bloom'))
const Riff = lazy(() => import('./pages/Riff'))

const CASE_PAGES: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  globalio: GlobalioCaseStudy,
  rex: RexCaseStudy,
  flexyn: FlexynCaseStudy,
}

// Demos are standalone products — they bring their own chrome, so the
// portfolio nav and footer stay out of the frame. Each declares the shell
// classes its loading state wears so the chunk never flashes paper.
const DEMO_PAGES: Record<
  string,
  { Page: React.LazyExoticComponent<() => React.JSX.Element>; label: string; shell: string; spinner: string }
> = {
  aeroscale: { Page: AeroScaleDashboard, label: 'AeroScale UI demo', shell: 'bg-aero-bg', spinner: 'text-aero-muted' },
  meridian: {
    Page: MeridianConfigurator,
    label: 'Meridian configurator demo',
    shell: 'bg-meridian-bg',
    spinner: 'text-meridian-muted',
  },
  'ledger-lens': {
    Page: LedgerLens,
    label: 'Ledger Lens receipt extractor demo',
    shell: 'bg-ledger-bg',
    spinner: 'text-ledger-muted',
  },
  palisade: {
    Page: PalisadeGrid,
    label: 'Palisade data grid demo',
    shell: 'bg-palisade-bg',
    spinner: 'text-palisade-muted',
  },
  skein: {
    Page: Skein,
    label: 'Skein link-analysis demo',
    shell: 'bg-skein-bg',
    spinner: 'text-skein-muted',
  },
  terra: {
    Page: Terra,
    label: 'Terra particle Earth demo',
    shell: 'bg-terra-bg',
    spinner: 'text-terra-muted',
  },
  cortex: {
    Page: Cortex,
    label: 'Cortex particle brain demo',
    shell: 'bg-cortex-bg',
    spinner: 'text-cortex-muted',
  },
  skull: {
    Page: Skull,
    label: 'Skull particle demo',
    shell: 'bg-skull-bg',
    spinner: 'text-skull-muted',
  },
  bloom: {
    Page: Bloom,
    label: 'Bloom voxel rose demo',
    shell: 'bg-bloom-bg',
    spinner: 'text-bloom-muted',
  },
  riff: {
    Page: Riff,
    label: 'Riff playable guitar demo',
    shell: 'bg-riff-bg',
    spinner: 'text-riff-muted',
  },
}

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

  const demo = demoSlug ? DEMO_PAGES[demoSlug] : undefined
  if (demo) {
    return (
      <main aria-label={demo.label}>
        <Suspense
          fallback={
            <div className={`grid min-h-svh place-items-center ${demo.shell}`}>
              <span className={`coord ${demo.spinner}`}>loading demo…</span>
            </div>
          }
        >
          <demo.Page />
        </Suspense>
      </main>
    )
  }

  const CasePage = caseSlug ? CASE_PAGES[caseSlug] : undefined
  if (CasePage) {
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
            <CasePage />
          </Suspense>
        </main>
        <CommandPalette />
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
      {/* Range-first: the demo shelf is the fastest proof of breadth, so it
          leads; the deeper case studies and Lab follow. */}
      <main aria-label="Portfolio">
        <Hero />
        <Range />
        <About />
        <Work />
        <Lab />
        <Now />
        <Contact />
      </main>
      <CommandPalette />
      <Footer />
    </>
  )
}
