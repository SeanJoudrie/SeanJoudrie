# Roster 06 — Margin: a doodled sled you draw the track for

> Build spec. This document is exhaustive on purpose. Every decision here is
> made. Where a formula, a constant, a hex, or a phase order is given, it is
> load-bearing — do not "improve" it. Read the whole document once, then build
> in the phase order of §14.
>
> Scope of **this** spec: the simulation core, the seven brushes, the three
> stamps, the rider system, and the level format. Everything in §16 is
> deliberately out of scope and must not be built yet — but the level format in
> §12 and the determinism law in §3 exist *now* because neither can be
> retrofitted.

---

## 0 · Identity

| Field | Value |
| --- | --- |
| Product name | **Margin** |
| Tagline | *doodle a hill, watch him ride it* |
| Demo slug | `margin` (route `#/demos/margin`) |
| Token prefix | `margin` (`--color-margin-*`, `.margin-root`, `body.margin-page`) |
| Range commission | **Commission `14`**, skill **"Deterministic physics & authoring tools"** |
| Page dir | `portfolio/src/pages/Margin/` |
| Smoke | `portfolio/scripts/smoke-margin.mjs` |
| Verify | `portfolio/scripts/check-determinism.mjs` |
| On-screen claim | **"Draw a line. He rides it."** |
| Footer claim | **"Fixed-step Verlet, bit-identical on every device · no physics library"** |

**Why "Margin":** doodles live in the margins of notebooks, which is exactly the
register the whole thing is set in. It is one word, the builder types it
hundreds of times, it is not a real product, and it is not taken by any existing
commission. *This is the one decision in this document worth overruling if you
dislike it — but rename before phase 1, not after.*

**What it is:** a Line Rider–like. The visitor draws a track on ruled notebook
paper with a small set of pens and highlighters, places a few stamps, and presses
play. A hand-drawn rider on a sled runs the track under deterministic physics.
The run is a pure function of the drawing, so a level is a short string, a share
link needs no backend, and the replay *is* the level.

**Non-goals, explicitly:** no player control during a run (see §1), no accounts,
no server, no database, no public submission queue, no sound (v1).

---

## 1 · Locked decisions (do not revisit)

1. **The run is deterministic.** No keyboard or touch input steers the rider. The
   entire craft is in the drawing. This was chosen over a driving game
   deliberately: it makes the level string a complete replay, kills the need for
   input recording, and means a shared link reproduces exactly on any device.
2. **No physics library.** Hand-rolled Verlet, in the house style of Palisade (no
   grid library) and Skein (no graph library).
3. **Colour means behaviour.** A plain ink line is geometry and nothing else.
   Every coloured line does something. A visitor must be able to read what a
   level does without a legend.
4. **The palette is a middle-school pencil case** — ballpoint, red pen, blue pen,
   and three highlighters. No colour outside §2.2.
5. **Ink and highlighter render differently.** Ink is thin and opaque.
   Highlighter is fat, translucent, and multiply-blended over the paper, so
   behaviour-carrying lines physically look highlighted. This is the single most
   important visual decision in the document.
6. **The rider is data, not code.** v1 ships a placeholder drawn from primitives,
   behind the exact same layered manifest that hand-drawn art will use, so
   dropping in real parts is a content change with **zero** code change (§9).
7. **Physics units are per-tick, not per-second.** See §3.

---

## 2 · Art direction

### 2.1 The page

Ruled notebook paper, aged very slightly. Three layers, back to front:

1. **Paper ground** `--margin-paper`, filled flat.
2. **Grain + creases.** Generated once at load into an offscreen canvas
   (256×256, value noise, tiled) at **3% maximum contrast**, plus two or three
   soft diagonal crease bands at 2%. Never animate it, never regenerate it.
   Subtle to the point of near-invisibility — if you can see it as texture
   rather than feel it as paper, it is too strong.
3. **Rules.** Horizontal ruled lines every 28 px in `--margin-rule`, and one
   vertical margin rule at x = 96 px in `--margin-margin-rule`. The rules live in
   world space and pan with the paper, not the viewport — the level is *on* the
   page.

