import { useEffect, useMemo, useState } from 'react'
import { BRAND } from '../data/brand'
import { PLATFORMS, SIGNALS, tipsFor } from '../data/playbooks'
import { buildChecklist } from '../lib/checklist'
import { download, tuneUpIcs } from '../lib/ics'
import { allocate, filterVideos, platformSearchUrl, playAllUrl, searchUrl, searchVideos, type Slot } from '../lib/playlist'
import { recipeUrl } from '../lib/session'
import type { Session, Tally, Video } from '../lib/types'
import { ExternalIcon, PlayIcon } from './icons'
import { Mascot } from './Mascot'
import { categoryColor } from './MixChart'
import { TallyStep } from './Steps'
import { Button, buttonClass, Card } from './ui'

const DONE_KEY = 'algorithm-builder:done'

function readDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function Results({
  s,
  returning,
  onEdit,
  onReset,
  onFollowUp,
}: {
  s: Session
  returning: boolean
  onEdit: () => void
  onReset: () => void
  onFollowUp: (t: Tally) => void
}) {
  const platform = PLATFORMS.find((p) => p.id === s.platform)!
  return (
    <div className="anim-rise space-y-5">
      <header className="flex items-center gap-4">
        <Mascot pose="celebrate" size={84} className="shrink-0" />
        <div>
          <h1 tabIndex={-1} className="font-display m-0 text-3xl font-bold leading-tight sm:text-4xl">
            {returning ? 'Welcome back. Tune-up time.' : 'Here’s your fix.'}
          </h1>
          <p className="m-0 mt-1 text-ink-2">
            Remove first, then add. {platform.depth === 'full' ? 'Two steps, about 10 minutes.' : `${platform.label} has no tools for apps like this, so here’s the playbook.`}
          </p>
        </div>
      </header>

      <MixSummary s={s} onEdit={onEdit} />

      {s.baseline && <TuneUp s={s} onFollowUp={onFollowUp} />}

      <Checklist s={s} />

      {s.platform === 'youtube' ? <Playlist s={s} /> : <SearchTerms s={s} />}

      <Tips s={s} />

      <SaveCard s={s} onReset={onReset} />

      {BRAND.tipUrl && (
        <p className="m-0 pt-2 text-center text-sm text-muted">
          Feed running better?{' '}
          <a href={BRAND.tipUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-ink underline underline-offset-4">
            The mechanic runs on coffee
          </a>
          .
        </p>
      )}
    </div>
  )
}

function MixSummary({ s, onEdit }: { s: Session; onEdit: () => void }) {
  const cats = s.mix.categories.filter((c) => c.weight > 0)
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display m-0 text-base font-bold">Your target mix</h2>
        <button onClick={onEdit} className="min-h-10 text-sm font-semibold text-accent-ink hover:underline">
          Edit mix
        </button>
      </div>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full" aria-hidden>
        {cats.map((c, i) => (
          <div key={c.id} style={{ width: `${c.weight}%`, background: categoryColor(s.mix.categories, c.id), borderRight: i < cats.length - 1 ? '2px solid var(--card)' : undefined }} />
        ))}
      </div>
      <p className="m-0 mt-2 text-sm text-ink-2">
        {cats.map((c) => `${c.label} ${c.weight}%`).join(' · ')}
        {s.mix.before ? ` · Time capsule: before ${s.mix.before}` : ''}
      </p>
      {s.turnDown.length > 0 && (
        <p className="m-0 mt-1 text-sm">
          <span className="font-semibold text-alarm">Turning down:</span> <span className="text-ink-2">{s.turnDown.join(', ')}</span>
        </p>
      )}
    </Card>
  )
}

/* ---------- Step 1: cleanup (F-14 + G-03) ---------- */

