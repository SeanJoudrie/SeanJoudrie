# AeroScale UI — Groundwork for Portfolio Demo #1 (Animated Financial Dashboard)

This is the locked-in spec for the first "Range" demo: a premium dark-mode SaaS
financial dashboard for the fictional company **AeroScale UI**, hand-rolled SVG
only, living **directly on the portfolio** as a lazy-loaded route.

Format per feature: **why it works** (the hiring signal + UX rationale) → **where
the brief as written falls short** → **improvements that take it to 10/10**. The
build plan at the end sequences every improvement into phases.

---

## 0. Integration decision (settled before any feature)

The portfolio is a light "Atlas" theme (`:root { color-scheme: light }`, warm
paper tokens). The dashboard is natively dark. These must not fight.

- **Route:** extend `lib/router.ts` with `#/demos/aeroscale` (same pattern as
  `#/work/<slug>`), lazy-loaded in `App.tsx` like the case studies — the main
  bundle gains ~0 bytes.
- **Theme scoping:** all dark tokens live on a `.aero-root` wrapper with its own
  `color-scheme: dark`, its own CSS custom properties, and its own `<style>`
  scope. The global Atlas theme is never touched. No site-wide dark toggle — the
  demo *is* the dark mode.
- **Nav:** the page gets a minimal dark chrome header with "← Portfolio" so the
  demo reads as a product, not a page of the portfolio.
- **Later:** the "Range" grid section links here. Out of scope for this build.

Why this beats a separate repo for v1: zero deploy friction, one PR, and the
portfolio's own router/motion conventions (View Transitions, `useReveal`) carry
over. A standalone repo + README can be extracted later once the demo is done —
extraction is cheap, building in two places is not.

---

## 1. Data architecture — the fake-but-realistic dataset

### Why it works
Fintech reviewers *will* sanity-check the numbers. Coherent SaaS data (ARR that
is exactly MRR×12, tiers that sum to the total, an LTV:CAC in the healthy 3–5×
band) is itself the proof of domain literacy — it says "I understand the
business I'd be visualizing," which is the actual hiring question behind demo #1.

### Where the brief falls short
"Generate realistic mock data" as independent numbers is how fake dashboards get
caught: churn that doesn't move MRR, tier lines that don't add up to the
headline, a CAC that implies negative margin. Independent random series = 6/10.

### Improvements → 10/10
1. **One generative model, everything derived.** A single seeded engine
   (`import { mulberry32 } from '../lib/daily'` — already in the codebase)
   simulates a monthly customer ledger per tier: new logos, expansion,
   contraction, churned logos. Every displayed metric is *derived* from that
   ledger, so cross-checks pass by construction:
   - `MRR(m) = Σ tiers(m)`, `ARR(m) = MRR(m) × 12`
   - churn% = churned MRR ÷ opening MRR (target band 1.8–2.5%)
   - `LTV = ARPA × grossMargin ÷ churn`, CAC tuned so LTV:CAC lands ≈ 4.2×
   - MRR scales $100k → $200k across TTM (⇒ ARR $1.2M → $2.4M, exactly the brief)
2. **A narrative, not just noise.** Three authored beats layered on the growth
   curve: Enterprise tier launch in month 4 (its line starts near zero and
   ramps), a churn spike in month 8 with visible recovery, and a Q4 seasonal
   bump. Reviewers remember stories; smooth exponential curves read as fake.
3. **Fixed seed, deterministic output.** Same data every visit (seeded, no
   `Date.now()` in the generator) so screenshots, the README, and the live demo
   always agree. A dev-only `?seed=` override for regenerating during tuning.
4. **Transactions feed from the same ledger.** "Recent high-value transactions"
   are sampled from the tier ARPAs (Enterprise deals $2.4k–$8k MRR, etc.) with
   plausible fake company names — never numbers the charts can contradict.
5. **Invariants as a tiny test.** `data/aeroscale.test.ts` (or a dev-mode
   assert) checks the sums/bands above — the data engine is the one part of a
   visual demo that's unit-testable, and a test here is a loud senior signal.