### 2.2 The pencil case (the entire palette)

| Token | Hex | Instrument | Meaning |
| --- | --- | --- | --- |
| `--margin-paper` | `#F6F2E8` | — | the page |
| `--margin-grain` | `#B9AE94` | — | texture + creases, ≤3% alpha |
| `--margin-rule` | `#C7D2E0` | printed rule | ruled lines |
| `--margin-margin-rule` | `#E0A79E` | printed rule | the vertical margin |
| `--margin-ink` | `#1E2430` | blue-black ballpoint | **solid line**, rider, UI text |
| `--margin-pencil` | `#A9A395` | pencil | **scenery**, parallax trees |
| `--margin-red` | `#C4362E` | red pen | **kill** |
| `--margin-blue` | `#2F62B8` | blue pen | **water** |
| `--margin-yellow` | `#F2C744` | highlighter | **boost** |
| `--margin-cyan` | `#7FD4E8` | highlighter | **ice** |
| `--margin-brown` | `#8A6A3F` | highlighter | **tar** |
| `--margin-green` | `#6FBF73` | highlighter | **portal A** |
| `--margin-pink` | `#E87FA8` | highlighter | **portal B** |

Nothing else. If a new mechanic needs a colour, it does not ship until a pen is
freed up.

### 2.3 Ink vs highlighter rendering

Two stroke functions, and every brush declares which it uses.

**Ink** — `lineWidth 2.4`, `lineCap round`, full alpha, `globalCompositeOperation
'source-over'`. Give it a hand-drawn wobble: when a segment is committed, subdivide
it into ~12 px pieces and offset each interior vertex perpendicular by
`±0.45 px`, sampled from the level-seeded PRNG (§12.4). The wobble is baked at
commit time and stored **only in the render cache, never in the level data** —
physics always uses the straight segment, so wobble can never affect a run.

**Highlighter** — `lineWidth 11`, `lineCap square`, `globalAlpha 0.5`,
`globalCompositeOperation 'multiply'`. Draw the stroke twice with a 0.8 px offset
between passes to build the doubled-edge density a real marker leaves. No wobble
— a highlighter is dragged, not sketched.

Ordering, back to front: paper → rules → parallax → highlighter strokes → ink
strokes → stamps → rider. Highlighter always sits *under* ink so an ink line
crossing a boost reads correctly.

### 2.4 Parallax

Three bands of scribbled conifers in `--margin-pencil`, drawn at 0.30 / 0.16 /
0.08 alpha, translating at **0.25 / 0.45 / 0.70** of camera x. Positions come
from the level-seeded PRNG (§12.4), so they are identical for everyone opening
the same link and cost nothing to store.

They exist for one reason: velocity is unreadable against a blank page. Without
them a fast run and a slow run look the same.

Trees are decoration. They are generated from the level hash, never from
simulation state, and nothing about them may ever feed back into physics.

### 2.5 Themes

Margin commits to a single visual world: it is a piece of paper. It does **not**
invert for dark mode. Set `color-scheme: light` on `.margin-root` and leave it.
This is the deliberate single-theme exception, not an omission — a dark notebook
page is not a thing.

---

## 3 · Units and the determinism law

### 3.1 Units

- 1 world unit = 1 CSS pixel at zoom 1.
- The simulation advances in **ticks**. One tick is one fixed step. 60 ticks per
  simulated second.
- Every constant in this document is expressed **per tick** or **per tick²**.
  There is no `dt` term anywhere in the integrator — it is folded into the
  constants. Never multiply by a frame delta.
- Rendering is decoupled: accumulate real elapsed time, run whole ticks while the
  accumulator exceeds one tick's worth, and cap at **5 ticks per frame** so a
  stalled tab cannot spiral.

### 3.2 The determinism law

A level string must produce a bit-identical run on every device and every
browser, forever. This is not a nice-to-have — it is the feature that makes
sharing work, and it fails silently and late if violated. CI enforces it (§13.2).

