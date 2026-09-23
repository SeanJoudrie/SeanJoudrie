import { useEffect, useMemo, useState } from 'react'
import { COPY, summarize } from '../copy'
import { BRAND } from '../data/brand'
import { channelsFor, feedFor, followFor, poolFor, type Feed } from '../data/library'
import { PLATFORMS, SIGNALS, tipsFor } from '../data/playbooks'
import { WILDCARD_ID } from '../data/topics'
import { buildChecklist, type CheckItem } from '../lib/checklist'
import { download, tuneUpIcs } from '../lib/ics'
import { allocate, filterVideos, platformSearchUrl, playAllUrl, searchUrl, searchVideos, type Slot } from '../lib/playlist'
import { pctFromTally, recipeUrl, tallyFromPct } from '../lib/session'
import type { Session, Tally, Video } from '../lib/types'
import { EstimateOptions } from './Flow'
import { ExternalIcon, PlayIcon } from './icons'
import { Mascot } from './Mascot'
import { categoryColor, displayLabel } from './MixChart'
import { Button, buttonClass, Card } from './ui'

const DONE_KEY = 'algorithm-builder:done'
const r = COPY.results

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
  onAdjust,
  onReset,
  onFollowUp,
}: {
  s: Session
  returning: boolean
  onAdjust: () => void
  onReset: () => void
  onFollowUp: (t: Tally) => void
}) {
  const platform = PLATFORMS.find((p) => p.id === s.platform)!
  const [showMore, setShowMore] = useState(false)
  const checkBack = returning && !!s.baseline
  return (
    <div className="anim-rise space-y-5">
      <header className="flex items-center gap-4">
        <Mascot pose="celebrate" size={72} className="shrink-0" />
        <div className="min-w-0">
          <h1 tabIndex={-1} className="font-display m-0 text-3xl font-bold leading-tight sm:text-4xl">
            {checkBack ? r.titleBack : r.title}
          </h1>
          <p className="m-0 mt-1 text-lg text-ink-2">{platform.depth === 'full' ? r.lead : r.leadTips}</p>
        </div>
      </header>

      {checkBack && <BetterCheck s={s} onFollowUp={onFollowUp} onNotBetter={() => setShowMore(true)} />}

      <Steps s={s} showMore={showMore} setShowMore={setShowMore} />

      {s.platform === 'youtube' ? <Watch s={s} /> : <SearchTerms s={s} />}

      <FeedSummary s={s} onAdjust={onAdjust} />

      <SaveCard s={s} onReset={onReset} />

      {BRAND.tipUrl && (
        <p className="m-0 pt-2 text-center text-base text-ink-2">
          {r.coffee}{' '}
          <a href={BRAND.tipUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-ink underline underline-offset-4">
            {r.coffeeLink}
          </a>
          .
        </p>
      )}
    </div>
  )
}

/* ---------- Return visit: "Is your feed better?" ---------- */

function BetterCheck({ s, onFollowUp, onNotBetter }: { s: Session; onFollowUp: (t: Tally) => void; onNotBetter: () => void }) {
  const before = pctFromTally(s.baseline!)
  const today = new Date().toISOString().slice(0, 10)
  const now = s.followUp && s.followUp.date === today ? pctFromTally(s.followUp) : null
  const name = s.turnDown.length === 1 ? s.turnDown[0] : s.turnDown.length ? `${s.turnDown[0]} and the rest` : ''
  const msg = now === null ? null : now < before ? r.better.yes : now === before ? r.better.same : r.better.worse
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">{name ? r.better.title(name) : r.better.titleNone}</h2>
      <p className="m-0 mt-2 mb-4 text-base text-ink-2">{r.better.before(before)}</p>
      <EstimateOptions
        selected={now}
        onPick={(pct) => {
          onFollowUp(tallyFromPct(pct, today))
          if (pct >= before) onNotBetter()
        }}
      />
      {msg && (
        <p className="m-0 mt-4 text-lg font-semibold" role="status">
          {msg}
        </p>
      )}
    </Card>
  )
}

/* ---------- The 3 things to do today, then the rest (F-14, G-03) ---------- */