Tier ARPAs: Starter ≈ $79, Professional ≈ $299, Enterprise ≈ $1,750 (avg), with
per-account variance. Tier mix by revenue lands ≈ 20 / 35 / 45% by month 12.

---

## 2. Layout & core components

### Why it works
Metrics row → main trend → granular breakdown is the exact scan order of Stripe,
ChartMogul, and every BI tool a hiring manager uses daily. Familiar structure
reads as competence; the polish budget goes into motion, not novel layout.

### Where the brief falls short
"High-level cards + big chart + secondary section" is table stakes. What
separates 7/10 from 10/10 is the *discipline* around it: one filter row that
scopes everything, one hero number, consistent density, and an entrance that's
choreographed rather than simultaneous.

### Improvements → 10/10
1. **One filter row above everything** (timeframe + tier chips together, left
   aligned). Filters scope *all* cards, chart, donut, and transactions — every
   number on screen always agrees. Never per-card filters.
2. **Exactly one hero figure.** ARR at ≥48px is the number the dashboard leads
   with; MRR / Net Revenue / Active Customers are stat tiles. Hero and tile
   values use **proportional figures** (`tabular-nums` makes large numbers look
   loose); tabular-nums is reserved for the transactions table and axis ticks.
3. **Stat tile contract:** label (sentence case) · value (compact: $2.4M) ·
   delta (signed, "vs prior period", green/red by direction-×-good) · 12-point
   sparkline in a de-emphasized stroke. Four identical anatomies = system, not
   four hand-made cards.
4. **Grid:** 12-col CSS grid, named areas; tiles 4-up → 2-up → 1-up at
   breakpoints; chart card spans 8, donut + transactions share the remaining 4
   then stack. 8pt spacing scale throughout.
5. **Surface system, not one flat dark.** Page `#0b0f17`, card `#131a26`,
   hairline borders `rgba(255,255,255,.08)`, no drop shadows (they die on dark —
   elevation comes from surface lightness steps).
6. **Entrance choreography:** tiles cascade 60–80ms apart (transform+opacity
   only), then the chart draws, then the donut sweeps. One composed load moment
   instead of everything popping at once. Respects `prefers-reduced-motion`.
7. **Tier breakdown is a donut only because it's 3 segments part-to-whole**
   (within the ≤6-segment rule), with the 2px surface-gap between segments and
   center total. If tiers ever needed close comparison it'd be bars — noted in
   the README as a deliberate choice.

---

## 3. Color & theme (validated, not eyeballed)

Run through the dataviz validator against the actual card surface `#131a26` —
these pass; don't substitute hues without re-running:

```
node scripts/validate_palette.js "#86b6ef,#3987e5,#1c5cab" --ordinal --mode dark --surface "#131a26"   # PASS
node scripts/validate_palette.js "#3987e5,#199e70,#c98500" --mode dark --surface "#131a26"             # PASS (alt)
```

- **Tiers are ordered** (Starter < Professional < Enterprise), so they take an
  **ordinal one-hue blue ramp**: Starter `#86b6ef` → Professional `#3987e5` →
  Enterprise `#1c5cab`. Reads as "same family, ascending weight" — exactly what
  tiers are. (Validated alternative if isolation legibility ever wins:
  categorical blue/aqua/yellow.)
- **Total MRR line = neutral near-white `#e8eefc`** — "the sum" reads as a
  different *kind* of thing than the tier layers, and it's the one line that
  never collides with a tier hue. The darkest tier step (2.63:1) is below 3:1,
  so the relief rule applies: direct end-labels + legend + table view (all
  shipped anyway).
- **"Glowing accents" are an effect, not a palette slot.** Vibrant cyans
  (`#22d3ee` etc.) all fail the series lightness band — glow comes from gradient
  fills and a blurred stroke echo (§4.2), while the series colors stay in the
  validated band.