1. **Fixed timestep. Always.** No variable-delta integration anywhere.
2. **No `Math.sin`, `cos`, `tan`, `atan2`, `pow`, `exp`, or `log` inside the
   simulation.** IEEE-754 requires correct rounding for `+ - * /` and
   `Math.sqrt`; it requires **nothing** of the transcendentals, and engines do
   differ. A track that works in Chrome will silently break in Safari. Every
   rotation in this spec is therefore built from normalized direction vectors
   and complex multiplication (§8.1) — sqrt and arithmetic only.
3. **No `Math.random` in the simulation.** Decoration uses `mulberry32` seeded
   from the level hash (§12.4) and may never feed back into physics.
4. **No iteration over `Set` or `Map`** in the sim. Fixed-order arrays only.
5. **Collision is resolved in level-array order**, which is stable because level
   data is an ordered array and edits append.
6. **All level coordinates are integers** in half-pixel units (§12.2). Nothing
   is stored as a float, so parsing cannot introduce drift.
7. **Never branch on floating-point equality.** Compare against explicit epsilons
   defined once in `sim/consts.ts`.

---

## 4 · The rig

Five points. Positions given at rest, rider facing +x, origin at the sled nose.

| Point | Rest position | Role |
| --- | --- | --- |
| `nose` | `(0, 0)` | **RIDE** — collides with solid surfaces |
| `tail` | `(-20, 0)` | **RIDE** — collides with solid surfaces |
| `seat` | `(-10, -11)` | structural only, no collision |
| `head` | `(-10, -27)` | **CRASH** — any contact ends the run |
| `hand` | `(2, -18)` | decorative only, no collision |

Only `head` crashes in v1. "He crashes when his head hits the ground" is
intuitive, readable, and the most forgiving thing to tune. A second crash point
on `seat` is a v2 tuning knob, not a launch feature.

### 4.1 Constraints

Verlet distance constraints, solved in this exact order, **6 iterations per
tick**.

| A | B | Rest length | Stiffness |
| --- | --- | --- | --- |
| `nose` | `tail` | 20.000 | 1.00 |
| `nose` | `seat` | 14.866 | 1.00 |
| `tail` | `seat` | 14.866 | 1.00 |
| `seat` | `head` | 16.000 | 0.92 |
| `nose` | `head` | 28.792 | 0.35 |
| `seat` | `hand` | 13.892 | 0.50 |

The first three form a rigid triangle — that is the sled. `nose–head` is a soft
posture constraint that keeps the rider upright without locking him; it is why he
leans in a dip and rights himself after. `seat–hand` is floppy on purpose.

Standard symmetric relaxation, both points moved equally (mass is uniform):

```
d = b.x - a.x, e = b.y - a.y
len = sqrt(d*d + e*e)
if (len < EPS_LEN) continue          // EPS_LEN = 1e-9
diff = (len - rest) / len * 0.5 * stiffness
a.x += d * diff;  a.y += e * diff
b.x -= d * diff;  b.y -= e * diff
```

---

## 5 · Integration

Position Verlet. Velocity is implicit in `(x - px)`.

```
// per tick, per point
vx = (p.x - p.px) * AIR          // AIR = 0.999
vy = (p.y - p.py) * AIR
p.px = p.x
p.py = p.y
p.x += vx + fx                   // fx from stamps this tick (§8), else 0
p.y += vy + fy + GRAVITY         // GRAVITY = 0.12
```

Then: solve constraints ×6, then resolve collisions (§6), then evaluate crash.

| Constant | Value | Note |
| --- | --- | --- |
| `GRAVITY` | `0.12` | px/tick². ≈200 px of fall in the first second. Tune here and nowhere else. |
| `AIR` | `0.999` | per-tick velocity retention |
| `ITERATIONS` | `6` | constraint passes per tick |
| `MAX_TICKS_PER_FRAME` | `5` | stall guard |
| `EPS_LEN` | `1e-9` | degenerate-length guard |
| `CONTACT_R` | `0.5` | point contact radius, px |

---

## 6 · Collision

Point versus line segment, resolved for RIDE points only, against collidable
brushes only, in level-array order.

