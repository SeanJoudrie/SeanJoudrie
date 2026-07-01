export type Project = {
  name: string
  /** Plate number label, e.g. "01" */
  plate: string
  hook: string
  description: string
  role: string
  stack: string[]
  status: string
  /** True only when there is a public URL a visitor can open right now. */
  liveUrl?: string
  repoUrl?: string
  /** Facts worth a chip — real, verifiable numbers only. */
  facts?: string[]
  caseStudy: {
    problem: string
    built: string
    outcome: string
  }
  /**
   * Card imagery slot. When a real capture lands, drop it in /public/shots
   * and set it here — the designed motif fallback disappears automatically.
   */
  screenshot?: string
  /** Screenshots shown in the case-study drawer gallery. */
  shots?: string[]
}

/** URL-safe slug used for deep-linking a project's case study (e.g. #flexyn). */
export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const projects: Project[] = [
  {
    name: 'Globalio',
    plate: '01',
    hook: 'A geography game the whole planet plays together.',
    description:
      'Flags, capitals, shapes, and languages across 50+ ways to play — one shared Daily Challenge for every player on Earth, generated with zero backend. Designed, built, and shipped solo in a week.',
    role: 'Solo — product, design, build',
    stack: ['React', 'TypeScript', 'Tailwind', 'PWA'],
    status: 'Live',
    liveUrl: 'https://globalio.app',
    facts: ['50+ game modes', '4,000+ codex entries', '197 countries', 'Built in a week'],
    shots: [
      'shots/globalio-today.webp',
      'shots/globalio-france.webp',
      'shots/globalio-progress.webp',
    ],
    caseStudy: {
      problem:
        'A daily-challenge game needs every player worldwide to get the exact same questions — without a backend to coordinate them. And a 4,000-entry codex of flags, capitals, and languages has to stay organized enough that quiz distractors never leak the answer.',
      built:
        'A deterministic seeded PRNG generates an identical Daily Challenge for everyone from the date alone, Wordle-style, with reproducible shuffles. The codex spans 197 countries and 76 languages, with a script-detection engine keeping every distractor plausible. The interface is its own design system — warm paper, editorial serif, plate-like cards — the same language this portfolio is set in.',
      outcome:
        'A fully client-side, offline-capable game with 50+ modes, real replay value, and shareable results — live at globalio.app, no sign-up, free.',
    },
  },
  {
    name: 'Flexyn',
    plate: '02',
    hook: 'A social fitness app that turns training into a progression loop.',
    description:
      'A 5,000+ exercise database, nutrition scanning, progress tracking, and a live social feed — every workout earns XP and climbs leaderboards. The next flagship; in private beta now.',
    role: 'Co-founder — product & design',
    stack: ['React', 'Supabase', 'Tailwind', 'PWA'],
    status: 'In build · private beta',
    facts: ['5,000+ exercise database', 'Row-level security throughout', 'Web-push from DB triggers'],
    caseStudy: {
      problem:
        'Fitness apps treat logging as a chore and lose users by week two. The hard problem is retention — making people want to come back tomorrow.',
      built:
        'A production-scale React + Supabase app where every workout earns XP and feeds a live social feed. Row-Level Security on every table, server-rendered notifications per recipient, and a web-push pipeline driven by database triggers.',
      outcome:
        'In private beta and heading for public launch — the most architecturally complete build here, and the next flagship of this portfolio.',
    },
  },
  {
    name: 'REX',
    plate: '03',
    hook: 'Swipe to decide what to watch — then go watch it.',
    description:
      'A swipe-first movie & TV picker on live TMDB data. Every swipe teaches an on-device taste model; the goal is a fast, confident pick, not endless scrolling.',
    role: 'Solo — product, recommendation engine, frontend',
    stack: ['React', 'TypeScript', 'Supabase', 'Tailwind'],
    status: 'Live beta',
    liveUrl: 'https://seanjoudrie.github.io/REX/',
    repoUrl: 'https://github.com/SeanJoudrie/REX',
    facts: ['On-device taste model', 'Two-phone match sessions', 'Keys proxied server-side'],
    caseStudy: {
      problem:
        'Discovery apps fail at retention: people open them bored, find nothing, and leave. The product has to help you decide — then get out of the way.',
      built:
        'An on-device recommendation engine (taste vector + entity affinity) scored entirely client-side, real-time two-phone "match" sessions, and a shareable taste "Mirror." The TMDB key never touches the client — it is proxied through a Supabase Edge Function.',
      outcome:
        'A genuinely different take on a crowded category, with the recommendation logic, multiplayer, and privacy model working end to end.',
    },
  },
  {
    name: 'Rap Sheet',
    plate: '04',
    hook: 'A party card game that keeps a criminal record on the table.',
    description:
      'Pass-the-phone party chaos — players draw charges, rack up priors, and end on a shareable WANTED-poster recap. Peer-to-peer multiplayer with no server at all.',
    role: 'Solo — concept, design, engine',
    stack: ['Vanilla JS', 'WebRTC', 'Canvas', 'PWA'],
    status: 'In build',
    repoUrl: 'https://github.com/SeanJoudrie/drinky',
    facts: ['~325-card weighted deck', 'Serverless P2P multiplayer', '3 game modes'],
    caseStudy: {
      problem:
        'Group party games need real multiplayer, but nobody wants to stand up a server — and the deck has to stay fresh without feeling random.',
      built:
        'A no-framework engine with a ~325-card weighted selection system balancing escalation, recency, and player count, plus peer-to-peer multiplayer over WebRTC with no backend.',
      outcome:
        'Proof of range — a different domain, a different stack, and a hard real-time networking problem solved without a server.',
    },
  },
]
