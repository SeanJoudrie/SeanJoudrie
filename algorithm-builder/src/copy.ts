/**
 * Every word the app shows, in one place (docs/UX_AUDIT.md §6). Rules:
 * 6th-grade reading level, short sentences, no jargon. A unit test
 * (copy.test.ts) checks the reading level and the retired-word list.
 *
 * Retired words (never in the UI): algorithm (except the brand name), mix,
 * slice, wildcard, recipe, tune-up, rehab, culprit, time capsule, lock, split.
 */

export const TOTAL_LABEL = 'your feed'

export const COPY = {
  landing: {
    title: 'Is your feed stuck on one thing?',
    lead: 'We’ll show you what to tap to fix it.',
    start: 'Fix my feed',
    trust: 'Free. No sign-in. We never touch your account.',
    resume: 'Pick up where I left off',
    whyTitle: 'Why this happens',
    why: [
      ['You watch one video.', 'The app shows you more like it.'],
      ['You click on one.', 'It shows you even more.'],
      ['Soon it’s all the same.', 'The fix: remove the old ones, then watch new ones.'],
    ],
  },

  nav: {
    question: (n: number, of: number) => `Question ${n} of ${of}`,
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    showFix: 'Show my fix',
    pickOne: 'Pick one to go on',
    home: 'Go to the start',
  },

  q1: {
    title: 'What is taking over your feed?',
    lead: 'Tap one or type it.',
    app: 'Which app?',
    tipsOnly: 'For this app we give you tips to follow.',
    search: 'Type a show, game, person or topic',
    add: 'Add',
    common: 'Common ones',
    matches: 'Matches',
    less: (n: number) => `Show me less of (${n})`,
    remove: (x: string) => `Remove ${x}`,
    bored: 'It’s not one thing. My feed is just boring.',
    boredOn: 'Got it. Your feed is just boring.',
    full: 'That’s the most you can add.',
  },

  q2: {
    title: (x: string) => `How much of your home screen is ${x}?`,
    titleMany: 'How much of your home screen is these things?',
    lead: 'Just guess. We’ll ask again next week.',
    // Stored as a share of the screen for the before/after check.
    options: [
      { id: 'almost-all', label: 'Almost all', pct: 90 },
      { id: 'half', label: 'About half', pct: 50 },
      { id: 'some', label: 'Some', pct: 25 },
      { id: 'little', label: 'A little', pct: 10 },
    ],
  },

  q3: {
    title: 'What do you want to see more of?',
    lead: 'Pick a few. We picked some for you.',
    leadEmpty: 'Pick a few.',
    search: 'Search, or type your own',
    add: 'Add',
    remove: (x: string) => `Remove ${x}`,
    all: 'See all topics',
    fewer: 'Show fewer topics',
    notFound: 'Not in our list. Tap Add to use it anyway.',
    picked: (n: number, max: number) => `${n} of ${max} picked.`,
    full: (max: number) => `You can pick up to ${max}. Remove one to pick another.`,
    none: 'Pick nothing and we’ll choose for you.',
  },

  results: {
    title: 'You’re done.',
    titleBack: 'Welcome back.',
    lead: 'Do these 3 things today.',
    leadTips: 'Do these 3 things in the app today.',

    better: {
      title: (x: string) => `Is your feed better? How much is ${x} now?`,
      titleNone: 'Is your feed better?',
      before: (pct: number) => `Last time you said about ${pct}%.`,
      yes: 'It’s working. Keep going.',
      same: 'No change yet. Do the 3 steps again.',
      worse: 'It went up. Start with step 1 again.',
    },

    stepsDone: (n: number, of: number) => `${n} of ${of} done`,
    more: (n: number) => `More ways to fix it (${n})`,
    less: 'Show less',

    watchTitle: 'Watch a few of these this week',
    watchLead: 'Watch a few minutes of each. Save the ones you like.',
    watchTips: 'Search for these in the app. Watch a few all the way through.',
    loading: 'Finding videos for you',
    handPicked: 'Hand-picked',
    fromYouTube: 'From YouTube',
    playAll: 'Play them all on YouTube',
    searchFor: (q: string) => `Search YouTube for “${q}”`,
    searchHint: 'Tap one. Pick a video that looks good.',
    busy: 'YouTube is busy. These links work just as well.',
    creditYouTube: 'Videos from YouTube',

    feedTitle: 'Your new feed',
    adjust: 'Change it',
    older: (y: number) => `Older videos: from before ${y}.`,
    showLess: (xs: string) => `Showing less of: ${xs}.`,

    againTitle: 'Check again next week',
    againLead: 'Save this page. Next week, come back and tell us how it went.',
    remind: 'Remind me next week',
    copy: 'Copy my link',
    copied: 'Link copied',
    startOver: 'Start over',

    tipsTitle: 'Keep it fixed',
    tipsLead: 'The app learns from what you tap.',
    moreTitle: 'Want more of it?',
    lessTitle: 'Want less of it?',
    appTips: (app: string) => `${app} tips`,
    menusChange: 'Menu names change sometimes. Look for the closest match.',

    coffee: 'Did this help?',
    coffeeLink: 'You can buy us a coffee',
  },

  adjust: {
    title: 'Change your new feed',
    lead: 'Move a bar to show more or less. It always adds up to 100%.',
    done: 'Done',
    topics: 'Topics',
    total: (n: number) => `Total ${n}%`,
    surprise: 'Surprise me',
    choose: 'Choose shows',
    doneChoosing: 'Done',
    keep: (x: string) => `Keep ${x} the same`,
    unkeep: (x: string) => `Let ${x} change`,
    keepHint: 'Kept the same when you move other bars',
    keepShort: 'Keep the same',
    keptShort: 'Kept the same',
    removeShort: 'Remove',
    add: 'Add',
    remove: (x: string) => `Remove ${x}`,
    inside: (x: string) => `Shows inside ${x}`,
    insideLead: (x: string, pct: number) => `Of your ${pct}% ${x}, how much of each?`,
    addTopic: 'Add a topic',
    addShow: 'Add a show',
    addTopicHint: 'For example: Chess or Formula 1',
    addShowHint: (x: string) => `A show or person in ${x}`,
    olderTitle: 'Add great old videos',
    olderLead: 'Great old videos you may have missed.',
    anyAge: 'Any age',
    olderThan: (y: number) => `Older than ${y}`,
    views: { pie: 'Pie', bars: 'Bars', list: 'List' },
    change: 'Your feed will change over a few days.',
    close: 'Close',
  },

  footer: {
    promise: (brand: string, mascot: string) => `${brand} never signs in to your accounts. ${mascot} shows you what to tap. You do the tapping.`,
    privacy: 'Privacy',
    terms: 'Terms',
    source: 'Source on GitHub',
    back: 'Back to the app',
  },
}

/** "Mostly X and Y. Some Z. A few surprises." for the feed summary. */
export function summarize(parts: { label: string; weight: number; surprise?: boolean }[]): string {
  const real = parts.filter((p) => !p.surprise && p.weight > 0).sort((a, b) => b.weight - a.weight)
  const surprise = parts.find((p) => p.surprise && p.weight > 0)
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
  // "Mostly" is everything close to the biggest share (within 10 points), up to 3.
  const top = real.filter((p) => p.weight >= (real[0]?.weight ?? 0) - 10).slice(0, 3)
  const rest = real.filter((p) => !top.includes(p))
  const out: string[] = []
  if (top.length) out.push(`Mostly ${join(top.map((p) => p.label))}.`)
  if (rest.length) out.push(`Some ${join(rest.slice(0, 3).map((p) => p.label))}${rest.length > 3 ? ' and more' : ''}.`)
  if (surprise) out.push('A few surprises.')
  return out.join(' ')
}
