/**
 * The graceful floor: no WebGL, a lost GPU context, or a failed load lands
 * here — a still of the idea, never a black rectangle. A dotted heart, half
 * oxygenated-red, half deoxygenated-blue.
 */
export function Fallback() {
  // A heart outline sampled as points, split left (red) / right (blue).
  const pts: Array<[number, number, boolean]> = []
  for (let i = 0; i < 300; i++) {
    const t = (i / 300) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    // fill inward a little for body
    const r = 0.55 + ((i * 0.61803) % 1) * 0.45
    pts.push([80 + x * r * 2.4, 66 - y * r * 2.4, x < 0])
  }
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 160 150" className="mx-auto h-44 w-48" aria-hidden="true">
          {pts.map(([x, y, blue], i) => (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.2} fill={blue ? 'var(--color-pulse-blue)' : 'var(--color-pulse-red)'} opacity={0.5} />
          ))}
        </svg>
        <p className="mt-4 text-sm text-pulse-ink-2">The beating particle heart isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-pulse-muted">It needs WebGL — 53,000 points, drawn every frame.</p>
      </div>
    </div>
  )
}
