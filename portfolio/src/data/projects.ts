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
    plate: '03',
    hook: 'A social fitness app that turns training into a progression loop.',
    description:
      'A 5,000+ exercise database, nutrition scanning, progress tracking, and a live social feed — every workout earns XP and climbs leaderboards. The next flagship; in private beta now.',
    role: 'Co-founder — product & design',
    stack: ['React', 'Supabase', 'Tailwind', 'PWA'],
    status: 'Private beta',
    facts: ['5,000+ exercise database', 'Row-level security throughout', 'Web-push from DB triggers'],
    screenshot: 'shots/flexyn-plate.webp',
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
    plate: '04',
    hook: 'Swipe to decide what to watch — then go watch it.',
    description:
      'A swipe-first movie & TV picker on live TMDB data. Every swipe teaches an on-device taste model; the goal is a fast, confident pick, not endless scrolling.',
    role: 'Solo — product, recommendation engine, frontend',
    stack: ['React', 'TypeScript', 'Supabase', 'Tailwind'],
    status: 'Beta',
    liveUrl: 'https://seanjoudrie.github.io/REX/',
    repoUrl: 'https://github.com/SeanJoudrie/REX',
    facts: ['On-device taste model', 'Two-phone match sessions', 'Keys proxied server-side'],
    screenshot: 'shots/rex-plate.webp',
    shots: ['shots/rex-onboarding.webp', 'shots/rex-discover.webp', 'shots/rex-mirror.webp'],
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
    plate: '07',
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
  {
    name: 'Curio',
    plate: '06',
    hook: 'One small real-world skill a day — do it, stamp how it felt, collect it.',
    description:
      'A daily cabinet of curiosities: each day serves one tiny hands-on challenge — beatbox a rhythm, roll an omelette, learn a phrase, palm a coin — most with optional level-ups. Do it in the real world, stamp how it went, and add it to your cabinet. Swipe less, do more. Installable PWA, works offline.',
    role: 'Solo — product, design, build',
    stack: ['React', 'TypeScript', 'Tailwind', 'PWA'],
    status: 'Beta',
    liveUrl: 'https://seanjoudrie.github.io/Curio/',
    repoUrl: 'https://github.com/SeanJoudrie/Curio',
    facts: ['A new challenge every day', 'Skills across many crafts', 'Stamp-and-collect ritual', 'Installable · offline'],
    caseStudy: {
      problem:
        'Most "daily" apps train you to swipe, not to do — the habit they build is scrolling. The problem was the opposite one: get someone to put the phone down and make one small real thing each day, and make that worth coming back to.',
      built:
        'A daily-challenge PWA with a deep, hand-authored library of tiny real-world skills spanning cooking, music, sleight-of-hand, language, mime, and craft — each with optional "level-up" extensions. A one-tap "stamp how it felt" reflection and a growing collection (the cabinet) turn a single action into a streak-worthy ritual. Installable, offline-capable, warm paper aesthetic.',
      outcome:
        'A calm, anti-doomscroll daily habit — one small thing, done in the real world and kept — live and installable at seanjoudrie.github.io/Curio.',
    },
  },
  {
    name: 'AAR',
    plate: '05',
    hook: 'Turns military experience into a civilian résumé for one specific job.',
    description:
      'Paste a service record and a job posting: every line comes back in recruiter-ready language, with an honest 0–100 fit score, the keyword gaps that posting exposes, and STAR interview answers. Files and photos are parsed on-device; the AI backend deploys separately with your own key.',
    role: 'Solo — product, design, full-stack + edge functions',
    stack: ['React', 'TypeScript', 'Tailwind', 'Supabase Edge', 'Claude API'],
    status: 'In build',
    repoUrl: 'https://github.com/SeanJoudrie/AARpublic',
    facts: ['On-device file & photo OCR', 'Streaming Claude backend', 'Never invents unverified facts'],
    caseStudy: {
      problem:
        'A résumé is only good relative to a job — and a service record is written in a language civilian recruiters don’t read. The failure mode isn’t an awkward sentence; it’s a résumé claiming something the veteran didn’t do, discovered in an interview.',
      built:
        'A guided translator that rewrites each line against the pasted job description, scores fit honestly, flags missing keywords, and drafts STAR answers — with a hard rule never to invent a number or award. PDF / DOCX / photo intake is parsed in the browser (self-hosted OCR, no upload); the Anthropic key is held server-side in a rate-limited, Turnstile-gated Supabase Edge Function that streams the result.',
      outcome:
        'A complete, accessible product — guided wizard, on-device OCR, DOCX/PDF export, and a plain-language interface built for a non-technical user. Public source on GitHub; the live backend deploys with an API key.',
    },
  },
  {
    name: 'Birdwatch',
    plate: '08',
    hook: 'A seasonal birding deck — twenty-four birds, and a calendar.',
    description:
      'An interactive birding prototype on real Massachusetts data: all 420 state species with authentic rarity and effort-adjusted seasonality. Tap a card for a species profile, three-tap quick-log a sighting, and scrub the calendar to watch the roster shift month to month.',
    role: 'Solo — product, design, build',
    stack: ['React', 'TypeScript', 'Tailwind', 'PWA'],
    status: 'Prototype',
    liveUrl: 'https://seanjoudrie.github.io/birb/',
    repoUrl: 'https://github.com/SeanJoudrie/birb',
    facts: ['All 420 MA species', 'Effort-adjusted seasonality', 'Three-tap quick-log', 'Generated card art'],
    caseStudy: {
      problem:
        'Birding apps are either exhaustive field references or gamified toys — neither makes the year itself the thing you come back to. The design question was whether a small, seasonal deck could carry both real data and a reason to return each month.',
      built:
        'A card-based prototype driven entirely by real Massachusetts birding data — 420 species tagged with rarity and effort-adjusted seasonality — rather than hard-coded content. A calendar governs which birds are in season, a three-tap quick-log records a sighting, and card art is generated algorithmically from each species name instead of relying on photos.',
      outcome:
        'A focused proof-of-concept — “twenty-four birds, and a calendar” — that shows the core loop: a seasonal roster, fast logging, and a retention hook built from the year itself.',
    },
  },
  {
    name: 'DroneDome',
    plate: '02',
    hook: 'Build a drone from parts salvaged off 35 real aircraft — then get told exactly how badly it flies.',
    description:
      'A 3D drone-building sandbox. Pick a real airframe — an MQ-9 Reaper, an RQ-4 Global Hawk, NASA’s Ingenuity — strip its wings off, bolt a quadcopter’s rotors on, scale it 4× and fly it on Mars. A live spec sheet computes thrust, lift, range and endurance from real formulas and tells you why the thing won’t get off the ground. Nothing is forbidden; an unflyable abomination is a valid build.',
    role: 'Solo — product, 3D, physics, asset pipeline',
    stack: ['React', 'TypeScript', 'three.js', 'Vite'],
    status: 'Beta',
    liveUrl: 'https://seanjoudrie.github.io/DroneDome/',
    repoUrl: 'https://github.com/SeanJoudrie/DroneDome',
    facts: ['35 real airframes', '4 environments — sea level → Mars', 'Every part hot-swappable', 'Presets within 2× of published specs'],
    caseStudy: {
      problem:
        'Treat aircraft as Lego: no “quadcopter mode” vs “aeroplane mode”, just a body plus slots for wings, tail, rotors, gear, hardpoints and payload — any slot fillable from any aircraft in the catalog. The hard part was the models: every mesh is someone else’s published export (NASA 3D Resources, Gazebo Fuel, PX4, Sketchfab), and a Sketchfab export typically arrives as thirty nodes all named defaultMaterial — nothing says which one is a wing.',
      built:
        'A geometric classifier works it out — the bounding box gives span/length/vertical axes, mirrored meshes get paired, and symmetric pairs plus position identify tails, gear and pylons. Where a model is welded (the Global Hawk’s wings are fused into the fuselage) the part is defined as a clipping box and cut away at runtime, which is also what lets it be moved and angled like a real part. Borrowed parts are rescaled to fit and the physics shares the scale factor, so the render and the numbers always agree. The physics is real but deliberately simple: momentum theory inverted for static rotor thrust with a figure of merit that decays in thin air, a parabolic drag polar with top speed solved by bisection, and Breguet range/endurance so the craft lightens as it burns fuel.',
      outcome:
        'A zero-backend browser sandbox — 35 airframes across 4 environments, every part hot-swappable across the whole catalog — with an automated asset pipeline (four upstream sources, geometric classification, decimation: 31 MB → 3.1 MB). Every push typechecks, verifies each airframe comes apart, fuzzes the physics with adversarial builds, and checks every preset against its manufacturer’s published figures — all land within 2×. Six further Playwright gates drive the app exactly as GitHub Pages serves it, roughly 2,400 automated operations, so a subpath-only regression can’t reach the live site.',
    },
  },
]
