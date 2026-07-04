import { ENTITY_TYPES, TYPE_COLOR, TYPE_LABEL } from './schema'

export function Legend() {
  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <p className="skein-label mb-2">Legend</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {ENTITY_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-2 text-xs text-skein-ink-2">
            <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLOR[t], opacity: 0.85 }} />
            {TYPE_LABEL[t]}
          </li>
        ))}
      </ul>
      <p className="skein-num mt-3 text-[0.68rem] leading-relaxed text-skein-muted">
        Force-directed layout, timeline, and map are hand-rolled — no graph library, no map tiles.
        The whole case is one seeded, deterministic dataset.
      </p>
    </div>
  )
}