```
// closest point on segment AB to P
abx = B.x - A.x,  aby = B.y - A.y
apx = P.x - A.x,  apy = P.y - A.y
ab2 = abx*abx + aby*aby
if (ab2 < EPS_LEN) continue
t = (apx*abx + apy*aby) / ab2
t = t < 0 ? 0 : t > 1 ? 1 : t
cx = A.x + abx*t,  cy = A.y + aby*t
dx = P.x - cx,     dy = P.y - cy
d2 = dx*dx + dy*dy
if (d2 >= CONTACT_R * CONTACT_R) continue
d = sqrt(d2)
nx = d > EPS_LEN ? dx/d : -aby / sqrt(ab2)   // degenerate: use segment normal
ny = d > EPS_LEN ? dy/d :  abx / sqrt(ab2)

// 1. push out along the normal
push = CONTACT_R - d
P.x += nx * push
P.y += ny * push

// 2. friction: decompose velocity, kill normal, damp tangential
vx = P.x - P.px,  vy = P.y - P.py
vn = vx*nx + vy*ny
tx = -ny, ty = nx
vt = vx*tx + vy*ty
vn = 0                                  // restitution 0 — a sled does not bounce
vt = vt * (1 - brush.friction) + brush.boost
P.px = P.x - (vn*nx + vt*tx)
P.py = P.y - (vn*ny + vt*ty)
```

Restitution is zero for every brush. A bouncing sled feels wrong and makes tracks
unpredictable to author.

**Crash test**, after collisions: if `head` is within `CONTACT_R * 2` of any
collidable segment, or within any kill segment's contact radius, the run ends.
Freeze the rig, stop ticking, draw a small hand-scribbled "!!" over the head.

---

## 7 · The seven brushes

| # | Brush | Colour | Class | Collides | friction | boost | Notes |
| --- | --- | --- | --- | :-: | --- | --- | --- |
| 1 | **Ink** | `--margin-ink` | ink | ✓ | `0.03` | `0` | the default |
| 2 | **Ice** | `--margin-cyan` | highlighter | ✓ | `0.00` | `0` | frictionless |
| 3 | **Tar** | `--margin-brown` | highlighter | ✓ | `0.30` | `0` | bogs him down |
| 4 | **Boost** | `--margin-yellow` | highlighter | ✓ | `0.02` | `+0.45` | impulse along segment direction |
| 5 | **Kill** | `--margin-red` | ink | ✓ | `0.03` | `0` | contact by **any** point ends the run |
| 6 | **Water** | `--margin-blue` | ink | ✗ | — | — | surface line, see below |
| 7 | **Scenery** | `--margin-pencil` | ink | ✗ | — | — | pure drawing, no physics at all |

**Boost direction** is the segment's own direction, A→B as drawn. Drawing a boost
line right-to-left boosts backwards. This is a feature and the toolbar tooltip
must say so.

**Water** does not collide. It defines a half-plane: for a water segment spanning
`[A.x, B.x]`, a point is submerged when its x lies in that span and its y is
below the segment's y at that x. While any RIDE point is submerged, that point
takes:

```
fy -= BUOYANCY          // BUOYANCY = 0.10 px/tick², upward
vx *= (1 - WATER_DRAG)  // WATER_DRAG = 0.08
vy *= (1 - WATER_DRAG)
```

Buoyancy at 0.10 against gravity at 0.12 means he sinks slowly and drags heavily
— a water section is a speed penalty you can survive, not a wall. If two water
lines overlap in x, the *first in level order* wins; do not sum them.

---

## 8 · The three stamps

### 8.1 Portal pair — the one with real math

A portal is two segments, A and B, drawn as a linked pair (green and pink). When
a RIDE point crosses A, it and the whole rig are transported to B, rotated by the
angle between them, with velocity rotated to match.

**No trigonometry.** Build the rotation from normalized direction vectors and one
complex multiplication:

```
// unit directions of each portal segment
uax = (A.bx - A.ax), uay = (A.by - A.ay)
la = sqrt(uax*uax + uay*uay);  uax /= la;  uay /= la
ubx = (B.bx - B.ax), uby = (B.by - B.ay)
lb = sqrt(ubx*ubx + uby*uby);  ubx /= lb;  uby /= lb

// q = uB * conj(uA)  — the rotation taking A's frame to B's frame
qc = ubx*uax + uby*uay          // cos of the angle between them
qs = uby*uax - ubx*uay          // sin of the same angle
```

