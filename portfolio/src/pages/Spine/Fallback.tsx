/**
 * The graceful floor: no WebGL, a lost GPU context, or a failed load lands
 * here — a still of the idea, never a black rectangle. A stack of dotted
 * vertebrae with an amber cord threading through.
 */
export function Fallback() {
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 120 200" className="mx-auto h-56 w-36" aria-hidden="true">
          {/* 16 vertebrae stacked with a gentle S-curve */}
          {Array.from({ length: 16 }, (_, i) => {
            const t = i / 15
            const y = 14 + t * 168
            const x = 60 + Math.sin(t * Math.PI * 2 - 0.6) * 9
            return (
              <g key={`v${i}`}>
                {Array.from({ length: 14 }, (_, k) => {
                  const a = (k / 14) * Math.PI * 2
                  const rx = 11 - t * 2
                  return (
                    <circle
                      key={k}
                      cx={(x + Math.cos(a) * rx).toFixed(1)}
                      cy={(y + Math.sin(a) * 4).toFixed(1)}
                      r={1.1}
                      fill="var(--color-spine-dot)"
                      opacity={0.45}
                    />
                  )
                })}
                {/* spinous process pointing back */}
                <circle cx={(x - 15 + t * 3).toFixed(1)} cy={y.toFixed(1)} r={1.1} fill="var(--color-spine-dot)" opacity={0.4} />
              </g>
            )
          })}
          {/* amber cord */}
          {Array.from({ length: 60 }, (_, i) => {
            const t = i / 59
            const y = 14 + t * 150
            const x = 60 + Math.sin(t * Math.PI * 2 - 0.6) * 9
            return <circle key={`c${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.3} fill="var(--color-spine-cord)" opacity={0.75} />
          })}
        </svg>
        <p className="mt-4 text-sm text-spine-ink-2">The particle spine isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-spine-muted">It needs WebGL — 64,000 points, drawn every frame.</p>
      </div>
    </div>
  )
}
