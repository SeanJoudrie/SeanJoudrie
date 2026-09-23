import type { Platform, ProblemId } from '../lib/types'

/**
 * Platform tip cards (F-19 to F-24). Menu names move around between app
 * versions, so every card carries the date it was last checked in the real
 * app. `null` means not yet checked; the UI says so. Review quarterly.
 */

export interface PlatformInfo {
  id: Platform
  label: string
  depth: 'full' | 'tips'
  checked: string | null
}

export const PLATFORMS: PlatformInfo[] = [
  { id: 'youtube', label: 'YouTube', depth: 'full', checked: null },
  { id: 'instagram', label: 'Instagram', depth: 'tips', checked: null },
  { id: 'tiktok', label: 'TikTok', depth: 'tips', checked: null },
  { id: 'x', label: 'X (Twitter)', depth: 'tips', checked: null },
]

/** The universal "the app learns from what you tap" card (F-19). */
export const SIGNALS = {
  more: ['Watch it all the way through', 'Save it (only you can see this)', 'Send it to a friend', 'Follow the channel', 'Like it (other people can see this)'],
  less: ['Scroll past it fast', 'Tap “Not interested”', 'Block the channel', 'Delete it from your history', 'Don’t comment when you’re mad'],
}

export interface Tip {
  text: string
  /** Show first when the user picked one of these problems (F-24). */
  for?: ProblemId[]
}

export const PLAYBOOKS: Record<Platform, Tip[]> = {
  youtube: [
    { text: 'Delete old videos from your history. It works faster than new ones.', for: ['one-topic', 'stale'] },
    { text: 'If one channel keeps coming back, tap the 3 dots and “Don’t recommend channel.”', for: ['one-topic', 'rage-bait'] },
    { text: 'Want to watch something just once? Pause your history first. Turn it back on after.', for: ['one-topic'] },
    { text: 'Your TV and your phone can learn in different ways. Fix the one where it started.' },
    { text: 'Comments tell YouTube you care. Close videos that make you mad.', for: ['rage-bait'] },
    { text: 'Follow two channels you liked from the videos we picked.', for: ['stale'] },
  ],
  instagram: [
    { text: 'Save posts instead of liking them. Only you can see what you save.' },
    { text: 'Sending a video to a friend tells the app you like it a lot.', for: ['stale'] },
    { text: 'On a video you don’t want, tap the 3 dots, then “Not interested.”', for: ['one-topic', 'rage-bait'] },
    { text: 'Look in settings for “Reset suggested content” to start fresh.', for: ['stale', 'one-topic'] },
    { text: 'Watched a whole video you didn’t want? Tap “Not interested” right after.' },
  ],
  tiktok: [
    { text: 'Press and hold a video, then tap “Not interested.” TikTok learns fast.', for: ['one-topic', 'rage-bait'] },
    { text: 'Scroll past fast. TikTok counts how long you watch.' },
    { text: 'Add a word filter for things you’re tired of. Look in settings.', for: ['one-topic'] },
    { text: 'Look in settings for a way to refresh your feed.', for: ['stale'] },
    { text: 'Search for the topics you want. Watch a few all the way.', for: ['stale'] },
  ],
  x: [
    { text: 'Tap the 3 dots on a post, then “Not interested in this post.”', for: ['one-topic'] },
    { text: 'Mute words for 30 days in settings. Try it for a show you’re tired of.', for: ['one-topic'] },
    { text: 'Replies tell X you care. Arguing gets you more of what makes you mad.', for: ['rage-bait'] },
    { text: 'If your feed is bad, use the Following tab for a while.', for: ['stale', 'rage-bait'] },
  ],
}

/** Put the tips that match the user's problems first (F-24). */
export function tipsFor(platform: Platform, problems: ProblemId[]): Tip[] {
  const tips = PLAYBOOKS[platform]
  const score = (t: Tip) => (t.for?.some((p) => problems.includes(p)) ? 0 : 1)
  return [...tips].sort((a, b) => score(a) - score(b))
}
