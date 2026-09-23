import { useState } from 'react'
import { BRAND } from '../data/brand'
import { PLATFORMS } from '../data/playbooks'
import { matchProblems, PROBLEMS } from '../data/problems'
import { CULPRITS, MAX_CATEGORIES, TOPICS } from '../data/topics'
import type { Session, Tally } from '../lib/types'
import { CloseIcon, PlatformIcon } from './icons'
import { Mascot } from './Mascot'
import { Button, Card, Chip, StepHeader } from './ui'

type Update = (patch: Partial<Session>) => void

/* ---------- Landing (G-01) ---------- */

export function Landing({ onStart, onResume }: { onStart: () => void; onResume: (() => void) | null }) {
  return (
    <div className="anim-rise">
      <div className="flex flex-col items-center text-center">
        <Mascot pose="wave" size={150} />
        <h1 tabIndex={-1} className="font-display m-0 mt-4 max-w-[16ch] text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">{BRAND.tagline}</h1>
        <p className="m-0 mt-4 max-w-[46ch] text-lg text-ink-2">
          Tell us what took over your YouTube, Instagram, TikTok or X feed and what you’d rather see. You get the exact settings to change and a playlist that pulls your feed back toward your mix.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button onClick={onStart} className="px-7 text-lg">
            Start my tune-up <span className="font-normal opacity-80">(2 min)</span>
          </Button>
          {onResume && (
            <Button variant="ghost" onClick={onResume}>
              Continue where I left off
            </Button>
          )}
        </div>
        <p className="m-0 mt-4 text-sm text-muted">No login. Nothing leaves your browser.</p>
      </div>

      <section className="mt-14" aria-labelledby="how">
        <h2 id="how" className="font-display m-0 mb-4 text-center text-xl font-bold">
          Why feeds get stuck
        </h2>
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {[
            ['1', 'One curious click', 'You watch one video about something. The app treats it as a strong hint.'],
            ['2', 'More of the same', 'Your feed fills with it. Short on time, you pick one anyway.'],
            ['3', 'The loop locks in', 'Every pick confirms it. Soon it’s 20 of the same thing.'],
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-xl border border-line bg-card p-4">
              <span className="font-display text-2xl font-bold text-accent-ink">{n}</span>
              <h3 className="m-0 mt-1 text-base font-semibold">{t}</h3>
              <p className="m-0 mt-1 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-4 text-center text-sm text-ink-2">
          The fix: <strong className="text-ink">remove first, then add.</strong> Your thumb is a vote, even when you don’t mean it.
        </p>
      </section>
    </div>
  )
}

/* ---------- Platform (F-01) ---------- */

export function PlatformStep({ s, update, next }: { s: Session; update: Update; next: () => void }) {
  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title="Which feed are we fixing?" say="YouTube gets the full tune-up. The others get a tip guide." />
      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            aria-pressed={s.platform === p.id}
            onClick={() => {
              update({ platform: p.id })
              next()
            }}
            className={`flex min-h-28 flex-col items-start justify-between rounded-xl border-2 p-4 text-left transition ${
              s.platform === p.id ? 'border-ink bg-accent-soft' : 'border-line bg-card hover:border-ink-2'
            }`}
          >
            <PlatformIcon id={p.id} className="text-ink-2" />
            <span>
              <span className="block font-semibold text-ink">{p.label}</span>
              <span className={`text-sm ${p.depth === 'full' ? 'text-accent-ink font-semibold' : 'text-muted'}`}>
                {p.depth === 'full' ? 'Full tune-up' : 'Tip guide'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Likes (F-02) ---------- */

export function LikesStep({ s, update }: { s: Session; update: Update }) {
  const [text, setText] = useState('')
  const [showAll, setShowAll] = useState(() => s.likes.some((l) => TOPICS.find((t) => t.id === l && !t.popular)))
  const full = s.likes.length >= MAX_CATEGORIES
  const toggle = (id: string) =>
    update({ likes: s.likes.includes(id) ? s.likes.filter((x) => x !== id) : full ? s.likes : [...s.likes, id] })
  const customLikes = s.likes.filter((l) => !TOPICS.some((t) => t.id === l))
  const q = text.trim().toLowerCase()
  // Typing filters the whole library; otherwise show the popular dozen (plus anything already picked).
  const visible = q
    ? TOPICS.filter((t) => t.label.toLowerCase().includes(q) || t.children.some((c) => c.label.toLowerCase().includes(q)))
    : TOPICS.filter((t) => showAll || t.popular || s.likes.includes(t.id))
  const exact = TOPICS.find((t) => t.label.toLowerCase() === q)
  const add = () => {
    const v = text.trim().replace(/\s+/g, ' ').slice(0, 40)
    if (!v || full) return
    if (exact) {
      if (!s.likes.includes(exact.id)) update({ likes: [...s.likes, exact.id] })
    } else if (!s.likes.some((l) => l.toLowerCase() === v.toLowerCase())) {
      update({ likes: [...s.likes, v] })
    }
    setText('')
  }
  return (
    <div className="anim-rise">
      <StepHeader pose="wave" title="What do you actually want to see?" say={`Pick up to ${MAX_CATEGORIES}. These become your mix.`} />
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label className="sr-only" htmlFor="custom-like">
          Search topics or add your own
        </label>
        <input
          id="custom-like"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search or add your own (e.g. Lego Technic)"
          autoComplete="off"
          disabled={full}
          className="min-h-11 min-w-0 flex-1 rounded-full border-2 border-line bg-card px-4 text-base text-ink placeholder:text-muted focus:border-ink"
        />
        <Button variant="secondary" type="submit" disabled={!text.trim() || full}>
          Add
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {visible.map((t) => (
          <Chip key={t.id} selected={s.likes.includes(t.id)} onClick={() => toggle(t.id)} disabled={full && !s.likes.includes(t.id)}>
            {t.label}
          </Chip>
        ))}
        {customLikes.map((l) => (
          <Chip key={l} selected onClick={() => toggle(l)} aria-label={`Remove ${l}`}>
            {l} <CloseIcon />
          </Chip>
        ))}
      </div>
      {q && visible.length === 0 && !full && (
        <p className="m-0 mt-3 text-sm text-muted">Not in our list. Press Add and it becomes its own slice.</p>
      )}
      {!q && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-4 min-h-11 text-sm font-semibold text-accent-ink hover:underline" aria-expanded={showAll}>
          {showAll ? 'Show fewer topics' : `More topics (${TOPICS.length - TOPICS.filter((t) => t.popular).length})`}
        </button>
      )}
      <p className="m-0 mt-2 text-sm text-muted">
        {full ? `That’s ${MAX_CATEGORIES}, the most a mix can hold. Remove one to pick another.` : s.likes.length === 0 ? 'Pick nothing and we’ll start you on comedy, science and a surprise.' : `${s.likes.length} of ${MAX_CATEGORIES} picked.`}
      </p>
    </div>
  )
}

/* ---------- Problem (F-03) ---------- */

export function ProblemStep({ s, update }: { s: Session; update: Update }) {
  const toggle = (id: (typeof PROBLEMS)[number]['id']) =>
    update({ problems: s.problems.includes(id) ? s.problems.filter((p) => p !== id) : [...s.problems, id] })
  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title="What’s wrong with it?" say="Pick any that fit." />
      <div className="grid gap-2 sm:grid-cols-2">
        {PROBLEMS.map((p) => (
          <button
            key={p.id}
            aria-pressed={s.problems.includes(p.id)}
            onClick={() => toggle(p.id)}
            className={`flex min-h-16 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
              s.problems.includes(p.id) ? 'border-ink bg-accent-soft' : 'border-line bg-card hover:border-ink-2'
            }`}
          >
            <span>
              <span className="block font-semibold text-ink">{p.label}</span>
              <span className="text-sm text-muted">{p.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <label htmlFor="note" className="mt-5 block text-sm font-medium text-ink-2">
        Or say it in your own words (optional)
      </label>
      <textarea
        id="note"
        rows={2}
        maxLength={280}
        value={s.note}
        onChange={(e) => {
          const note = e.target.value
          const found = matchProblems(note).filter((p) => !s.problems.includes(p))
          update({ note, problems: found.length ? [...s.problems, ...found] : s.problems })
        }}
        placeholder="My feed is only Game of Thrones since I rewatched one scene…"
        className="mt-2 w-full rounded-xl border-2 border-line bg-card p-3 text-base text-ink placeholder:text-muted focus:border-ink"
      />
    </div>
  )
}

/* ---------- Too much of what (F-04, F-09) ---------- */

export function TooMuchStep({ s, update }: { s: Session; update: Update }) {
  const [text, setText] = useState('')
  const add = (v: string) => {
    const t = v.trim().replace(/\s+/g, ' ').slice(0, 40)
    if (!t || s.turnDown.some((x) => x.toLowerCase() === t.toLowerCase()) || s.turnDown.length >= 8) return
    update({ turnDown: [...s.turnDown, t] })
  }
  const remove = (t: string) => update({ turnDown: s.turnDown.filter((x) => x !== t) })
  const suggestions = CULPRITS.filter((c) => !s.turnDown.includes(c) && (!text || c.toLowerCase().includes(text.toLowerCase())))
  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title="Too much of what?" say="Name the shows, games, creators or topics that took over. Anything works." />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add(text)
          setText('')
        }}
      >
        <label className="sr-only" htmlFor="too-much">
          Something you’re getting too much of
        </label>
        <input
          id="too-much"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Game of Thrones"
          autoComplete="off"
          className="min-h-11 flex-1 rounded-full border-2 border-line bg-card px-4 text-base text-ink placeholder:text-muted focus:border-ink"
        />
        <Button variant="secondary" type="submit" disabled={!text.trim()}>
          Add
        </Button>
      </form>

      {s.turnDown.length > 0 && (
        <div className="mt-4 rounded-xl border-2 border-alarm bg-alarm-soft p-4">
          <p className="m-0 mb-2 text-sm font-semibold text-alarm">Turn down ({s.turnDown.length})</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {s.turnDown.map((t) => (
              <li key={t}>
                <button
                  onClick={() => remove(t)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-alarm bg-card px-3 text-base font-medium text-ink"
                  aria-label={`Remove ${t}`}
                >
                  {t} <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="m-0 mt-5 mb-2 text-sm text-muted">Common culprits</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 10).map((c) => (
          <Chip key={c} selected={false} tone="alarm" onClick={() => add(c)}>
            + {c}
          </Chip>
        ))}
      </div>
    </div>
  )
}

/* ---------- Baseline tally (G-02) ---------- */

export function TallyStep({
  value,
  onChange,
  title,
  say,
  sickOfLabel,
  nested = false,
}: {
  nested?: boolean
  value: Tally | null
  onChange: (t: Tally) => void
  title: string
  say: string
  sickOfLabel: string
}) {
  const t = value ?? { date: new Date().toISOString().slice(0, 10), wanted: 0, sickOf: 0, other: 0 }
  const total = t.wanted + t.sickOf + t.other
  const set = (k: 'wanted' | 'sickOf' | 'other', d: number) => {
    const n = Math.max(0, t[k] + d)
    if (d > 0 && total >= 20) return
    onChange({ ...t, date: new Date().toISOString().slice(0, 10), [k]: n })
  }
  const rows: { k: 'wanted' | 'sickOf' | 'other'; label: string; color: string }[] = [
    { k: 'sickOf', label: sickOfLabel, color: 'var(--alarm)' },
    { k: 'wanted', label: 'Stuff I actually want', color: 'var(--good)' },
    { k: 'other', label: 'Everything else', color: 'var(--muted)' },
  ]
  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title={title} say={say} nested={nested} />
      <Card className={nested ? '!border-0 !p-0' : ''}>
        <ul className="m-0 list-none space-y-3 p-0">
          {rows.map((r) => (
            <li key={r.k} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-base font-medium">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: r.color }} aria-hidden />
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                <button className="h-11 w-11 rounded-full border-2 border-line bg-card text-xl font-bold" onClick={() => set(r.k, -1)} aria-label={`One less: ${r.label}`}>
                  −
                </button>
                <output className="font-display w-8 text-center text-2xl font-bold tabular-nums" aria-live="polite">
                  {t[r.k]}
                </output>
                <button className="h-11 w-11 rounded-full border-2 border-ink bg-accent-soft text-xl font-bold" onClick={() => set(r.k, 1)} aria-label={`One more: ${r.label}`}>
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          {rows.map((r) => (
            <div key={r.k} className="bar-seg h-full" style={{ width: `${(t[r.k] / 20) * 100}%`, background: r.color }} />
          ))}
        </div>
        <p className="m-0 mt-2 text-sm text-muted">{total} of 20 counted</p>
      </Card>
    </div>
  )
}
