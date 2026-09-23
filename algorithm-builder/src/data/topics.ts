import { TOPIC_LIST } from './library'

/**
 * The "What do you like?" chips (F-02). Each chip becomes a mix category with
 * sensible sub-topics, so nobody starts from a blank chart. Queries are what we
 * actually send to YouTube search; keep them specific enough to return good
 * long-form results.
 */

export interface TopicPreset {
  id: string
  label: string
  /** Shown before "See all topics" is opened. */
  popular?: boolean
  children: { label: string; query: string }[]
}

/** Every topic in the library (202, see docs/ux/TAXONOMY.md), as mix categories. */
export const TOPICS: TopicPreset[] = TOPIC_LIST.map((t) => ({ id: t.id, label: t.label, popular: t.suggested, children: t.subtopics }))

/** Pool for the wildcard slice (F-10): "random but good", not truly random. */
export const WILDCARD_QUERIES = [
  'bookbinding by hand',
  'lock picking explained',
  'mushroom foraging',
  'bonsai care',
  'sign painting by hand',
  'knife sharpening',
  'map making by hand',
  'old radio restoration',
  'beekeeping',
  'calligraphy',
  'speedrun explained',
  'stop motion animation making',
  'how its made factory',
  'miniature model making',
  'deep sea creatures documentary',
  'origami tutorial advanced',
  'restoration rusty tool',
  'linguistics explained',
  'architecture explained',
  'bird calls explained',
  'typography history',
  'maps explained geography',
  'clock repair',
  'glass blowing',
]

export const WILDCARD_ID = 'wildcard'
export const MAX_CATEGORIES = 7
