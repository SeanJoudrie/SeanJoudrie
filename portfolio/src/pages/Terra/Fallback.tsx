/**
 * The graceful floor: no WebGL, a lost GPU context, a failed mask fetch, or
 * a render error lands here — a still of the idea, never a black rectangle.
 * A dotted globe with a green land-run across the equator: shape + palette
 * only, so it has nothing to drift from.
 */
export function Fallback() {
  // A deterministic ring of "particles" — three latitude bands, dotted.
  const bands = [
    { ry: 14, n: 22, land: [3, 4, 5, 12, 13] },
    { ry: 30, n: 30, land: [7, 8, 9, 10, 21, 22] },
    { ry: 42, n: 34, land: [1, 2, 15, 16, 17, 28] },
  ]
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 120 120" className="mx-auto h-40 w-40" aria-hidden="true">
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--color-terra-line-strong)" strokeWidth="1" strokeDasharray="1 4" />
          {bands.map(({ ry, n, land }, b) =>
            Array.from({ length: n }, (_, i) => {
              const a = (i / n) * Math.PI * 2
              const cx = 60 + Math.cos(a) * 46 * Math.cos((ry / 46) * 0.9)
              const cy = 60 + Math.sin(a) * ry
              const isLand = land.includes(i)
              return (
                <circle
                  key={`${b}-${i}`}
                  cx={cx}
                  cy={cy}
                  r={isLand ? 1.7 : 1.2}
                  fill={isLand ? 'var(--color-terra-land)' : 'var(--color-terra-sea)'}
                  opacity={isLand ? 0.95 : 0.55}
                />
              )
            }),
          )}
        </svg>
        <p className="mt-4 text-sm text-terra-ink-2">The particle Earth isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-terra-muted">
          It needs WebGL — 60,000 points, drawn every frame.
        </p>
      </div>
    </div>
  )
}