Detect the crossing with a segment-vs-segment test on the point's motion segment
`(P.px, P.py) → (P.x, P.y)` against portal A. On a hit, for **every** point in
the rig (never just the crossing point — the rig must stay intact):

```
// express relative to A's start, rotate by q, place relative to B's start
rx = p.x - A.ax,  ry = p.y - A.ay
p.x = B.ax + (rx*qc - ry*qs)
p.y = B.ay + (rx*qs + ry*qc)
// same transform on the previous position preserves velocity exactly
rpx = p.px - A.ax,  rpy = p.py - A.ay
p.px = B.ax + (rpx*qc - rpy*qs)
p.py = B.ay + (rpx*qs + rpy*qc)
```

Transforming `px/py` by the identical rotation is what carries momentum through
correctly — do not recompute velocity by any other route.

**Re-entry guard:** after a teleport, set `portalCooldown = 3` ticks on the rig
and skip all portal tests while it is non-zero. Without it a pair placed
face-to-face traps the rig in an infinite transport loop on consecutive ticks.

Portals are **bidirectional**: crossing B transports to A with the inverse
rotation `(qc, -qs)`.

### 8.2 Gravity well

A point mass. Drawn as a hand-scribbled spiral.

```
dx = W.x - p.x,  dy = W.y - p.y
r2 = dx*dx + dy*dy
if (r2 > CUTOFF_R2) continue              // CUTOFF_R = 400 → CUTOFF_R2 = 160000
r = sqrt(r2)
rc = r < WELL_MIN_R ? WELL_MIN_R : r      // WELL_MIN_R = 24, singularity guard
a = W.strength / (rc * rc)                // default strength = 1200
fx += dx / r * a
fy += dy / r * a
```

At r = 100 the pull equals gravity exactly (1200/10000 = 0.12); at r = 50 it is
four times gravity. That scale makes a well placed a screen-height away a gentle
curve and one placed near the track a slingshot. Applied to **every** point in
the rig, including non-colliding ones, or the rig tears.

Strength is stored per-well and exposed as three toolbar sizes: `600` / `1200` /
`2400`.

### 8.3 Wind

Two forms, one stamp type distinguished by a flag.

**Arrow** — drawn as a segment. Inside a capsule of radius `WIND_R = 60` around
the segment, apply a uniform acceleration along the segment direction at
`strength` (default `0.08`). Reuse the point-vs-segment distance from §6 for the
containment test.

**Vortex** — drawn as a circle. Inside radius `R`, apply acceleration tangential
to the radius vector:

```
r = sqrt(r2)
rc = r < VORTEX_MIN_R ? VORTEX_MIN_R : r   // VORTEX_MIN_R = 16
a = V.strength * (1 - rc / V.radius)       // linear falloff to zero at the rim
fx += (-dy / rc) * a
fy += ( dx / rc) * a
```

Both are static fields. Nothing here simulates a fluid — that would be
non-deterministic and it is not what the mechanic needs.

---

## 9 · The rider

### 9.1 The layer system

Four independent slots. Total riders = the product, not the sum.

| Slot | v1 count | Anchor |
| --- | :-: | --- |
| `body` | 4 | `seat` |
| `face` | 6 | `head` |
| `hat` | 8 | `head`, offset `(0, -9)` |
| `beard` | 5 | `head`, offset `(0, +4)` |

4 × 6 × 8 × 5 = **960 riders from 23 drawings.** That is the whole reason to
layer rather than draw whole characters.

### 9.2 The manifest

```ts
// portfolio/src/pages/Margin/rider/manifest.ts
export type Part = {
  id: string
  /** SVG path data in a 32×32 box, origin at the anchor point. */
  d: string
  /** Stroke width multiplier; hand-drawn parts vary. */
  w?: number
}
export const PARTS: Record<'body' | 'face' | 'hat' | 'beard', Part[]> = { … }
```

