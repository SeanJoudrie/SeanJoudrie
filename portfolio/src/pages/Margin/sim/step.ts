/**
 * One tick.
 *
 * There is no `dt` argument, and that is the point. Every constant in
 * `consts.ts` is already expressed per tick, so the integrator cannot be
 * accidentally coupled to frame rate — which is the most common way a physics
 * toy stops being reproducible. The caller accumulates real elapsed time and
 * asks for whole ticks (`ticksFor`), capped so a backgrounded tab cannot
 * return and run a thousand of them at once.
 */
import { AIR, GONE_MARGIN, GRAVITY, ITERATIONS, MAX_RUN_TICKS, MAX_TICKS_PER_FRAME } from './consts.ts'
import { applyWater, collide, crashed, markWet, WATER_DRAG } from './collide.ts'
import { applyPosture, N_POINTS, solveConstraints, type Rig } from './rig.ts'
import { applyPortals, applyWells, applyWinds } from './stamps.ts'
import type { World } from './types.ts'

/** Milliseconds of wall clock per simulated tick. */
export const TICK_MS = 1000 / 60

export function step(rig: Rig, world: World): void {
  if (rig.crashed || rig.gone) return

  for (let i = 0; i < N_POINTS; i++) {
    rig.fx[i] = 0
    rig.fy[i] = 0
  }

  markWet(rig, world)
  applyWells(rig, world)
  applyWinds(rig, world)
  applyWater(rig)

  // Position Verlet. Velocity is implicit in (x - px), so damping it means
  // scaling that difference rather than tracking a separate vector.
  for (let i = 0; i < N_POINTS; i++) {
    const damp = rig.wet[i] ? AIR * (1 - WATER_DRAG) : AIR
    const vx = (rig.x[i] - rig.px[i]) * damp
    const vy = (rig.y[i] - rig.py[i]) * damp
    rig.px[i] = rig.x[i]
    rig.py[i] = rig.y[i]
    rig.x[i] += vx + rig.fx[i]
    rig.y[i] += vy + rig.fy[i] + GRAVITY
  }

  solveConstraints(rig, ITERATIONS)
  applyPosture(rig)

  if (collide(rig, world)) {
    rig.crashed = true
    return
  }

  applyPortals(rig, world)

  if (crashed(rig, world)) {
    rig.crashed = true
    return
  }

  const b = world.bounds
  const hx = rig.x[0]
  const hy = rig.y[0]
  if (
    hx < b.minX - GONE_MARGIN ||
    hx > b.maxX + GONE_MARGIN ||
    hy < b.minY - GONE_MARGIN ||
    hy > b.maxY + GONE_MARGIN
  ) {
    rig.gone = true
    return
  }

  rig.ticks++
  if (rig.ticks >= MAX_RUN_TICKS) rig.gone = true
}

/**
 * How many whole ticks are owed for `elapsedMs`, capped. Returns the tick
 * count and the leftover milliseconds to carry into the next frame — the
 * caller must keep the remainder, or the simulation slowly runs slow.
 */
export function ticksFor(accumulatorMs: number): { ticks: number; remainder: number } {
  let ticks = Math.floor(accumulatorMs / TICK_MS)
  let remainder = accumulatorMs - ticks * TICK_MS
  if (ticks > MAX_TICKS_PER_FRAME) {
    ticks = MAX_TICKS_PER_FRAME
    remainder = 0
  }
  return { ticks, remainder }
}

/** Run a fixed number of ticks. Used by the determinism gate and by tests. */
export function run(rig: Rig, world: World, ticks: number): void {
  for (let t = 0; t < ticks; t++) step(rig, world)
}
