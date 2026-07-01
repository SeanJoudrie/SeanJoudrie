const GLOBALIO_URL = 'https://globalio.app'

const FEATURES = [
  { label: '195 countries' },
  { label: '76 languages' },
  { label: 'Daily Challenge' },
  { label: 'Offline-ready' },
]

/**
 * Globalio showcase — a live, playable embed of globalio.app.
 *
 * globalio.app sets no X-Frame-Options / frame-ancestors CSP, so it can be
 * framed. A tall live iframe is awkward on a phone, so the live embed is
 * desktop-only (lg+); mobile gets a screenshot card instead.
 */
export function GlobalioDemo() {
  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl border border-[#4dd6c1]/25 bg-navy-900/60">
      {/* one calm teal wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-[#4dd6c1]/10 blur-3xl"
      />

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

          <h3 className="mt-5 font-display text-5xl font-bold leading-none tracking-tight text-[#7ff0dd] sm:text-6xl">
            Globalio
          </h3>
          <p className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">
            Duolingo-meets-Wordle for the whole planet.
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
                className="rounded-lg border border-navy-700 bg-navy-950/70 px-3 py-1.5 text-sm font-medium text-ink"
              >
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

          {/* more views — real screenshots (desktop) */}
          <div className="mt-8 hidden items-center gap-3 lg:flex">
            <span className="annotation">More views</span>
            {[
              { src: 'shots/globalio-france.webp', label: 'Flag Codex' },
              { src: 'shots/globalio-progress.webp', label: 'Progress Map' },
            ].map((s) => (
              <a
                key={s.src}
                href={GLOBALIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="block h-24 w-[52px] shrink-0 overflow-hidden rounded-lg border border-navy-700 transition-colors hover:border-[#4dd6c1]"
              >
                <img
                  src={s.src}
                  alt={`Globalio — ${s.label}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
              </a>
            ))}
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

        {/* real screenshot in a phone frame (mobile) */}
        <a
          href={GLOBALIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mx-auto block w-[248px] lg:hidden"
        >
          <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-navy-800 bg-navy-950 shadow-2xl shadow-black/50 ring-1 ring-[#4dd6c1]/30">
            <div
              aria-hidden
              className="absolute left-1/2 top-2.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-navy-700"
            />
            <div className="absolute -right-2 top-5 z-20 rotate-3 rounded-lg bg-[#f6a821] px-2 py-0.5 font-display text-[10px] font-bold text-navy-950 shadow-lg">
              ● LIVE
            </div>
            <img
              src="shots/globalio-today.webp"
              alt="Globalio — Today screen"
              loading="lazy"
              decoding="async"
              className="w-full rounded-[1.5rem]"
            />
          </div>
          <span className="mt-4 block text-center font-semibold text-[#7ff0dd]">
            Tap to play ↗
          </span>
        </a>
      </div>
    </div>
  )
}