Every part is **path data only**, drawn in `--margin-ink` at the current stroke
settings. No fills, no colour, no per-part styling. This is what makes the
placeholder and the final art interchangeable.

### 9.3 v1 placeholder

Ship a `PARTS` table whose entries are generated path strings — circles, arcs,
zigzags — so all four slots and the cycling interaction are real and testable
from phase 6. Hand-drawn parts replace the strings and nothing else changes.

The placeholder must be visibly a placeholder. Do not spend time making generated
scribbles look good; that is the art pass, and doing it twice is waste.

### 9.4 Click to cycle

Clicking the rider cycles the slot under the cursor: upper third → `hat`, middle
→ `face`, lower → `body`; shift-click cycles `beard`. No modal, no settings
panel, no customisation screen. Poke him until you like him.

Selection is four small integers, stored in the level string (§12.1) — so **your
rider travels with your link.** This is close to free and it is the entire reason
a thing like this spreads.

---

## 10 · Editor

**Toolbar**, one row, left edge, drawn as a hand-labelled strip taped to the
page: the seven brushes, then a divider, then portal / well / wind, then a
divider, then start-flag, undo, redo, clear, play.

- **Draw:** press, drag, release commits one segment per ~14 px of travel.
  Segments are appended in draw order.
- **Undo/redo:** `⌘Z` / `⇧⌘Z` and `Ctrl` equivalents, 100 deep, operating on
  whole strokes rather than segments.
- **Pan:** space-drag, middle-drag, or two-finger.
- **Zoom:** wheel and pinch, clamped `0.25×`–`4×`, quantised to 1/16 steps so a
  level looks identical when reopened.
- **Erase:** right-drag, or the eraser modifier, removing whole strokes whose
  bounding box the cursor enters.
- **Play / reset:** `Enter` plays from the start flag, `Esc` resets. Editing while
  playing is not allowed — it resets first.

**Touch:** every one of the above has a touch path. The toolbar targets are
`44 px` minimum. This is checked at 390 px width in the smoke test.

**Camera during a run:** critically damped follow on the `seat` point, spring
constant `0.10`, damping `0.72`, evaluated in *render* space, never fed back into
the sim. Zoom out linearly from `1.0×` to `0.7×` as speed rises from 0 to 12
px/tick so fast sections stay readable.

---

## 11 · States

| State | Behaviour |
| --- | --- |
| Empty page | Ghosted hand-drawn arrow and "draw a hill →" near the start flag. Disappears on first stroke. |
| Drawing | Live preview stroke in the active brush, at the class's real render settings. |
| Playing | Toolbar dims to 40%, camera follows, tick counter runs in the margin. |
| Crashed | Rig freezes, "!!" over the head, `Esc` / click resets. No modal. |
| Off-track | If the rig leaves the level bounding box by >2000 px, end the run as "gone". |
| Reduced motion | Parallax holds still. The run still runs — it is the content, not decoration. |

---

## 12 · Level format

### 12.1 Shape

```ts
type Level = {
  v: 1
  r: [body: number, face: number, hat: number, beard: number]
  s: [x: number, y: number]                                  // start flag
  l: Array<[brush: number, x1: number, y1: number, x2: number, y2: number]>
  p: Array<[ax, ay, bx, by, cx, cy, dx, dy: number]>          // portal pairs
  g: Array<[x: number, y: number, strength: number]>          // wells
  w: Array<[x1, y1, x2, y2: number, strength: number, kind: 0 | 1]>  // wind
}
```

### 12.2 Quantisation

All coordinates are stored as integers in **half-pixel units** (world × 2).
Nothing float-valued is ever serialised. Decode multiplies by 0.5, which is
exact in binary floating point, so a round-trip cannot drift.

### 12.3 Encoding

1. Sort nothing — array order is load-bearing (§3.2 rule 5).
2. Delta-encode consecutive coordinates within each array.
3. Zig-zag varint each value.
4. `base64url`, no padding.
5. Prefix the format version as one byte.

A 200-segment track lands around 500 bytes, which fits any URL comfortably.
Share is `#/demos/margin?l=<string>` and requires no backend of any kind.

### 12.4 Level hash and the decoration PRNG

