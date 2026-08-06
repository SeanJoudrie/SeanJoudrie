# Margin — handoff

Everything decided and everything built, as of the end of the first session. The
exhaustive build spec is `docs/roster/6-margin.md`; this is the summary you can
paste somewhere else and carry on from.

---

## 1 · What it is

**Margin** — *doodle a hill, watch him ride it.* A Line Rider–like set on ruled
notebook paper. You draw a track with a small set of pens and highlighters,
place a few stamps, and press play. A hand-drawn rider on a sled runs it under
deterministic physics.

**The one line:** *Draw a line. He rides it.*

The run is a pure function of the drawing, so a level is a short string, a share
link needs no backend, and **the replay is the level**.

---

## 2 · How this got chosen

Worth keeping, because it is the reasoning that rules out the next ten ideas.

The existing Range is **9 of 13 graphics commissions** (5 of them the same
particle engine). Every one of the 13 is a thing you *watch*: an object on a
stage, orbit it, pick a labelled part, it lights up. None of them lets a visitor
*make* anything, none can surprise its author, and none is different on a second
visit.

So the filter was structural, not aesthetic: **a toy beats a simulation**, even a
prettier simulation. Line Rider won because the visitor authors the content, it
is a weekend of physics rather than a month, it reads on a phone, and
pencil-on-paper turns the existing portfolio identity into something playable
instead of another document.

Ideas explicitly deferred and why: origami (rigid folding is a research problem),
a growing city (a product, not a demo), liquid glass (you cannot refract live DOM
— Apple does it at the compositor level, and over real text you are rasterising
the page with something like html2canvas), ferrofluid (the real Rosensweig
instability is hard, and the easy version looks cheap), falling sand (a full CA;
the single easiest thing here to make subtly non-deterministic).

---

## 3 · Locked decisions

1. **The run is deterministic.** No input steers the rider. All the craft is in
   the drawing. Chosen over a driving game deliberately: it makes the level
   string a complete replay, kills input recording, and reproduces exactly on any
   device.
2. **No physics library.** Hand-rolled Verlet, matching the house habit (Palisade
   has no grid library, Skein no graph library).
3. **Colour means behaviour.** A plain ink line is geometry. Every coloured line
   *does* something, so a level is readable without a legend.
4. **The palette is a middle-school pencil case** — ballpoint, red pen, blue pen,
   three highlighters. Nothing outside it.
5. **Ink and highlighter render differently.** Ink is thin and opaque;
   highlighter is fat, translucent, multiply-blended — and the ink line is drawn
   *through* it, because you highlight over writing. Most important visual call.
6. **The rider is data, not code.** Layered manifest, so hand-drawn parts drop in
   as a content change with zero code change.
7. **Units are per-tick, never per-second.** No `dt` anywhere in the integrator.

---

## 4 · Art direction

Ruled notebook paper, aged very slightly. Rules every 28 px, a vertical margin
rule, both in world space so the level sits *on* the page. Paper grain ≤3%
contrast, generated once, never animated.

| Token | Hex | Instrument | Means |
| --- | --- | --- | --- |
| paper | `#F6F2E8` | — | the page |
| rule | `#C7D2E0` | printed | ruled lines |
| margin rule | `#E0A79E` | printed | the vertical margin |
| ink | `#1E2430` | blue-black ballpoint | **solid line**, rider, UI |
| pencil | `#A9A395` | pencil | **scenery**, parallax trees |
| red | `#C4362E` | red pen | **kill** |
| blue | `#2F62B8` | blue pen | **water** |
| yellow | `#F2C744` | highlighter | **boost** |
| cyan | `#7FD4E8` | highlighter | **ice** |
| brown | `#8A6A3F` | highlighter | **tar** |
| green / pink | `#6FBF73` / `#E87FA8` | highlighter | **portal A / B** |

Parallax conifers in pencil grey at three depths (0.25 / 0.45 / 0.70 of camera
x), seeded from the level hash. They exist because velocity is unreadable
against a blank page.

**Single theme, deliberately.** It is a sheet of paper; a dark notebook page is
not a thing. `color-scheme: light`, no inversion.

---

## 5 · The simulation

### The rig — 5 points, 6 distance constraints, 1 posture rule

| Point | Rest | Role |
| --- | --- | --- |
| `nose` | `(0, 0)` | **RIDE** — collides |
| `tail` | `(-20, 0)` | **RIDE** — collides |
| `seat` | `(-10, -11)` | structural |
| `head` | `(-10, -27)` | **CRASH** — contact ends the run |
| `hand` | `(2, -18)` | decorative |

