export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'x'

export type ProblemId = 'one-topic' | 'too-new' | 'rage-bait' | 'no-discovery' | 'stale'

/** A leaf of the mix: something we can search for. */
export interface SubTopic {
  id: string
  label: string
  /** Share of its parent category, 0–100. Siblings always sum to 100. */
  weight: number
  locked?: boolean
  /** What we actually search for; defaults to the label. */
  query?: string
}

export interface Category {
  id: string
  label: string
  /** Share of the whole feed, 0–100. Categories always sum to 100. */
  weight: number
  locked?: boolean
  children: SubTopic[]
}

export interface Mix {
  categories: Category[]
  /** Prefer videos uploaded before this year (time capsule), or null for any age. */
  before: number | null
}

/** A tally of the first 20 videos on the homepage (G-02). */
export interface Tally {
  date: string
  wanted: number
  sickOf: number
  other: number
}

export interface Session {
  v: 1
  platform: Platform
  likes: string[]
  problems: ProblemId[]
  note: string
  turnDown: string[]
  mix: Mix
  baseline: Tally | null
  followUp: Tally | null
  /** Channels they said "not for me" to (YouTube channel ids). */
  hidden: string[]
}

export interface Video {
  id: string
  title: string
  channel: string
  published: string
  thumb: string
}
