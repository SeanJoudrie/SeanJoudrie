/**
 * Point-versus-segment contact, friction, water, and the crash test.
 *
 * Everything here walks `world.segs` in level order and stops at the first
 * match where the rule says "first wins". That order is stable because level
 * data is an ordered array that edits append to, and it is load-bearing: two
 * implementations that resolve the same overlapping contacts in a different
 * order produce different runs, which is the whole failure this simulation is
 * built to avoid.
 */
import { BUOYANCY, CONTACT_R, EPS_LEN, HEAD_CRASH_R, WATER_DRAG } from './consts.ts'
import { HEAD, N_POINTS, RIDE_POINTS, type Rig } from './rig.ts'
import { BRUSHES, Brush, type Seg, type World } from './types.ts'

/** Squared distance from (px, py) to segment `s`, and the closest point on it. */
function closest(s: Seg, px: number, py: number) {
  const abx = s.bx - s.ax
  const aby = s.by - s.ay
  const ab2 = abx * abx + aby * aby
  if (ab2 < EPS_LEN) return null
  let t = ((px - s.ax) * abx + (py - s.ay) * aby) / ab2
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const cx = s.ax + abx * t
  const cy = s.ay + aby * t
  const dx = px - cx
  const dy = py - cy
  return { d2: dx * dx + dy * dy, dx, dy, cx, cy, abx, aby, ab2 }
}

/** Scratch contact, reused so the hot loop allocates nothing. */
const contact = { nx: 0, ny: 0, x: 0, y: 0, hit: false }

/**
 * Find this point's contact with one line, sweeping first.
 *
 * Proximity alone is not enough and the numbers say why: a point dropped 70 px
 * arrives at √(2 · 0.12 · 70) ≈ 4.1 px/tick, and a 0.5 px contact radius means
 * it is never *within* the radius on any tick — it is above the line, then
 * below it, and it never touched. Discrete collision tunnels through exactly
 * the fast sections a sledding game is made of.
 *
 * So the motion `(px,py) → (x,y)` is tested against the segment as a segment
 * crossing, and only if nothing crossed does the proximity test run to hold a
 * resting sled on the ground. Both branches are arithmetic and `sqrt`.
 */
function findContact(s: Seg, x0: number, y0: number, x1: number, y1: number): boolean {
  contact.hit = false

  const abx = s.bx - s.ax
  const aby = s.by - s.ay
  const ab2 = abx * abx + aby * aby
  if (ab2 < EPS_LEN) return false

  // Swept: did this tick's motion cross the line?
  const rx = x1 - x0
  const ry = y1 - y0
  const denom = rx * aby - ry * abx
  if (denom > EPS_LEN || denom < -EPS_LEN) {
    const ox = s.ax - x0
    const oy = s.ay - y0
    const t = (ox * aby - oy * abx) / denom
    const u = (ox * ry - oy * rx) / denom
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      const inv = 1 / Math.sqrt(ab2)
      let nx = -aby * inv
      let ny = abx * inv
      // Orient the normal back toward the side the point came from, so it is
      // pushed out the way it arrived rather than through the line.
      if ((x0 - s.ax) * nx + (y0 - s.ay) * ny < 0) {
        nx = -nx
        ny = -ny
      }
      contact.nx = nx
      contact.ny = ny
      contact.x = x0 + rx * t
      contact.y = y0 + ry * t
      contact.hit = true
      return true
    }
  }

  // Resting: is the point already sitting on the line?
  const near = closest(s, x1, y1)
  if (!near || near.d2 >= CONTACT_R * CONTACT_R) return false
  const d = Math.sqrt(near.d2)
  if (d > EPS_LEN) {
    contact.nx = near.dx / d
    contact.ny = near.dy / d
  } else {
    // Dead centre on the line: fall back to the segment's own normal so the
    // push-out direction stays defined instead of becoming NaN.
    const inv = 1 / Math.sqrt(ab2)
    contact.nx = -aby * inv
    contact.ny = abx * inv
  }
  contact.x = near.cx
  contact.y = near.cy
  contact.hit = true
  return true
}

/**
 * Resolve one rig point against every collidable line.
 *
 * Restitution is zero for every brush — a sled does not bounce, and a bouncing
 * one makes tracks impossible to author because the outcome stops being
 * legible from the drawing.
 *
 * Returns true if the point touched something that ends the run.
 */
