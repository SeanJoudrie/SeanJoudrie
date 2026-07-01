const GLOBALIO_URL = 'https://globalio.app'

/**
 * A live, playable Globalio embed inside a phone-frame mockup.
 *
 * globalio.app sets no X-Frame-Options / frame-ancestors CSP, so it can be
 * framed. A tall live iframe is awkward to scroll past on a phone, so the live
 * embed is desktop-only (lg+); on mobile we show a compact "Play it live" card
 * that opens the real app in a new tab.
 */
export function GlobalioDemo() {
  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/60">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
        <div>
          <p className="eyebrow mb-3">Live demo</p>
          <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Play Globalio right here — live, not a mockup.
          </h3>
          <p className="mt-4 text-mute">
            This is the real, shipped app running in the frame — the same
            deterministic daily challenge every player worldwide gets, fully
            client-side and offline-capable. Poke around, then open it full
            screen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={GLOBALIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-accent px-5 py-3 font-semibold text-navy-950 transition-transform hover:-translate-y-0.5"
            >
              Open full screen ↗
            </a>
            <a
              href="https://github.com/SeanJoudrie"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-navy-600 px-5 py-3 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              More on GitHub
            </a>
          </div>
        </div>

        {/* Desktop: live phone-frame embed */}
        <div className="hidden justify-center lg:flex">
          <div className="relative w-[300px] shrink-0 rounded-[2.25rem] border-[10px] border-navy-700 bg-navy-950 p-1 shadow-2xl shadow-black/40">
            <div
              aria-hidden
              className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-navy-600"
            />
            <iframe
              src={GLOBALIO_URL}
              title="Globalio — live, playable"
              loading="lazy"
              className="h-[560px] w-full rounded-[1.65rem] bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>

        {/* Mobile: compact card instead of a tall live embed */}
        <a
          href={GLOBALIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-xl border border-navy-700 bg-navy-950/60 p-5 transition-colors hover:border-accent lg:hidden"
        >
          <div>
            <p className="font-display font-semibold text-ink">Play Globalio ↗</p>
            <p className="mt-0.5 text-sm text-faint">
              Opens the live app in a new tab.
            </p>
          </div>
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-bold text-navy-950"
          >
            ▶
          </span>
        </a>
      </div>
    </div>
  )
}
