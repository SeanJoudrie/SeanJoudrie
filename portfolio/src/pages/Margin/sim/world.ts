/**
 * Level (stored, integer half-pixels) → World (simulated, float pixels).
 *
 * Two jobs. It multiplies every coordinate by 0.5, which is exact in binary
 * floating point so a serialise/parse round-trip cannot move a track by even
 * one ULP. And it precomputes the values the tick loop would otherwise redo
 * sixty times a second — most importantly each portal's rotation, built from
 * normalised direction vectors rather than from an angle, because `atan2` and
 * friends are not required to give the same answer in every browser.
 */
import { EPS_LEN } from './consts.ts'
import type { Brush, Level, Portal, Seg, Well, Wind, World } from './types.ts'
import { BRUSHES, WindKind } from './types.ts'

/** Stored units are half-pixels; 0.5 is exact, so this never introduces drift. */
const U = 0.5

/**
 * Levels arrive from a URL anyone can edit, so an id from the wire is a
 * suggestion, not a fact. An out-of-range brush would index past `BRUSHES` and
 * hand the collision loop `undefined`; unknown ids fall back to plain ink.
 */
function safeBrush(b: number): Brush {
  return (Number.isInteger(b) && b >= 0 && b < BRUSHES.length ? b : 0) as Brush
}

export function compile(level: Level): World {
  const segs: Seg[] = level.l.map(([brush, x1, y1, x2, y2]) => ({
    brush: safeBrush(brush),
    ax: x1 * U,
    ay: y1 * U,
    bx: x2 * U,
    by: y2 * U,
  }))

  const portals: Portal[] = level.p.map(([ax, ay, bx, by, cx, cy, dx, dy]) => {
    const A = { ax: ax * U, ay: ay * U, bx: bx * U, by: by * U }
    const B = { cx: cx * U, cy: cy * U, dx: dx * U, dy: dy * U }

    // Unit direction of each portal segment.
    let uax = A.bx - A.ax
    let uay = A.by - A.ay
    const la = Math.sqrt(uax * uax + uay * uay)
    if (la > EPS_LEN) {
      uax /= la
      uay /= la
    }
    let ubx = B.dx - B.cx
    let uby = B.dy - B.cy
    const lb = Math.sqrt(ubx * ubx + uby * uby)
    if (lb > EPS_LEN) {
      ubx /= lb
      uby /= lb
    }

    // q = uB · conj(uA) — the rotation carrying A's frame onto B's. Arithmetic
    // and sqrt only, so it is bit-identical everywhere.
    const qc = ubx * uax + uby * uay
    const qs = uby * uax - ubx * uay

    return { ...A, ...B, qc, qs }
  })

  const wells: Well[] = level.g.map(([x, y, strength]) => ({
    x: x * U,
    y: y * U,
    strength,
  }))

  const winds: Wind[] = level.w.map(([x1, y1, x2, y2, strength, kind]) => {
    const ax = x1 * U
    const ay = y1 * U
    const bx = x2 * U
    const by = y2 * U
    let ux = bx - ax
    let uy = by - ay
    const len = Math.sqrt(ux * ux + uy * uy)
    if (len > EPS_LEN) {
      ux /= len
      uy /= len
    }
    // Wind accelerations are small — 0.02 px/tick² against gravity's 0.12 —
    // so they are stored as integer thousandths. Everything in a level file is
    // an integer, without exception: a float in the wire format is a float
    // that can round differently on the way back in.
    return {
      ax,
      ay,
      bx,
      by,
      ux,
      uy,
      radius: len,
      strength: strength / 1000,
      kind: kind === WindKind.Vortex ? WindKind.Vortex : WindKind.Arrow,
    }
  })

  const start = { x: level.s[0] * U, y: level.s[1] * U }

  // Bounds over everything placed, so the off-track test has something to
  // measure against even on a level made of one line.
  let minX = start.x
  let minY = start.y
  let maxX = start.x
  let maxY = start.y
  const fold = (x: number, y: number) => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  for (const s of segs) {
    fold(s.ax, s.ay)
    fold(s.bx, s.by)
  }
  for (const p of portals) {
    fold(p.ax, p.ay)
    fold(p.bx, p.by)
    fold(p.cx, p.cy)
    fold(p.dx, p.dy)
  }
  for (const w of wells) fold(w.x, w.y)
  for (const w of winds) {
    fold(w.ax, w.ay)
    fold(w.bx, w.by)
  }

  return { segs, portals, wells, winds, start, bounds: { minX, minY, maxX, maxY } }
}

export function emptyLevel(): Level {
  return { v: 1, r: [0, 0, 0, 0], s: [0, 0], l: [], p: [], g: [], w: [] }
}
