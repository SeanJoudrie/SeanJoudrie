import type { ProblemId } from '../lib/types'

export const PROBLEMS: { id: ProblemId; label: string; hint: string }[] = [
  { id: 'one-topic', label: 'Too much of one thing', hint: '20 videos of the same show in a row' },
  { id: 'too-new', label: 'Only new stuff', hint: 'Great older videos never show up' },
  { id: 'rage-bait', label: 'It makes me angry', hint: 'Outrage, drama, arguments' },
  { id: 'no-discovery', label: 'Nothing surprises me', hint: 'Same channels, no discoveries' },
  { id: 'stale', label: 'It just feels stale', hint: 'Nothing I actually want to click' },
]

/** Free-text keyword match (F-03 without AI): nudges the presets. */
export function matchProblems(note: string): ProblemId[] {
  const t = note.toLowerCase()
  const hits: ProblemId[] = []
  if (/same|only|all|nothing but|too much|every/.test(t)) hits.push('one-topic')
  if (/old|older|classic|new stuff|recent/.test(t)) hits.push('too-new')
  if (/angry|rage|drama|politic|outrage|argu/.test(t)) hits.push('rage-bait')
  if (/discover|surpris|random|new channel/.test(t)) hits.push('no-discovery')
  if (/bor|stale|nothing good|meh/.test(t)) hits.push('stale')
  return hits
}
