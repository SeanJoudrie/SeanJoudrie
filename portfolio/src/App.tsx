import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { About } from './components/About'
import { Lab } from './components/Lab'
import { Now } from './components/Now'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'

export default function App() {
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
