import type { CSSProperties } from 'react'

const GLOBALIO_URL = 'https://globalio.app'

const FEATURES = [
  { icon: '🌍', label: '195 countries' },
  { icon: '🗣️', label: '76 languages' },
  { icon: '📅', label: 'Daily Challenge' },
  { icon: '⚡', label: 'Offline-ready' },
]

// Decorative floating flags (purely visual, behind content).
const FLAGS = [
  { e: '🇯🇵', top: '8%', left: '6%', r: '-12deg', d: '0s' },
  { e: '🇧🇷', top: '22%', left: '84%', r: '10deg', d: '1.2s' },
  { e: '🇰🇪', top: '68%', left: '10%', r: '8deg', d: '2.1s' },
  { e: '🇫🇷', top: '80%', left: '76%', r: '-9deg', d: '0.6s' },
  { e: '🇮🇳', top: '46%', left: '92%', r: '6deg', d: '1.8s' },
  { e: '🇿🇦', top: '88%', left: '40%', r: '-6deg', d: '2.6s' },
]

/**
 * Globalio showcase — a live, playable ad for globalio.app.
 *
 * globalio.app sets no X-Frame-Options / frame-ancestors CSP, so it can be
 * framed. A tall live iframe is awkward on a phone, so the live embed is
 * desktop-only (lg+); mobile gets a rich "play it live" card instead.
 */
export function GlobalioDemo() {
  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl border border-[#4dd6c1]/25 bg-gradient-to-br from-navy-900 via-navy-950 to-[#06201d] shadow-2xl shadow-[#0b3a34]/40">
      {/* teal glow */}
      <div
        aria-hidden
        className="gio-pulse pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#4dd6c1]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#f6a821]/10 blur-3xl"
      />

      {/* slow-spinning globe wireframe */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 opacity-[0.14] sm:block"
      >
        <svg className="gio-spin" width="440" height="440" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="96" stroke="#4dd6c1" strokeWidth="0.6" />
          <ellipse cx="100" cy="100" rx="96" ry="40" stroke="#4dd6c1" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="96" ry="72" stroke="#4dd6c1" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="40" ry="96" stroke="#4dd6c1" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="72" ry="96" stroke="#4dd6c1" strokeWidth="0.5" />
          <line x1="4" y1="100" x2="196" y2="100" stroke="#4dd6c1" strokeWidth="0.5" />
          <line x1="100" y1="4" x2="100" y2="196" stroke="#4dd6c1" strokeWidth="0.5" />
        </svg>
      </div>

      {/* drifting flags */}
      {FLAGS.map((f) => (
        <span
          key={f.e}
          aria-hidden
          className="gio-drift pointer-events-none absolute select-none text-3xl opacity-15 sm:text-4xl"
          style={{ top: f.top, left: f.left, '--r': f.r, animationDelay: f.d } as CSSProperties}
        >
          {f.e}
        </span>
      ))}

      <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        {/* copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#4dd6c1]/40 bg-[#4dd6c1]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#7ff0dd]">
            <span className="relative flex h-2 w-2">
              <span className="gio-pulse absolute inline-flex h-full w-full rounded-full bg-[#4dd6c1]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4dd6c1]" />
            </span>
            Live · playable right here
          </span>

          <h3 className="mt-5 font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            <span className="gio-gradient-text">Globalio</span>
          </h3>
          <p className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
            Duolingo-meets-Wordle for the whole planet. 🌐
          </p>
          <p className="mt-4 max-w-md text-mute">
            Flags, capitals, country shapes, and languages — one shared Daily
            Challenge for every player on Earth, generated with zero backend.
            This is the <span className="text-[#7ff0dd]">real, shipped app</span>{' '}
            running in the frame. Not a mockup. Go play it.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2.5">
            {FEATURES.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-950/70 px-3 py-1.5 text-sm font-medium text-ink"
              >
                <span aria-hidden>{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={GLOBALIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#4dd6c1] px-6 py-3.5 font-semibold text-[#06201d] shadow-lg shadow-[#4dd6c1]/30 transition-all hover:-translate-y-0.5 hover:bg-[#7ff0dd] hover:shadow-[#4dd6c1]/50"
            >
              Play Globalio
              <span className="transition-transform group-hover:translate-x-0.5">↗</span>
            </a>
            <a
              href={GLOBALIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-navy-600 px-6 py-3.5 font-semibold text-ink transition-colors hover:border-[#4dd6c1] hover:text-[#7ff0dd]"
            >
              Open full screen
            </a>
          </div>
        </div>

        {/* live phone (desktop) */}
        <div className="hidden justify-center lg:flex">
          <div className="gio-float relative">
            {/* glow halo behind the phone */}
            <div
              aria-hidden
              className="gio-pulse absolute inset-0 -z-10 rounded-[3rem] bg-[#4dd6c1]/25 blur-2xl"
            />
            <div className="relative w-[310px] rounded-[2.5rem] border-[12px] border-navy-800 bg-navy-950 p-1 shadow-2xl shadow-black/60 ring-1 ring-[#4dd6c1]/30">
              {/* notch */}
              <div
                aria-hidden
                className="absolute left-1/2 top-3 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-navy-700"
              />
              {/* live badge */}
              <div className="absolute -right-3 top-6 z-20 rotate-3 rounded-lg bg-[#f6a821] px-2.5 py-1 font-display text-xs font-bold text-navy-950 shadow-lg">
                ● LIVE
              </div>
              <iframe
                src={GLOBALIO_URL}
                title="Globalio — live, playable"
                loading="lazy"
                className="h-[580px] w-full rounded-[1.9rem] bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>

        {/* rich card (mobile) */}
        <a
          href={GLOBALIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#4dd6c1]/30 bg-navy-950/70 p-5 transition-colors hover:border-[#4dd6c1] lg:hidden"
        >
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#4dd6c1] text-3xl shadow-lg shadow-[#4dd6c1]/30"
          >
            🌍
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-ink">
              Play Globalio{' '}
              <span className="text-[#7ff0dd] transition-transform group-hover:translate-x-0.5 inline-block">
                ↗
              </span>
            </p>
            <p className="mt-0.5 text-sm text-mute">
              The live game — one Daily Challenge for the whole planet. Opens in
              a new tab.
            </p>
          </div>
        </a>
      </div>
    </div>
  )
}
