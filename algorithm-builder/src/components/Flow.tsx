import { useState } from 'react'
import { COPY } from '../copy'
import { findCulprit, findTopic, GROUPS, searchLessOf, searchTopics, TOPIC_LIST } from '../data/library'
import { PLATFORMS } from '../data/playbooks'
import { MAX_CATEGORIES } from '../data/topics'
import { norm } from '../lib/search'
import { tallyFromPct } from '../lib/session'
import type { Platform, Session } from '../lib/types'
import { CloseIcon } from './icons'
import { Mascot } from './Mascot'
import { Button, Chip, StepHeader, inputClass } from './ui'

type Update = (patch: Partial<Session>) => void
/** What's typed in a question's box. Kept by the page so Next can use it. */
type Draft = { text: string; setText: (t: string) => void }

const MAX_LESS = 8
const clean = (t: string) => t.trim().replace(/\s+/g, ' ').slice(0, 40)

/** Add a typed name to "Show me less of", using the name we know if it's clearly the same thing. */
export function withLessOf(s: Session, typed: string): Partial<Session> {
  const v = clean(typed)
  const name = findCulprit(v)?.label ?? findTopic(v)?.label ?? v
  if (!name || s.turnDown.length >= MAX_LESS || s.turnDown.some((t) => norm(t) === norm(name))) return {}
  return { turnDown: [...s.turnDown, name], problems: s.problems.filter((p) => p !== 'stale') }
}

/** Add a typed topic to "more of": a known topic if it's the same name, else their own words. */
export function withMoreOf(s: Session, typed: string): Partial<Session> {
  const v = clean(typed)
  if (!v || s.likes.length >= MAX_CATEGORIES) return {}
  // The topic's name or a nickname ("yoga" → Yoga & stretching); anything else stays in their words.
  const exact = findTopic(v)
  if (exact) return s.likes.includes(exact.id) ? {} : { likes: [...s.likes, exact.id] }
  return s.likes.some((l) => norm(l) === norm(v)) ? {} : { likes: [...s.likes, v] }
}

/* ---------- Landing ---------- */

