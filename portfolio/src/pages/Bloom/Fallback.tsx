/**
 * The graceful floor: no WebGL, a lost GPU context, or a failed load lands
 * here — a still of the idea, never a black rectangle. A rose sketched in
 * flat squares: red bloom, green stem and leaf.
 */
export function Fallback() {
  // (col, row, size, kind) — kind 0 petal, 1 foliage
  const cubes: Array<[number, number, number, number]> = [
    [76, 26, 16, 0], [58, 34, 14, 0], [92, 34, 14, 0], [70, 42, 16, 0], [86, 46, 12, 0],
    [64, 20, 10, 0], [88, 20, 10, 0], [76, 12, 10, 0],
    [76, 62, 8, 1], [76, 72, 8, 1], [76, 82, 8, 1], [76, 92, 8, 1], [76, 102, 8, 1],
    [86, 78, 10, 1], [96, 74, 8, 1], [62, 92, 10, 1], [52, 88, 8, 1],
  ]
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 160 130" className="mx-auto h-44 w-52" aria-hidden="true">
          {cubes.map(([x, y, s, kind], i) => (
            <rect
              key={i}
              x={x - s / 2}
              y={y - s / 2}
              width={s}
              height={s}
              rx={1.5}
              fill={kind === 0 ? 'var(--color-bloom-hot)' : 'var(--color-bloom-leaf)'}
              opacity={0.5 + ((i * 37) % 40) / 100}
            />
          ))}
        </svg>
        <p className="mt-4 text-sm text-bloom-ink-2">The voxel rose isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-bloom-muted">It needs WebGL — up to 77,000 lit cubes in one draw call.</p>
      </div>
    </div>
  )
}
