import { useEffect, useState } from 'react'
import { Build } from './components/Build'
import { Check } from './components/Check'
import { Lab } from './components/Lab'
import { Library } from './components/Library'
import { useLibrary } from './lib/library'
import { load, save } from './lib/storage'

const tabs = [
  { id: 'build', label: 'Build' },
  { id: 'check', label: 'Check' },
  { id: 'library', label: 'Library' },
  { id: 'lab', label: 'Lab' },
] as const
type Tab = (typeof tabs)[number]['id']

const parseHash = (): { tab: Tab; arg?: string } => {
  const [tab, arg] = location.hash.replace(/^#\/?/, '').split('/')
  return { tab: tabs.some((t) => t.id === tab) ? (tab as Tab) : 'build', arg }
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const [checkText, setCheckText] = useState(() => load('pp.check.v1', ''))
  const lib = useLibrary()

  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => save('pp.check.v1', checkText), [checkText])

  const go = (tab: Tab, arg?: string) => { location.hash = `/${tab}${arg ? `/${arg}` : ''}` }
  const saveToLibrary = (title: string, body: string) => lib.add({ title, body, tags: [] })

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-ui focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4">
        <a href="#/build" className="flex items-center gap-2 text-ink no-underline">
          <img src="./favicon.svg" alt="" width="28" height="28" />
          <span className="text-lg font-semibold">Perfect Prompt</span>
        </a>
        <nav aria-label="Sections">
          <ul className="m-0 flex list-none gap-1 p-0">
            {tabs.map((t) => (
              <li key={t.id}>
                <a
                  href={`#/${t.id}`}
                  aria-current={route.tab === t.id ? 'page' : undefined}
                  className={`inline-flex min-h-10 items-center rounded-ui px-3 text-sm font-medium no-underline ${route.tab === t.id ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:text-ink'}`}
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="py-8 outline-none">
        {route.tab === 'build' && <Build onSave={saveToLibrary} />}
        {route.tab === 'check' && <Check text={checkText} setText={setCheckText} entries={lib.entries} onSave={saveToLibrary} />}
        {route.tab === 'library' && <Library lib={lib} onCheck={(t) => { setCheckText(t); go('check') }} onLab={(slug) => go('lab', slug)} />}
        {route.tab === 'lab' && <Lab focus={route.arg} />}
      </main>

      <footer className="border-t border-line py-6 text-sm text-ink-2">
        Everything you write stays in this browser. Nothing is sent anywhere unless you copy it.
      </footer>
    </div>
  )
}