export function Landing({ onStart, onResume }: { onStart: () => void; onResume: (() => void) | null }) {
  const c = COPY.landing
  return (
    <div className="anim-rise">
      <div className="flex flex-col items-center text-center">
        <Mascot pose="wave" size={120} />
        <h1 tabIndex={-1} className="font-display m-0 mt-4 max-w-[18ch] text-4xl font-bold leading-tight text-ink sm:text-5xl">
          {c.title}
        </h1>
        <p className="m-0 mt-4 max-w-[36ch] text-lg text-ink-2">{c.lead}</p>
        <p className="m-0 mt-2 text-base font-semibold text-ink">{c.trust}</p>
        <div className="mt-6 flex w-full max-w-[360px] flex-col items-stretch gap-3">
          <Button onClick={onStart} className="text-lg">
            {c.start}
          </Button>
          {onResume && (
            <Button variant="secondary" onClick={onResume}>
              {c.resume}
            </Button>
          )}
        </div>
      </div>

      <section className="mt-12" aria-labelledby="why">
        <h2 id="why" className="font-display m-0 mb-4 text-center text-xl font-bold">
          {c.whyTitle}
        </h2>
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {c.why.map(([a, b], i) => (
            <li key={a} className="rounded-xl border border-line bg-card p-4">
              <span className="font-display text-2xl font-bold text-accent-ink">{i + 1}</span>
              <p className="m-0 mt-1 text-base font-semibold text-ink">{a}</p>
              <p className="m-0 mt-1 text-base text-ink-2">{b}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

/* ---------- Question 1: What is taking over your feed? ---------- */

/** Shown before anything is typed: a spread that fits most ages. */
const COMMON = ['Political commentary', 'Game of Thrones', 'Celebrity gossip', 'Minecraft', 'Shorts', 'Reaction videos', 'Star Wars', 'True crime']
export function TakingOver({ s, update, draft: { text, setText } }: { s: Session; update: Update; draft: Draft }) {
  const c = COPY.q1
  const bored = s.problems.includes('stale') && s.turnDown.length === 0
  const full = s.turnDown.length >= MAX_LESS
  const has = (name: string) => s.turnDown.some((t) => norm(t) === norm(name))
  const add = (name: string) => update(withLessOf(s, name))
  const remove = (name: string) => update({ turnDown: s.turnDown.filter((t) => t !== name) })
  const shown = text.trim() ? searchLessOf(text, 16).filter((m) => !has(m)).slice(0, 8) : COMMON.filter((x) => !has(x))
  const own = clean(text)
  const ownNew = own && !has(own) && !shown.some((x) => norm(x) === norm(own)) && !findCulprit(own) && !findTopic(own)
  const platform = PLATFORMS.find((p) => p.id === s.platform)!

  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title={c.title} say={c.lead} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="app" className="text-base font-semibold text-ink">
          {c.app}
        </label>
        <select
          id="app"
          value={s.platform}
          onChange={(e) => update({ platform: e.target.value as Platform })}
          className="min-h-12 rounded-full border-2 border-line bg-card px-4 text-base font-semibold text-ink focus:border-ink"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {platform.depth === 'tips' && <span className="text-base text-ink-2">{c.tipsOnly}</span>}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add(text)
          setText('')
        }}
      >
        <label className="sr-only" htmlFor="less-of">
          {c.search}
        </label>
        <input id="less-of" value={text} onChange={(e) => setText(e.target.value)} placeholder={c.search} autoComplete="off" disabled={full} className={inputClass} />
        <Button variant="secondary" type="submit" className="shrink-0" disabled={!text.trim() || full}>
          {c.add}
        </Button>
      </form>

      {s.turnDown.length > 0 && (
        <div className="mt-5 rounded-xl border-2 border-alarm bg-alarm-soft p-4">
          <p className="m-0 mb-2 text-base font-semibold text-alarm">{c.less(s.turnDown.length)}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {s.turnDown.map((t) => (
              <li key={t}>
                <button
                  onClick={() => remove(t)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-alarm bg-card px-4 text-base font-medium text-ink"
                  aria-label={c.remove(t)}
                >
                  {t} <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(shown.length > 0 || ownNew) && !full && (
        <>
          <p className="m-0 mt-5 mb-2 text-base text-ink-2">{text.trim() ? c.matches : c.common}</p>
          <div className="flex flex-wrap gap-2">
            {shown.map((name) => (
              <Chip
                key={name}
                selected={false}
                tone="alarm"
                onClick={() => {
                  add(name)
                  setText('')
                }}
              >
                + {name}
              </Chip>
            ))}
            {ownNew && (
              <Chip
                selected={false}
                tone="alarm"
                onClick={() => {
                  add(own)
                  setText('')
                }}
              >
                {c.useOwn(own)}
              </Chip>
            )}
          </div>
        </>
      )}
      {full && <p className="m-0 mt-3 text-base text-ink-2">{c.full}</p>}

      {s.turnDown.length === 0 && (
        <button
          aria-pressed={bored}
          onClick={() => update({ problems: bored ? [] : ['stale'] })}
          className={`mt-6 min-h-12 w-full rounded-xl border-2 px-4 py-3 text-left text-base font-medium ${bored ? 'border-ink bg-accent-soft text-ink' : 'border-line bg-card text-ink'}`}
        >
          {bored ? c.boredOn : c.bored}
        </button>
      )}
    </div>
  )
}

/* ---------- Question 2: How much? (only if something was named) ---------- */

export function HowMuch({ s, update, next }: { s: Session; update: Update; next: () => void }) {
  const c = COPY.q2
  const current = s.baseline ? Math.round((s.baseline.sickOf / 20) * 100) : null
  const title = s.turnDown.length === 1 ? c.title(s.turnDown[0]) : s.turnDown.length === 2 ? c.title(`${s.turnDown[0]} and ${s.turnDown[1]}`) : c.titleMany
  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title={title} say={c.lead} />
      <EstimateOptions
        selected={current}
        onPick={(pct) => {
          update({ baseline: tallyFromPct(pct) })
          // Single choice: move on by itself.
          next()
        }}
      />
    </div>
  )
}

export function EstimateOptions({ selected, onPick }: { selected: number | null; onPick: (pct: number) => void }) {
  return (
    <div role="group" className="grid gap-3">
      {COPY.q2.options.map((o) => (
        <button
          key={o.id}
          aria-pressed={selected === o.pct}
          onClick={() => onPick(o.pct)}
          className={`min-h-14 rounded-xl border-2 px-5 py-3 text-left text-lg font-semibold transition ${
            selected === o.pct ? 'border-ink bg-accent-soft text-ink' : 'border-line bg-card text-ink hover:border-ink-2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Question 3: What do you want to see more of? ---------- */

export function WantMore({ s, update, draft: { text, setText } }: { s: Session; update: Update; draft: Draft }) {
  const c = COPY.q3
  const [showAll, setShowAll] = useState(false)
  const full = s.likes.length >= MAX_CATEGORIES
  const toggle = (id: string) => update({ likes: s.likes.includes(id) ? s.likes.filter((x) => x !== id) : full ? s.likes : [...s.likes, id] })
  const known = (l: string) => TOPIC_LIST.some((t) => t.id === l)
  const custom = s.likes.filter((l) => !known(l))
  const q = text.trim()
  const results = q ? searchTopics(q, 12) : []
  const picked = TOPIC_LIST.filter((t) => s.likes.includes(t.id))
  const suggested = TOPIC_LIST.filter((t) => t.suggested && !s.likes.includes(t.id))
  const exactTopic = q ? findTopic(q) : undefined
  const add = () => {
    update(withMoreOf(s, q))
    setText('')
  }
  const chip = (t: { id: string; label: string }) => (
    <Chip key={t.id} selected={s.likes.includes(t.id)} onClick={() => toggle(t.id)} disabled={full && !s.likes.includes(t.id)}>
      {t.label}
    </Chip>
  )

  return (
    <div className="anim-rise">
      <StepHeader pose="wave" title={c.title} say={s.likes.length ? c.lead : c.leadEmpty} />
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label className="sr-only" htmlFor="more-of">
          {c.search}
        </label>
        <input id="more-of" value={text} onChange={(e) => setText(e.target.value)} placeholder={c.search} autoComplete="off" disabled={full} className={inputClass} />
        <Button variant="secondary" type="submit" className="shrink-0" disabled={!q || full}>
          {c.add}
        </Button>
      </form>

      {q ? (
        <>
          {results.length > 0 && <p className="m-0 mb-2 text-base text-ink-2">{c.matches}</p>}
          <div className="flex flex-wrap gap-2">
            {results.map(chip)}
            {!full && !exactTopic && !s.likes.some((l) => norm(l) === norm(q)) && (
              <Chip selected={false} onClick={add}>
                {c.useOwn(clean(q))}
              </Chip>
            )}
          </div>
          {results.length === 0 && !full && <p className="m-0 mt-3 text-base text-ink-2">{c.notFound}</p>}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {picked.map(chip)}
          {custom.map((l) => (
            <Chip key={l} selected onClick={() => toggle(l)} aria-label={c.remove(l)}>
              {l} <CloseIcon />
            </Chip>
          ))}
          {!showAll && suggested.slice(0, Math.max(0, 12 - picked.length)).map(chip)}
        </div>
      )}

      {!q && (
        <button onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="mt-4 min-h-12 text-base font-semibold text-accent-ink underline underline-offset-4">
          {showAll ? c.fewer : c.all}
        </button>
      )}
      {!q && showAll && (
        <div className="mt-2 space-y-2">
          {GROUPS.map((g) => (
            <details key={g} className="rounded-xl border border-line bg-card">
              <summary className="flex min-h-12 cursor-pointer items-center px-4 text-base font-semibold text-ink">{g}</summary>
              <div className="flex flex-wrap gap-2 px-4 pb-4">{TOPIC_LIST.filter((t) => t.group === g).map(chip)}</div>
            </details>
          ))}
        </div>
      )}

      <p className="m-0 mt-4 text-base text-ink-2" aria-live="polite">
        {full ? c.full(MAX_CATEGORIES) : s.likes.length ? c.picked(s.likes.length, MAX_CATEGORIES) : c.none}
      </p>
    </div>
  )
}