function Checklist({ s }: { s: Session }) {
  const items = useMemo(() => buildChecklist(s.platform, s.turnDown, s.problems), [s.platform, s.turnDown, s.problems])
  const [done, setDone] = useState<string[]>(readDone)
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    setDone(next)
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  const count = items.filter((i) => done.includes(i.id)).length
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display m-0 text-xl font-bold">
          <span className="text-accent-ink">Step 1.</span> Clean up
        </h2>
        <span className="text-sm font-semibold tabular-nums text-ink-2" aria-live="polite">
          {count} of {items.length} done
        </span>
      </div>
      <p className="m-0 mt-1 text-sm text-ink-2">Removing what caused the loop works faster than anything you add on top.</p>
      <ul className="m-0 mt-4 list-none space-y-2 p-0">
        {items.map((it) => {
          const checked = done.includes(it.id)
          return (
            <li key={it.id} className={`rounded-xl border-2 p-3 transition ${checked ? 'border-good/40 bg-paper-2' : 'border-line'}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={checked} onChange={() => toggle(it.id)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--good)]" />
                <span>
                  <span className={`block text-base font-medium ${checked ? 'text-muted line-through' : 'text-ink'}`}>{it.text}</span>
                  {it.detail && <span className="mt-1 block text-sm text-ink-2">{it.detail}</span>}
                </span>
              </label>
              {it.link && (
                <a href={it.link.href} target="_blank" rel="noopener noreferrer" className="ml-8 mt-1 inline-block text-sm font-semibold text-accent-ink underline underline-offset-4">
                  {it.link.label} <ExternalIcon className="inline align-[-2px]" />
                </a>
              )}
            </li>
          )
        })}
      </ul>
      {s.turnDown.length === 0 && <p className="m-0 mt-3 text-sm text-muted">Tip: add what you’re sick of in the “Too much of what?” step and this list gets specific.</p>}
    </Card>
  )
}

/* ---------- Step 2: rehab playlist (F-15, G-07, G-17) ---------- */

type SlotState = { slot: Slot; videos: Video[] | null; fallback: boolean }

function Playlist({ s }: { s: Session }) {
  // Same wildcard pick all day, so it can be cached instead of re-searched.
  const [seed] = useState(() => Math.floor(Date.now() / 86_400_000))
  const slots = useMemo(() => allocate(s.mix, 10, seed), [s.mix, seed])
  const [state, setState] = useState<SlotState[]>(() => slots.map((slot) => ({ slot, videos: null, fallback: false })))
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    const ctl = new AbortController()
    setState(slots.map((slot) => ({ slot, videos: null, fallback: false })))
    setReason(null)
    ;(async () => {
      const seen = new Set<string>()
      const results = await Promise.all(slots.map((slot) => searchVideos(slot.query, s.mix.before, ctl.signal).catch(() => null)))
      if (ctl.signal.aborted) return
      let why: string | null = null
      const next = slots.map((slot, i) => {
        const r = results[i]
        if (r && r.status === 'ok') {
          const vids = filterVideos(r.items, s.turnDown, seen, slot.count)
          if (vids.length) return { slot, videos: vids, fallback: false }
        } else if (r) {
          why = r.status
        }
        return { slot, videos: [], fallback: true }
      })
      setState(next)
      setReason(why)
    })()
    return () => ctl.abort()
  }, [slots, s.mix.before, s.turnDown])

  const loading = state.some((x) => x.videos === null)
  const videos = state.flatMap((x) => x.videos ?? [])
  const fallbacks = state.filter((x) => x.fallback)

  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">
        <span className="text-accent-ink">Step 2.</span> Watch your rehab playlist
      </h2>
      <p className="m-0 mt-1 text-sm text-ink-2">
        {videos.length || loading ? 'Ten videos matched to your mix.' : 'Searches matched to your mix.'} Over the next few days:
      </p>
      <ol className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-3">
        {[
          ['Watch a few minutes of each', 'Watch time is the loudest vote.'],
          ['Save or like the good ones', 'Skip the rest quickly.'],
          ['Subscribe to one or two', 'Only if you’d actually miss them.'],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-xl bg-paper-2 p-3">
            <span className="font-display font-bold text-accent-ink">{i + 1}</span> <span className="text-base font-semibold">{t}</span>
            <span className="block text-sm text-ink-2">{d}</span>
          </li>
        ))}
      </ol>

      {loading && (
        <div className="mt-4 flex items-center gap-3" role="status">
          <Mascot pose="diagnose" size={44} />
          <span className="text-sm text-ink-2">Tightening bolts… finding videos</span>
        </div>
      )}
      {loading && (
        <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </ul>
      )}

      {!loading && videos.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <a href={playAllUrl(videos)} target="_blank" rel="noopener noreferrer" className={buttonClass('primary')}>
              <PlayIcon /> Play all on YouTube
            </a>
            <span className="text-xs text-muted">Videos and data from YouTube</span>
          </div>
          <ul className="anim-pop m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
            {state.flatMap(({ slot, videos: vids }) =>
              (vids ?? []).map((v) => (
                <li key={v.id} className="min-w-0">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-xl border border-line p-2 transition hover:border-ink-2"
                  >
                    {v.thumb && <img src={v.thumb} alt="" width={120} height={68} loading="lazy" className="h-[68px] w-[120px] shrink-0 rounded-lg object-cover" />}
                    <span className="min-w-0">
                      <span className="line-clamp-2 block text-base font-medium leading-snug text-ink">{v.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {v.channel} · {v.published.slice(0, 4)} · <span className="text-ink-2">{slot.label}</span>
                      </span>
                    </span>
                  </a>
                </li>
              )),
            )}
          </ul>
        </>
      )}

      {!loading && fallbacks.length > 0 && (
        <div className="anim-pop mt-4">
          {reason && reason !== 'unconfigured' && (
            <p className="m-0 mb-2 flex items-center gap-2 text-sm text-ink-2">
              <Mascot pose="confused" size={36} /> YouTube’s search is busy right now, so here are links that do the same job.
            </p>
          )}
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {fallbacks.map(({ slot }) => (
              <li key={slot.key} className="min-w-0">
                <a
                  href={searchUrl(slot.query, s.mix.before)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-line bg-card px-4 py-2 transition hover:border-ink"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold text-ink">{slot.label}</span>
                    <span className="block truncate text-xs text-muted">
                      Search “{slot.query}”{s.mix.before ? `, before ${s.mix.before}` : ''} · pick {slot.count}
                    </span>
                  </span>
                  <ExternalIcon className="text-accent-ink" />
                </a>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2 text-xs text-muted">Pick the video that looks best in each search. Skip anything about what you’re turning down.</p>
        </div>
      )}
    </Card>
  )
}

/** Tip-guide platforms: no API, so we hand over the searches (F-21 to F-23). */
function SearchTerms({ s }: { s: Session }) {
  const slots = useMemo(() => allocate(s.mix, 10, 7), [s.mix])
  const platform = s.platform as 'instagram' | 'tiktok' | 'x'
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">
        <span className="text-accent-ink">Step 2.</span> Seed your feed
      </h2>
      <p className="m-0 mt-1 text-sm text-ink-2">Search for these in the app. Watch a few fully and save the good ones, rather than liking them.</p>
      <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
        {slots.map((slot) => {
          const href = platformSearchUrl(platform, slot.query)
          const body = (
            <>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-ink">{slot.label}</span>
                <span className="block truncate text-xs text-muted">
                  “{slot.query}” · {slot.count} {slot.count === 1 ? 'video' : 'videos'}
                </span>
              </span>
              {href && <ExternalIcon className="text-accent-ink" />}
            </>
          )
          return (
            <li key={slot.key} className="min-w-0">
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-line px-4 py-2 hover:border-ink">
                  {body}
                </a>
              ) : (
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-line px-4 py-2">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ---------- Tips (F-19, F-20 to F-24) ---------- */

function Tips({ s }: { s: Session }) {
  const platform = PLATFORMS.find((p) => p.id === s.platform)!
  const tips = tipsFor(s.platform, s.problems)
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">Keep it healthy</h2>
      <p className="m-0 mt-1 text-sm text-ink-2">Your thumb is a vote, even when you don’t mean it.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-good/50 p-4">
          <h3 className="m-0 text-base font-bold text-good">Want MORE of it?</h3>
          <ul className="m-0 mt-2 space-y-2 pl-5 text-sm text-ink">
            {SIGNALS.more.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-2 border-alarm/50 p-4">
          <h3 className="m-0 text-base font-bold text-alarm">Want LESS of it?</h3>
          <ul className="m-0 mt-2 space-y-2 pl-5 text-sm text-ink">
            {SIGNALS.less.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3 className="m-0 mt-5 text-base font-bold">{platform.label} tips</h3>
      <ul className="m-0 mt-2 space-y-2 pl-5 text-base text-ink">
        {tips.slice(0, 5).map((t) => (
          <li key={t.text}>{t.text}</li>
        ))}
      </ul>
      <p className="m-0 mt-3 text-xs text-muted">
        Menu names change between app versions{platform.checked ? `; last checked ${platform.checked}` : ''}. Look for the closest match.
      </p>
    </Card>
  )
}

/* ---------- Save: recipe link (F-18) + calendar tune-up (F-05) ---------- */

function SaveCard({ s, onReset }: { s: Session; onReset: () => void }) {
  const link = recipeUrl(s)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your recipe link:', link)
    }
  }
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">Come back in a week</h2>
      <p className="m-0 mt-1 text-sm text-ink-2">
        Your recipe link holds your whole mix. Bookmark it, no account needed. Next week, open it, re-count your homepage and adjust.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={copy}>{copied ? 'Link copied' : 'Copy my recipe link'}</Button>
        <Button variant="secondary" onClick={() => download('feed-tune-up.ics', tuneUpIcs(link), 'text/calendar')}>
          Add tune-up to calendar
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Start over
        </Button>
      </div>
    </Card>
  )
}

/* ---------- Tune-up: before/after (G-02) ---------- */

function TuneUp({ s, onFollowUp }: { s: Session; onFollowUp: (t: Tally) => void }) {
  const [open, setOpen] = useState(false)
  const b = s.baseline!
  const f = s.followUp
  const sickLabel = s.turnDown.length ? `${s.turnDown[0]}${s.turnDown.length > 1 ? ' & co.' : ''}` : 'The stuff I’m sick of'
  const row = (label: string, t: Tally) => (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{t.date}</span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-paper-2">
        <div style={{ width: `${(t.sickOf / 20) * 100}%`, background: 'var(--alarm)' }} className="bar-seg" />
        <div style={{ width: `${(t.wanted / 20) * 100}%`, background: 'var(--good)' }} className="bar-seg" />
        <div style={{ width: `${(t.other / 20) * 100}%`, background: 'var(--muted)' }} className="bar-seg" />
      </div>
      <p className="m-0 mt-1 text-sm text-ink-2">
        {t.sickOf}/20 {sickLabel} · {t.wanted}/20 wanted
      </p>
    </div>
  )
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">Your homepage check</h2>
      <div className="mt-3 space-y-3">
        {row('Before', b)}
        {f && row('After', f)}
      </div>
      {f && (
        <p className="m-0 mt-3 font-semibold">
          {f.sickOf < b.sickOf
            ? `Down ${b.sickOf - f.sickOf} of 20. It’s working.`
            : f.sickOf === b.sickOf
              ? 'No change yet. Give the cleanup steps another pass.'
              : 'It went up. Re-check the watch-history step.'}
        </p>
      )}
      {!open ? (
        <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
          {f ? 'Count again' : 'Count my homepage again'}
        </Button>
      ) : (
        <div className="mt-4">
          <TallyStep
            value={f && f.date === new Date().toISOString().slice(0, 10) ? f : null}
            onChange={onFollowUp}
            title="Count your homepage again"
            say="Same as before: the first 20 videos on your YouTube homepage."
            sickOfLabel={sickLabel}
            nested
          />
        </div>
      )}
    </Card>
  )
}
