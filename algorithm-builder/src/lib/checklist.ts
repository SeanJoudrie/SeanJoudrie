import type { Platform, ProblemId } from './types'

/**
 * The cleanup checklist (F-14): remove first, then add. Sorted by impact, so
 * the first three are the "Do these 3 things today" list and the rest go
 * behind "More ways to fix it". Plain words: see src/copy.ts for the rules.
 */

export interface CheckItem {
  id: string
  text: string
  detail?: string
  link?: { href: string; label: string }
}

const YT_HISTORY = { href: 'https://www.youtube.com/feed/history', label: 'Open my YouTube history' }
const G_ACTIVITY = { href: 'https://myactivity.google.com/product/youtube', label: 'Open my search history' }

export function buildChecklist(platform: Platform, turnDown: string[], problems: ProblemId[]): CheckItem[] {
  const items: CheckItem[] = []
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const names = list(turnDown)

  if (platform === 'youtube') {
    for (const term of turnDown) {
      items.push({
        id: `yt-del-${slug(term)}`,
        text: `Delete ${term} videos from your history.`,
        detail: 'Search your history for it. Tap the X on each one. This helps the most.',
        link: YT_HISTORY,
      })
    }
    if (turnDown.length) {
      items.push({
        id: 'yt-not-interested',
        text: `Tap “Not interested” on the next 3 ${names} videos.`,
        detail: 'Tap the 3 dots under the video to find it.',
      })
      items.push({ id: 'yt-search-history', text: `Delete your searches for ${names}.`, link: G_ACTIVITY })
    } else {
      items.push({
        id: 'yt-not-interested-any',
        text: 'Tap “Not interested” on 3 videos you don’t want.',
        detail: 'Tap the 3 dots under the video to find it.',
      })
    }
    items.push({
      id: 'yt-subscribe',
      text: 'Pick 2 videos above you like, and follow their channels.',
    })
    items.push({
      id: 'yt-quarantine',
      text: 'Want to watch something just once? Pause your history first.',
      detail: 'Turn it back on after. Then it won’t fill your feed.',
      link: YT_HISTORY,
    })
    if (problems.includes('rage-bait')) {
      items.push({ id: 'yt-rage', text: 'Don’t comment on videos that make you mad. Just close them.' })
    }
  } else {
    const how: Record<Exclude<Platform, 'youtube'>, string> = {
      instagram: 'Tap the 3 dots to find it. Do it before you watch much.',
      tiktok: 'Press and hold the video to find it. Do it before you watch much.',
      x: 'Tap the 3 dots on the post to find it.',
    }
    for (const term of turnDown) {
      items.push({ id: `${platform}-ni-${slug(term)}`, text: `Tap “Not interested” on the next 3 ${term} posts.`, detail: how[platform] })
    }
    if (platform === 'x' && turnDown.length) items.push({ id: 'x-mute', text: `Mute the words ${names} for 30 days.` })
    if (platform === 'tiktok' && turnDown.length) items.push({ id: 'tt-filter', text: `Add a word filter for ${names}.` })
    if (!turnDown.length) items.push({ id: `${platform}-ni-any`, text: 'Tap “Not interested” on 3 posts you don’t want.', detail: how[platform] })
    items.push({ id: `${platform}-private`, text: 'Save the posts you like, instead of liking them.', detail: 'Saves are private. The app still learns from them.' })
    if (problems.includes('stale') || !turnDown.length) {
      items.push({
        id: `${platform}-reset`,
        text: platform === 'x' ? 'Use the Following tab for a week.' : 'Look in settings for a way to reset your feed.',
      })
    }
  }
  return items
}

function list(terms: string[]): string {
  if (terms.length <= 1) return terms.join('')
  return `${terms.slice(0, -1).join(', ')} and ${terms[terms.length - 1]}`
}
