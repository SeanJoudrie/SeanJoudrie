import { DEFAULT_SELECTION, decodeSelection, encodeSelection, PARTS, priceOf } from './config'
import type { PartId, Selection } from './config'

/** Dev-only contract for the config schema — never in the production chunk. */
export function assertConfig(): void {
  const errs: string[] = []

  for (const part of PARTS) {
    const ids = part.options.map((o) => o.id)
    if (new Set(ids).size !== ids.length) errs.push(`${part.id}: duplicate option ids`)
    if (!ids.includes(DEFAULT_SELECTION[part.id])) errs.push(`${part.id}: default '${DEFAULT_SELECTION[part.id]}' missing`)
    for (const o of part.options) {
      if (o.priceDelta < 0) errs.push(`${part.id}/${o.id}: negative price delta`)
      if (!/^#[0-9a-f]{6}$/i.test(o.swatch)) errs.push(`${part.id}/${o.id}: bad swatch '${o.swatch}'`)
      if (!/^[a-z0-9-]+$/.test(o.id)) errs.push(`${part.id}/${o.id}: id not URL-safe`)
    }
  }

  if (priceOf(DEFAULT_SELECTION) <= 0) errs.push('base build priced at zero')

  // URL codec round-trips every legal selection and rejects garbage.
  for (const part of PARTS) {
    for (const o of part.options) {
      const sel: Selection = { ...DEFAULT_SELECTION, [part.id as PartId]: o.id }
      const back = decodeSelection(`#/demos/meridian${encodeSelection(sel)}`)
      if (JSON.stringify(back) !== JSON.stringify(sel)) errs.push(`codec round-trip failed for ${part.id}=${o.id}`)
    }
  }
  const attack = decodeSelection('#/demos/meridian?case=<script>&dial=__proto__&bogus=1')
  if (JSON.stringify(attack) !== JSON.stringify(DEFAULT_SELECTION)) errs.push('codec accepted garbage input')

  if (errs.length) throw new Error(`Meridian config invariants failed:\n  · ${errs.join('\n  · ')}`)
}
