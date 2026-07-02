/**
 * The graceful floor: no WebGL, a crashed GPU context, or a render error
 * lands here — a static silhouette, never a black rectangle. Deliberately
 * NOT config-accurate (shape + brand only), so it has nothing to drift
 * from; the panel beside it keeps working — build and price stay live.
 */
export function Fallback() {
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 120 120" className="mx-auto h-40 w-40" aria-hidden="true">
          {/* lugs */}
          {[
            [38, 18],
            [70, 18],
            [38, 94],
            [70, 94],
          ].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width="12" height="9" rx="3" fill="none" stroke="var(--color-meridian-muted)" strokeWidth="2" />
          ))}
          <circle cx="60" cy="60" r="34" fill="none" stroke="var(--color-meridian-brass)" strokeWidth="3" />
          <circle cx="60" cy="60" r="27" fill="none" stroke="var(--color-meridian-muted)" strokeWidth="1.5" />
          {/* hands at ten-past-ten, the catalog pose */}
          <line x1="60" y1="60" x2="46" y2="46" stroke="var(--color-meridian-ink-2)" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="60" x2="74" y2="42" stroke="var(--color-meridian-ink-2)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="60" r="2.5" fill="var(--color-meridian-brass)" />
          {/* crown */}
          <rect x="97" y="55" width="7" height="10" rx="2" fill="none" stroke="var(--color-meridian-muted)" strokeWidth="2" />
        </svg>
        <p className="mt-4 text-sm text-meridian-ink-2">The 3D preview isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-meridian-muted">
          The configurator still works — your build and price stay live.
        </p>
      </div>
    </div>
  )
}