- **Deltas/status:** good `#0ca30c`, critical `#d03b3b` (fixed status tokens,
  never reused as series colors), always paired with a ▲/▼ glyph — never color
  alone.
- **Ink:** primary `#ffffff`, secondary `#c3c2b7`, muted axis `#898781`,
  gridline hairline `#2c2c2a`-equivalent stepped for the slate surface.
- **Text never wears series color** — identity comes from a colored line-key
  beside the text.

---

## 4. Animation & micro-interactions

### 4.1 Self-drawing SVG lines

**Why it works:** stroke-dash draw-on is the single clearest "I understand SVG
internals, no library" proof — it's the technique interviewers ask about.

**Where the brief falls short:** the naive version measures `getTotalLength()`
(layout read), re-draws on every re-render, and leaves dash props on the path
where they corrupt later morphs.

**→ 10/10:**
1. `pathLength="1"` on the path normalizes length — `stroke-dasharray: 1;
   stroke-dashoffset: 1 → 0` with **zero measurement**, no layout read, works at
   any responsive width.
2. Draw **once on mount only** (a `hasDrawn` ref) — filter changes morph, they
   never re-draw. ~1.4s, `cubic-bezier(0.22, 1, 0.36, 1)`; tier lines stagger
   ~150ms behind the total.
3. On animation end, **remove dash properties** so the path is clean state for
   tooltip hit-testing and morphs.
4. Area fill reveals in sync via a `<clipPath>` rect animated with `transform:
   scaleX` (GPU) — line and fill arrive as one object.
5. `prefers-reduced-motion`: skip to the finished frame instantly.

### 4.2 Glowing area fills

**Why:** the glow *is* the "premium dark" aesthetic — it's what gets screenshot.

**Falls short:** the obvious tool, SVG `feGaussianBlur` filters, re-rasterizes
per frame and is the #1 way hand-rolled charts drop to 20fps.

**→ 10/10:**
1. Fill = vertical `<linearGradient>` of the series hue, ~16% opacity at the
   line fading to 0 at baseline — a wash, never a saturated block, so hairline
   gridlines stay legible beneath it.
2. Glow = a **duplicate of the stroke path** underneath with CSS
   `filter: blur(6px)`, wider stroke, ~35% opacity. It's static after the draw
   completes, so the browser rasterizes it once — no per-frame filter cost.
   During morphs, the echo moves with the same `d` (cheap) and never animates
   its blur radius.
3. Glow only on the total line — three glowing tier lines is noise; one is a
   headline.

### 4.3 Animated number tickers

**Why:** counters make the numbers feel earned, and doing them *right* proves
rAF fluency.

**Falls short:** one `setInterval` per card (jittery, uncoordinated), always
counting from zero, digit-width jitter shifting layout mid-count.

**→ 10/10:**
1. **One shared rAF loop** (a tiny `useTicker` engine) drives every tween on the
   page — tickers, morphs, donut sweeps all step in the same frame callback.
   This is the strongest 60fps lever in the whole build.
2. `easeOutExpo`, ~1.1s. `Intl.NumberFormat` for currency; hero uses compact
   notation ($2.4M), tiles use full ($199,584).
3. **On filter change, tween from the current value** — counting from zero every
   toggle reads as a page reload, tweening the delta reads as a living system.
4. **No layout shift:** render the target value invisibly to reserve the card's
   final width, keeping proportional figures without mid-count reflow.
5. Reduced motion: set final value instantly. Screen readers get the final
   value only (no per-frame announcements; `aria-live` off during the tween).

### 4.4 Tooltips & hover

**Why:** hover behavior is where frontend candidates actually get judged — it's
the part reviewers *touch*.

**Falls short:** per-point hover circles (pinpoint targets nobody hits), tooltip
re-created per point, values only reachable by hovering.

**→ 10/10:**
1. **Crosshair finds the X:** one full-height transparent overlay rect takes
   `pointermove`; nearest month by index math (uniform x-spacing — no search
   needed); a vertical hairline snaps to it. Nobody has to aim at a 2px line.