function Steps({ s, showMore, setShowMore }: { s: Session; showMore: boolean; setShowMore: (v: boolean) => void }) {
  const items = useMemo(() => buildChecklist(s.platform, s.turnDown, s.problems), [s.platform, s.turnDown, s.problems])
  const [done, setDone] = useState<string[]>(readDone)
  const top = items.slice(0, 3)
  const rest = items.slice(3)
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    setDone(next)
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  return (
    <Card>
      <p className="m-0 mb-3 text-right text-base font-semibold tabular-nums text-ink-2" aria-live="polite">
        {r.stepsDone(top.filter((i) => done.includes(i.id)).length, top.length)}
      </p>
      <ol className="m-0 list-none space-y-3 p-0">
        {top.map((it, i) => (
          <StepItem key={it.id} n={i + 1} item={it} checked={done.includes(it.id)} onToggle={() => toggle(it.id)} big />
        ))}
      </ol>
      <button onClick={() => setShowMore(!showMore)} aria-expanded={showMore} className="mt-4 min-h-12 text-base font-semibold text-accent-ink underline underline-offset-4">
        {showMore ? r.less : r.more(rest.length + 1)}
      </button>
      {showMore && (
        <div className="anim-pop mt-3 space-y-4">
          {rest.length > 0 && (
            <ul className="m-0 list-none space-y-3 p-0">
              {rest.map((it) => (
                <StepItem key={it.id} item={it} checked={done.includes(it.id)} onToggle={() => toggle(it.id)} />
              ))}
            </ul>
          )}
          <Tips s={s} />
        </div>
      )}
    </Card>
  )
}

