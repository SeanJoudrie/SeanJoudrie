import { norm, rank, score } from '../lib/search'
import type { ProblemId } from '../lib/types'
import channels from './channels.json'
import pool from './pool.json'
import taxonomy from './taxonomy.json'

/**
 * The topic library (docs/ux/TAXONOMY.md), the "show me less of" list, and
 * the hand-picked, oEmbed-verified video pool (`npm run verify:pool`).
 */

export interface Topic {
  id: string
  label: string
  group: string
  subtopics: { label: string; query: string }[]
  synonyms: string[]
  /** Looser words that lead here ("lipstick" → Beauty & makeup). */
  keywords: string[]
  audience: string
  suggested: boolean
  popularWith: string[]
}

export interface Culprit {
  id: string
  label: string
  synonyms: string[]
  /** Topics to suggest instead (never the same franchise). */
  alternatives: string[]
}

export interface PoolVideo {
  id: string
  title: string
  channel: string
  year: number | null
  topics: string[]
  source: string
  checked: string
}

/** A YouTube channel confirmed by scripts/channels.mjs. */
export interface Channel {
  id: string
  name: string
}

/** Recent uploads per channel, from scripts/feeds.mjs (loaded on the results page). */
export interface Feed {
  fetched: string
  channels: Record<
    string,
    {
      name: string
      videos: { id: string; title: string; published: string }[]
      /** Median views per day of the last 60 days of full-length uploads. */
      perDay?: number
      /** Full-length uploads in the last 30 days. */
      recent?: number
    }
  >
}

export const TOPIC_LIST = taxonomy.topics as Topic[]
export const CULPRIT_LIST = taxonomy.culprits as Culprit[]
export const POOL = pool as PoolVideo[]
export const GROUPS = [...new Set(TOPIC_LIST.map((t) => t.group))]

const byId = new Map(TOPIC_LIST.map((t) => [t.id, t]))
export const topicById = (id: string) => byId.get(id)

const topicNames = (t: Topic) => [t.label, ...t.synonyms]
const topicRelated = (t: Topic) => [...t.subtopics.map((s) => s.label), ...t.keywords, t.group]
const culpritNames = (c: Culprit) => [c.label, ...c.synonyms]

export const searchTopics = (q: string, limit = 12) => rank(q, TOPIC_LIST, topicNames, limit, topicRelated)
export const searchCulprits = (q: string, limit = 8) => rank(q, CULPRIT_LIST, culpritNames, limit)

/**
 * Names to offer on "What's taking over your feed?": the shows and people we
 * know first, then whole topics, so "lipstick" still finds Beauty & makeup.
 */
export function searchLessOf(q: string, limit = 8): string[] {
  const hits = [
    ...CULPRIT_LIST.map((c, i) => ({ label: c.label, s: score(q, culpritNames(c)), i })),
    ...TOPIC_LIST.map((t, i) => ({ label: t.label, s: score(q, topicNames(t), topicRelated(t)), i: CULPRIT_LIST.length + i })),
  ]
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
  const out: string[] = []
  for (const h of hits) if (out.length < limit && !out.some((o) => norm(o) === norm(h.label))) out.push(h.label)
  return out
}

/** The culprit a typed name refers to, if we know it well enough. */
export function findCulprit(name: string): Culprit | undefined {
  // 90+ is the name, a nickname or a plural: "star" alone isn't Star Wars.
  return CULPRIT_LIST.find((c) => score(name, culpritNames(c)) >= 90)
}

/** The topic a typed name refers to by its name or a nickname ("makeup"). */
export function findTopic(name: string): Topic | undefined {
  return TOPIC_LIST.find((t) => score(name, topicNames(t)) >= 90)
}

/** What people commonly want back when their feed is taken over. */
export const DEFAULT_SUGGESTIONS = ['documentaries', 'nature-relaxing', 'easy-recipes']

/**
 * Up to `n` topics to pre-select on "What do you want to see more of?",
 * drawn from what they're sick of. Never suggests a topic that matches the
 * thing they're turning down.
 */
export function suggestFor(turnDown: string[], n = 3): string[] {
  const out: string[] = []
  const clashes = (id: string) => {
    const t = byId.get(id)
    return !t || turnDown.some((d) => score(d, topicNames(t), t.keywords) >= 60)
  }
  for (const d of turnDown) for (const a of findCulprit(d)?.alternatives ?? []) if (!out.includes(a) && !clashes(a)) out.push(a)
  for (const a of DEFAULT_SUGGESTIONS) if (!out.includes(a) && !clashes(a)) out.push(a)
  return out.slice(0, n)
}

