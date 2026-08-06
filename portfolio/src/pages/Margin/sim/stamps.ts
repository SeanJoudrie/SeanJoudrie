/**
 * Gravity wells, wind fields, and portals.
 *
 * All three are pure arithmetic and `sqrt`. There is not a trig call in this
 * file and there must never be one: IEEE-754 requires correct rounding for
 * `+ - * /` and `Math.sqrt` and requires *nothing* of `sin`, `cos`, `atan2`
 * and the rest, so engines are free to differ in the last bit. One differing
 * bit at tick 40 is a completely different run by tick 400, which would mean a
 * shared track that works for its author and fails for whoever opens the link.
 * `check-determinism.mjs` greps this directory to keep it that way.
 */
import {
  EPS_LEN,
  PORTAL_COOLDOWN,
  VORTEX_MIN_R,
  WELL_CUTOFF_R2,
  WELL_MIN_R,
  WIND_R,
} from './consts.ts'
import { N_POINTS, RIDE_POINTS, type Rig } from './rig.ts'
import { WindKind, type World } from './types.ts'

/**
 * Wells pull every point in the rig, including the ones that never collide.
 * Applying to a subset would tear the rig apart against its own constraints.
 */
export function applyWells(rig: Rig, world: World): void {
  const { wells } = world
  for (let w = 0; w < wells.length; w++) {
    const well = wells[w]
    for (let i = 0; i < N_POINTS; i++) {
      const dx = well.x - rig.x[i]
      const dy = well.y - rig.y[i]
      const r2 = dx * dx + dy * dy
      if (r2 > WELL_CUTOFF_R2 || r2 < EPS_LEN) continue
      const r = Math.sqrt(r2)
      const rc = r < WELL_MIN_R ? WELL_MIN_R : r
      const a = well.strength / (rc * rc)
      rig.fx[i] += (dx / r) * a
      rig.fy[i] += (dy / r) * a
    }
  }
}

export function applyWinds(rig: Rig, world: World): void {
  const { winds } = world
  for (let w = 0; w < winds.length; w++) {
    const wind = winds[w]
    if (wind.kind === WindKind.Arrow) {
      // Uniform push inside a capsule around the drawn segment.
      const abx = wind.bx - wind.ax
      const aby = wind.by - wind.ay
      const ab2 = abx * abx + aby * aby
      if (ab2 < EPS_LEN) continue
      for (let i = 0; i < N_POINTS; i++) {
        let t = ((rig.x[i] - wind.ax) * abx + (rig.y[i] - wind.ay) * aby) / ab2
        t = t < 0 ? 0 : t > 1 ? 1 : t
        const dx = rig.x[i] - (wind.ax + abx * t)
        const dy = rig.y[i] - (wind.ay + aby * t)
        if (dx * dx + dy * dy > WIND_R * WIND_R) continue
        rig.fx[i] += wind.ux * wind.strength
        rig.fy[i] += wind.uy * wind.strength
      }
    } else {
      // Tangential push inside a disc, falling linearly to zero at the rim.
      const radius = wind.radius
      if (radius < EPS_LEN) continue
      for (let i = 0; i < N_POINTS; i++) {
        const dx = rig.x[i] - wind.ax
        const dy = rig.y[i] - wind.ay
        const r2 = dx * dx + dy * dy
        if (r2 > radius * radius) continue
        const r = Math.sqrt(r2)
        const rc = r < VORTEX_MIN_R ? VORTEX_MIN_R : r
        const a = wind.strength * (1 - rc / radius)
        rig.fx[i] += (-dy / rc) * a
        rig.fy[i] += (dx / rc) * a
      }
    }
  }
}

/** Do segments P0→P1 and Q0→Q1 cross? Arithmetic only. */
function segmentsCross(
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  q0x: number,
  q0y: number,
  q1x: number,
  q1y: number,
): boolean {
  const rx = p1x - p0x
  const ry = p1y - p0y
  const sx = q1x - q0x
  const sy = q1y - q0y
  const denom = rx * sy - ry * sx
  if (denom < EPS_LEN && denom > -EPS_LEN) return false
  const ox = q0x - p0x
  const oy = q0y - p0y
  const t = (ox * sy - oy * sx) / denom
  if (t < 0 || t > 1) return false
  const u = (ox * ry - oy * rx) / denom
  return u >= 0 && u <= 1
}

/**
 * Move the whole rig from one portal frame into the other.
 *
 * The previous position gets the identical rotation, which is what carries
 * momentum through correctly — recomputing velocity by any other route loses
 * or invents energy at the mouth.
 */
function transport(
  rig: Rig,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  qc: number,
  qs: number,
): void {
  for (let i = 0; i < N_POINTS; i++) {
    const rx = rig.x[i] - fromX
    const ry = rig.y[i] - fromY
    rig.x[i] = toX + (rx * qc - ry * qs)
    rig.y[i] = toY + (rx * qs + ry * qc)

    const rpx = rig.px[i] - fromX
    const rpy = rig.py[i] - fromY
    rig.px[i] = toX + (rpx * qc - rpy * qs)
    rig.py[i] = toY + (rpx * qs + rpy * qc)
  }
  rig.portalCooldown = PORTAL_COOLDOWN
}

/**
 * Portals are bidirectional: crossing B comes out of A under the inverse
 * rotation. The cooldown exists because a pair placed facing each other would
 * otherwise transport the rig on every consecutive tick, forever.
 */
export function applyPortals(rig: Rig, world: World): void {
  if (rig.portalCooldown > 0) {
    rig.portalCooldown--
    return
  }
  const { portals } = world
  for (let k = 0; k < portals.length; k++) {
    const p = portals[k]
    for (let r = 0; r < RIDE_POINTS.length; r++) {
      const i = RIDE_POINTS[r]
      const x0 = rig.px[i]
      const y0 = rig.py[i]
      const x1 = rig.x[i]
      const y1 = rig.y[i]

      if (segmentsCross(x0, y0, x1, y1, p.ax, p.ay, p.bx, p.by)) {
        transport(rig, p.ax, p.ay, p.cx, p.cy, p.qc, p.qs)
        return
      }
      if (segmentsCross(x0, y0, x1, y1, p.cx, p.cy, p.dx, p.dy)) {
        transport(rig, p.cx, p.cy, p.ax, p.ay, p.qc, -p.qs)
        return
      }
    }
  }
}
