import { useId, useState } from 'react'
import { COPY } from '../copy'
import { WILDCARD_ID } from '../data/topics'
import { rebalance, removeAt } from '../lib/mix'
import { slugify } from '../lib/session'
import type { Category, Mix, SubTopic } from '../lib/types'
import { categoryColor, childColor, displayLabel, MixChart, ViewToggle, type View } from './MixChart'
import { LockIcon } from './icons'
import { inputClass } from './ui'

const VIEW_KEY = 'algorithm-builder:view'
const readView = (): View => {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'bars' || v === 'numbers' ? v : 'pie'
  } catch {
    return 'pie'
  }
}

/**
 * The feed editor (F-06 to F-11), opened from "Change it" on the results
 * page. Optional: the feed is built automatically, this is for people who
 * want control.
 */
export function MixStep({ mix, onChange }: { mix: Mix; onChange: (m: Mix) => void }) {
  const c = COPY.adjust
  const [view, setViewState] = useState<View>(readView)
  const [selected, setSelected] = useState<string | null>(null)
  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* ignore */
    }
  }
  const cats = mix.categories
  const sel = cats.find((x) => x.id === selected) ?? null
  const setCats = (categories: Category[]) => onChange({ ...mix, categories })
  const setChildren = (id: string, children: SubTopic[]) => setCats(cats.map((x) => (x.id === id ? { ...x, children } : x)))
  const realCount = cats.filter((x) => x.id !== WILDCARD_ID).length

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <ViewToggle view={view} onChange={setView} />
        </div>
        <MixChart mix={mix} view={view} selected={selected} onSelect={(id) => setSelected(id === selected || id === WILDCARD_ID ? null : id)} />
        <p className="m-0 mt-3 text-center text-base text-ink-2">{c.change}</p>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display m-0 text-lg font-bold">{c.topics}</h3>
          <span className="rounded-full bg-paper-2 px-3 py-1 text-base font-semibold tabular-nums text-ink-2" aria-live="polite">
            {c.total(cats.reduce((a, x) => a + x.weight, 0))}
          </span>
        </div>
        <ul className="m-0 list-none space-y-3 p-0">
          {cats.map((cat, i) => (
            <SliderRow
              key={cat.id}
              label={displayLabel(cat)}
              value={cat.weight}
              color={categoryColor(cats, cat.id)}
              locked={!!cat.locked}
              onChange={(v) => setCats(rebalance(cats, i, v))}
              onLock={() => setCats(cats.map((x, j) => (j === i ? { ...x, locked: !x.locked || undefined } : x)))}
              onEdit={cat.id === WILDCARD_ID ? undefined : () => setSelected(cat.id === selected ? null : cat.id)}
              editing={selected === cat.id}
              onRemove={
                cat.id !== WILDCARD_ID && realCount > 1
                  ? () => {
                      if (selected === cat.id) setSelected(null)
                      setCats(removeAt(cats, i))
                    }
                  : undefined
              }
            >
              {sel && sel.id === cat.id && <SubTopics key={sel.id} cat={sel} color={categoryColor(cats, sel.id)} onChange={(k) => setChildren(sel.id, k)} />}
            </SliderRow>
          ))}
        </ul>
        <AddTopic
          label={c.addTopic}
          placeholder={c.addTopicHint}
          disabled={cats.length >= 8}
          onAdd={(label) => {
            const id = `added-${slugify(label)}`
            if (cats.some((x) => x.id === id)) return
            const wild = cats.findIndex((x) => x.id === WILDCARD_ID)
            const fresh: Category = { id, label, weight: 0, children: [{ id: `${id}-all`, label, weight: 100 }] }
            const next = [...cats]
            next.splice(wild === -1 ? next.length : wild, 0, fresh)
            setCats(rebalance(next, next.indexOf(fresh), 10))
          }}
        />
      </section>

      <section>
        <h3 className="font-display m-0 text-lg font-bold">{c.olderTitle}</h3>
        <p className="m-0 mt-1 text-base text-ink-2">{c.olderLead}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={c.olderTitle}>
          {[null, 2020, 2015, 2010].map((y) => (
            <button
              key={String(y)}
              role="radio"
              aria-checked={mix.before === y}
              onClick={() => onChange({ ...mix, before: y })}
              className={`min-h-12 rounded-full border-2 px-4 text-base font-medium ${mix.before === y ? 'border-ink bg-accent-soft text-ink' : 'border-line bg-card text-ink'}`}
            >
              {y ? c.olderThan(y) : c.anyAge}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Label and amount, the bar, then plain-word actions underneath (no icon-only buttons). */
function SliderRow({
  label,
  value,
  color,
  locked,
  onChange,
  onLock,
  onEdit,
  editing,
  onRemove,
  children,
}: {
  label: string
  value: number
  color: string
  locked: boolean
  onChange: (v: number) => void
  onLock: () => void
  onEdit?: () => void
  editing?: boolean
  onRemove?: () => void
  children?: React.ReactNode
}) {
  const c = COPY.adjust
  const id = useId()
  const pill = 'min-h-12 rounded-full border-2 px-4 text-base font-semibold'
  return (
    <li className={`rounded-xl border border-line p-3 ${editing ? 'bg-paper-2' : 'bg-card'}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex min-w-0 items-center gap-2 text-base font-semibold text-ink">
          <span className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
          <span>{label}</span>
        </label>
        <span className="font-display shrink-0 text-xl font-bold tabular-nums">{value}%</span>
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={locked}
        aria-valuetext={`${value}% of your feed`}
        style={{ ['--pct' as string]: `${value}%`, ['--track-fill' as string]: color }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex flex-wrap gap-2">
        {onEdit && (
          <button onClick={onEdit} aria-expanded={editing} className={`${pill} border-line bg-card text-ink`}>
            {editing ? c.doneChoosing : c.choose}
          </button>
        )}
        <button
          onClick={onLock}
          aria-pressed={locked}
          aria-label={locked ? c.unkeep(label) : c.keep(label)}
          title={c.keepHint}
          className={`${pill} inline-flex items-center gap-2 ${locked ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink'}`}
        >
          <LockIcon closed={locked} /> {locked ? c.keptShort : c.keepShort}
        </button>
        {onRemove && (
          <button onClick={onRemove} aria-label={c.remove(label)} className={`${pill} border-line bg-card text-ink hover:border-alarm`}>
            {c.removeShort}
          </button>
        )}
      </div>
      {children}
    </li>
  )
}

function SubTopics({ cat, color, onChange }: { cat: Category; color: string; onChange: (k: SubTopic[]) => void }) {
  const c = COPY.adjust
  const kids = cat.children
  return (
    <div className="anim-pop mt-3 border-t border-line pt-3">
      <h4 className="font-display m-0 text-base font-bold">{c.inside(cat.label)}</h4>
      <p className="m-0 mb-2 text-base text-ink-2">{c.insideLead(cat.label, cat.weight)}</p>
      <ul className="m-0 list-none space-y-3 p-0">
        {kids.map((k, i) => (
          <SliderRow
            key={k.id}
            label={k.label}
            value={k.weight}
            color={childColor(color, i)}
            locked={!!k.locked}
            onChange={(v) => onChange(rebalance(kids, i, v))}
            onLock={() => onChange(kids.map((x, j) => (j === i ? { ...x, locked: !x.locked || undefined } : x)))}
            onRemove={kids.length > 1 ? () => onChange(removeAt(kids, i)) : undefined}
          />
        ))}
      </ul>
      <AddTopic
        label={c.addShow}
        placeholder={c.addShowHint(cat.label)}
        disabled={kids.length >= 6}
        onAdd={(label) => {
          const id = slugify(label)
          if (kids.some((k) => k.id === id)) return
          const next = [...kids, { id, label, weight: 0 }]
          onChange(rebalance(next, next.length - 1, Math.round(100 / next.length)))
        }}
      />
    </div>
  )
}

function AddTopic({ onAdd, disabled, label, placeholder }: { onAdd: (label: string) => void; disabled?: boolean; label: string; placeholder: string }) {
  const [v, setV] = useState('')
  const [open, setOpen] = useState(false)
  const id = useId()
  if (!open)
    return (
      <button onClick={() => setOpen(true)} disabled={disabled} className="mt-3 min-h-12 text-base font-semibold text-accent-ink underline underline-offset-4 disabled:opacity-50">
        + {label}
      </button>
    )
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const t = v.trim().slice(0, 40)
        if (t) onAdd(t)
        setV('')
        setOpen(false)
      }}
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input id={id} autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className={inputClass} />
      <button type="submit" className="min-h-12 shrink-0 rounded-full border-2 border-ink px-4 text-base font-semibold">
        {COPY.adjust.add}
      </button>
    </form>
  )
}
