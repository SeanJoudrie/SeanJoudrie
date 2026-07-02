/**
 * The configuration surface — every option, its price delta, and the
 * material recipe it applies. Price is always derived (BASE + Σ deltas),
 * never stored, so it can't drift. Invariants enforced in dev by
 * config.assert.ts.
 */

export const BASE_PRICE = 1_450

export type PartId = 'case' | 'bezel' | 'dial' | 'strap'

export type Metal = {
  color: string
  metalness: number
  roughness: number
  clearcoat: number
  anisotropy?: number
}

export type Face = { base: string; deep: string; ink: string }

export type CaseOption = { id: string; label: string; priceDelta: number; swatch: string; metal: Metal }
export type BezelOption = CaseOption
export type DialOption = { id: string; label: string; priceDelta: number; swatch: string; face: Face }
export type StrapOption = {
  id: string
  label: string
  priceDelta: number
  swatch: string
  kind: 'leather' | 'rubber' | 'bracelet'
  color: string
}

export const CASES: CaseOption[] = [
  { id: 'steel', label: 'Brushed steel', priceDelta: 0, swatch: '#c9cdd3', metal: { color: '#c9cdd3', metalness: 1, roughness: 0.34, clearcoat: 0.35, anisotropy: 0.55 } },
  { id: 'titanium', label: 'Titanium', priceDelta: 180, swatch: '#a8adb0', metal: { color: '#a8adb0', metalness: 1, roughness: 0.44, clearcoat: 0.15, anisotropy: 0.4 } },
  { id: 'gold', label: '18k gold', priceDelta: 450, swatch: '#d4a54a', metal: { color: '#d4a54a', metalness: 1, roughness: 0.24, clearcoat: 0.4, anisotropy: 0.35 } },
  { id: 'pvd', label: 'Black PVD', priceDelta: 120, swatch: '#26282a', metal: { color: '#26282a', metalness: 1, roughness: 0.46, clearcoat: 0.1, anisotropy: 0.3 } },
]

export const BEZELS: BezelOption[] = [
  { id: 'polished', label: 'Polished', priceDelta: 0, swatch: '#d4d8dd', metal: { color: '#d4d8dd', metalness: 1, roughness: 0.12, clearcoat: 0.6 } },
  { id: 'brushed', label: 'Brushed', priceDelta: 40, swatch: '#b9bec5', metal: { color: '#b9bec5', metalness: 1, roughness: 0.34, clearcoat: 0.3, anisotropy: 0.5 } },
  { id: 'ceramic', label: 'Black ceramic', priceDelta: 90, swatch: '#16181a', metal: { color: '#16181a', metalness: 0, roughness: 0.14, clearcoat: 1 } },
]

export const DIALS: DialOption[] = [
  { id: 'midnight', label: 'Midnight blue', priceDelta: 0, swatch: '#25395c', face: { base: '#2e4468', deep: '#101b30', ink: '#e8e6df' } },
  { id: 'silver', label: 'Silver sunray', priceDelta: 0, swatch: '#cfd3d8', face: { base: '#d9dce0', deep: '#9aa0a8', ink: '#23262b' } },
  { id: 'forest', label: 'Forest green', priceDelta: 40, swatch: '#2c5445', face: { base: '#33604e', deep: '#0f241b', ink: '#e8e6df' } },
  { id: 'slate', label: 'Slate black', priceDelta: 0, swatch: '#32353a', face: { base: '#3d4046', deep: '#131519', ink: '#dfdcd4' } },
]

export const STRAPS: StrapOption[] = [
  { id: 'tan', label: 'Tan leather', priceDelta: 0, swatch: '#9a6b42', kind: 'leather', color: '#9a6b42' },
  { id: 'black', label: 'Black leather', priceDelta: 0, swatch: '#211d1a', kind: 'leather', color: '#211d1a' },
  { id: 'navy', label: 'Navy leather', priceDelta: 0, swatch: '#2a3550', kind: 'leather', color: '#2a3550' },
  { id: 'bracelet', label: 'Steel bracelet', priceDelta: 160, swatch: '#c3c7cd', kind: 'bracelet', color: '#c3c7cd' },
  { id: 'rubber', label: 'Rubber', priceDelta: 30, swatch: '#1b1d1f', kind: 'rubber', color: '#1b1d1f' },
]

export const PARTS: { id: PartId; label: string; options: { id: string; label: string; priceDelta: number; swatch: string }[] }[] = [
  { id: 'case', label: 'Case', options: CASES },
  { id: 'bezel', label: 'Bezel', options: BEZELS },
  { id: 'dial', label: 'Dial', options: DIALS },
  { id: 'strap', label: 'Strap', options: STRAPS },
]

export type Selection = Record<PartId, string>

export const DEFAULT_SELECTION: Selection = { case: 'steel', bezel: 'polished', dial: 'midnight', strap: 'tan' }

const byId = <T extends { id: string }>(list: T[], id: string, fallback: string): T =>
  list.find((o) => o.id === id) ?? list.find((o) => o.id === fallback)!

export const caseOf = (s: Selection) => byId(CASES, s.case, DEFAULT_SELECTION.case)
export const bezelOf = (s: Selection) => byId(BEZELS, s.bezel, DEFAULT_SELECTION.bezel)
export const dialOf = (s: Selection) => byId(DIALS, s.dial, DEFAULT_SELECTION.dial)
export const strapOf = (s: Selection) => byId(STRAPS, s.strap, DEFAULT_SELECTION.strap)

export const priceOf = (s: Selection) =>
  BASE_PRICE + caseOf(s).priceDelta + bezelOf(s).priceDelta + dialOf(s).priceDelta + strapOf(s).priceDelta

/** Selection ↔ URL query (inside the hash): only non-default keys ride. */
export function encodeSelection(s: Selection): string {
  const q = (Object.keys(s) as PartId[])
    .filter((k) => s[k] !== DEFAULT_SELECTION[k])
    .map((k) => `${k}=${s[k]}`)
    .join('&')
  return q ? `?${q}` : ''
}

export function decodeSelection(hash: string): Selection {
  const out = { ...DEFAULT_SELECTION }
  const q = hash.split('?')[1]
  if (!q) return out
  for (const pair of q.split('&')) {
    const [k, v] = pair.split('=')
    if (k === 'case' && CASES.some((o) => o.id === v)) out.case = v
    else if (k === 'bezel' && BEZELS.some((o) => o.id === v)) out.bezel = v
    else if (k === 'dial' && DIALS.some((o) => o.id === v)) out.dial = v
    else if (k === 'strap' && STRAPS.some((o) => o.id === v)) out.strap = v
  }
  return out
}

if (import.meta.env?.DEV) {
  void import('./config.assert').then(({ assertConfig }) => assertConfig())
}