function resolvePoint(rig: Rig, world: World, i: number): boolean {
  const { segs } = world
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k]
    const props = BRUSHES[s.brush]
    if (!props.collides) continue

    const x0 = rig.px[i]
    const y0 = rig.py[i]
    if (!findContact(s, x0, y0, rig.x[i], rig.y[i])) continue

    if (props.kill) return true

    // Incoming velocity is the motion that was attempted, taken before the
    // position is snapped to the surface.
    const vx = rig.x[i] - x0
    const vy = rig.y[i] - y0

    const nx = contact.nx
    const ny = contact.ny

    // 1 — sit the point exactly one contact radius off the surface.
    rig.x[i] = contact.x + nx * CONTACT_R
    rig.y[i] = contact.y + ny * CONTACT_R

    // 2 — drop the normal component of velocity, damp the tangential.
    const tx = -ny
    const ty = nx
    let vt = vx * tx + vy * ty

    // A boost pushes along the segment as drawn, so drawing one right-to-left
    // boosts backwards. That is a feature; the toolbar has to say so.
    if (props.boost !== 0) {
      const along = (s.bx - s.ax) * tx + (s.by - s.ay) * ty
      vt = vt * (1 - props.friction) + (along >= 0 ? props.boost : -props.boost)
    } else {
      vt = vt * (1 - props.friction)
    }

    rig.px[i] = rig.x[i] - vt * tx
    rig.py[i] = rig.y[i] - vt * ty
  }
  return false
}

/** Resolve the sled's two runners. Returns true if the run ended. */
export function collide(rig: Rig, world: World): boolean {
  for (let r = 0; r < RIDE_POINTS.length; r++) {
    if (resolvePoint(rig, world, RIDE_POINTS[r])) return true
  }
  return false
}

/**
 * Did this point's motion this tick come within `radius` of the segment, or
 * pass clean through it? The crash test needs the swept half for the same
 * reason contact does — a head travelling faster than its own crash radius
 * would otherwise sail through the ground and keep going.
 */
function touches(
  s: Seg,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
): boolean {
  const abx = s.bx - s.ax
  const aby = s.by - s.ay
  const ab2 = abx * abx + aby * aby
  if (ab2 < EPS_LEN) return false

  const rx = x1 - x0
  const ry = y1 - y0
  const denom = rx * aby - ry * abx
  if (denom > EPS_LEN || denom < -EPS_LEN) {
    const ox = s.ax - x0
    const oy = s.ay - y0
    const t = (ox * aby - oy * abx) / denom
    const u = (ox * ry - oy * rx) / denom
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true
  }

  const near = closest(s, x1, y1)
  return near !== null && near.d2 < radius * radius
}

/**
 * The crash test. The head is not a colliding point — it passes through
 * everything — but coming within HEAD_CRASH_R of anything solid ends the run.
 * Kill lines end it for any point at all, not just the head.
 */
export function crashed(rig: Rig, world: World): boolean {
  const { segs } = world
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k]
    const props = BRUSHES[s.brush]
    if (!props.collides) continue

    if (props.kill) {
      for (let i = 0; i < N_POINTS; i++) {
        if (touches(s, rig.px[i], rig.py[i], rig.x[i], rig.y[i], CONTACT_R)) return true
      }
      continue
    }

    if (touches(s, rig.px[HEAD], rig.py[HEAD], rig.x[HEAD], rig.y[HEAD], HEAD_CRASH_R)) {
      return true
    }
  }
  return false
}

/**
 * Mark which points are underwater.
 *
 * A water line is a surface, not a solid: it defines the half-plane below
 * itself across its own x-span. The first water line covering a point wins —
 * overlapping pools do not stack, or two lazy strokes would launch the rig.
 */
export function markWet(rig: Rig, world: World): void {
  const { segs } = world
  for (let i = 0; i < N_POINTS; i++) {
    rig.wet[i] = 0
    const px = rig.x[i]
    const py = rig.y[i]
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k]
      if (s.brush !== Brush.Water) continue
      const lo = s.ax < s.bx ? s.ax : s.bx
      const hi = s.ax < s.bx ? s.bx : s.ax
      if (px < lo || px > hi) continue
      const span = s.bx - s.ax
      const t = Math.abs(span) < EPS_LEN ? 0 : (px - s.ax) / span
      const surfaceY = s.ay + (s.by - s.ay) * t
      if (py > surfaceY) {
        rig.wet[i] = 1
        break
      }
    }
  }
}

/** Buoyancy for submerged points. Drag is applied in the integrator. */
export function applyWater(rig: Rig): void {
  for (let i = 0; i < N_POINTS; i++) {
    if (rig.wet[i]) rig.fy[i] -= BUOYANCY
  }
}

export { WATER_DRAG }
