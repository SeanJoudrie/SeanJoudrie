# Meridian — Groundwork for Portfolio Demo #2 (3D Product Configurator)

**The project, stated precisely** (filling the template's project slot):
Range Commission 02 — a premium 3D **wristwatch configurator** for a fictional
brand, **Meridian Instruments** (model: *the Meridian One*), living on the
portfolio at `#/demos/meridian`, linked from the Range section. Visitors orbit
a photoreal-leaning watch in the browser, swap case metal / dial color / bezel
/ strap live, glide between camera presets, and watch a price update. Stack:
the existing portfolio app (React 19 + TypeScript + Vite + Tailwind v4) plus
the Three.js ecosystem — the one demo where a library *is* the point ("I can
do 3D on the web"), so the hand-rolled brand moves down a level: **zero
downloaded 3D assets**. Every part of the watch is procedural geometry; every
texture is generated in-code. "Done" = live on the site as Commission 02,
passing the Phase-4 checklist, with the portfolio's main bundle untouched.

Decisions already taken with the owner: product = **wristwatch** (asked and
answered — it was the one expensive-to-reverse ambiguity; chair and sneaker
were the rejected options: chair reads less premium, sneaker forces a
downloaded glTF asset). Everything else below is my call, justified inline.

---

## Phase 1 — Groundwork

### a) Objective
All decisions that are expensive to reverse are locked and written down:
requirements, user stories, edge-case inventory, stack with pinned versions,
config data model, scene architecture, fidelity bar, and performance budget.
**Exit criteria:** this document approved; the config schema typecheckable as
written; a numbered decision log with a rejected alternative per decision; a
measurable fidelity bar and perf budget that Phase 3/4 can be audited against.

### b) Proposed solution

**User stories.**
1. A hiring manager opens the link on a MacBook, drags to orbit, clicks
   "18k gold + green dial," sees the change render instantly and the price
   tick up — in under 10 seconds of arrival.
2. A recruiter on an iPhone taps swatches one-handed; the watch stays at
   60fps-feeling smoothness and never hijacks page scroll.
3. A developer inspects: procedural geometry, no .glb in the network tab,
   a shareable URL encoding the build (`?case=gold&dial=forest&strap=tan`).
4. A keyboard/screen-reader user configures the entire watch without the
   canvas: every control is plain HTML; a live region announces changes; the
   canvas carries a descriptive, config-aware `aria-label`.
5. A visitor with no WebGL (or a crashed GPU context) gets a graceful static
   fallback, not a black rectangle.

**Configuration surface (scope-fenced).** Four part groups, each 3–5 options:
- **Case:** brushed steel · titanium · 18k gold · black PVD
- **Dial:** silver sunray · midnight blue · forest green · slate black
- **Bezel:** polished steel · brushed steel · black ceramic
- **Strap:** leather (tan · black · navy) · steel bracelet · rubber (black)

Explicitly cut (the scope fence): caseback engraving, AR/QuickLook export,
exhibition caseback, chronograph subdials, gift packaging step. Each is a
week of work disguised as a checkbox.

**Data model** (in `config.ts`, no runtime deps):

```ts
type PartId = 'case' | 'bezel' | 'dial' | 'strap'
type MaterialSpec = {
  color: string
  metalness: number
  roughness: number
  clearcoat?: number
  /** leather | rubber | metal | ceramic — picks the procedural texture recipe */
  finish: Finish
}
type PartOption = {
  id: string          // stable, URL-safe: 'gold', 'forest'
  label: string       // '18k Gold'
  priceDelta: number  // vs the base build
  swatch: string      // chip color for the panel
  material: MaterialSpec
}
type Selection = Record<PartId, string>   // option ids; validated on URL read
const BASE_PRICE = 1_450
```
Price = `BASE_PRICE + Σ priceDelta` — derived, never stored, so it can't
drift (same discipline as AeroScale's ledger).

**Stack.** `three` + `@react-three/fiber` v9 (React 19-compatible) +
`@react-three/drei` (narrow import surface: `Environment`, `Lightformer`,
`ContactShadows`, `CameraControls`). Rejected alternatives:
- *Raw imperative three* — fights React's ownership of the tree; state→scene
  sync code balloons; R3F is the industry-standard React idiom (hiring signal
  in itself).
- *Babylon.js* — heavier, no React-first idiom, wrong ecosystem signal.
- *`<model-viewer>`* — needs a glTF asset and gives no per-part procedural
  control; it demos "I can embed a viewer," not "I can build 3D."
- *Downloaded glTF watch* — licensing/attribution, multi-MB asset, and every
  configurable part is hostage to how the artist grouped meshes.

**Zero-asset policy, concretely.** Environment lighting is generated in-app
(`<Environment resolution={256}>` with authored `<Lightformer>` key/fill/rim
planes — no HDRI download). Dial face, leather grain, and knurling are
`CanvasTexture`s drawn with the 2D canvas API. Text on the dial is drawn into
the canvas texture (system/Inter stack) — **not** drei's `<Text>`, whose
troika default fetches a font from a CDN (breaks the policy) and doesn't eat
woff2 (the only format the repo ships).

**Scene architecture.** One lazy route chunk (`#/demos/meridian`, mirroring
AeroScale): `Canvas` with `frameloop="demand"` (renders only when something
changes — battery-friendly), DPR clamped `[1, 2]`, ACES tone mapping.
`CameraControls` (drei) owns both free orbit *and* preset glides
(`setLookAt(..., true)` with built-in user-interrupt handling — rejected
OrbitControls + hand-rolled tween precisely because two systems fighting over
one camera is the classic configurator bug). The watch keeps real local time:
hour/minute hands set from the clock, seconds hand **ticks once per second**
(quartz behavior) via a 1Hz `invalidate()` — authenticity and near-zero idle
GPU cost from the same decision.

**Fidelity bar** (the go/no-go for "not a toy"): real Meridian-One
proportions — 40mm case → 1.0 scene unit, 11.6mm thickness → 0.29, 20mm lug
width → 0.5, strap taper 20→18mm; beveled/rounded edges on every part
(nothing razor-sharp); metal reads as metal under the rig (visible anisotropic
highlight sweep when orbiting); the go/no-go is checked on a test sphere +
case blank *before* any detail work (Phase 3, step 1).

**Perf budget:** demo chunk (three + R3F + drei subset + app code)
**≤ 330 KB gzipped**; portfolio main bundle diff **= 0 bytes**; orbit at
60fps desktop / no visible hitching on a mid phone; idle ≈ 1 render/sec
(the quartz tick); interactions render-on-demand only.

### c) Potential shortcomings
1. **Procedural fidelity risk** — the whole bet. A lathe-and-boxes watch under
   bad lighting looks like a toy, and no amount of config UI rescues it.
2. **Version-pinning risk** — three / R3F v9 / drei move fast and peer-depend
   tightly; a mismatched trio fails at runtime, not install time.
3. **Scope creep pressure** — configurators invite "just add engraving."
4. **The seconds-hand + demand-frameloop interplay** is easy to get subtly
   wrong (a stray `useFrame` silently forces 60fps forever, killing the
   battery win and making the budget a lie).
5. **Fake pricing** could read as real-product plagiarism if styled too much
   like a specific brand.

### d) Mitigations (one-to-one)
1. Fidelity is **front-loaded as Phase 3 step 1 with an explicit go/no-go**:
   lighting rig + material test sphere + case blank must pass the bar before
   any further geometry. If it fails after one focused iteration, the
   pre-agreed fallback is scope-swap to the chair (procedurally forgiving),
   not a quality slide.
6. Versions are resolved **from drei's published peerDependencies at install
   time**, pinned exact in package.json, and validated by a compile + render
   smoke in Phase 2 before any feature work.
2. The scope fence above is written into the doc; anything outside it is a
   new negotiation, not a slide.
3. One **rendering-policy module** (`invalidate.ts`): every render trigger
   (config change, camera motion, 1Hz tick) goes through it; Phase 4 has an
   explicit idle-rAF-count check that fails if anything renders continuously.
4. Meridian's design language is deliberately generic-premium (no Rolex
   fluting, no Nautilus porthole); prices carry a "demo pricing" footnote.

### e) Rating: 9/10
The decisions are locked, justified against alternatives, and measurable.
The remaining point: the fidelity bar, while now numeric on proportions, still
has one subjective clause ("reads as metal"), and the go/no-go depends on it.

### f) Path to 10/10
Make the subjective clause testable: **the orbit test** — screenshot the case
blank at 3 orbit angles; the specular highlight must visibly travel across
the brushed surface between frames (screenshot-diffable), and the silhouette
must show no polygonal faceting at 2× zoom (segment counts: lathe ≥ 96,
torus ≥ 128). **Revised solution:** fidelity bar = proportions table + orbit
test + faceting check, all screenshot-verifiable in this session.
**Re-score: 10/10** — every exit criterion is now mechanically checkable.

---

## Phase 2 — Scaffolding

### a) Objective
The route exists end-to-end with tooling proven: dependencies installed and
pinned, an empty lit scene rendering at the route behind a lazy chunk, theme
tokens in place, bundle budget measured and passing.
**Exit criteria:** `#/demos/meridian` renders a lit placeholder (material test
sphere) with working orbit; `npm run build` green; demo chunk ≤ 330 KB gz
(measured, recorded); main-bundle size diff exactly zero; file skeleton
committed.

### b) Proposed solution

**Dependencies:** `three`, `@react-three/fiber@^9`, `@react-three/drei` —
exact versions resolved against drei's peer range at install, then pinned.
Nothing else: no `maath` (damping is 10 lines hand-rolled on the existing
shared ticker pattern — brand consistency), no `leva`, no postprocessing
package (bloom/AO would double the chunk for marginal gain — rejected).

**Shared-utility promotion:** `useSharedTicker.ts` (the one-rAF-loop +
`useCountUp` from AeroScale) moves to `src/lib/ticker.ts`; AeroScale's imports
update. Justified: the price counter must behave identically to the dashboard
tickers, and duplicating a frame loop would mean two rAF loops on one site —
the exact thing the pattern exists to prevent. (Rejected: copy-paste into the
demo folder; two sources of truth.)

**File skeleton** (`portfolio/src/pages/MeridianConfigurator/`):
```
index.tsx        page shell: layout, panel, suspense, error boundary
theme.css        meridian-* scoped dark theme (midnight + brass)
config.ts        parts/options/pricing schema + URL codec
config.assert.ts dev-mode invariants (unique ids, defaults exist, prices ≥ 0,
                 URL round-trip identity)
Scene.tsx        Canvas, lighting rig, ContactShadows, CameraRig
CameraRig.tsx    CameraControls wrapper: presets, autorotate, interrupts
invalidate.ts    the rendering-policy module (all render triggers)
materials.ts     MaterialSpec → cached MeshPhysicalMaterial instances
textures.ts      CanvasTexture recipes: dial face, leather grain, knurling
watch/           Case.tsx Bezel.tsx Dial.tsx Hands.tsx Crown.tsx Strap.tsx
Panel.tsx        HTML config UI: groups, swatch chips, price, share
useSelection.ts  selection state + URL sync + validation
Fallback.tsx     no-WebGL / error-boundary static rendering
```

**Theme:** `meridian-*` tokens in the global `@theme` block (same pattern as
`aero-*`): midnight `#0e0d0b`, card `#171511`, brass accent `#c9a55a`, warm
inks — deliberately warm-dark vs AeroScale's cool slate, so the two demos
read as different rooms. Text-contrast values computed before use (brass on
midnight ≥ 4.5:1 for text roles).

**Router:** `demoSlug` already exists. App.tsx's single `if (demoSlug ===
'aeroscale')` branch generalizes to a `DEMO_PAGES` map (mirroring the
`CASE_PAGES` map that main now uses for case studies) — two demos is a
pattern, not a coincidence.

**Bundle discipline:** build once with only the placeholder scene; record
`meridian` chunk gz size in the commit message. Budget gate: if the skeleton
already exceeds ~280 KB gz (three+R3F+drei floor), drop `CameraControls` for
a hand-rolled orbit (−~25 KB) before feature work begins, not after.

### c) Potential shortcomings
1. **drei's import weight is unpredictable** — it re-exports half the
   ecosystem, and tree-shaking failures are notorious; four imports could
   still drag in 100 KB of strangers.
2. **The `ticker.ts` move touches AeroScale**, a shipped, verified demo —
   regression risk in the thing that's already live.
3. **React 19 + R3F v9 + Vite 6** is a young combination; a scaffold-time
   incompatibility (e.g., reconciler mismatch) would stall everything.
4. Theme tokens chosen by eye could fail contrast on the panel text.

### d) Mitigations (one-to-one)
1. Measure at scaffold time (the exit criterion), and if over budget, the
   documented fallback ladder is: per-module drei imports → drop
   CameraControls → drop Environment for a 3-light rig. Decided now, applied
   mechanically then.
2. The move is a pure re-export refactor (`AeroScaleDashboard/useSharedTicker
   .ts` becomes `export * from '../../lib/ticker'` for one commit, callers
   migrate, shim deleted) — plus the existing AeroScale Playwright smoke
   (tickers count, morph runs) re-run before the commit lands.
3. The placeholder-scene exit criterion *is* the compatibility test, run as
   the first action of the phase — failure surfaces on day zero with maximum
   time to pin alternate versions.
4. Contrast is computed (same WCAG math as the dataviz pass) for every
   text-role token before the theme commits; failing values get darkened
   until they pass, by number not by eye.

### e) Rating: 9/10
Concrete, measured, with fallback ladders. Held back by one honest unknown:
the exact drei/R3F/three version trio can't be pinned *in this document* —
it depends on the registry state at install time.

### f) Path to 10/10
That unknown is not a plan weakness — it's precisely what the phase's first
exit criterion exists to resolve, with a decided fallback (pin to drei's
peer range; if v9-compat fails outright, fall back one drei major and re-run
the smoke). **Revised solution:** the version-resolution procedure and its
fallback are now specified as the phase's first action rather than left as
an ambient risk. **Re-score: 10/10** — nothing in this phase is unspecified;
one step is simply *scheduled* to execute at install time, with its failure
path pre-decided.

---

## Phase 3 — Building

### a) Objective
The watch exists, configures, and moves. **Exit criteria:** all four part
groups render at the fidelity bar and respond to every option; camera presets
glide and free orbit works on touch + mouse; hands keep real time with the
1Hz tick; panel drives everything with URL round-trip; the Phase-1 orbit
test passes on the finished case.

### b) Proposed solution — in deliberate order, with the reasoning

1. **Lighting first** (rig + tone mapping + ContactShadows + material test
   sphere + case blank → **go/no-go against the fidelity bar**). Why first:
   every material decision downstream is only tunable under final lighting;
   tuning materials under temp lights means re-tuning everything later.
2. **Case group** (lathe profile with bevel curvature, 4 lug RoundedBoxes,
   crown + pushers with canvas-knurling bump). The case is the fidelity
   anchor — if it convinces, everything else rides its lighting.
3. **Dial** (CanvasTexture face: sunray gradient, minute track, printed
   "MERIDIAN" + "ONE"; instanced 3D hour indices riding above the texture).
4. **Hands + timekeeping** (extruded tapered shapes, stacked z-offsets, real
   local time, 1Hz tick through `invalidate.ts`).
5. **Crystal** (MeshPhysicalMaterial `transmission` dome; quality tier: plain
   transparent + env reflection below the GPU cutoff).
6. **Straps** (leather: extruded rounded profile along a droop curve with
   canvas grain bump + stitch dashes; bracelet: instanced links along the
   same curve; rubber: leather geometry, smooth material). Last of the
   geometry because it's the biggest time-sink with the most acceptable
   simplest-pass (see (d)).
7. **Config system** (`materials.ts` cache: option id → material instance,
   created once, disposed on unmount; color/roughness *damped* over ~250ms
   through the shared ticker so swaps feel physical, not spliced).
8. **CameraRig presets** (Hero ¾ · Dial · Crown · Strap) + idle autorotate
   (starts after 6s idle, pauses on interaction, off under reduced motion).
9. **Panel + integration** (HTML groups with swatch chips `aria-pressed`,
   price via shared `useCountUp`, share-link button, URL sync, live region).
   UI last because it's pure consumption of a by-then-stable scene API.

### c) Potential shortcomings
1. **The strap is the geometry time-sink** — a droop curve with a twisted
   profile can eat days and still look like rubber hose.
2. **Transmission crystal cost** on mobile GPUs (it renders the scene twice).
3. **Z-fighting** in the dial stack (face texture / indices / hands / crystal
   all within 0.3 scene units).
4. **Texture/material churn**: rebuilding CanvasTextures per option change
   allocates GPU memory mid-interaction (visible hitch).
5. **State tearing**: config state read inside `useFrame` closures goes stale
   or, worse, re-renders the R3F tree per frame.
6. **Touch conflicts**: one-finger orbit vs page scroll on the demo page.

### d) Mitigations (one-to-one)
1. Timebox: simplest-acceptable strap first (two gently-curved extrusions,
   4h cap), detail pass only after everything else lands. The bracelet is
   instanced boxes — cheap — so one of three strap types is guaranteed good.
2. GPU tier check once at mount (renderer caps + devicePixelRatio heuristic);
   low tier gets the transparent-reflective crystal — decided at mount, never
   swapped live.
3. Explicit z-budget written into `watch/` constants (face 0 / track +0.004 /
   indices +0.012 / hands +0.02 stepped / crystal +0.08) — collisions become
   arithmetic, not tuning.
4. All textures for all options are built **once at scene mount** into a Map
   (≈ a dozen small canvases, trivial memory), so option swaps only rebind.
5. Config flows as plain React state → part props (re-render on click:
   correct and cheap); *only* continuous values (damped colors, hands, camera)
   live in refs inside `useFrame`. The boundary is documented in `Scene.tsx`.
6. `CameraControls` touch config: one-finger rotate *inside* the canvas only,
   with the canvas sized to leave a scroll gutter on mobile layouts; two-
   finger dolly; `touch-action` set accordingly and verified on a real phone.

### e) Rating: 9/10
The order is justified, the risks are the real ones, and each mitigation is
concrete. Held back by: hands keeping real time interacts with timezone/DST
edge cases I haven't specified (clock math is a classic silent-wrongness
spot), and the go/no-go fallback (chair swap) is heavy relative to the more
likely partial-failure mode.

### f) Path to 10/10
(1) Specify the clock: hands read `new Date()` local time each tick —
hour = `(h % 12 + m/60) × 30°`, minute = `(m + s/60) × 6°`, second = `s × 6°`
stepped; no timezone math at all (local Date *is* the wrist time — the trap
would be doing more). (2) Grade the go/no-go: full-fail → chair swap stays,
but partial-fail (case convinces, straps don't) → ship bracelet + rubber and
cut leather — a 1-hour decision instead of a restart. **Revised solution:**
both written into the phase as stated. **Re-score: 10/10** — every previously
soft spot now has a specified behavior.

---

## Phase 4 — Testing

### a) Objective
Every requirement from Phase 1 verified by something that runs, plus the
accessibility and resilience floors. **Exit criteria:** the checklist below
fully green, each item verified by a script or a recorded check in this
session, and AeroScale's existing smoke still green (regression gate for the
ticker move).

### b) Proposed solution
Layered, matching what this repo actually has (no test infra today):

1. **Types + invariants:** `tsc` strict (already in `npm run build`);
   `config.assert.ts` dev-mode asserts — unique option ids, every part has a
   valid default, prices ≥ 0, every material color parses, URL codec
   round-trips every legal selection and rejects garbage (`?case=<script>`).
2. **Scripted browser suite** (Playwright on the preview build, committed as
   `portfolio/scripts/smoke-meridian.mjs` so it outlives this session):
   - route loads; canvas paints (pixel-sample: not background in ≥ 3 regions)
   - every option chip click → pixel delta in the watch region (proves the
     material swap actually rendered, not just state)
   - keyboard-only path: tab through all groups, arrow/space select, price
     updates, live region announces
   - deep link applies (`?case=gold&dial=forest`), invalid params fall back
     to defaults without crashing
   - reduced-motion: no autorotate, no intro, presets cut instantly
   - WebGL disabled (Chromium launch flag) → `Fallback` UI, no black box
   - context loss (`WEBGL_lose_context.loseContext()`) → fallback or recovery
   - fps sample during orbit + during a preset glide (≥ 55fps desktop) and
     **idle rAF count ≈ 1/s** (the quartz tick, proving demand-frameloop)
   - mobile viewport pass: layout, touch orbit, scroll gutter
3. **Accessibility floor:** focus order matches visual order; chips are
   `aria-pressed` buttons in a labeled group; canvas has config-aware
   `aria-label`; announcements via one polite live region; token contrast
   computed (Phase 2) — re-checked against final panel text sizes.
4. **Regression gate:** the AeroScale smoke (draw-on, morph, tickers, hover)
   re-run against the same build.

### c) Potential shortcomings
1. **No CI** — the scripts run when a human (or I) runs them; nothing guards
   `main` pushes structurally.
2. **Chromium-only** — this environment has no Safari/iOS, and WebGL behavior
   (esp. transmission, DPR, touch) differs most exactly there.
3. **Pixel-delta checks are GPU-dependent** — thresholds tuned on this
   machine could flake elsewhere.
4. Screen-reader behavior is *approximated* by ARIA correctness, not verified
   with an actual SR.

### d) Mitigations (one-to-one)
1. Genuine external decision — see (f).
2. Feature-detect and default conservative (transmission behind the GPU tier
   check; `-webkit` touch-action verified by code review; DPR clamp is the
   Safari-crash guard) **plus** a 5-minute owner device pass: you open it on
   your iPhone and report — scheduled as an explicit Phase-5 gate.
3. Thresholds are written generous (region must change by *any* visible
   margin, not a tuned percentage) and the script is documented as a smoke,
   not a pixel-perfect visual regression suite.
4. ARIA pattern used (toolbar of pressed buttons + live region) is the
   textbook one; the residual risk is accepted and noted in the script
   header rather than hidden.

### e) Rating: 9/10
Everything testable here is tested by something executable and committed.
The missing point is structural, not effort: no CI, no Safari.

### f) Path to 10/10 — **genuine external blocker, question for you**
I can add a GitHub Actions workflow (`test.yml`: build + the two smoke
scripts on PRs) — ~30 minutes, closes shortcoming 1 permanently, and turns
this repo from "deploy on push" into "verify then deploy." But adding CI to
your repo is your call, not mine, and Safari can only be tested on your
phone. **The two unblock questions: (1) want the CI workflow? (2) will you do
the 60-second iPhone pass when Phase 5 lands?** With both answered yes, this
phase is a 10; until then it's an honest **9/10** with the gap named.

---

## Phase 5 — Polish

### a) Objective
The demo feels like a product, ships, and joins the shelf. **Exit criteria:**
loading/error/empty states all designed (no flash of black canvas, no dead
ends); entrance choreography + micro-interactions in, all reduced-motion-
safe; perf budget re-verified on the final build; Range card 02 live; PR
merged and the deployed URL confirmed working; final re-audit of every
phase's exit criteria recorded.

### b) Proposed solution
- **Loading:** route chunk shows the meridian-dark shell + panel skeleton
  with a `coord`-style "assembling the One…" label; the canvas fades in only
  after the first rendered frame (R3F `onCreated` + one-frame callback), so
  there is never a black rectangle.
- **Entrance:** watch starts 35° off-hero and settles to the hero preset over
  ~1.2s while the panel cascades in (the site's `hero-in` language); skipped
  entirely under reduced motion (scene mounts at hero, panel appears).
- **Micro-interactions:** damped material transitions (Phase 3), price ticker
  count, chip hover lift (`springy`), preset-button active states, autorotate
  after 6s idle → **off entirely after 60s** (battery), share button copies
  the URL with a "copied" confirmation in the live region.
- **Error/empty:** one error boundary around the Canvas → `Fallback.tsx`, a
  static composed SVG of the watch silhouette + the panel *still functional*
  for price/share (config without preview beats a dead page); same fallback
  for no-WebGL and unrecovered context loss.
- **Perf pass:** re-run the fps + idle-rAF + bundle measurements on the final
  build; dispose audit (navigate away → renderer, geometries, textures,
  materials disposed — heap snapshot before/after); `AdaptiveDpr`-style
  degradation while dragging on the low GPU tier.
- **Ship:** Range card 02 (small webp screenshot thumbnail in `public/shots/`
  like the Work plates — a real render beats a hand-drawn SVG for a 3D demo),
  page `<title>`, PR with the phase evidence, Pages deploy, live-URL check,
  and the owner's iPhone pass (Phase 4's gate) recorded.

### c) Potential shortcomings
1. The intro animation competes with time-to-interactive on slow devices —
   a 1.2s flourish on top of a ~330 KB chunk + scene compile could feel slow.
2. The webp thumbnail bakes one config; if the default build changes later,
   the card lies.
3. Fallback SVG is a second rendering of the watch to maintain — drift risk.
4. Autorotate + demand frameloop means the idle-rAF test from Phase 4 has a
   window (first 60s) where continuous rendering is *correct* — the test and
   the feature could contradict each other if specified sloppily.

### d) Mitigations (one-to-one)
1. The intro plays *concurrently* with panel hydration (nothing waits on it),
   starts only after first-frame, and is skipped under reduced motion **and**
   on the low GPU tier — the flourish is a bonus tier, not a gate.
2. Thumbnail is regenerated by a one-line documented step in the script
   (screenshot preset "Hero" at default config); the default config is a
   named constant the script reads — they can't drift silently.
3. The fallback SVG is deliberately a *silhouette* (shape + brand + copy),
   not a config-accurate render — it has no config surface to drift from.
4. The idle-rAF test is specified against the *post-autorotate* window
   (t > 60s idle, or immediately with reduced motion) — written into the
   script, not left to interpretation.

### e) Rating: 10/10
Every state (loading/error/reduced/low-GPU/no-WebGL) has a designed behavior;
every animation has an off-ramp; shipping includes re-audit and a real-device
gate. Shortcomings found in (c) were specification gaps, and (d) closed them
by specification, not hope. Nothing here waits on missing information.

### f) Path to 10/10
Already at 10 after folding (d) into the plan; no revision cycle needed
beyond what (c)→(d) already forced.

---

## Final summary

| Phase | Final rating | Single biggest remaining risk | First concrete action |
|---|---|---|---|
| 1 Groundwork | 10/10 | Fidelity bet on procedural geometry (managed by the step-1 go/no-go) | Approve this doc |
| 2 Scaffolding | 10/10 | drei bundle weight past budget (fallback ladder pre-decided) | Resolve + pin three/R3F/drei versions, render the placeholder scene |
| 3 Building | 10/10 | Strap fidelity (timeboxed; graded fallback: ship bracelet + rubber) | Lighting rig + case blank → go/no-go |
| 4 Testing | **9/10** | No CI + no Safari in this environment | Your call: add `test.yml` CI? iPhone pass at ship time? |
| 5 Polish | 10/10 | Intro flourish vs slow devices (tiered off-ramps specified) | Runs only after 1–4 |

**The one open question (Phase 4's blocker):** want me to add a GitHub
Actions CI workflow (build + both demo smokes on PRs), and will you do the
60-second iPhone check when it ships? Neither blocks starting — Phases 1–3
proceed identically either way.
