/**
 * Static fallback for no-WebGL, context loss, or a scene render error.
 * A schematic section through the canyon with a visibility ray — enough to
 * convey what the demo does without a GL context. Never a blank canvas.
 */
export function Fallback() {
  return (
    <div className="grid flex-1 place-items-center px-5 py-16">
      <div className="max-w-md text-center">
        <svg viewBox="0 0 320 150" className="mx-auto w-full max-w-sm" role="img" aria-label="Schematic cross-section of a canyon showing an observer's line of sight clipped by the far rim">
          {/* sky */}
          <rect width="320" height="150" fill="var(--color-relief-card)" rx="8" />
          {/* terrain section */}
          <path
            d="M0 118 L46 112 L64 60 L96 56 L120 104 L150 128 L182 132 L206 96 L232 44 L268 40 L292 108 L320 114 L320 150 L0 150 Z"
            fill="var(--color-relief-rock)"
            fillOpacity="0.5"
            stroke="var(--color-relief-line-strong)"
            strokeWidth="1"
          />
          {/* observer stem */}
          <line x1="96" y1="56" x2="96" y2="34" stroke="var(--color-relief-visible)" strokeWidth="1.5" />
          <circle cx="96" cy="32" r="3.5" fill="var(--color-relief-visible)" />
          {/* sight line that clears the near rim and grazes the far rim */}
          <line x1="96" y1="32" x2="232" y2="44" stroke="var(--color-relief-visible)" strokeWidth="1" strokeDasharray="3 3" />
          {/* the hidden pocket beyond the grazing point */}
          <path d="M232 44 L268 40 L292 108 L320 114 L320 150 L232 150 Z" fill="var(--color-relief-hidden)" fillOpacity="0.42" />
        </svg>
        <p className="relief-label mt-6">Relief · viewshed</p>
        <p className="mt-3 leading-relaxed text-relief-ink-2">
          This demo needs WebGL to compute visibility across the terrain. Your browser
          didn’t provide a graphics context, so here’s the idea in section: everything
          the observer can see, and the pocket the far rim hides from them.
        </p>
      </div>
    </div>
  )
}
