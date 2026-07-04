import { useMemo } from 'react'
import { CASE } from './generate'
import { ms } from './schema'
import type { Action, SkeinState } from './model'
import type { Derived } from './model'

/* An authored SVG "chart of the region" — abstract sea, landmasses, plotted
   ports at their mx,my coords — with derived shipping lanes (per vessel, its
   active shipment ports connected in date order) and per-port activity badges
   that update with the window. Click a port → selectLocation. No map tiles,
   no real geography. */

type Props = { state: SkeinState; derived: Derived; dispatch: (a: Action) => void }

const VB = 480
const locs = () => CASE.entities.filter((e) => e.type === 'location')

export function MapPane({ state, derived, dispatch }: Props) {
  const byId = useMemo(() => new Map(CASE.entities.map((e) => [e.id, e])), [])
  const sum = useMemo(() => new Map(derived.locations.map((l) => [l.id, l])), [derived])

  // shipping lanes: per vessel, active shipments in date order → consecutive ports
  const lanes = useMemo(() => {
    const [ws, we] = state.window
    const byVessel = new Map<string, { locId: string; t: number }[]>()
    for (const r of CASE.rels) {
      if (r.type !== 'shipped' || !r.locationId) continue
      const t = ms(r.date)
      if (t < ws || t > we) continue
      if (state.locationFilter && r.locationId !== state.locationFilter) continue
      const arr = byVessel.get(r.source) ?? []
      arr.push({ locId: r.locationId, t })
      byVessel.set(r.source, arr)
    }
    const segs: { ax: number; ay: number; bx: number; by: number; key: string }[] = []
    for (const [, calls] of byVessel) {
      calls.sort((a, b) => a.t - b.t)
      for (let i = 0; i + 1 < calls.length; i++) {
        const a = byId.get(calls[i].locId)!
        const b = byId.get(calls[i + 1].locId)!
        if (a.id === b.id) continue
        segs.push({ ax: a.mx! * VB, ay: a.my! * VB, bx: b.mx! * VB, by: b.my! * VB, key: `${a.id}-${b.id}-${i}` })
      }
    }
    return segs
  }, [state.window, state.locationFilter, byId])

  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="skein-label">Geospatial · click a port</span>
        {state.locationFilter && (
          <button onClick={() => dispatch({ t: 'clearSelection' })} className="skein-num text-xs text-skein-thread hover:underline">
            clear filter ✕
          </button>
        )}
      </div>
      <svg data-skein="map" viewBox={`0 0 ${VB} ${VB}`} className="aspect-square w-full" role="group" aria-label="Schematic chart of the region's ports. Click a port to filter every view to entities present there in the current window.">
        {/* sea */}
        <rect width={VB} height={VB} rx="10" fill="#0f1622" />
        {/* two abstract landmasses (authored, not real geography) */}
        <path d="M -20 120 C 80 90, 120 160, 90 220 C 60 280, 140 300, 120 360 L -20 380 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        <path d="M 500 60 C 400 100, 430 180, 470 220 C 520 270, 470 340, 500 420 L 520 -20 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        <path d="M 250 430 C 300 400, 360 440, 380 500 L 180 500 C 190 460, 210 450, 250 430 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        {/* graticule */}
        {[120, 240, 360].map((g) => (
          <g key={g} stroke="var(--color-skein-line)" strokeOpacity="0.5">
            <line x1={g} y1="0" x2={g} y2={VB} />
            <line x1="0" y1={g} x2={VB} y2={g} />
          </g>
        ))}
        {/* shipping lanes */}
        <g>
          {lanes.map((s) => (
            <line key={s.key} x1={s.ax} y1={s.ay} x2={s.bx} y2={s.by} stroke="var(--color-skein-thread)" strokeOpacity="0.5" strokeWidth="1.75" strokeDasharray="5 4" />
          ))}
        </g>
        {/* ports */}
        {locs().map((l) => {
          const s = sum.get(l.id)
          const active = (s?.activeEntities ?? 0) > 0
          const isFilter = state.locationFilter === l.id
          const cx = l.mx! * VB
          const cy = l.my! * VB
          return (
            <g key={l.id} data-loc data-loc-id={l.id} style={{ cursor: 'pointer' }}
              onClick={() => dispatch({ t: 'selectLocation', id: l.id })}>
              {isFilter && <circle cx={cx} cy={cy} r="18" fill="none" stroke="var(--color-skein-thread)" strokeWidth="2" />}
              <circle cx={cx} cy={cy} r={active ? 9 : 6} fill="var(--color-skein-location)" fillOpacity={active ? 0.85 : 0.3} stroke="var(--color-skein-location)" strokeWidth="1.5" />
              {active && s!.activeEntities > 0 && (
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fill="#0c0b12" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
                  {s!.activeEntities}
                </text>
              )}
              <text x={cx} y={cy - 13} textAnchor="middle" fontSize="10" fill={active ? 'var(--color-skein-ink)' : 'var(--color-skein-muted)'} style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                {l.name}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="skein-num mt-2 text-xs text-skein-muted">
        Badge = distinct entities present in-window. Dashed lines = vessel port calls in date order.
      </p>
    </div>
  )
}
