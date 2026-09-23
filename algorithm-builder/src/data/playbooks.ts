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
  { id: 'instagram', label: 'Instagram Reels', depth: 'tips', checked: null },
  { id: 'tiktok', label: 'TikTok', depth: 'tips', checked: null },
  { id: 'x', label: 'X / Twitter', depth: 'tips', checked: null },
]

/** The universal "your thumb is a vote" card (F-19). */
export const SIGNALS = {
  more: [
    'Watch it all the way through (the loudest signal everywhere)',
    'Save it (private)',
    'Share it or send it in a DM',
    'Follow or subscribe',
    'Like or comment (public, so optional)',
  ],
  less: [
    'Scroll past within a second or two',
    'Tap “Not interested”',
    'Block the channel or mute the word',
    'Delete it from your watch history',
    'Never hate-watch or hate-comment: anger still counts',
  ],
}

export interface Tip {
  text: string
  /** Show first when the user picked one of these problems (F-24). */
  for?: ProblemId[]
}

export const PLAYBOOKS: Record<Platform, Tip[]> = {
  youtube: [
    { text: 'Deleting a video from watch history removes it from the recommendation math. It works faster than watching new things on top.', for: ['one-topic', 'stale'] },
    { text: 'On a video in your feed, tap ⋮ → “Don’t recommend channel” for channels that keep coming back.', for: ['one-topic', 'rage-bait'] },
    { text: 'Curious about something once? Pause watch history first, or use an incognito tab. Unpause after.', for: ['one-topic'] },
    { text: 'Your TV and your phone can learn differently. Clean up on the device where the problem started.' },
    { text: 'Arguing in the comments tells YouTube you care. Close the video instead.', for: ['rage-bait'] },
    { text: 'Subscribe to two channels from your rehab playlist that you genuinely liked.', for: ['no-discovery', 'stale'] },
    { text: 'Search for older classics directly: YouTube rarely offers them on its own.', for: ['too-new'] },
  ],
  instagram: [
    { text: 'Save instead of like. Saves are private and still a strong signal, so nobody sees what you’re into.' },
    { text: 'Sending a reel in a DM is one of the strongest signals. A chat with just yourself works.', for: ['no-discovery', 'stale'] },
    { text: 'On a reel you don’t want more of, tap ⋯ → “Not interested”, right away.', for: ['one-topic', 'rage-bait'] },
    { text: 'Look for “Reset suggested content” in settings for a fresh start.', for: ['stale', 'one-topic'] },
    { text: 'Watched a whole clip you didn’t want more of? Cancel it out with “Not interested” immediately.' },
  ],
  tiktok: [
    { text: 'Long-press a video → “Not interested”. TikTok reacts to this within minutes.', for: ['one-topic', 'rage-bait'] },
    { text: 'Scroll past fast. TikTok weighs watch time more heavily than any other app.' },
    { text: 'Add keyword filters for the topics you’re sick of (look under content preferences).', for: ['one-topic'] },
    { text: 'Look for “Refresh your For You feed” to start over.', for: ['stale'] },
    { text: 'Search for the topics in your mix and watch a few fully to seed the feed.', for: ['no-discovery'] },
  ],
  x: [
    { text: 'Tap ⋯ on a post → “Not interested in this post”.', for: ['one-topic'] },
    { text: 'Mute words for 30 days (e.g. a show you’re tired of): Settings → Privacy and safety → Mute and block.', for: ['one-topic'] },
    { text: 'Replies count as heavy engagement. Arguing is the fastest way to get more of what makes you angry.', for: ['rage-bait'] },
    { text: 'When For You is bad, switch to the Following tab for a while.', for: ['stale', 'rage-bait'] },
  ],
}

/** Put the tips that match the user's problems first (F-24). */
export function tipsFor(platform: Platform, problems: ProblemId[]): Tip[] {
  const tips = PLAYBOOKS[platform]
  const score = (t: Tip) => (t.for?.some((p) => problems.includes(p)) ? 0 : 1)
  return [...tips].sort((a, b) => score(a) - score(b))
}
