import type { Heightfield } from './heightfield'
import type { ReliefMeta } from './meta'

/**
 * Terrain profile along a line, and whether you can see down it.
 *
 * The viewshed answers "everything visible from here" as a picture. This
 * answers "what is between me and THAT" as a section, which is the form the
 * question is actually asked in when someone is siting a link or a sensor: not
 * how much can I see, but is this one path clear, and if not, by how much does
 * it miss and where.
 *
 * It is also the only place the curvature correction becomes visible. Elsewhere
 * d²/2R is a line in a footnote; drawn as a section it is the ground bending up
 * between the two ends, and you can watch a sight line graze it.
 *
 * THE EARTH BULGE. Two points on a sphere are joined by a chord that passes
 * inside it, so ground of equal altitude partway along stands ABOVE that chord.
 * Working in a flat frame, that is the same as lifting the intervening terrain
 * by d1·d2 / 2R — zero at both ends, largest in the middle. Refraction bends the
 * ray downward, which is conventionally folded in by inflating the radius:
 * R_eff = R / (1 - k). Identical geometry to the viewshed's own correction, seen
 * from the side instead of from the observer.
 */

const EARTH_R = 6371000
/** Refraction coefficient. Matches viewshed.ts and check-viewshed.mjs. */
export const REFRACTION_K = 0.13

export type ProfileSample = {
  /** Distance from the observer, metres. */
  d: number
  /** True ground elevation, metres. */
  ground: number
  /** Ground as the sight line meets it: elevation plus the earth bulge. */
  apparent: number
  /** Height of the sight line at this distance, metres. */
  sight: number
}

export type ProfileResult = {
  distanceM: number
  samples: ProfileSample[]
  /** Elevation of the observer's eye and of the target's ground. */
  eyeM: number
  targetM: number
  blocked: boolean
  /** Distance at which the terrain first cuts the sight line, metres. */
  firstBlockM: number | null
  /**
   * Smallest gap between the sight line and the apparent ground, metres.
   * Negative when blocked — how much the ray is buried at its worst point,
   * which is the number that says how far the observer would have to climb.
   */
  minClearanceM: number
}

/**
 * Sample the ground between two normalised positions and test the sight line.
 *
 * The endpoints are excluded from the blocking test. The observer's own cell is
 * beneath their feet by definition, and the target cell IS the thing being
 * looked at — counting either as an obstruction would report every path blocked.
 */
export function lineOfSight(
  field: Heightfield,
  meta: ReliefMeta,
  a: { u: number; v: number },
  b: { u: number; v: number },
  eyeHeightM: number,
  refraction: boolean,
  steps = 256,
): ProfileResult {
  const distanceM = Math.hypot((b.u - a.u) * meta.widthM, (b.v - a.v) * meta.heightM)
  const rEff = refraction ? EARTH_R / (1 - REFRACTION_K) : EARTH_R

  const groundA = field.elevAt(a.u, a.v)
  const groundB = field.elevAt(b.u, b.v)
  const eyeM = groundA + eyeHeightM
  const targetM = groundB

  const samples: ProfileSample[] = []
  let firstBlockM: number | null = null
  let minClearanceM = Infinity

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const d = distanceM * t
    const ground = field.elevAt(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t)
    const bulge = distanceM > 0 ? (d * (distanceM - d)) / (2 * rEff) : 0
    const apparent = ground + bulge
    const sight = eyeM + (targetM - eyeM) * t
    samples.push({ d, ground, apparent, sight })

    if (i > 0 && i < steps) {
      const clearance = sight - apparent
      if (clearance < minClearanceM) minClearanceM = clearance
      if (clearance < 0 && firstBlockM === null) firstBlockM = d
    }
  }

  return {
    distanceM,
    samples,
    eyeM,
    targetM,
    blocked: firstBlockM !== null,
    firstBlockM,
    minClearanceM: minClearanceM === Infinity ? 0 : minClearanceM,
  }
}
