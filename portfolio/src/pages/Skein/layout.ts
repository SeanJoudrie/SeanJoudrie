import { mulberry32 } from '../../lib/rand'
import type { Entity, Rel } from './schema'

/* The hand-rolled force layout. Pure physics, no React, no library: Coulomb
   repulsion between every node pair (O(n²), fine at n≈50), Hooke springs along
   deduped edges (rest length grows with endpoint degree so hubs breathe),
   gentle centering, damped Euler integration with a velocity clamp, and alpha
   annealing — alpha decays each tick and is reheated on interaction (drag,
   filter, resize), so the graph settles when idle and re-relaxes when the
   analyst touches it. Dragged nodes are pinned. */

export interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
  degree: number
}

/* Tuned for n≈50 / m≈132 in the WORLD box below. Do not retune by eye —
   these produce a legible, non-jittery settle in ~120 frames. */
const REPULSION = 5400   // Coulomb constant
const SPRING = 0.05      // Hooke stiffness
const REST = 82          // base edge rest length (px)
const CENTER = 0.014     // pull toward the world centroid
const DAMP = 0.85        // velocity retained per tick
const MAX_V = 24         // per-tick velocity clamp (px)
const MIN_D2 = 100       // (10px)² floor to avoid the 1/d² singularity
const ALPHA_MIN = 0.02
const ALPHA_DECAY = 0.985
const ALPHA_HOT = 0.7

/** The layout's private world coordinate box (Graph maps it into the SVG). */
export const WORLD = { w: 960, h: 660 }

export class LayoutEngine {
  nodes: Node[] = []
  index = new Map<string, number>()
  private springs: { a: number; b: number; rest: number }[] = []
  alpha = ALPHA_HOT

  constructor(entities: Entity[], rels: Rel[], seed = 20_240_117) {
    const rnd = mulberry32(seed)
    const deg = new Map<string, number>()
    for (const r of rels) {
      deg.set(r.source, (deg.get(r.source) ?? 0) + 1)
      deg.set(r.target, (deg.get(r.target) ?? 0) + 1)
    }
    // Seed positions on a phyllotaxis spiral so the first frame is not a blob
    // and the settle is deterministic across devices.
    entities.forEach((e, i) => {
      const ang = i * 2.399963229 // golden angle (rad)
      const rad = 20 * Math.sqrt(i) + rnd() * 10
      this.index.set(e.id, i)
      this.nodes.push({
        id: e.id,
        x: WORLD.w / 2 + Math.cos(ang) * rad,
        y: WORLD.h / 2 + Math.sin(ang) * rad,
        vx: 0, vy: 0, pinned: false, degree: deg.get(e.id) ?? 0,
      })
    })
    // One spring per unique pair (parallel edges share a spring).
    const seen = new Set<string>()
    for (const r of rels) {
      const a = this.index.get(r.source)
      const b = this.index.get(r.target)
      if (a == null || b == null || a === b) continue
      const key = a < b ? `${a}:${b}` : `${b}:${a}`
      if (seen.has(key)) continue
      seen.add(key)
      const rest = REST + Math.min(64, (this.nodes[a].degree + this.nodes[b].degree) * 3)
      this.springs.push({ a, b, rest })
    }
  }

  node(id: string): Node | undefined {
    const i = this.index.get(id)
    return i == null ? undefined : this.nodes[i]
  }

  /** Wake the simulation (call on drag / filter / resize). */
  reheat(a = ALPHA_HOT): void {
    this.alpha = Math.max(this.alpha, a)
  }

  hot(): boolean {
    return this.alpha > ALPHA_MIN
  }

  pin(id: string, x: number, y: number): void {
    const n = this.node(id)
    if (n) { n.pinned = true; n.x = x; n.y = y; n.vx = 0; n.vy = 0 }
  }
  moveTo(id: string, x: number, y: number): void {
    const n = this.node(id)
    if (n) { n.x = x; n.y = y }
  }
  unpin(id: string): void {
    const n = this.node(id)
    if (n) n.pinned = false
  }

  /** Advance one frame. Returns true while still hot (Graph keeps the loop). */
  step(): boolean {
    const a = this.alpha
    const N = this.nodes.length
    const ns = this.nodes

    // repulsion — every unordered pair
    for (let i = 0; i < N; i++) {
      const ni = ns[i]
      for (let j = i + 1; j < N; j++) {
        const nj = ns[j]
        let dx = nj.x - ni.x
        let dy = nj.y - ni.y
        let d2 = dx * dx + dy * dy
        if (d2 < MIN_D2) { dx = dx || 0.5; dy = dy || 0.5; d2 = MIN_D2 }
        const d = Math.sqrt(d2)
        const f = (REPULSION / d2) * a
        const fx = (dx / d) * f
        const fy = (dy / d) * f
        ni.vx -= fx; ni.vy -= fy
        nj.vx += fx; nj.vy += fy
      }
    }

    // spring attraction along edges
    for (const s of this.springs) {
      const na = ns[s.a]
      const nb = ns[s.b]
      const dx = nb.x - na.x
      const dy = nb.y - na.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const f = SPRING * (d - s.rest) * a
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      na.vx += fx; na.vy += fy
      nb.vx -= fx; nb.vy -= fy
    }

    // centering + integrate (pinned nodes are held by the pointer)
    const cx = WORLD.w / 2
    const cy = WORLD.h / 2
    for (const n of ns) {
      if (n.pinned) { n.vx = 0; n.vy = 0; continue }
      n.vx += (cx - n.x) * CENTER * a
      n.vy += (cy - n.y) * CENTER * a
      n.vx *= DAMP
      n.vy *= DAMP
      if (n.vx > MAX_V) n.vx = MAX_V; else if (n.vx < -MAX_V) n.vx = -MAX_V
      if (n.vy > MAX_V) n.vy = MAX_V; else if (n.vy < -MAX_V) n.vy = -MAX_V
      n.x += n.vx
      n.y += n.vy
    }

    this.alpha *= ALPHA_DECAY
    return this.hot()
  }

  /** Run a batch of ticks synchronously (used for the reduced-motion pre-settle). */
  settle(iterations = 260): void {
    this.alpha = ALPHA_HOT
    for (let i = 0; i < iterations; i++) this.step()
    this.alpha = 0
  }
}
