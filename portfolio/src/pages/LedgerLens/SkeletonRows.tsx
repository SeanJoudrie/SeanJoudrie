/** Streaming skeleton — dim shimmering rows shown while the model reads/structures.
 *  `count` grows as line items resolve from the stream. */
export function SkeletonRows({ count }: { count: number }) {
  const n = Math.max(3, Math.min(count || 0, 12))
  return (
    <div className="mt-4 space-y-2" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="grid grid-cols-[1fr_4rem_5rem_5rem] items-center gap-3">
          <div className="ledger-skel h-4" style={{ width: `${60 + ((i * 37) % 35)}%` }} />
          <div className="ledger-skel h-4" />
          <div className="ledger-skel h-4" />
          <div className="ledger-skel h-4" />
        </div>
      ))}
    </div>
  )
}
