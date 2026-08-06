/**
 * The rider: five points and six distance constraints.
 *
 * The first three constraints form a rigid triangle — that is the sled.
 * `nose–head` is a soft posture spring, and it is the reason he leans into a
 * dip and rights himself coming out of one rather than staying welded upright.
 * `seat–hand` is floppy on purpose and carries no weight in the simulation.
 *
 * Only the head crashes. "He wipes out when his head hits the ground" is
 * legible to anyone watching and it is the most forgiving thing to tune; a
 * second crash point on the seat is a knob to reach for later, not now.
 */
import { EPS_LEN } from './consts.ts'

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
  { a: NOSE, b: HEAD, rest: 28.792, k: 0.35 },
  { a: SEAT, b: HAND, rest: 13.892, k: 0.5 },
]

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
 * Place the rig at the start flag, at rest. Both position and previous
 * position are set to the same value, so he starts with exactly zero velocity
 * — which is what makes a run reproducible from the level alone.
 */
export function spawn(rig: Rig, startX: number, startY: number): void {
  for (let i = 0; i < N_POINTS; i++) {
    const x = startX + REST[i][0]
    const y = startY + REST[i][1]
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
