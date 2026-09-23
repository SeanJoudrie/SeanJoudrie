import type { Platform, ProblemId } from './types'

/**
 * The cleanup checklist (F-14): remove first, then add. Items are specific to
 * the platform and to what the user said they're sick of.
 */

export interface CheckItem {
  id: string
  text: string
  detail?: string
  link?: { href: string; label: string }
}

const YT_HISTORY = { href: 'https://www.youtube.com/feed/history', label: 'Open watch history' }
const G_ACTIVITY = { href: 'https://myactivity.google.com/product/youtube', label: 'Open YouTube activity' }

export function buildChecklist(platform: Platform, turnDown: string[], problems: ProblemId[]): CheckItem[] {
  const items: CheckItem[] = []
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  if (platform === 'youtube') {
    for (const term of turnDown) {
      items.push({
        id: `yt-del-${slug(term)}`,
        text: `Delete “${term}” videos from your watch history`,
        detail: 'Search your history for it and remove each one. This is the single biggest fix.',
        link: YT_HISTORY,
      })
    }
    if (turnDown.length) {
      items.push({
        id: 'yt-search-history',
        text: `Clear searches for ${list(turnDown)} from your search history`,
        link: G_ACTIVITY,
      })
      items.push({
        id: 'yt-not-interested',
        text: `On the next 3 ${list(turnDown)} videos in your feed: ⋮ → “Not interested”`,
        detail: 'If one channel keeps showing up, pick “Don’t recommend channel” instead.',
      })
    }
    items.push({
      id: 'yt-quarantine',
      text: 'Before any one-off curiosity watch: pause watch history (or use incognito)',
      detail: 'The “I just want to rewatch one scene” button. Unpause afterwards.',
      link: YT_HISTORY,
    })
    if (problems.includes('rage-bait')) {
      items.push({ id: 'yt-rage', text: 'Don’t comment on videos that make you angry. Close them instead.' })
    }
  } else {
    const notInterested: Record<Exclude<Platform, 'youtube'>, string> = {
      instagram: 'tap ⋯ → “Not interested”',
      tiktok: 'long-press → “Not interested”',
      x: 'tap ⋯ → “Not interested in this post”',
    }
    for (const term of turnDown) {
      items.push({
        id: `${platform}-ni-${slug(term)}`,
        text: `On the next 3 “${term}” posts: ${notInterested[platform]}`,
        detail: 'Do it right away, before you’ve watched much of it.',
      })
    }
    if (platform === 'x' && turnDown.length) {
      items.push({ id: 'x-mute', text: `Mute the words ${list(turnDown)} for 30 days` })
    }
    if (platform === 'tiktok' && turnDown.length) {
      items.push({ id: 'tt-filter', text: `Add keyword filters for ${list(turnDown)}` })
    }
    if (problems.includes('stale')) {
      items.push({
        id: `${platform}-reset`,
        text: platform === 'x' ? 'Switch to the Following tab for a week' : 'Look for the “reset / refresh your feed” option in settings',
      })
    }
    items.push({
      id: `${platform}-private`,
      text: 'From now on: save and share what you like instead of liking it publicly',
    })
  }
  return items
}

function list(terms: string[]): string {
  const q = terms.map((t) => `“${t}”`)
  if (q.length <= 1) return q.join('')
  return `${q.slice(0, -1).join(', ')} and ${q[q.length - 1]}`
}
