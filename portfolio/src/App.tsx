import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Work } from './components/Work'
import { Experience } from './components/Experience'
import { Now } from './components/Now'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'

export default function App() {
  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-950"
      >
        Skip to content
      </a>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Experience />
        <Now />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