Constraints, solved in this order, 6 iterations/tick: `nose–tail` 20.0 k1.0 ·
`nose–seat` 14.866 k1.0 · `tail–seat` 14.866 k1.0 · `seat–head` 16.0 k0.92 ·
`nose–head` 28.792 k0.6 · `seat–hand` 13.892 k0.5.

Plus `applyPosture` — which side of the sled the rider is on, expressed in the
sled's own frame. **Not** a distance constraint, and cannot be one (§7).

### Constants

| | Value | |
| --- | --- | --- |
| `GRAVITY` | `0.12` | px/tick², ≈200 px of fall in the first second |
| `AIR` | `0.999` | per-tick velocity retention |
| `ITERATIONS` | `6` | constraint passes per tick |
| `CONTACT_R` | `2.0` | contact band, px — see §7 |
| `HEAD_CRASH_R` | `2.0` | gameplay tolerance, held *separately* |
| `BUOYANCY` | `0.06` | half gravity: he sinks, does not bob |
| `WATER_DRAG` | `0.012` | ≈50% of speed lost per second under |
| `POSTURE_K` | `0.12` | soft pull toward upright |
| `PORTAL_COOLDOWN` | `3` | ticks, stops a facing pair trapping the rig |

### The seven brushes — one table, seven mechanics

| Brush | Colour | Class | Collides | friction | boost |
| --- | --- | --- | :-: | --- | --- |
| **Ink** | ink | ink | ✓ | `0.004` | — |
| **Ice** | cyan | highlighter | ✓ | `0.0` | — |
| **Tar** | brown | highlighter | ✓ | `0.038` | — |
| **Boost** | yellow | highlighter | ✓ | `0.003` | `+0.08` |
| **Kill** | red | ink | ✓ | `0.004` | — |
| **Water** | blue | ink | ✗ | surface line, half-plane below | |
| **Scenery** | pencil | ink | ✗ | drawing only | |

Friction is **per tick of contact**, and a resting sled touches 60×/second — so
these are derived from per-second targets (ink keeps ~80%, tar ~10%). Boost
direction is the segment as drawn; drawing one right-to-left boosts backwards,
which the toolbar has to say.

### The three stamps

- **Portal pair** — rotation built from normalised direction vectors and one
  complex multiply. **No trigonometry, ever** (§7). Bidirectional. The whole rig
  transports, previous positions rotated identically so momentum carries.
- **Gravity well** — inverse square, `strength / max(r, 24)²`, cutoff 400 px.
  At r=100 the pull equals gravity exactly. Sizes 600 / 1200 / 2400.
- **Wind** — arrow (uniform push in a 60 px capsule) or vortex (tangential,
  linear falloff to the rim). Static fields; nothing simulates a fluid.

### Level format

`{v, r[4], s[2], l[], p[], g[], w[]}`, all integers in **half-pixel units** (0.5
is exact in binary FP, so a round-trip cannot drift). Encoded integers → delta →
zig-zag → varint → base64url. A 200-segment level is ~500 bytes and lives in the
URL: `#/demos/margin?l=<string>`. Sharing needs no backend.

Wind strengths are integer **thousandths** — a float in the wire format zig-zags
to zero.

---

## 6 · What is built

```
src/pages/Margin/
  sim/consts.ts      every tunable, per-tick units
  sim/types.ts       Level, World, the brush table
  sim/rig.ts         points, constraints, spawn, applyPosture
  sim/world.ts       Level -> World, clamps ids from the wire
  sim/collide.ts     swept + resting contact, friction, water, crash
  sim/stamps.ts      wells, wind, portals
  sim/step.ts        the fixed-step tick
  sim/index.ts       public surface
  level/format.ts    encode / decode / URL
scripts/check-determinism.mjs
```

`npm run verify:margin` — 12 checks, all green. Two fixtures (a long descent for
brush/stamp coverage; a straight ramp for portals), 3000 ticks, bit-level
checksums, an encode→decode round trip, plus two static gates: **no
transcendentals inside `sim/`** and **`sim/` imports nothing from outside
itself**.

Phase-1 feel harness (published artifact, not the real route):
<https://claude.ai/code/artifact/e77b1e79-20d1-4a4b-ab32-a8a7ac52657b>

