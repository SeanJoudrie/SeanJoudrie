import { useEffect, useState } from 'react'
import { compose, emptyDraft, withRamble, type Draft } from '../lib/builder'
import { load, save } from '../lib/storage'
import { Button, Card, CopyButton, Field, inputClass, Pre, TextArea } from './ui'
import { CheckPanel } from './CheckPanel'

const DRAFT = 'pp.draft.v1'

const hints = {
  goal: 'What the model is, and the one outcome you want. “You are a front-end engineer. Build the landing page for…”',
  context: 'What it can’t guess: what the project is, who it’s for, what exists already, the stack, what you care about most.',
  task: 'What to do. Number the steps if order matters.',
  good: 'How you’ll judge it. Make it checkable: “a new user logs a workout in 3 taps”, not “make it good”.',
  output: 'What to hand back (files, format, length) and what to do when unsure.',
}

export function Build({ onSave }: { onSave: (title: string, body: string) => void }) {
  const [d, setD] = useState<Draft>(() => ({ ...emptyDraft, ...load<Partial<Draft>>(DRAFT, {}) }))
  const [title, setTitle] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => save(DRAFT, d), [d])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setRule = (i: number, k: 'rule' | 'why', v: string) => set('rules', d.rules.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const prompt = compose(d)

  const saveIt = () => {
    onSave(title.trim() || d.goal.trim().split(/[.\n]/)[0].slice(0, 60) || 'Untitled prompt', prompt)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="step1">
        <h2 id="step1" className="text-xl font-semibold">1. What are you making?</h2>
        <p className="mt-2 max-w-[65ch] text-ink-2">Say it however it comes out. Voice-to-text rambling is fine; that’s what the builder is for.</p>
        <div className="mt-4">
          <TextArea
            rows={5}
            aria-label="What are you making?"
            placeholder="I want to make an app that tracks my dog's… it's for me and my partner… it should feel quick, like two taps…"
            value={d.ramble}
            onChange={(e) => set('ramble', e.target.value)}
          />
        </div>
      </section>

      <section aria-labelledby="step2">
        <h2 id="step2" className="text-xl font-semibold">2. Build the prompt</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold">Let Claude build it</h3>
            <p className="mt-2 text-sm text-ink-2">Copies the Prompt Builder with your description attached. Paste it into a new Claude chat; it asks up to 5 questions, writes the prompt, and lists how it could still go wrong.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton variant="primary" text={withRamble(d.ramble)} label={d.ramble.trim() ? 'Copy builder + my description' : 'Copy the builder'} />
              <a className="inline-flex min-h-10 items-center rounded-ui border border-line px-4 text-sm font-medium text-ink no-underline hover:border-ink-2" href="https://claude.ai/new" target="_blank" rel="noreferrer">
                Open Claude<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold">Fill it in yourself</h3>
            <p className="mt-2 text-sm text-ink-2">Use the form below. The prompt builds as you type, and the check next to it shows what’s still missing.</p>
            <p className="mt-4 text-sm text-ink-2">Got the prompt back from Claude? Paste it into the Check tab, or save it straight to the Library.</p>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <section aria-labelledby="form" className="space-y-6">
          <h2 id="form" className="text-xl font-semibold">The prompt, section by section</h2>
          <Field label="Role and goal" hint={hints.goal}><TextArea rows={3} value={d.goal} onChange={(e) => set('goal', e.target.value)} /></Field>
          <Field label="Context" hint={hints.context}><TextArea rows={5} value={d.context} onChange={(e) => set('context', e.target.value)} /></Field>
          <Field label="The task" hint={hints.task}><TextArea rows={4} value={d.task} onChange={(e) => set('task', e.target.value)} /></Field>
          <fieldset className="border-0 p-0">
            <legend className="text-sm font-semibold">Constraints</legend>
            <p className="mt-1 text-sm text-ink-2">Each hard limit, with the reason. The reason is what lets the model handle cases you didn’t list.</p>
            <div className="mt-2 space-y-3">
              {d.rules.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClass} aria-label={`Rule ${i + 1}`} placeholder="Keep body text at 18px" value={r.rule} onChange={(e) => setRule(i, 'rule', e.target.value)} />
                  <input className={inputClass} aria-label={`Why rule ${i + 1}`} placeholder="because many users are older" value={r.why} onChange={(e) => setRule(i, 'why', e.target.value)} />
                  <Button variant="quiet" aria-label={`Remove rule ${i + 1}`} onClick={() => set('rules', d.rules.length > 1 ? d.rules.filter((_, j) => j !== i) : [{ rule: '', why: '' }])}>Remove</Button>
                </div>
              ))}
            </div>
            <Button className="mt-3" onClick={() => set('rules', [...d.rules, { rule: '', why: '' }])}>Add a rule</Button>
          </fieldset>
          <Field label="What good looks like" hint={hints.good}><TextArea rows={3} value={d.good} onChange={(e) => set('good', e.target.value)} /></Field>
          <Field label="Output" hint={hints.output}><TextArea rows={3} value={d.output} onChange={(e) => set('output', e.target.value)} /></Field>
          <Button variant="quiet" onClick={() => { if (confirm('Clear the whole draft?')) setD(emptyDraft) }}>Clear the draft</Button>
        </section>

        <aside aria-labelledby="preview" className="space-y-4 lg:sticky lg:top-4">
          <h2 id="preview" className="text-xl font-semibold">Your prompt</h2>
          {prompt ? <Pre>{prompt}</Pre> : <p className="rounded-ui border border-dashed border-line p-4 text-sm text-ink-2">Fill in a section and it appears here.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton variant="primary" text={prompt} label="Copy prompt" />
            <input className={`${inputClass} max-w-[240px] text-sm`} aria-label="Name for the library" placeholder="Name it (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button onClick={saveIt} disabled={!prompt}>{saved ? 'Saved to Library' : 'Save to Library'}</Button>
          </div>
          <Card>
            <h3 className="mb-4 text-base font-semibold">Check</h3>
            <CheckPanel text={prompt} />
          </Card>
        </aside>
      </div>
    </div>
  )
}
