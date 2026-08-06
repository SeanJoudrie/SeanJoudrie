/**
 * The simulation's public surface.
 *
 * Nothing under `sim/` may import from anywhere outside it. No DOM, no React,
 * no canvas, and in particular nothing from `render/` — the decoration PRNG
 * lives over there and a single accidental import of it into a physics path
 * would make runs unreproducible in a way no one would notice for months.
 * `check-determinism.mjs` asserts the boundary holds.
 */
export * from './consts.ts'
export * from './types.ts'
export { HAND, HEAD, NOSE, N_POINTS, RIDE_POINTS, SEAT, TAIL, makeRig, spawn, type Rig } from './rig.ts'
export { compile, emptyLevel } from './world.ts'
export { run, step, ticksFor, TICK_MS } from './step.ts'
