/**
 * The graceful floor: no WebGL, a lost GPU context, or a failed load lands
 * here — a still of the idea, never a black rectangle. A dotted skull in
 * profile with an ivory palette.
 */
export function Fallback() {
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 160 140" className="mx-auto h-44 w-48" aria-hidden="true">
          {Array.from({ length: 300 }, (_, i) => {
            const a = (i * 2.399963) % (Math.PI * 2)
            const r = 1 - ((i * 0.61803) % 1) * 0.4
            const cx = 80 + Math.cos(a) * 44 * r
            const cy = 56 + Math.sin(a) * 40 * r
            return <circle key={`c${i}`} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={1} fill="var(--color-skull-dot)" opacity={0.4} />
          })}
          {/* eye sockets + jaw hint */}
          <circle cx="66" cy="60" r="8" fill="var(--color-skull-bg)" />
          <circle cx="94" cy="60" r="8" fill="var(--color-skull-bg)" />
          {Array.from({ length: 60 }, (_, i) => {
            const x = 58 + (i % 20) * 2.4
            const y = 104 + Math.floor(i / 20) * 3
            return <circle key={`j${i}`} cx={x} cy={y} r={1} fill="var(--color-skull-hot)" opacity={0.7} />
          })}
        </svg>
        <p className="mt-4 text-sm text-skull-ink-2">The particle skull isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-skull-muted">It needs WebGL — 61,000 points, drawn every frame.</p>
      </div>
    </div>
  )
}
