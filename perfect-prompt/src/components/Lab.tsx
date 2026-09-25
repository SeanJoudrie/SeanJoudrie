import { useEffect, useState } from 'react'
import { labTests, type LabTest } from '../data/lab'
import { Button, Card } from './ui'

export function Lab({ focus }: { focus?: string }) {
  useEffect(() => {
    if (focus) document.getElementById(`lab-${focus}`)?.scrollIntoView()
  }, [focus])
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Lab</h2>
        <p className="mt-2 max-w-[65ch] text-ink-2">
          A prompt is only as good as what it produces. Each test takes a frozen copy of a real page, hands the same page to separate runs that differ only in the prompt, and compares the results side by side. The live apps are never touched.
        </p>
      </div>
      {labTests.map((t) => <Test key={t.slug} t={t} />)}
    </div>
  )
}

function Test({ t }: { t: LabTest }) {
  const [view, setView] = useState<'desktop' | 'mobile'>('mobile')
  const base = `./lab/${t.slug}`
  return (
    <article aria-labelledby={`lab-${t.slug}`} className="space-y-6">
      <header>
        <p className="text-sm text-ink-2">{t.date}</p>
        <h3 id={`lab-${t.slug}`} className="mt-1 text-lg font-semibold">{t.title}</h3>
        <p className="mt-2 max-w-[65ch]">{t.question}</p>
      </header>

      <Card className="border-accent">
        <h4 className="text-base font-semibold">Result</h4>
        <p className="mt-2 max-w-[70ch]">{t.verdict}</p>
      </Card>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Screen size">
        {(['mobile', 'desktop'] as const).map((v) => (
          <Button key={v} aria-pressed={view === v} variant={view === v ? 'primary' : 'secondary'} onClick={() => setView(v)}>{v === 'mobile' ? 'Phone' : 'Desktop'}</Button>
        ))}
      </div>

      <div className={`grid gap-4 ${view === 'mobile' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'lg:grid-cols-3'}`}>
        {t.versions.map((v) => (
          <figure key={v.key} className="min-w-0">
            <figcaption className="mb-2">
              <span className="block text-sm font-semibold">{v.label}</span>
              <span className="block text-sm text-ink-2">{v.byline}</span>
            </figcaption>
            <a href={`${base}/${v.key}/`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-ui border border-line bg-card">
              <img src={`${base}/shots/${v.key}-${view}.png`} alt={`${v.label}, ${view === 'mobile' ? 'phone' : 'desktop'} screenshot`} loading="lazy" className="block w-full" />
              <span className="sr-only"> (opens the page in a new tab)</span>
            </a>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {v.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </figure>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-sm text-ink-2">{t.scoreCaption}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4 font-semibold">Criterion</th>
              {t.versions.map((v) => <th key={v.key} scope="col" className="py-2 pr-4 font-semibold">{v.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {t.scores.map((s) => (
              <tr key={s.criterion} className="border-b border-line align-top">
                <th scope="row" className="py-2 pr-4 font-normal">{s.criterion}</th>
                {t.versions.map((v) => <td key={v.key} className="py-2 pr-4">{s.values[v.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-label="What this test taught">
        <h4 className="text-base font-semibold">What it taught</h4>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {t.lessons.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>
    </article>
  )
}
