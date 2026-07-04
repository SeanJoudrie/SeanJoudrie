import type { EntityType, Risk } from './schema'
import { FLAG } from './schema'

/** 24×24 path(s) per entity type; stroke uses currentColor. Exported as the
    single source of glyph geometry — Graph.tsx imports these to draw node
    centers directly (no nested <svg> per node), so there is only one copy. */
export const PATHS: Record<EntityType, string> = {
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
  org: 'M4 21V6l7-3 7 3v15M4 21h16M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  account: 'M3 7h18v10H3zM3 11h18M7 15h4',
  location: 'M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 9a2 2 0 100 0.01',
  vessel: 'M3 15l1.5 4h15L21 15M5 15V8l7-3 7 3v7M12 5v10M5 15h14',
}

export function TypeGlyph({ type, size = 15, className = '' }: { type: EntityType; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[type]} />
    </svg>
  )
}

/** Risk dot: high = flag amber (hollow ring), medium = solid, low = faint. */
export function RiskDot({ risk }: { risk: Risk }) {
  const title = `${risk} risk`
  if (risk === 'high') return <span title={title} className="inline-block h-2 w-2 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${FLAG}` }} aria-label={title} />
  return <span title={title} className="inline-block h-2 w-2 rounded-full" style={{ background: risk === 'medium' ? 'var(--color-skein-muted)' : 'var(--color-skein-line)' }} aria-label={title} />
}
