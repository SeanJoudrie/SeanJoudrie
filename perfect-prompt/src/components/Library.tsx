import { useRef, useState } from 'react'
import { checkPrompt } from '../lib/check'
import { ratingLabel, ratingOrder, type Entry, type Rating, type useLibrary } from '../lib/library'
import { Button, Card, CopyButton, inputClass, Pre, TextArea } from './ui'
import { ScoreBadge } from './CheckPanel'

type Lib = ReturnType<typeof useLibrary>

const ratingStyle: Record<Rating, string> = {
  great: 'bg-accent-soft text-accent',
  ok: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
}

export function Library({ lib, onCheck, onLab }: { lib: Lib; onCheck: (text: string) => void; onLab: (slug: string) => void }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const tags = [...new Set(lib.entries.flatMap((e) => e.tags))].sort()
  const q = query.trim().toLowerCase()
  const shown = lib.entries
    .filter((e) => !tag || e.tags.includes(tag))
    .filter((e) => !q || `${e.title} ${e.body} ${e.tags.join(' ')} ${e.notes ?? ''}`.toLowerCase().includes(q))
    .map((e) => ({ e, score: checkPrompt(e.body).score }))
    .sort((a, b) => ratingOrder[a.e.rating ?? 'none'] - ratingOrder[b.e.rating ?? 'none'] || b.e.uses - a.e.uses || b.score - a.score)

  const download = () => {
    const url = URL.createObjectURL(new Blob([lib.exportJson()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `prompt-library-${new Date().toISOString().slice(0, 10)}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File) => {
    try {
      setMessage(`Imported ${lib.importJson(await file.text())} prompts.`)
    } catch {
      setMessage('That file isn’t a prompt library export.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Library</h2>
          <p className="mt-2 max-w-[65ch] text-ink-2">Prompts that worked rise to the top. Rate a prompt after you use it; that rating is what makes this list worth keeping.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setAdding((a) => !a)}>{adding ? 'Cancel' : 'Add a prompt'}</Button>
          <Button onClick={download}>Export</Button>
          <Button onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
        </div>
      </div>
      {message && <p role="status" className="text-sm text-ink-2">{message}</p>}
      <p className="text-sm text-ink-2">Saved in this browser only. Export to back up or move to another device.</p>

      {adding && <AddForm onAdd={(e) => { lib.add(e); setAdding(false) }} />}

      <div className="flex flex-wrap gap-2">
        <input className={`${inputClass} max-w-[320px]`} type="search" aria-label="Search prompts" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="min-h-10 rounded-ui border border-line bg-card px-3 text-sm" aria-label="Filter by tag" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <ul className="list-none space-y-4 p-0">
        {shown.map(({ e, score }) => <Item key={e.id} e={e} score={score} lib={lib} onCheck={onCheck} onLab={onLab} />)}
        {shown.length === 0 && <li className="text-ink-2">Nothing matches.</li>}
      </ul>
    </div>
  )
}

function Item({ e, score, lib, onCheck, onLab }: { e: Entry; score: number; lib: Lib; onCheck: (t: string) => void; onLab: (slug: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{e.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {e.rating && <span className={`rounded-ui px-2 py-1 font-medium ${ratingStyle[e.rating]}`}>{ratingLabel[e.rating]}</span>}
              <ScoreBadge score={score} />
              {e.tags.map((t) => <span key={t} className="rounded-ui border border-line px-2 py-0.5 text-ink-2">{t}</span>)}
              {e.uses > 0 && <span className="text-ink-2">Copied {e.uses}×</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton variant="primary" text={e.body} onCopied={() => lib.update(e.id, { uses: e.uses + 1 })} />
            <Button onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Hide' : 'Show'}</Button>
          </div>
        </div>
        {e.source && <p className="mt-3 text-sm text-ink-2">Source: {e.source}</p>}
        {e.notes && !open && <p className="mt-2 text-sm">{e.notes}</p>}

        {open && (
          <div className="mt-4 space-y-4">
            <Pre>{e.body}</Pre>
            <fieldset className="border-0 p-0">
              <legend className="text-sm font-semibold">How did it work?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['great', 'ok', 'bad'] as Rating[]).map((r) => (
                  <Button key={r} aria-pressed={e.rating === r} className={e.rating === r ? ratingStyle[r] : ''} onClick={() => lib.update(e.id, { rating: e.rating === r ? undefined : r })}>{ratingLabel[r]}</Button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-sm font-semibold">Notes</span>
              <span className="mt-2 block"><TextArea rows={2} placeholder="What it was good at, what you had to fix after…" defaultValue={e.notes ?? ''} onBlur={(ev) => ev.target.value !== (e.notes ?? '') && lib.update(e.id, { notes: ev.target.value })} /></span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onCheck(e.body)}>Check it</Button>
              {e.lab && <Button onClick={() => onLab(e.lab!)}>See the Lab test</Button>}
              {!e.seeded && <Button variant="quiet" onClick={() => { if (confirm(`Delete “${e.title}”?`)) lib.remove(e.id) }}>Delete</Button>}
            </div>
          </div>
        )}
      </Card>
    </li>
  )
}

function AddForm({ onAdd }: { onAdd: (e: Omit<Entry, 'id' | 'created' | 'uses'>) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [source, setSource] = useState('')
  return (
    <Card>
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); onAdd({ title: title.trim() || 'Untitled prompt', body, tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), source: source.trim() || undefined }) }}>
        <input className={inputClass} aria-label="Title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextArea rows={10} mono aria-label="Prompt" placeholder="The prompt" required value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={inputClass} aria-label="Tags" placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
          <input className={inputClass} aria-label="Source" placeholder="Where it came from (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <Button type="submit" variant="primary" disabled={!body.trim()}>Save</Button>
      </form>
    </Card>
  )
}
