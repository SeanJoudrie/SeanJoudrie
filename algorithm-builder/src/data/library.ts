import { rank, score } from '../lib/search'
import type { ProblemId } from '../lib/types'
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

export const TOPIC_LIST = taxonomy.topics as Topic[]
export const CULPRIT_LIST = taxonomy.culprits as Culprit[]
export const POOL = pool as PoolVideo[]
export const GROUPS = [...new Set(TOPIC_LIST.map((t) => t.group))]

const byId = new Map(TOPIC_LIST.map((t) => [t.id, t]))
export const topicById = (id: string) => byId.get(id)

export const searchTopics = (q: string, limit = 12) => rank(q, TOPIC_LIST, (t) => [t.label, ...t.synonyms, ...t.subtopics.map((s) => s.label)], limit)
export const searchCulprits = (q: string, limit = 8) => rank(q, CULPRIT_LIST, (c) => [c.label, ...c.synonyms], limit)

/** The culprit a typed name refers to, if we know it well enough. */
export function findCulprit(name: string): Culprit | undefined {
  return CULPRIT_LIST.find((c) => score(name, [c.label, ...c.synonyms]) >= 80)
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
    return !t || turnDown.some((d) => score(d, [t.label, ...t.synonyms]) >= 60)
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
