/**
 * The rider: five points, five distance constraints, and one posture rule.
 *
 * The first three constraints form a rigid triangle — that is the sled.
 * `seat–hand` is floppy on purpose and carries no weight in the simulation.
 * Which side of the sled the rider sits on is *not* a distance constraint and
 * cannot be one; see `applyPosture` below for why that matters more than it
 * sounds.
 *
 * Only the head crashes. "He wipes out when his head hits the ground" is
 * legible to anyone watching and it is the most forgiving thing to tune; a
 * second crash point on the seat is a knob to reach for later, not now.
 */
import { EPS_LEN } from './consts.ts'
import type { World } from './types.ts'

export const NOSE = 0
export const TAIL = 1
export const SEAT = 2
export const HEAD = 3
export const HAND = 4
export const N_POINTS = 5

/** Points that collide with solid surfaces — the sled's two runners. */
export const RIDE_POINTS = [NOSE, TAIL] as const

/** Rest layout, rider facing +x, origin at the sled nose. */
const REST: ReadonlyArray<readonly [number, number]> = [
  [0, 0], // nose
  [-20, 0], // tail
  [-10, -11], // seat
  [-10, -27], // head
  [2, -18], // hand
]

type Constraint = { a: number; b: number; rest: number; k: number }

/**
 * Solved in this order, ITERATIONS times per tick. The order is part of the
 * result — Gauss-Seidel relaxation is not commutative — so it is fixed here
 * and never derived from anything that could vary.
 */
export const CONSTRAINTS: readonly Constraint[] = [
  { a: NOSE, b: TAIL, rest: 20.0, k: 1.0 },
  { a: NOSE, b: SEAT, rest: 14.866, k: 1.0 },
  { a: TAIL, b: SEAT, rest: 14.866, k: 1.0 },
  { a: SEAT, b: HEAD, rest: 16.0, k: 0.92 },
  // The head needs a second anchor or it collapses. Held only by seat–head it
  // is free anywhere on a 16 px circle about the seat, and on touchdown its
  // downward momentum swings it straight through the sled and into the ground
  // — measured: head 15 px below the surface five ticks after landing, every
  // time. This and `applyPosture` are complementary, not redundant: the
  // distance stops it sinking, the posture stops it mirroring.
  { a: NOSE, b: HEAD, rest: 28.792, k: 0.6 },
  { a: SEAT, b: HAND, rest: 13.892, k: 0.5 },
]

/**
 * Posture: which *side* of the sled the rider sits on.
 *
 * Distance constraints cannot express this, and that is not a detail — a point
 * held by two distance constraints in 2D has two solutions, mirrored across the
 * line through its anchors, and both satisfy the constraints exactly. So the
 * head pops through to the underside on the first hard landing and the rider
 * spends the rest of the run flopping between upright and inverted. Measured on
 * the portal ramp before this existed: flipped at tick 58, then oscillating for
 * the whole descent.
 *
 * The fix is a constraint that knows about orientation. The sled's own frame
 * gives one: midpoint of nose/tail for the origin, nose−tail for the long axis,
 * its perpendicular for up. The head has a rest position in that frame, and it
 * is pulled toward it — softly, so he still leans into a dip and rights himself
 * afterwards, which the old posture spring was there to do.
 *
 * A hard mirror runs first as a backstop: if the head has ended up on the wrong
 * side despite the pull, reflect it (and its previous position, so the velocity
 * comes with it rather than fighting the correction).
 */
const POSTURE_K = 0.12
/** Head offset in the sled's frame: along the sled, then along its up-normal. */
const HEAD_ALONG = 0
const HEAD_UP = -27
/** The seat rides in the same frame, and can invert the same way. */
const SEAT_UP = -11

export type Rig = {
  x: Float64Array
  y: Float64Array
  /** Previous position. Velocity is implicit in (x - px). */
  px: Float64Array
  py: Float64Array
  /** Force accumulated this tick, zeroed at the top of every step. */
  fx: Float64Array
  fy: Float64Array
  /** Per-point submersion, recomputed each tick. */
  wet: Uint8Array
  portalCooldown: number
  crashed: boolean
  gone: boolean
  ticks: number
}

export function makeRig(): Rig {
  return {
    x: new Float64Array(N_POINTS),
    y: new Float64Array(N_POINTS),
    px: new Float64Array(N_POINTS),
    py: new Float64Array(N_POINTS),
    fx: new Float64Array(N_POINTS),
    fy: new Float64Array(N_POINTS),
    wet: new Uint8Array(N_POINTS),
    portalCooldown: 0,
    crashed: false,
    gone: false,
    ticks: 0,
  }
}