2. **One tooltip, every visible series at that X** — total + each active tier,
   values leading (strong), names secondary, keyed by short line-strokes of the
   series color (not boxes). A dot with a 2px surface ring marks each snapped
   point.
3. Single persistent tooltip element, moved with `transform: translate3d` and
   `opacity` transitions only; flips side near the right edge; ~80ms hide delay
   so it doesn't flicker between points.
4. **Keyboard parity:** the chart is focusable; ←/→ steps months; Home/End jump;
   the same tooltip renders on focus. This single feature outclasses ~95% of
   portfolio charts.
5. Tooltips **enhance, never gate**: a visually-hidden (toggleable) data table
   twin carries every value, and endpoints carry sparse direct labels.
6. Tooltip text set via `textContent` — never innerHTML concatenation.

---

## 5. Interactivity & filtering

### 5.1 Timeframe toggles (Q1 / Q2 / H1 / FY)

**Why:** state-driven chart morphing is the hardest thing in the brief — landing
it is the difference between "rendered a chart" and "owns a render pipeline."

**Falls short:** CSS transitions on the `d` attribute (unsupported in Safari —
it just snaps) or dash-offset tricks (wrong tool). Also: Q1 has 3 points, FY has
12 — naive interpolation between different point counts breaks.

**→ 10/10:**
1. **Interpolate data, not path strings.** On toggle, resample the old and new
   visible slices to a fixed N (~48) points via linear interpolation, tween
   value arrays in the shared rAF loop, rebuild `d` each frame. Numerically
   correct, Safari-proof, and cheap (48 pts × 4 paths ≈ nothing).
2. React stays out of the hot path: per-frame writes go through
   `pathEl.setAttribute('d', …)` on refs; React state commits once at tween end.
   (The senior move — no 60Hz re-renders.)
3. Y-axis rescales with "nice" ticks; outgoing tick labels fade/slide as
   incoming ones arrive; the axis is part of the morph, not a hard swap.
4. Toggle UI: a segmented control with one sliding indicator (`transform`
   only), `role="radiogroup"`, arrow-key navigation.
5. Every tile, delta ("vs prior period" recomputes to prior quarter/half/year),
   donut, and the transactions list rescope to the same slice — the whole page
   answers to one filter, per §2.1.
6. Timeframe encoded in the URL (`#/demos/aeroscale?tf=q2`) so views are
   shareable/screenshotable — free polish, tiny cost.

### 5.2 Tier category filters

**Why:** layer isolation proves entity-stable rendering — the thing chart
libraries do for you and hand-rollers usually get wrong.

**Falls short:** popping layers in/out, and the classic bug — reassigning
colors after a layer is removed.

**→ 10/10:**
1. **The legend is the filter:** tier chips with checkbox semantics
   (`aria-pressed`), color swatch + name + current share.
2. **Color follows the entity, never the rank.** Enterprise stays `#1c5cab`
   whether 3 layers show or 1. Non-negotiable.
3. Removal tweens the tier's values → 0 while fading its layer opacity, so
   the total line and y-scale reflow smoothly in the same rAF tween — a layer
   *deflates*, it doesn't vanish.
4. **Hover a chip = preview isolation** (other layers dim to ~25%) before
   committing a toggle — cheap, delightful, and shows the state model is real.
5. Minimum one tier active (disable the last chip) — an empty chart is a bug
   you designed in.
6. Tiles/donut recompute against active tiers, tickers tween the delta (§4.3.3).

---

## 6. Technical constraints — how the hand-rolled core stays honest

1. **Scales from scratch:** ~40 lines — linear y with nice-tick generation,
   index-based x, `viewBox` + CSS `width:100%` for responsiveness, a
   `ResizeObserver` on the card recomputing pixel-space paths (memoized on
   `(data, size, filters)`).
2. **60fps discipline:** CSS animates `transform`/`opacity` only; the one
   JS-driven property is path `d`, batched in the single shared rAF loop; no
   layout reads in any frame; the blur echo never animates its filter. Verify
   with a DevTools performance trace before calling it done — claimed 60fps
   with a recorded trace in the README is worth more than the claim.