function StepItem({ item, checked, onToggle, n, big = false }: { item: CheckItem; checked: boolean; onToggle: () => void; n?: number; big?: boolean }) {
  return (
    <li className={`rounded-xl border-2 p-4 transition ${checked ? 'border-good bg-paper-2' : 'border-line'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-6 w-6 shrink-0 accent-[var(--good)]" />
        <span className="min-w-0">
          <span className={`block font-semibold ${big ? 'text-lg' : 'text-base'} ${checked ? 'text-ink-2 line-through' : 'text-ink'}`}>
            {n ? <span className="font-display text-accent-ink">{n}. </span> : null}
            {item.text}
          </span>
          {item.detail && <span className="mt-1 block text-base text-ink-2">{item.detail}</span>}
        </span>
      </label>
      {item.link && (
        <a href={item.link.href} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'mt-3 ml-9')}>
          {item.link.label} <ExternalIcon />
        </a>
      )}
    </li>
  )
}

function Tips({ s }: { s: Session }) {
  const platform = PLATFORMS.find((p) => p.id === s.platform)!
  return (
    <section className="rounded-xl bg-paper-2 p-4">
      <h3 className="font-display m-0 text-lg font-bold">{r.tipsTitle}</h3>
      <p className="m-0 mt-1 text-base text-ink-2">{r.tipsLead}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <h4 className="m-0 text-base font-bold text-good">{r.moreTitle}</h4>
          <ul className="m-0 mt-1 space-y-1 pl-5 text-base">
            {SIGNALS.more.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="m-0 text-base font-bold text-alarm">{r.lessTitle}</h4>
          <ul className="m-0 mt-1 space-y-1 pl-5 text-base">
            {SIGNALS.less.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <h4 className="m-0 mt-4 text-base font-bold">{r.appTips(platform.label)}</h4>
      <ul className="m-0 mt-1 space-y-2 pl-5 text-base">
        {tipsFor(s.platform, s.problems)
          .slice(0, 5)
          .map((t) => (
            <li key={t.text}>{t.text}</li>
          ))}
      </ul>
      <p className="m-0 mt-3 text-base text-ink-2">{r.menusChange}</p>
    </section>
  )
}

/* ---------- Videos: hand-picked first, then YouTube, then search links (F-15, G-07) ---------- */

type Picked = { video: Video; slot: Slot; source: 'pool' | 'channel' | 'api' }

const thumbOf = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

// Recent uploads from good channels: a separate file, loaded once, only here.
let feedLoad: Promise<Feed | null> | null = null
const loadFeed = () => (feedLoad ??= import('../data/feed.json').then((m) => m.default as Feed).catch(() => null))

function Watch({ s }: { s: Session }) {
  // Same "Surprise me" pick all day, so it can be cached.
  const [seed] = useState(() => Math.floor(Date.now() / 86_400_000))
  const slots = useMemo(() => allocate(s.mix, 10, seed), [s.mix, seed])
  const [state, setState] = useState<{ picked: Picked[]; missing: Slot[]; busy: boolean; loading: boolean }>({ picked: [], missing: [], busy: false, loading: true })

  useEffect(() => {
    const ctl = new AbortController()
    const seen = new Set<string>()
    const channels = new Set<string>()
    const picked: Picked[] = []
    const need: { slot: Slot; count: number }[] = []
    // 1. Hand-picked videos for each slot's topic (no quota, works on GitHub Pages).
    for (const slot of slots) {
      const topic = slot.key.split('/')[0]
      const fromPool = topic === WILDCARD_ID ? [] : poolFor(topic, s.mix.before)
      const fresh = filterVideos(
        fromPool.filter((v) => !channels.has(v.channel)).map((v) => ({ id: v.id, title: v.title, channel: v.channel, published: v.year ? `${v.year}` : '', thumb: thumbOf(v.id) })),
        s.turnDown,
        seen,
        slot.count,
      )
      fresh.forEach((v) => {
        channels.add(v.channel)
        picked.push({ video: v, slot, source: 'pool' })
      })
      if (fresh.length < slot.count) need.push({ slot, count: slot.count - fresh.length })
    }
    setState({ picked, missing: [], busy: false, loading: need.length > 0 })
    if (!need.length) return
    ;(async () => {
      // 2. New uploads from good channels for the topic (no quota either).
      //    They're all recent, so skip them when older videos were asked for.
      const feed = s.mix.before ? null : await loadFeed()
      if (ctl.signal.aborted) return
      if (feed)
        for (const n of need) {
          const topic = n.slot.key.split('/')[0]
          if (topic === WILDCARD_ID || !channelsFor(topic).length) continue
          // Checked against a copy: only the videos actually picked count as seen.
          const vids = filterVideos(
            feedFor(topic, feed)
              .filter((v) => !channels.has(v.channel))
              .map((v) => ({ ...v, thumb: thumbOf(v.id) })),
            s.turnDown,
            new Set(seen),
          )
          // One video per channel.
          for (const v of vids) {
            if (n.count === 0) break
            if (channels.has(v.channel)) continue
            channels.add(v.channel)
            seen.add(v.id)
            picked.push({ video: v, slot: n.slot, source: 'channel' })
            n.count--
          }
        }
      const still = need.filter((n) => n.count > 0)
      if (!still.length) return setState({ picked: [...picked], missing: [], busy: false, loading: false })
      // 3. Top up from YouTube search; 4. anything still missing becomes a search link.
      need.splice(0, need.length, ...still)
      const results = await Promise.all(need.map((n) => searchVideos(n.slot.query, s.mix.before, ctl.signal).catch(() => null)))
      if (ctl.signal.aborted) return
      const missing: Slot[] = []
      let busy = false
      need.forEach((n, i) => {
        const res = results[i]
        const vids = res && res.status === 'ok' ? filterVideos(res.items.filter((v) => !channels.has(v.channel)), s.turnDown, seen, n.count) : []
        if (res && res.status !== 'ok' && res.status !== 'unconfigured') busy = true
        vids.forEach((v) => {
          channels.add(v.channel)
          picked.push({ video: v, slot: n.slot, source: 'api' })
        })
        if (vids.length < n.count) missing.push({ ...n.slot, count: n.count - vids.length })
      })
      setState({ picked: [...picked], missing, busy, loading: false })
    })()
    return () => ctl.abort()
  }, [slots, s.mix.before, s.turnDown])

  const { picked, missing, busy, loading } = state
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">{r.watchTitle}</h2>
      <p className="m-0 mt-1 text-base text-ink-2">{r.watchLead}</p>

      {picked.length > 1 && (
        <a href={playAllUrl(picked.map((p) => p.video))} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'mt-4')}>
          <PlayIcon /> {r.playAll}
        </a>
      )}

      {picked.length > 0 && (
        <ul className="anim-pop m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
          {picked.map(({ video: v, slot, source }) => (
            <li key={v.id} className="min-w-0">
              <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 gap-3 rounded-xl border border-line p-2 transition hover:border-ink-2">
                {v.thumb && <img src={v.thumb} alt="" width={128} height={72} loading="lazy" className="h-[72px] w-[128px] shrink-0 rounded-lg object-cover" />}
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-base font-semibold leading-snug text-ink">{v.title}</span>
                  <span className="mt-1 block truncate text-base text-ink-2">
                    {v.channel}
                    {v.published ? ` · ${v.published.slice(0, 4)}` : ''}
                  </span>
                  <span className="mt-1 inline-block rounded-full bg-paper-2 px-2 text-base text-ink-2">
                    {/* Channel videos match the topic, not a sub-topic. */}
                    {source === 'pool' ? r.handPicked : source === 'channel' ? r.goodChannel : r.fromYouTube} · {source === 'channel' ? slot.category : slot.label}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="mt-4" role="status">
          <p className="m-0 flex items-center gap-3 text-base text-ink-2">
            <Mascot pose="diagnose" size={40} /> {r.loading}
          </p>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </ul>
        </div>
      )}

      {!loading && missing.length > 0 && (
        <div className="anim-pop mt-4">
          {busy && (
            <p className="m-0 mb-2 flex items-center gap-2 text-base text-ink-2">
              <Mascot pose="confused" size={36} /> {r.busy}
            </p>
          )}
          <p className="m-0 mb-2 text-base text-ink-2">{r.searchHint}</p>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {missing.map((slot) => (
              <li key={slot.key} className="min-w-0">
                <a
                  href={searchUrl(slot.query, s.mix.before)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-line bg-card px-4 py-2 transition hover:border-ink"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-ink">{slot.label}</span>
                    <span className="block text-base text-ink-2">{r.searchFor(slot.query)}</span>
                  </span>
                  <ExternalIcon className="text-accent-ink" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Follow s={s} />

      <p className="m-0 mt-4 text-base text-ink-2">{r.creditYouTube}</p>
    </Card>
  )
}

/** Subscribing is one of the strongest "more of this" signals YouTube has. */
function Follow({ s }: { s: Session }) {
  const list = followFor(
    s.mix.categories.map((c) => c.id),
    s.turnDown,
  )
  if (!list.length) return null
  return (
    <section className="mt-6" aria-labelledby="follow">
      <h3 id="follow" className="font-display m-0 text-lg font-bold">
        {r.followTitle}
      </h3>
      <p className="m-0 mt-1 text-base text-ink-2">{r.followLead}</p>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {list.map((c) => (
          <li key={c.id} className="min-w-0 max-w-full">
            <a
              href={`https://www.youtube.com/channel/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full border-2 border-line bg-card px-4 text-base font-semibold text-ink transition hover:border-ink"
            >
              <span className="truncate">{c.name}</span> <ExternalIcon className="shrink-0 text-accent-ink" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Tip-guide apps have no video tools, so we hand over the searches (F-21 to F-23). */
function SearchTerms({ s }: { s: Session }) {
  const slots = useMemo(() => allocate(s.mix, 10, 7), [s.mix])
  const platform = s.platform as 'instagram' | 'tiktok' | 'x'
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">{r.watchTitle}</h2>
      <p className="m-0 mt-1 text-base text-ink-2">{r.watchTips}</p>
      <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
        {slots.map((slot) => {
          const href = platformSearchUrl(platform, slot.query)
          const body = (
            <>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-ink">{slot.label}</span>
                <span className="block text-base text-ink-2">“{slot.query}”</span>
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

/* ---------- Your new feed, in one sentence (F-06 summary) ---------- */

function FeedSummary({ s, onAdjust }: { s: Session; onAdjust: () => void }) {
  const cats = s.mix.categories.filter((c) => c.weight > 0)
  const sentence = summarize(s.mix.categories.map((c) => ({ label: displayLabel(c), weight: c.weight, surprise: c.id === WILDCARD_ID })))
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">{r.feedTitle}</h2>
      <p className="m-0 mt-2 text-lg text-ink">{sentence}</p>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full" aria-hidden>
        {cats.map((c, i) => (
          <div key={c.id} style={{ width: `${c.weight}%`, background: categoryColor(s.mix.categories, c.id), borderRight: i < cats.length - 1 ? '2px solid var(--card)' : undefined }} />
        ))}
      </div>
      {s.mix.before && <p className="m-0 mt-2 text-base text-ink-2">{r.older(s.mix.before)}</p>}
      {s.turnDown.length > 0 && <p className="m-0 mt-2 text-base text-ink-2">{r.showLess(s.turnDown.join(', '))}</p>}
      <Button variant="secondary" className="mt-4" onClick={onAdjust}>
        {r.adjust}
      </Button>
    </Card>
  )
}

/* ---------- Come back next week (F-18, F-05) ---------- */

function SaveCard({ s, onReset }: { s: Session; onReset: () => void }) {
  const link = recipeUrl(s)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(r.copy, link)
    }
  }
  return (
    <Card>
      <h2 className="font-display m-0 text-xl font-bold">{r.againTitle}</h2>
      <p className="m-0 mt-1 text-base text-ink-2">{r.againLead}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button onClick={() => download('check-my-feed.ics', tuneUpIcs(link), 'text/calendar')}>{r.remind}</Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? r.copied : r.copy}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          {r.startOver}
        </Button>
      </div>
    </Card>
  )
}
