export type Project = {
  name: string
  hook: string
  description: string
  role: string
  stack: string[]
  status: string
  liveUrl?: string
  repoUrl?: string
  accent: string // hex used for the card's top rule + glow
  caseStudy: {
    problem: string
    built: string
    outcome: string
  }
  // [FILL: screenshot] — drop a path like "/shots/flexyn.webp" to render a preview image.
  screenshot?: string
  // Screenshots shown in the case-study drawer gallery.
  shots?: string[]
}

/** URL-safe slug used for deep-linking a project's case study (e.g. #flexyn). */
export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const projects: Project[] = [
  {
    name: 'Flexyn',
    hook: 'A social fitness app that turns training into a progression loop.',
    description:
      'A 5,000+ exercise database, barcode-based nutrition scanning, workout & progress tracking, AI-assisted form feedback, plus gamification and a social feed — a full consumer product, not a prototype.',
    role: 'Co-Founder — product, design, and full-stack build',
    stack: ['React', 'Vite', 'Supabase', 'Tailwind', 'PWA'],
    status: 'Live · Beta-tested',
    repoUrl: 'https://github.com/SeanJoudrie',
    // liveUrl: '[FILL: link]',
    accent: '#7c5cff',
    // screenshot: '/shots/flexyn.webp', // [FILL: screenshot]
    caseStudy: {
      problem:
        'Fitness apps treat logging as a chore and abandon users after week two. The hard problem is retention — making people want to come back tomorrow.',
      built:
        'A production-scale React + Supabase app where every workout earns XP, climbs leaderboards, and feeds a live social feed. Row-Level Security on every table, server-side notifications rendered per recipient, and a web-push pipeline driven by database triggers.',
      outcome:
        'A working, beta-tested product spanning tracking, social, and gamification — the most architecturally complete thing in this portfolio, and the basis for an App Store release.',
    },
  },
  {
    name: 'REX',
    hook: 'Swipe to decide what to watch — then go watch it.',
    description:
      'A Tinder-style movie & TV discovery app backed by live TMDB data. Every swipe teaches an on-device taste model; the goal is a fast, confident pick, not endless scrolling.',
    role: 'Solo builder — product, recommendation engine, frontend, edge proxy',
    stack: ['React', 'Vite', 'Supabase', 'Tailwind', 'TypeScript'],
    status: 'In development',
    liveUrl: 'https://seanjoudrie.github.io/REX/',
    repoUrl: 'https://github.com/SeanJoudrie/REX',
    accent: '#ff7a59',
    // screenshot: '/shots/rex.webp', // [FILL: screenshot]
    caseStudy: {
      problem:
        'Discovery apps fail at retention: people open them bored, find nothing, and leave. The product has to help you decide and then get out of the way.',
      built:
        'An on-device recommendation engine (taste vector + entity affinity) scored entirely client-side, real-time two-phone "match" sessions, and a shareable taste "Mirror." The TMDB key never touches the client — it is proxied through a Supabase Edge Function.',
      outcome:
        'A genuinely novel take on a crowded category, with the recommendation logic, multiplayer, and privacy model all working end to end.',
    },
  },
  {
    name: 'Globalio',
    hook: 'Duolingo-meets-Wordle for world geography.',
    description:
      'A polished geography learning game — flags, capitals, country shapes, and languages — with multiple modes and a global daily challenge.',
    role: 'Solo builder — product, design, frontend',
    stack: ['React', 'Vite', 'Tailwind', 'TypeScript'],
    status: 'Live',
    liveUrl: 'https://globalio.app',
    accent: '#4dd6c1',
    shots: [
      'shots/globalio-today.webp',
      'shots/globalio-france.webp',
      'shots/globalio-progress.webp',
    ],
    // screenshot: '/shots/globalio.webp', // [FILL: screenshot]
    caseStudy: {
      problem:
        'A daily-challenge game needs every player worldwide to get the exact same questions — without a backend to coordinate them.',
      built:
        'A deterministic seeded PRNG generates an identical Daily Challenge for everyone from the date alone, Wordle-style, with reproducible answer shuffles. 195 countries and 76 languages with a script-detection engine so quiz distractors never give away the answer.',
      outcome:
        'A fully client-side, offline-capable game with real replay value and shareable results — shipped and live.',
    },
  },
  {
    name: 'Rap Sheet',
    hook: 'A party card game that keeps a criminal record on the table.',
    description:
      'A pass-the-phone party game with a "rap sheet" metaphor — players draw charges, rack up priors, and end on a shareable WANTED-poster recap. Three game modes and peer-to-peer multiplayer.',
    role: 'Solo builder — concept, design, engine, multiplayer',
    stack: ['Vanilla JS', 'PeerJS (WebRTC)', 'Canvas', 'PWA'],
    status: 'In design / build',
    repoUrl: 'https://github.com/SeanJoudrie/drinky',
    accent: '#d7263d',
    // screenshot: '/shots/rapsheet.webp', // [FILL: screenshot]
    caseStudy: {
      problem:
        'Group party games need real multiplayer but no one wants to stand up a server — and the deck has to stay fresh without feeling random.',
      built:
        'A no-framework engine with a ~325-card weighted selection system (balancing escalation, recency, and player count), an AI-driven "Snitch" custom-card concept, and peer-to-peer multiplayer over WebRTC with no backend at all.',
      outcome:
        'Proof of range — a different domain, a different stack, and a hard real-time networking problem solved without a server.',
    },
  },
]
