/**
 * Every tunable in the simulation, in one file.
 *
 * Units are per *tick*, never per second. One tick is one fixed step and the
 * simulation runs 60 of them per simulated second, so there is no `dt` term
 * anywhere in the integrator — it is folded into these numbers. Nothing here
 * may ever be multiplied by a frame delta; see `step.ts` for why that matters
 * more here than in an ordinary game loop.
 *
 * Phase 1 of the build is tuning this file and nothing else.
 */

/** Downward acceleration, px/tick². ≈200 px of fall in the first second. */
export const GRAVITY = 0.12

/** Per-tick velocity retention in air. */
export const AIR = 0.999

/** Constraint relaxation passes per tick. */
export const ITERATIONS = 6

/** Never advance more than this many ticks in one animation frame. */
export const MAX_TICKS_PER_FRAME = 5

/** Guard against dividing by a degenerate length. */
export const EPS_LEN = 1e-9

/**
 * Contact radius of a rig point against a line, px.
 *
 * Not as thin as it looks like it could be. The swept test catches anything
 * that *moves* through a line, but the constraint solve and the posture rule
 * both reposition points without any motion to sweep — and a point nudged to
 * the far side by more than this radius is then invisible to both tests, so it
 * sits inside the ground and keeps sinking. The band has to be thicker than
 * any correction those two can apply in one tick.
 */
export const CONTACT_R = 2.0

/**
 * A run ends when the head comes this close to anything solid, px. Held
 * separately from CONTACT_R rather than derived from it: this one is a
 * gameplay tolerance, that one is a numerical safety margin, and tuning either
 * for its own reasons should not silently move the other.
 */
export const HEAD_CRASH_R = 2.0

/** Ticks of immunity after a portal transport, so a facing pair can't trap the rig. */
export const PORTAL_COOLDOWN = 3

/**
 * Upward acceleration while submerged, px/tick². Half of GRAVITY, so he sinks
 * at half weight — visibly underwater without bobbing on the surface like a
 * cork, which is what a value close to GRAVITY produces.
 */
export const BUOYANCY = 0.06

/**
 * Per-tick velocity loss while submerged. Water is a penalty you can survive,
 * not a wall: 0.012 leaves ~50% of speed after a second under, where the 0.08
 * this started at left 0.7% and turned any pool into a full stop.
 */
export const WATER_DRAG = 0.012

/** Gravity wells: distance beyond which a well is ignored, px. */
export const WELL_CUTOFF_R = 400
export const WELL_CUTOFF_R2 = WELL_CUTOFF_R * WELL_CUTOFF_R

/** Gravity wells: closest approach used in the inverse-square term, px. */
export const WELL_MIN_R = 24

/** Wind arrows: radius of the capsule around the drawn segment, px. */
export const WIND_R = 60

/** Vortices: closest approach used in the tangential term, px. */
export const VORTEX_MIN_R = 16

/** A run ends when the rig leaves the level's bounding box by this much, px. */
export const GONE_MARGIN = 2000

/** Hard stop so a level that traps the rig in a loop still terminates. */
export const MAX_RUN_TICKS = 60 * 60 * 5