const RAGE = new Set(['news-explained'])

/** Work out the problem from what they named, so nobody has to answer it. */
export function inferProblems(turnDown: string[], bored: boolean): ProblemId[] {
  const p: ProblemId[] = []
  if (turnDown.length) p.push('one-topic')
  if (turnDown.some((d) => findCulprit(d)?.alternatives.some((a) => RAGE.has(a)))) p.push('rage-bait')
  if (bored) p.push('stale')
  return p
}

/** Hand-picked videos for a topic, optionally only older ones. */
export function poolFor(topicId: string, before: number | null): PoolVideo[] {
  return POOL.filter((v) => v.topics.includes(topicId) && (!before || (v.year !== null && v.year < before)))
}

const { _handPickedOnly: HAND_PICKED_ONLY = [], ...CHANNELS } = channels as unknown as Record<string, Channel[]> & { _handPickedOnly?: string[] }

/** Good channels for a topic, best first. */
export const channelsFor = (topicId: string): Channel[] => CHANNELS[topicId] ?? []

/**
 * Politics, news, religion, kids and health: recommending the biggest
 * channels means picking sides or trusting size, so these keep their
 * hand-picked order and never get "Popular this month".
 */
export const isHandPickedOnly = (topicId: string) => HAND_PICKED_ONLY.includes(topicId)

/**
 * Recent videos from a topic's good channels, taking turns between channels
 * so one channel doesn't fill the list. Only used when older videos aren't
 * asked for (these are all recent).
 */
export function feedFor(topicId: string, feed: Feed, hidden: string[] = []): { id: string; title: string; channel: string; published: string }[] {
  const lists = channelsFor(topicId)
    .filter((c) => !hidden.includes(c.id))
    .map((c) => (feed.channels[c.id]?.videos ?? []).map((v) => ({ ...v, channel: feed.channels[c.id].name })))
  const out: { id: string; title: string; channel: string; published: string }[] = []
  for (let i = 0; lists.some((l) => l[i]); i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}

/** "Big Cats | BBC Earth" → "Big Cats": the channel name is already shown. */
export function withoutChannel(title: string | undefined, channel: string): string | undefined {
  if (!title) return title
  const cut = title.replace(new RegExp(`\\s*[|\\-–—:]\\s*${channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '')
  return cut || title
}

export interface Recommendation {
  channel: Channel
  topic: string
  /** Doing much better than the other channels on this topic right now. */
  popular: boolean
  latest?: string
}

/**
 * Channels to recommend for these topics, best first, taking turns between
 * topics (the first topic is the one they want most). Leaves out anything
 * they hid or are sick of. With the feed, each topic's channels are ranked
 * by how they're doing right now, and the clear leader is "Popular this
 * month"; hand-picked-only topics keep their order and get no badge.
 */
export function recommend(topicIds: string[], turnDown: string[], hidden: string[], feed: Feed | null): Recommendation[] {
  const bad = turnDown.map(norm).filter(Boolean)
  const lists = topicIds.map((topic) => {
    const stat = (c: Channel) => feed?.channels[c.id]?.perDay ?? 0
    let list = channelsFor(topic).filter((c) => !hidden.includes(c.id) && !bad.some((b) => norm(c.name).includes(b)))
    const ranked = feed && !isHandPickedOnly(topic)
    if (ranked) list = [...list].sort((a, b) => stat(b) - stat(a))
    // The leader is popular if it's active and at least twice the topic's middle channel.
    const rates = channelsFor(topic).map(stat).filter(Boolean).sort((a, b) => a - b)
    const middle = rates[Math.floor(rates.length / 2)] ?? 0
    return list.map((c, i) => ({
      channel: c,
      topic,
      popular: !!ranked && i === 0 && rates.length >= 3 && (feed.channels[c.id]?.recent ?? 0) >= 2 && stat(c) >= 2 * middle,
      latest: withoutChannel(feed?.channels[c.id]?.videos[0]?.title, c.name),
    }))
  })
  const out: Recommendation[] = []
  for (let i = 0; lists.some((l) => l[i]); i++) for (const l of lists) if (l[i] && !out.some((r) => r.channel.id === l[i].channel.id)) out.push(l[i])
  return out
}