`hash = FNV-1a over the encoded string`, then `mulberry32(hash)` — the same
generator Globalio uses for its daily seed. It drives **only** parallax tree
placement (§2.4) and ink wobble (§2.3). It is never touched by anything in
`sim/`, and `check-determinism.mjs` asserts that a run is identical with the
decoration PRNG stubbed out entirely.

---

## 13 · Verification

### 13.1 `smoke-margin.mjs`

Playwright against the built app, in the house style of the existing smoke
scripts. Asserts: route mounts; toolbar has 13 controls; drawing three strokes
produces three entries; play advances the tick counter; crash freezes it; a
round-tripped share link reproduces the same level object; toolbar targets are
≥44 px at 390 px width; no console errors.

### 13.2 `check-determinism.mjs` — the gate that matters

Pure Node, no browser, importing `sim/` directly.

1. Build a fixture level exercising **every** brush and **every** stamp.
2. Run 3,000 ticks. Hash the full rig state each tick into a rolling checksum.
3. Run it again in the same process — assert the checksums are identical.
4. Encode → decode the level, run again — assert identical.
5. Run with the decoration PRNG stubbed to return `0` — assert identical.
6. Grep `sim/` for `Math.sin|cos|tan|atan2|pow|exp|log|random` — **fail the
   build on any hit.** This is the rule that will otherwise be violated by
   accident six months from now.

Add both to the `smoke` and a new `verify:margin` script in
`portfolio/package.json`.

---

## 14 · Phase order

Build in this order. Do not skip ahead — phase 1 decides whether the rest is
worth building.

1. **Sim core, no art, no editor.** One hardcoded zig-zag track, ink brush only,
   placeholder rig drawn as bare line segments. **Tune `GRAVITY`, `AIR`, the
   six constraint stiffnesses, and `friction` until it feels good.** This is the
   whole game. Budget real time here and do not move on until a hill, a jump,
   and a landing all feel right.
2. **`check-determinism.mjs` green,** including the grep gate. Before there is
   anything to retrofit.
3. **Paper, rules, ink/highlighter rendering, parallax.** The look lands.
4. **Editor:** draw, undo, erase, pan, zoom, play, reset. Ink brush only.
5. **The remaining six brushes.** One properties table, seven rows.
6. **Rider system + click-to-cycle,** on placeholder parts.
7. **The three stamps.** Portals last of the three — they are the only one with
   subtle math.
8. **Level format + share link.**
9. **Hand-drawn parts replace the placeholders.** Content only, zero code.

---

## 15 · Accessibility

- Every toolbar control is a real `<button>` with a label, reachable by keyboard,
  with a visible focus ring in `--margin-ink`.
- Drawing has a keyboard path: arrow keys move a cursor on a 14 px grid,
  `Enter` starts and ends a stroke. Slow, but present.
- The brush palette never encodes meaning in colour alone — each toolbar entry
  carries its name, and ice/water are additionally distinguished by stroke class
  (highlighter vs ink) so they cannot be confused at a glance.
- `prefers-reduced-motion` holds the parallax still and disables camera zoom
  changes. The run itself continues — it is the content.
- Crash state is announced in a live region, not signalled by the "!!" alone.

---

## 16 · Deliberately out of scope

Do not build these. They are noted so nothing in this spec forecloses them.

| Later | Blocked on / note |
| --- | --- |
| **Note lines** (marble-sequencer combo) | Purple highlighter is reserved. Determinism makes the song reproducible, which is why this gets *better* later, not worse. |
| **Rope / cloth stamp** | Same Verlet integrator; nearly free once §4–5 exist. |
| **Oscillating platform** | Must use a **triangle wave**, never `sin` (§3.2 rule 2). |
| **Second rider** | Rig array becomes rig-of-arrays; collision order rules still apply. |
| **Falling sand** | A full cellular automaton and the easiest thing here to make subtly non-deterministic. v3 at the earliest. |
| **Curated user levels** | Five hardcoded share strings, autoplaying in a loop — the level *is* the replay, so this costs almost nothing. |
| **Public submissions** | Would create a moderation surface. Curated links have none. Do not open this without a plan for it. |