/**
 * Place the rig at the start flag, at rest, lying along the track.
 *
 * The alignment is not cosmetic. Dropped in flat onto a 19° slope the downhill
 * runner touches first, stops dead against zero restitution, and the tail
 * rotates straight over it — a nose-plant, every time, before the rider has
 * done anything. Laying him along the tangent of the line under the flag is
 * both what a player means by putting the start there and the difference
 * between a run and an immediate wipeout.
 *
 * Position and previous position are set to the same value, so he starts with
 * exactly zero velocity — which is what makes a run reproducible from the
 * level alone.
 */
export function spawn(rig: Rig, world: World): void {
  const startX = world.start.x
  const startY = world.start.y
  const ux = world.startDir.x
  const uy = world.startDir.y
  for (let i = 0; i < N_POINTS; i++) {
    const rx = REST[i][0]
    const ry = REST[i][1]
    const x = startX + rx * ux - ry * uy
    const y = startY + rx * uy + ry * ux
    rig.x[i] = x
    rig.y[i] = y
    rig.px[i] = x
    rig.py[i] = y
    rig.fx[i] = 0
    rig.fy[i] = 0
    rig.wet[i] = 0
  }
  rig.portalCooldown = 0
  rig.crashed = false
  rig.gone = false
  rig.ticks = 0
}

/** Mirror one point back across the sled's long axis, velocity and all. */
function mirror(
  rig: Rig,
  i: number,
  mx: number,
  my: number,
  perpX: number,
  perpY: number,
): void {
  const hx = rig.x[i] - mx
  const hy = rig.y[i] - my
  const c = hx * perpX + hy * perpY
  rig.x[i] = mx + hx - 2 * c * perpX
  rig.y[i] = my + hy - 2 * c * perpY

  const gx = rig.px[i] - mx
  const gy = rig.py[i] - my
  const d = gx * perpX + gy * perpY
  rig.px[i] = mx + gx - 2 * d * perpX
  rig.py[i] = my + gy - 2 * d * perpY
}

/**
 * Hold the rider on the correct side of his sled. Runs after the distance
 * constraints, which have no opinion about it. See CONSTRAINTS above.
 */
export function applyPosture(rig: Rig): void {
  const { x, y } = rig
  const dx = x[NOSE] - x[TAIL]
  const dy = y[NOSE] - y[TAIL]
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < EPS_LEN) return

  const ux = dx / len
  const uy = dy / len
  // Perpendicular. At rest the sled points along +x and this is +y (screen
  // down), which is why the rest offsets above are negative.
  const perpX = -uy
  const perpY = ux
  const mx = (x[NOSE] + x[TAIL]) * 0.5
  const my = (y[NOSE] + y[TAIL]) * 0.5

  // Backstop: anything that has crossed to the wrong side comes back.
  const seatC = (x[SEAT] - mx) * perpX + (y[SEAT] - my) * perpY
  if (seatC * SEAT_UP < 0) mirror(rig, SEAT, mx, my, perpX, perpY)
  const headC = (x[HEAD] - mx) * perpX + (y[HEAD] - my) * perpY
  if (headC * HEAD_UP < 0) mirror(rig, HEAD, mx, my, perpX, perpY)

  // Soft pull toward where the head sits in the sled's own frame.
  const tx = mx + ux * HEAD_ALONG + perpX * HEAD_UP
  const ty = my + uy * HEAD_ALONG + perpY * HEAD_UP
  x[HEAD] += (tx - x[HEAD]) * POSTURE_K
  y[HEAD] += (ty - y[HEAD]) * POSTURE_K
}

/** Symmetric relaxation — mass is uniform, so both points move equally. */
export function solveConstraints(rig: Rig, iterations: number): void {
  const { x, y } = rig
  for (let it = 0; it < iterations; it++) {
    for (let c = 0; c < CONSTRAINTS.length; c++) {
      const { a, b, rest, k } = CONSTRAINTS[c]
      const dx = x[b] - x[a]
      const dy = y[b] - y[a]
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < EPS_LEN) continue
      const diff = ((len - rest) / len) * 0.5 * k
      x[a] += dx * diff
      y[a] += dy * diff
      x[b] -= dx * diff
      y[b] -= dy * diff
    }
  }
}
