/**
 * The graceful floor: no WebGL, a lost GPU context, or a failed load lands
 * here — a still of the idea, never a black rectangle. A dotted brain
 * silhouette with one deep structure glowing red.
 */
export function Fallback() {
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 160 120" className="mx-auto h-40 w-52" aria-hidden="true">
          {/* stipple brain silhouette */}
          {Array.from({ length: 340 }, (_, i) => {
            // deterministic pseudo-random points inside a brain-ish blob
            const a = (i * 2.399963) % (Math.PI * 2)
            const r = 1 - ((i * 0.61803) % 1) * 0.45
            const bx = 80 + Math.cos(a) * 46 * r
            const by = 58 + Math.sin(a) * 34 * r * (a > Math.PI ? 0.9 : 1)
            // a red cluster low-center = the "deep structure"
            const deep = Math.hypot(bx - 84, by - 66) < 12
            return (
              <circle
                key={i}
                cx={bx.toFixed(1)}
                cy={by.toFixed(1)}
                r={deep ? 1.5 : 1}
                fill={deep ? 'var(--color-cortex-hot)' : 'var(--color-cortex-dot)'}
                opacity={deep ? 0.95 : 0.4}
              />
            )
          })}
        </svg>
        <p className="mt-4 text-sm text-cortex-ink-2">The particle brain isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-cortex-muted">It needs WebGL — 80,000 points, drawn every frame.</p>
      </div>
    </div>
  )
}
