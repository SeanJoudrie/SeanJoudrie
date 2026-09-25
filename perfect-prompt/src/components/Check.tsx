import type { Entry } from '../lib/library'
import { Button, Card, CopyButton, TextArea } from './ui'
import { CheckPanel } from './CheckPanel'

export function Check({ text, setText, entries, onSave }: { text: string; setText: (t: string) => void; entries: Entry[]; onSave: (title: string, body: string) => void }) {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
      <section aria-labelledby="check-in" className="space-y-4">
        <h2 id="check-in" className="text-xl font-semibold">Check any prompt</h2>
        <p className="max-w-[65ch] text-ink-2">Paste a prompt you found, wrote, or got back from the builder. The check looks for the parts that most often separate a generic result from a good one.</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-ink-2" htmlFor="load">Or load one from the Library:</label>
          <select id="load" className="min-h-10 max-w-full rounded-ui border border-line bg-card px-3 text-sm" value="" onChange={(e) => { const hit = entries.find((x) => x.id === e.target.value); if (hit) setText(hit.body) }}>
            <option value="">Choose…</option>
            {entries.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <TextArea rows={18} mono aria-label="Prompt to check" placeholder="Paste a prompt here…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <CopyButton text={text} />
          <Button onClick={() => onSave(text.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 60) || 'Untitled prompt', text)} disabled={!text.trim()}>Save to Library</Button>
          <Button variant="quiet" onClick={() => setText('')} disabled={!text}>Clear</Button>
        </div>
      </section>
      <aside aria-label="Results" className="lg:sticky lg:top-4">
        <Card>
          <CheckPanel text={text} />
        </Card>
      </aside>
    </div>
  )
}
