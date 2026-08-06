/**
 * The two shapes a level takes.
 *
 * `Level` is the stored form: every coordinate is an integer in half-pixel
 * units, because a float that survives a serialise/parse round-trip is a float
 * that can drift, and a drifting level is a shared link that works for its
 * author and silently fails for everyone else. `compile()` turns it into a
 * `World` by multiplying by 0.5 — exact in binary floating point — and
 * precomputing the things the tick loop would otherwise recompute 60 times a
 * second.
 */

/**
 * Brush ids. The index *is* the wire format, so these never get reordered.
 *
 * A const object rather than an enum: `isolatedModules` forbids `const enum`,
 * and Node's strip-only type stripping rejects enums outright — which would
 * put the determinism gate out of reach of the very module it has to check.
 */
export const Brush = {
  Ink: 0,
  Ice: 1,
  Tar: 2,
  Boost: 3,
  Kill: 4,
  Water: 5,
  Scenery: 6,
} as const
export type Brush = (typeof Brush)[keyof typeof Brush]

export type BrushProps = {
  /** Does a rig point collide with it at all? */
  collides: boolean
  /** Fraction of tangential velocity removed per contact. */
  friction: number
  /** Tangential impulse added per contact, px/tick, along the segment as drawn. */
  boost: number
  /** Contact by any point ends the run. */
  kill: boolean
}

/**
 * One row per brush. Seven mechanics out of one table — which is the whole
 * reason the brush set is worth having.
 *
 * Friction is a fraction of tangential velocity removed *per tick of contact*,
 * not per contact event, so the intuitive-looking numbers are all far too
 * large: a sled resting on a line is in contact sixty times a second, and
 * friction 0.30 leaves 0.7^60 ≈ 0.000001 of its speed after one second. These
 * are derived from per-second targets instead — ink keeps ~80% of speed over a
 * second of contact, tar keeps ~10%.
 *
 * Boost is likewise an impulse per tick of contact. At 0.08, a 100 px pad
 * crossed at 3 px/tick is about 33 ticks of contact and adds ~2.6 px/tick —
 * a real kick against a ride that cruises at 2–5.
 */
export const BRUSHES: readonly BrushProps[] = [
  { collides: true, friction: 0.004, boost: 0, kill: false }, // Ink   — keeps ~79%/s
  { collides: true, friction: 0.0, boost: 0, kill: false }, // Ice   — keeps everything
  { collides: true, friction: 0.038, boost: 0, kill: false }, // Tar   — keeps ~10%/s
  { collides: true, friction: 0.003, boost: 0.08, kill: false }, // Boost — keeps ~84%/s
  { collides: true, friction: 0.004, boost: 0, kill: true }, // Kill
  { collides: false, friction: 0, boost: 0, kill: false }, // Water — a surface, not a solid
  { collides: false, friction: 0, boost: 0, kill: false }, // Scenery — drawing only
]

/** Wind stamp kinds. */
export const WindKind = { Arrow: 0, Vortex: 1 } as const
export type WindKind = (typeof WindKind)[keyof typeof WindKind]

/** The stored level. All numbers are integers in half-pixel units. */
export type Level = {
  v: 1
  /** Rider part indices: body, face, hat, beard. */
  r: [number, number, number, number]
  /** Start flag. */
  s: [number, number]
  /** Lines: [brush, x1, y1, x2, y2]. Order is load-bearing — see collide.ts. */
  l: Array<[number, number, number, number, number]>
  /** Portal pairs: [ax, ay, bx, by, cx, cy, dx, dy]. */
  p: Array<[number, number, number, number, number, number, number, number]>
  /** Gravity wells: [x, y, strength]. Strength is px³/tick², already integral. */
  g: Array<[number, number, number]>
  /** Wind: [x1, y1, x2, y2, strength, kind]. Strength is integer thousandths. */
  w: Array<[number, number, number, number, number, number]>
}

export type Seg = {
  brush: Brush
  ax: number
  ay: number
  bx: number
  by: number
}

/**
 * A portal pair with its rotation precomputed as a unit complex number.
 *
 * `qc`/`qs` are the cosine and sine of the angle between the two segments —
 * but they are never *computed* with a trig function. They come out of
 * normalising both direction vectors and multiplying one by the conjugate of
 * the other, which needs nothing but arithmetic and `sqrt`. See §3.2 of the
 * spec: the transcendentals are not bit-identical across JS engines, so a
 * portal built with `atan2` is a track that works in Chrome and breaks in
 * Safari, six months after anyone would think to look.
 */
export type Portal = {
  ax: number
  ay: number
  bx: number
  by: number
  cx: number
  cy: number
  dx: number
  dy: number
  qc: number
  qs: number
}

export type Well = { x: number; y: number; strength: number }

export type Wind = {
  ax: number
  ay: number
  bx: number
  by: number
  /** Unit direction, precomputed. For a vortex this is the radius to the rim. */
  ux: number
  uy: number
  /** Vortex radius, px. Unused for arrows. */
  radius: number
  strength: number
  kind: WindKind
}

export type World = {
  segs: Seg[]
  portals: Portal[]
  wells: Well[]
  winds: Wind[]
  start: { x: number; y: number }
  /** Level bounds plus GONE_MARGIN, for the off-track test. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}