3. **Dark-mode compliance = the §3 token sheet**, applied via `.aero-root`
   custom properties. Contrast is validator-checked, not eyeballed.
4. **Accessibility floor:** reduced-motion path on every animation, keyboard
   chart navigation (§4.4.4), data-table twin, focus-visible states matching
   the portfolio's existing convention, `aria-label`s on all controls.
5. **No new dependencies.** `package.json` diff: zero. That fact goes in the
   README/case-study copy — it's the headline.
6. **Export-to-PNG** (from the original roster pitch): serialize the SVG →
   `Image` → canvas → `toBlob`. ~30 lines, ships in polish phase, cut first if
   scope pressures.

---

## 7. Build plan

Weekend-to-a-week scope. Each phase is shippable; polish phases cut cleanly.

| Phase | Deliverable | Est. |
|---|---|---|
| **P0 — Shell** | `#/demos/aeroscale` route in `router.ts`, lazy page, `.aero-root` dark token sheet, back-to-portfolio chrome | 0.5d |
| **P1 — Data engine** | `data/aeroscale.ts`: seeded ledger simulation, derived metrics, narrative beats, invariant asserts | 0.5–1d |
| **P2 — Static layout** | Grid, hero figure, 4 stat tiles (full contract incl. sparklines), donut, transactions table — real numbers, no motion yet | 1d |
| **P3 — Chart core** | Scales, paths, gradient fill, glow echo, draw-on mount animation, entrance choreography | 1d |
| **P4 — Hover layer** | Crosshair, multi-series tooltip, snapped dots, keyboard navigation, table twin | 0.5–1d |
| **P5 — Filters** | Timeframe morph engine (shared rAF, resample-and-tween), tier chips with deflate/isolate, ticker retweens, URL state | 1d |
| **P6 — Polish** | Reduced-motion audit, perf trace, export-PNG, mobile pass, anti-pattern checklist sweep, README/case-study copy | 0.5d |

**File map (all under `portfolio/src`):**

```
pages/AeroScaleDashboard/
  index.tsx            # page shell, layout grid, filter row
  theme.css            # .aero-root token sheet (scoped dark mode)
  data.ts              # seeded ledger engine + derived metrics
  data.assert.ts       # dev-mode invariants
  useSharedTicker.ts   # the one rAF loop: tweens for tickers/morphs/sweeps
  Chart.tsx            # scales, paths, draw-on, morph, glow
  ChartHover.tsx       # crosshair, tooltip, keyboard nav
  StatTile.tsx         # label/value/delta/sparkline contract
  TierDonut.tsx        # 3-segment donut, surface gaps, center total
  Transactions.tsx     # ledger-sampled feed, tabular-nums
lib/router.ts          # + demo route (few lines)
App.tsx                # + lazy import branch
```

**Definition of done (the 10/10 checklist):**
- [ ] All palette validator commands pass against `#131a26`
- [ ] Data invariants pass (ARR=MRR×12, tiers sum, churn band, LTV:CAC 3–5×)
- [ ] Draw-on uses `pathLength=1`, runs once, cleans up dash props
- [ ] One shared rAF loop; zero `setInterval`; no React re-render per frame
- [ ] Tickers tween from current value on filter change, no layout shift
- [ ] Timeframe morph is numeric resample-and-tween (works in Safari)
- [ ] Tier colors stable under any filter combination
- [ ] Keyboard: chart navigable, same tooltip on focus, radiogroup toggles
- [ ] `prefers-reduced-motion` honored by every animation
- [ ] Data-table twin present; no value gated behind hover
- [ ] DevTools trace shows no dropped frames during morph + ticker overlap
- [ ] `package.json` dependency diff is empty
- [ ] Swept against dataviz anti-patterns (no dual axis, no recolor-on-filter, no number-on-every-point, no dashed gridlines, no clipped labels)