---

## 7 · What phase 1 cost — the expensive knowledge

Every one of these survived a green determinism gate. Do not reintroduce them.

1. **Collision tunnelled.** A point dropped 70 px arrives at 4.1 px/tick against
   a thin contact radius — above the line one tick, below it the next, never
   *within* it. Contact is **swept**: the tick's motion is tested as a segment
   crossing, with proximity kept for a resting sled. The head's crash test needs
   the same or he sails through the ground head-first.
2. **Friction was an order of magnitude too strong** — see §5. Tar at `0.30` left
   0.0000001 of speed after one second.
3. **The rider rode upside down.** A point held by two distance constraints in 2D
   has **two solutions**, mirrored across the line through its anchors, and both
   satisfy the constraints exactly. Nothing stopped the head popping to the
   underside on the first landing. Distance constraints cannot express which side
   he sits on; `applyPosture` does it in the sled's frame.
4. **He nose-planted on every spawn.** Dropped in flat onto a slope, the downhill
   runner touches first, stops dead against zero restitution, and the tail
   rotates over it. The start flag now adopts the **tangent of the line beneath
   it** — which is also what a player means by putting the flag there.
5. **The head collapsed without `nose–head`.** Held only by `seat–head` it is
   free anywhere on a 16 px circle about the seat and its momentum carries it
   through the sled into the ground. Posture and distance are complementary: the
   distance stops it sinking, the posture stops it mirroring.
6. **Points could sink through a line and stay there.** The swept test catches
   motion; the constraint solve and posture reposition points with *no motion to
   sweep*, and anything nudged past the contact band is invisible to both tests.
   `CONTACT_R` is 2.0 — thicker than any one-tick correction.
7. **`Math.sin`/`cos`/`atan2` are not bit-identical across JS engines.** IEEE-754
   requires correct rounding for `+ - * /` and `sqrt` and *nothing* of the
   transcendentals. A portal built with `atan2` works in Chrome and silently
   breaks in Safari. CI greps for this.
8. **A portal pair downstream on the same track is inescapable.** Portals are
   bidirectional: he rides into B going forward, is thrown back to A, and
   ping-pongs until he tumbles. Correct behaviour — but people will draw it, so
   it needs a one-way flag or an editor warning.
9. **A closed portal loop is a perpetual motion machine.** It descends, the
   teleport returns the height for free, speed climbs every lap (measured
   6.3 → 8.2 → 10.0 px/tick) until he tumbles.

---

## 8 · Open — awaiting a verdict on feel

Nobody has judged the ride yet. These are the questions:

- Does he **carry speed like a sled**, or is he floaty / draggy? (`GRAVITY`, ink
  friction)
- Is `HEAD_CRASH_R = 2.0` too unforgiving on landings?
- Is the **ice vs tar** contrast dramatic enough to justify two brushes?
- Any **stutter or height pop** at a portal transit is a bug, not tuning.

---

## 9 · Remaining phases

3. Paper grain, ruled lines, ink/highlighter rendering, parallax
4. Editor: draw, undo, erase, pan, zoom, play, reset — ink only
5. The remaining six brushes
6. Rider system + click-to-cycle, on placeholder parts
7. The three stamps (portals last — the only subtle maths)
8. Level format + share link wired to the URL
9. Hand-drawn parts replace the placeholders — content only, zero code

**Deferred by design:** note lines (the marble-sequencer combo; purple is
reserved, and determinism makes the song reproducible so this gets *better*
later), rope/cloth (same Verlet integrator, nearly free), oscillating platforms
(**triangle wave, never `sin`**), a second rider, falling sand (v3 at the
earliest), curated user levels (five hardcoded share strings autoplaying — the
level *is* the replay, so it costs almost nothing).

**Do not open public submissions** without a plan. It creates a moderation
surface; curated links have none.

---

## 10 · If this becomes its own repo

Move `src/pages/Margin/`, `scripts/check-determinism.mjs`, the
`verify:margin` package script, and `docs/roster/6-margin.md`.

One thing changes with it: Margin was specced as **Range commission 14**, a demo
route inside the portfolio (`#/demos/margin`). Standing alone it is a product,
not a commission — which frees it to have its own domain and its own front page,
and means the route, the `margin-*` token namespace, and the "commission 14"
framing in the spec all want revisiting. Nothing in the code depends on the
portfolio; `sim/` imports nothing but itself, and CI asserts it.
