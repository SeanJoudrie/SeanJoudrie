import { useEffect, useMemo, useState } from 'react'
import { COPY, summarize } from '../copy'
import { BRAND } from '../data/brand'
import { channelNamed, channelsFor, feedFor, picksFor, poolFor, recommend, surpriseFrom, topicById, type Feed } from '../data/library'
import { PLATFORMS, SIGNALS, tipsFor } from '../data/playbooks'
import { WILDCARD_ID } from '../data/topics'
import { buildChecklist, type CheckItem } from '../lib/checklist'
import { download, tuneUpIcs } from '../lib/ics'
import { allocate, filterVideos, platformSearchUrl, playAllUrl, PLAYLIST_SIZE, searchUrl, searchVideos, type Slot } from '../lib/playlist'
import { MAX_PARTS, pctFromTally, pickId, recipeUrl, tallyFromPct, togglePick } from '../lib/session'
import type { Category, Mix, Session, Tally, Video } from '../lib/types'
import { EstimateOptions } from './Flow'
import { CloseIcon, ExternalIcon, PlayIcon } from './icons'
import { Mascot } from './Mascot'
import { categoryColor, displayLabel } from './MixChart'
import { Button, buttonClass, Card, Chip } from './ui'

const r = COPY.results

export function Results({
  s,
  returning,
  onAdjust,
  onReset,
  onFollowUp,
  onHide,
  onMix,
}: {
  s: Session
  returning: boolean
  onAdjust: () => void
  onReset: () => void
  onFollowUp: (t: Tally) => void
  onHide: (hidden: string[]) => void
  onMix: (mix: Mix) => void
}) {
  const [showMore, setShowMore] = useState(false)
  const checkBack = returning && !!s.baseline
  const youtube = s.platform === 'youtube'
  const sentence = summarize(s.mix.categories.map((c) => ({ label: displayLabel(c), weight: c.weight, surprise: c.id === WILDCARD_ID })))
  return (
    <div className="anim-rise space-y-5">
      <header className="flex items-center gap-4">
        <Mascot pose="celebrate" size={64} className="shrink-0" />
        <div className="min-w-0">
          <h1 tabIndex={-1} className="font-display m-0 text-3xl font-bold leading-tight sm:text-4xl">
            {checkBack ? r.titleBack : r.title}
          </h1>
          <p className="m-0 mt-1 text-lg text-ink-2">{youtube ? sentence : r.leadTips}</p>
        </div>
      </header>

      {checkBack && <BetterCheck s={s} onFollowUp={onFollowUp} onNotBetter={() => setShowMore(true)} />}

      {youtube ? <Feed s={s} onAdjust={onAdjust} onHide={onHide} onMix={onMix} /> : <SearchTerms s={s} onAdjust={onAdjust} />}

      <Steps s={s} showMore={showMore} setShowMore={setShowMore} />

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

/* ---------- Clean-up: 2 small things, then the rest (F-14, G-03) ----------
 * People here have usually tried "Not interested" already, so this sits
 * under their new feed, small, with no boxes to tick. */

function Steps({ s, showMore, setShowMore }: { s: Session; showMore: boolean; setShowMore: (v: boolean) => void }) {
  const items = useMemo(() => buildChecklist(s.platform, s.turnDown, s.problems), [s.platform, s.turnDown, s.problems])
  const top = items.slice(0, 2)
  const rest = items.slice(2)
  return (
    <Card>
      <h2 className="font-display m-0 text-lg font-bold">{s.platform === 'youtube' ? r.cleanTitle : r.cleanTitleTips}</h2>
      <ol className="m-0 mt-3 list-none space-y-3 p-0">
        {top.map((it, i) => (
          <StepItem key={it.id} n={i + 1} item={it} />
        ))}
      </ol>
      <button onClick={() => setShowMore(!showMore)} aria-expanded={showMore} className="mt-2 min-h-12 text-base font-semibold text-accent-ink underline underline-offset-4">
        {showMore ? r.less : r.more(rest.length + 1)}
      </button>
      {showMore && (
        <div className="anim-pop mt-2 space-y-4">
          {rest.length > 0 && (
            <ul className="m-0 list-none space-y-3 p-0">
              {rest.map((it) => (
                <StepItem key={it.id} item={it} />
              ))}
            </ul>
          )}
          <Tips s={s} />
        </div>
      )}
    </Card>
  )
}

function StepItem({ item, n }: { item: CheckItem; n?: number }) {
  return (
    <li className="text-base">
      <span className="block font-semibold text-ink">
        {n ? <span className="text-accent-ink">{n}. </span> : null}
        {item.text}
      </span>
      {item.detail && <span className="block text-ink-2">{item.detail}</span>}
      {item.link && (
        <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 font-semibold text-accent-ink underline underline-offset-4">
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

function useFeed(): Feed | null | undefined {
  const [feed, setFeed] = useState<Feed | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    loadFeed().then((f) => live && setFeed(f))
    return () => {
      live = false
    }
  }, [])
  return feed
}

type Videos = { picked: Picked[]; missing: Slot[]; busy: boolean; loading: boolean }

/** Find this week's videos: hand-picked, then good channels, then YouTube search, then search links. */
function useVideos(s: Session, slots: Slot[]): Videos {
  const [state, setState] = useState<Videos>({ picked: [], missing: [], busy: false, loading: true })

  useEffect(() => {
    const ctl = new AbortController()
    const seen = new Set<string>()
    const channels = new Set<string>()
    const picked: Picked[] = []
    const need: { slot: Slot; count: number }[] = []
    // 1. Hand-picked videos for each slot's topic (no quota, works on GitHub Pages).
    //    Picks ("The Office") are their own search, so they skip the topic's list.
    for (const slot of slots) {
      const topic = slot.key.split('/')[0]
      const isPick = slot.key.split('/')[1]?.startsWith('pick-')
      const fromPool = topic === WILDCARD_ID || isPick ? [] : poolFor(topic, s.mix.before)
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
          const [topic, part] = n.slot.key.split('/')
          if (topic === WILDCARD_ID) {
            // A good video from a topic they didn't pick, the same one all day.
            const day = Math.floor(Date.now() / 86_400_000)
            const v = surpriseFrom(feed, s.mix.categories.map((c) => c.id), s.hidden, s.turnDown, day)
            if (v && !seen.has(v.id) && !channels.has(v.channel)) {
              seen.add(v.id)
              channels.add(v.channel)
              picked.push({ video: { ...v, thumb: thumbOf(v.id) }, slot: { ...n.slot, label: topicById(v.topic)?.label ?? n.slot.label }, source: 'channel' })
              n.count--
            }
            continue
          }
          // A pick with its own channel ("The Office") gets that channel's latest videos.
          if (part?.startsWith('pick-')) {
            const own = channelNamed(n.slot.label)
            const vids = own && !s.hidden.includes(own.id) ? (feed.channels[own.id]?.videos ?? []) : []
            for (const v of filterVideos(vids.map((v) => ({ ...v, channel: feed.channels[own!.id].name, thumb: thumbOf(v.id) })), s.turnDown, seen, n.count)) {
              channels.add(v.channel)
              picked.push({ video: v, slot: n.slot, source: 'channel' })
              n.count--
            }
            continue
          }
          if (!channelsFor(topic).length) continue
          // Checked against a copy: only the videos actually picked count as seen.
          const vids = filterVideos(
            feedFor(topic, feed, s.hidden)
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
      const results = await Promise.all(still.map((n) => searchVideos(n.slot.query, s.mix.before, ctl.signal).catch(() => null)))
      if (ctl.signal.aborted) return
      const missing: Slot[] = []
      let busy = false
      still.forEach((n, i) => {
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
  }, [slots, s.mix.before, s.turnDown, s.hidden])

  return state
}

/* ---------- The new feed: the plan, then a shelf per topic ---------- */

function Feed({ s, onAdjust, onHide, onMix }: { s: Session; onAdjust: () => void; onHide: (hidden: string[]) => void; onMix: (mix: Mix) => void }) {
  // Same "Surprise me" pick all day, so it can be cached.
  const [seed] = useState(() => Math.floor(Date.now() / 86_400_000))
  const slots = useMemo(() => {
    const out = allocate(s.mix, PLAYLIST_SIZE, seed)
    // "Surprise me" is small, so it can round down to nothing: it always gets one.
    const wild = s.mix.categories.find((c) => c.id === WILDCARD_ID && c.weight > 0)
    if (wild && !out.some((x) => x.key.startsWith(`${WILDCARD_ID}/`))) out.push(...allocate({ before: s.mix.before, categories: [{ ...wild, weight: 100 }] }, 1, seed))
    // Something they picked by name ("The Office") always gets a video too.
    for (const c of s.mix.categories)
      for (const k of c.children)
        if (c.weight > 0 && k.id.startsWith('pick-') && !out.some((x) => x.key === `${c.id}/${k.id}`))
          out.push({ key: `${c.id}/${k.id}`, label: k.label, category: c.label, query: k.query || k.label, count: 1 })
    return out
  }, [s.mix, seed])
  const videos = useVideos(s, slots)
  const cats = s.mix.categories.filter((c) => c.weight > 0)
  const countFor = (id: string) => slots.filter((x) => x.key.startsWith(`${id}/`)).reduce((n, x) => n + x.count, 0)
  const all = videos.picked.map((p) => p.video)

  return (
    <>
      <Card>
        <section aria-labelledby="plan">
          <h2 id="plan" className="font-display m-0 text-xl font-bold">
            {r.planTitle}
          </h2>
          <p className="m-0 mt-1 text-base text-ink-2">{r.planLead(slots.reduce((n, x) => n + x.count, 0))}</p>
          <div className="mt-4 flex h-5 overflow-hidden rounded-full" aria-hidden>
            {cats.map((c, i) => (
              <div key={c.id} style={{ width: `${c.weight}%`, background: categoryColor(s.mix.categories, c.id), borderRight: i < cats.length - 1 ? '2px solid var(--card)' : undefined }} />
            ))}
          </div>
          <ul className="m-0 mt-3 list-none space-y-1 p-0">
            {cats.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 text-base">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: categoryColor(s.mix.categories, c.id) }} aria-hidden />
                <span className="min-w-0 flex-1 font-semibold text-ink">{displayLabel(c)}</span>
                <span className="ml-auto tabular-nums text-ink-2">{r.share(c.weight, countFor(c.id))}</span>
              </li>
            ))}
          </ul>
          {s.mix.before && <p className="m-0 mt-2 text-base text-ink-2">{r.older(s.mix.before)}</p>}
          {s.turnDown.length > 0 && <p className="m-0 mt-2 text-base text-ink-2">{r.showLess(s.turnDown.join(', '))}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {all.length > 1 && (
              <a href={playAllUrl(all)} target="_blank" rel="noopener noreferrer" className={buttonClass('primary')}>
                <PlayIcon /> {r.playAll}
              </a>
            )}
            <Button variant="secondary" onClick={onAdjust}>
              {r.adjust}
            </Button>
          </div>
        </section>
      </Card>

      {videos.busy && (
        <p className="m-0 flex items-center gap-2 text-base text-ink-2">
          <Mascot pose="confused" size={36} /> {r.busy}
        </p>
      )}

      {cats.map((c) => (
        <Shelf key={c.id} s={s} cat={c} count={countFor(c.id)} videos={videos} onHide={onHide} onMix={onMix} />
      ))}

      <p className="m-0 text-base text-ink-2">{r.creditYouTube}</p>
    </>
  )
}

function Shelf({ s, cat, count, videos, onHide, onMix }: { s: Session; cat: Category; count: number; videos: Videos; onHide: (hidden: string[]) => void; onMix: (mix: Mix) => void }) {
  const mine = videos.picked.filter((p) => p.slot.key.startsWith(`${cat.id}/`))
  const links = videos.missing.filter((m) => m.key.startsWith(`${cat.id}/`))
  const surprise = cat.id === WILDCARD_ID
  const picks = surprise ? [] : picksFor(cat.id, s.turnDown)
  const color = categoryColor(s.mix.categories, cat.id)
  const heading = `shelf-${cat.id}-title`
  return (
    <Card className="scroll-mt-4">
      <section id={`shelf-${cat.id}`} aria-labelledby={heading}>
        <header className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id={heading} className="font-display m-0 flex min-w-0 items-center gap-2 text-xl font-bold">
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
            <span className="truncate">{surprise ? r.surpriseTitle : displayLabel(cat)}</span>
          </h2>
          <span className="ml-auto text-base tabular-nums text-ink-2">{r.share(cat.weight, count)}</span>
        </header>
        {surprise && <p className="m-0 mt-1 text-base text-ink-2">{r.surpriseLead}</p>}

        {videos.loading && !mine.length ? (
          <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0" aria-hidden>
            {Array.from({ length: Math.min(2, Math.max(1, count)) }).map((_, i) => (
              <li key={i} className="skeleton aspect-video rounded-xl" />
            ))}
          </ul>
        ) : (
          (mine.length > 0 || links.length > 0) && (
            // Swipe on a phone (the next card peeks in), a grid on bigger screens.
            <ul className="-mx-5 mt-4 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {mine.map(({ video: v, slot, source }) => (
                <li key={v.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="block h-full rounded-xl border border-line p-2 transition hover:border-ink-2">
                    {v.thumb && <img src={v.thumb} alt="" width={320} height={180} loading="lazy" className="aspect-video w-full rounded-lg object-cover" />}
                    <span className="mt-2 line-clamp-2 block text-base font-semibold leading-snug text-ink">{v.title}</span>
                    <span className="mt-1 block truncate text-base text-ink-2">
                      {v.channel}
                      {v.published ? ` · ${v.published.slice(0, 4)}` : ''}
                    </span>
                    <span className="mt-1 inline-block rounded-full bg-paper-2 px-2 text-base text-ink-2">
                      {source === 'pool' ? r.handPicked : source === 'channel' ? r.goodChannel : r.fromYouTube}
                      {/* Channel videos match the topic, not a part of it; a surprise says where it's from. */}
                      {surprise ? ` · ${slot.label}` : source !== 'channel' && slot.label !== cat.label ? ` · ${slot.label}` : ''}
                    </span>
                  </a>
                </li>
              ))}
              {links.map((slot) => (
                <li key={slot.key} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <a
                    href={searchUrl(slot.query, s.mix.before)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full min-h-28 flex-col justify-between gap-2 rounded-xl border-2 border-dashed border-line bg-card p-4 transition hover:border-ink"
                  >
                    <span className="block text-base font-semibold text-ink">{slot.label}</span>
                    <span className="flex items-center justify-between gap-2 text-base text-ink-2">
                      {r.searchFor(slot.query)} <ExternalIcon className="shrink-0 text-accent-ink" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )
        )}

        {picks.length > 0 && <Picks cat={cat} picks={picks} mix={s.mix} onMix={onMix} />}
        {!surprise && <ShelfChannels s={s} topic={cat.id} onHide={onHide} />}
      </section>
    </Card>
  )
}

/** "Want something specific?": sitcoms → The Office, Seinfeld... Tapping adds it to the plan. */
function Picks({ cat, picks, mix, onMix }: { cat: Category; picks: { label: string; query: string }[]; mix: Mix; onMix: (mix: Mix) => void }) {
  const on = (label: string) => cat.children.some((k) => k.id === pickId(label))
  const full = cat.children.length >= MAX_PARTS
  return (
    <div className="mt-4">
      <h3 className="m-0 text-base font-semibold text-ink">{r.picksTitle(displayLabel(cat))}</h3>
      <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {picks.map((p) => (
          // Kept at full width so the row scrolls instead of squashing the chips.
          <span key={p.label} className="shrink-0 sm:shrink">
            <Chip selected={on(p.label)} disabled={full && !on(p.label)} onClick={() => onMix(togglePick(mix, cat.id, p))}>
              {p.label}
            </Chip>
          </span>
        ))}
      </div>
    </div>
  )
}

/* Channels for this topic: 3 at a time, "not for me" with undo, others. */

const PAGE = 3

function ShelfChannels({ s, topic, onHide }: { s: Session; topic: string; onHide: (hidden: string[]) => void }) {
  const feed = useFeed()
  const [start, setStart] = useState(0)
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null)
  const all = useMemo(() => (feed === undefined ? [] : recommend([topic], s.turnDown, s.hidden, feed)), [feed, topic, s.turnDown, s.hidden])
  if (feed === undefined) return null
  const hiddenHere = s.hidden.filter((id) => channelsFor(topic).some((c) => c.id === id))
  if (!all.length && !hiddenHere.length) return null

  const from = all.length ? start % all.length : 0
  const shown = [...all.slice(from, from + PAGE), ...all.slice(0, Math.max(0, from + PAGE - all.length))].slice(0, Math.min(PAGE, all.length))
  const hide = (id: string, name: string) => {
    onHide([...s.hidden.filter((x) => x !== id), id])
    setUndo({ id, name })
  }
  return (
    <div className="mt-4" role="region" aria-label={r.channelsFor(topicById(topic)?.label ?? topic)}>
      <h3 className="m-0 text-base font-semibold text-ink">{r.channelsTitle}</h3>
      {shown.length > 0 && (
        <ul className="-mx-5 mt-2 flex list-none snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {shown.map(({ channel: c, popular, latest }) => (
            <li key={c.id} className="flex w-[72%] min-w-0 shrink-0 snap-start items-start gap-1 rounded-xl border border-line p-2 pl-3 sm:w-auto">
              <a href={`https://www.youtube.com/channel/${c.id}`} target="_blank" rel="noopener noreferrer" className="min-h-12 min-w-0 flex-1 rounded-lg py-1">
                <span className="flex items-center gap-2 text-base font-semibold text-ink">
                  <span className="truncate">{c.name}</span> <ExternalIcon className="shrink-0 text-accent-ink" />
                </span>
                {popular && <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 text-base font-semibold text-ink">{r.popular}</span>}
                {latest && <span className="mt-1 line-clamp-2 block text-base text-ink-2">{r.latest(latest)}</span>}
              </a>
              <button
                onClick={() => hide(c.id, c.name)}
                aria-label={r.notForMe(c.name)}
                title={r.notForMe(c.name)}
                className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full text-ink-2 transition hover:bg-paper-2 hover:text-ink"
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 text-base text-ink-2" aria-live="polite">
        {undo && (
          <>
            {r.hidden(undo.name)}{' '}
            <button
              onClick={() => {
                onHide(s.hidden.filter((x) => x !== undo.id))
                setUndo(null)
              }}
              className="min-h-12 font-semibold text-accent-ink underline underline-offset-4"
            >
              {r.undo}
            </button>
          </>
        )}
      </p>
      {all.length > PAGE && (
        <button onClick={() => setStart(from + PAGE)} className="min-h-12 text-base font-semibold text-accent-ink underline underline-offset-4">
          {r.showOthers}
        </button>
      )}
      {!all.length && (
        <p className="m-0 text-base text-ink-2">
          {r.noneLeft}{' '}
          <button onClick={() => onHide(s.hidden.filter((id) => !hiddenHere.includes(id)))} className="min-h-12 font-semibold text-accent-ink underline underline-offset-4">
            {r.showHidden}
          </button>
        </p>
      )}
    </div>
  )
}

/** Tip-guide apps have no video tools, so we hand over the searches (F-21 to F-23). */
function SearchTerms({ s, onAdjust }: { s: Session; onAdjust: () => void }) {
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
