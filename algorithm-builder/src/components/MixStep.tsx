import { useId, useState } from 'react'
import { WILDCARD_ID } from '../data/topics'
import { normalize, rebalance } from '../lib/mix'
import { slugify } from '../lib/session'
import type { Category, Mix, SubTopic } from '../lib/types'
import { categoryColor, childColor, MixChart, ViewToggle, type View } from './MixChart'
import { Card, StepHeader } from './ui'

const VIEW_KEY = 'algorithm-builder:view'
const readView = (): View => {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'bars' || v === 'numbers' ? v : 'pie'
  } catch {
    return 'pie'
  }
}

/** The mix builder (F-06 to F-11). */
export function MixStep({ mix, onChange }: { mix: Mix; onChange: (m: Mix) => void }) {
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
  const sel = cats.find((c) => c.id === selected) ?? null

  const setCats = (categories: Category[]) => onChange({ ...mix, categories })
  const setCatWeight = (i: number, v: number) => setCats(rebalance(cats, i, v))
  const toggleLock = (i: number) => setCats(cats.map((c, j) => (j === i ? { ...c, locked: !c.locked || undefined } : c)))

  const setChildren = (id: string, children: SubTopic[]) => setCats(cats.map((c) => (c.id === id ? { ...c, children } : c)))

  return (
    <div className="anim-rise">
      <StepHeader pose="diagnose" title="Build your mix" say="Drag the sliders. Everything always adds up to 100%. Tap a slice to split it further." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display m-0 text-lg font-extrabold">Your mix</h2>
            <ViewToggle view={view} onChange={setView} />
          </div>
          <MixChart mix={mix} view={view} selected={selected} onSelect={(id) => setSelected(id === selected ? null : id)} />
          <p className="m-0 mt-4 text-center text-xs text-muted">This is the mix we’ll steer toward. Feeds shift over 3–7 days.</p>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display m-0 text-lg font-extrabold">Topics</h2>
              <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-ink-2" aria-live="polite">
                Total {cats.reduce((a, c) => a + c.weight, 0)}%
              </span>
            </div>
            <ul className="m-0 list-none space-y-2 p-0">
              {cats.map((c, i) => (
                <SliderRow
                  key={c.id}
                  label={c.id === WILDCARD_ID ? 'Something I’d never click' : c.label}
                  value={c.weight}
                  color={categoryColor(cats, c.id)}
                  locked={!!c.locked}
                  onChange={(v) => setCatWeight(i, v)}
                  onLock={() => toggleLock(i)}
                  onEdit={c.id === WILDCARD_ID ? undefined : () => setSelected(c.id === selected ? null : c.id)}
                  editing={selected === c.id}
                />
              ))}
            </ul>
            <AddTopic
              disabled={cats.length >= 8}
              onAdd={(label) => {
                const id = `added-${slugify(label)}`
                if (cats.some((c) => c.id === id)) return
                const wild = cats.findIndex((c) => c.id === WILDCARD_ID)
                const fresh: Category = { id, label, weight: 10, children: [{ id: `${id}-all`, label, weight: 100 }] }
                const next = [...cats]
                next.splice(wild === -1 ? next.length : wild, 0, fresh)
                const idx = next.indexOf(fresh)
                setCats(rebalance(next.map((c) => (c === fresh ? { ...c, weight: 0 } : c)), idx, 10))
              }}
            />
          </Card>

          {sel && sel.id !== WILDCARD_ID && (
            <SubTopics
              key={sel.id}
              cat={sel}
              color={categoryColor(cats, sel.id)}
              onChange={(children) => setChildren(sel.id, children)}
              onClose={() => setSelected(null)}
            />
          )}

          <Card>
            <h2 className="font-display m-0 text-lg font-extrabold">Time capsule</h2>
            <p className="m-0 mt-1 text-sm text-ink-2">Great videos from years ago that the algorithm forgot.</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Upload date">
              {[null, 2020, 2015, 2010].map((y) => (
                <button
                  key={String(y)}
                  role="radio"
                  aria-checked={mix.before === y}
                  onClick={() => onChange({ ...mix, before: y })}
                  className={`min-h-11 rounded-full border-2 px-4 text-[15px] font-medium ${
                    mix.before === y ? 'border-ink bg-accent-soft text-ink' : 'border-line bg-card text-ink-2'
                  }`}
                >
                  {y ? `Before ${y}` : 'Any age'}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

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
}) {
  const id = useId()
  return (
    <li className={`rounded-xl px-2 py-1.5 ${editing ? 'bg-paper-2' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex min-w-0 items-center gap-2 text-[15px] font-medium text-ink">
          <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
          <span className="truncate">{label}</span>
        </label>
        <span className="flex shrink-0 items-center gap-1">
          <span className="font-display w-11 text-right text-lg font-extrabold tabular-nums">{value}%</span>
          {onEdit && (
            <button onClick={onEdit} className="h-9 rounded-full px-2.5 text-sm font-semibold text-accent-ink hover:underline" aria-expanded={editing}>
              {editing ? 'Done' : 'Split'}
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-full text-lg text-muted hover:text-alarm" aria-label={`Remove ${label}`}>
              ×
            </button>
          )}
          <button
            onClick={onLock}
            aria-pressed={locked}
            aria-label={`${locked ? 'Unlock' : 'Lock'} ${label}`}
            title={locked ? 'Locked: won’t move when you change others' : 'Lock this slice'}
            className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm ${locked ? 'border-ink bg-ink text-paper' : 'border-line text-muted'}`}
          >
            <LockIcon closed={locked} />
          </button>
        </span>
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
    </li>
  )
}

function LockIcon({ closed }: { closed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" stroke="none" />
      <path d={closed ? 'M5 7V5a3 3 0 0 1 6 0v2' : 'M5 7V5a3 3 0 0 1 5.6-1.5'} />
    </svg>
  )
}

function SubTopics({ cat, color, onChange, onClose }: { cat: Category; color: string; onChange: (k: SubTopic[]) => void; onClose: () => void }) {
  const kids = cat.children
  return (
    <Card className="anim-pop">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display m-0 text-lg font-extrabold">Inside {cat.label}</h2>
        <button onClick={onClose} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-2 hover:text-ink">
          Close
        </button>
      </div>
      <p className="m-0 mb-3 text-sm text-ink-2">Of your {cat.weight}% {cat.label}, how much of each?</p>
      <ul className="m-0 list-none space-y-2 p-0">
        {kids.map((k, i) => (
          <SliderRow
            key={k.id}
            label={k.label}
            value={k.weight}
            color={childColor(color, i)}
            locked={!!k.locked}
            onChange={(v) => onChange(rebalance(kids, i, v))}
            onLock={() => onChange(kids.map((x, j) => (j === i ? { ...x, locked: !x.locked || undefined } : x)))}
            onRemove={kids.length > 1 ? () => onChange(normalize(kids.filter((_, j) => j !== i))) : undefined}
          />
        ))}
      </ul>
      <AddTopic
        label="Add a sub-topic"
        placeholder={`e.g. a show or creator in ${cat.label}`}
        disabled={kids.length >= 6}
        onAdd={(label) => {
          const id = slugify(label)
          if (kids.some((k) => k.id === id)) return
          const next = [...kids, { id, label, weight: 0 }]
          onChange(rebalance(next, next.length - 1, Math.round(100 / next.length)))
        }}
      />
    </Card>
  )
}

function AddTopic({
  onAdd,
  disabled,
  label = 'Add a topic',
  placeholder = 'e.g. Chess, Formula 1, a creator…',
}: {
  onAdd: (label: string) => void
  disabled?: boolean
  label?: string
  placeholder?: string
}) {
  const [v, setV] = useState('')
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button onClick={() => setOpen(true)} disabled={disabled} className="mt-3 min-h-11 text-[15px] font-semibold text-accent-ink hover:underline disabled:opacity-50">
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
      <label className="sr-only" htmlFor={`add-${slugify(label)}`}>
        {label}
      </label>
      <input
        id={`add-${slugify(label)}`}
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 flex-1 rounded-full border-2 border-line bg-card px-4 text-[15px] text-ink placeholder:text-muted focus:border-ink"
      />
      <button type="submit" className="min-h-11 rounded-full border-2 border-ink px-4 font-semibold">
        Add
      </button>
    </form>
  )
}
