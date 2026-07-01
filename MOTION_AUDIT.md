# Motion & Flow Audit — Where Subtle Animation Belongs

**Subject:** seanjoudrie.github.io/SeanJoudrie (post-Phase-C build)
**Method:** full source read (`portfolio/src`), interactive click-through of every screen and state at 390px and 1440px, computed-style verification of suspected snap points.
**Principle applied:** motion must clarify, guide, or reward — never decorate. Everything below is transform/opacity only, 150–350 ms unless noted, and every item has a reduced-motion fallback.

---

## Phase 1 — The experience map and its motion gaps

The journey: **load → hero + flag game → index of works → (case study | drawer) → about → lab → now → contact**, plus the mobile menu sheet and the 404. What already moves well: scroll reveals, the fan-open, dim-line draws, spring hovers, the stamp/shake, drawer slide, view transitions, menu-link stagger, header hide/reveal. The gaps are almost all **exits, in-place state changes, and first paint** — the categories entrance-focused systems always miss:

| # | Moment | Current behavior | Verdict |
|---|--------|------------------|---------|
| G1 | **Mobile menu close** | Sheet unmounts the same frame the ✕ is tapped (verified: gone in <50 ms). Links stagger *in*, then the whole thing vanishes *instantly*. | Broken-feeling. P0 |
| G2 | **Mobile menu sheet enter** | Links stagger in, but the sheet container itself appears with no transition — a full-screen surface pops into existence. | Abrupt. P0 |
| G3 | **Seed Scrubber date change** | `key={day}` remounts the flag SVG; flag and option chips swap in the same frame. The core demo of the site's cleverest idea reads as a *cut*. | Abrupt, and it's a showcase. P0 |
| G4 | **Codex Explorer state changes** | Region chips, sort headers, and row hovers have `transition-duration: 0s` (verified) — active-chip fill, row highlight, and the empty state all snap. | Snappy in the bad way. P0 |
| G5 | **Back to the index (case page → home)** | `navigate()` scrolls to top, then an effect `scrollIntoView`s `#work` in the next frame — two scroll positions in two frames. | Flow stutter. P0 |
| G6 | **Copy-email button** | The "COPIED" stamp is wider than "Copy" — the button resizes and its neighbors shift at the exact moment of success. | Feedback that jolts. P0 |
| G7 | **First paint of the hero** | Everything renders at once, fully opaque, zero motion. Sections below all reveal on scroll, so the *one screen everyone sees* is the only one with no entrance language. | Missed tone-setter. P1 |
| G8 | **Flag game result row** | The hint line swaps to stamp + "Keep going" link in one frame (stamp animates, the link does not — it pops). | Half-finished moment. P1 |
| G9 | **Case-study header on direct load** | Deep-linking `#/work/globalio` (no view transition) renders the header statically while body sections reveal on scroll. | Inconsistent. P1 |
| G10 | **Drawer close button / row hovers inside drawer** | Fine (springy + transitions present). | ✓ no action |
| G11 | **Lazy screenshots** | Images pop in when the network delivers them (visible on slow connections in the fan and case study). | P2 |
| G12 | **Specimen motifs (Flexyn/REX/Rap Sheet plates)** | Static SVGs inside a lifting card — the one place a designed placeholder could quietly demonstrate motion. | P2 delight |
| G13 | **Case-study reading progress** | The page is ~5 screens long with no sense of position (the v1 scroll bar was removed site-wide, correctly — but a long article is where it belongs). | P2 |

---

## Phase 2 — Categorized opportunities

- **Entrance & reveal:** G7 (hero first-paint stagger), G9 (case header), G11 (image fade-in). Everything else already has scroll reveals — do **not** add more; the current density is right.
- **Transitions between states/views:** G1/G2 (sheet enter/exit), G5 (back-nav scroll continuity). View transitions already cover route changes.
- **Micro-interactions & feedback:** G4 (chips/sort/rows), G6 (copy stamp shift), G8 (result-row link). Buttons/cards already spring — consistent, keep.
- **Loading & waiting:** G11; the Suspense fallbacks ("loading experiment…") could pulse gently — half-line item, folded into G11's pattern.
- **Attention & guidance:** G3 — the scrubber *is* an attention moment: the whole point is "look, the round changed because the date changed," and a directional slide makes causality visible.
- **Delight:** G12 motif hovers; the existing stamp/fan/flag-pop already carry the delight budget. Add nothing else — restraint is the brand.
- **Empty/success/error:** Codex empty state ("Nothing in the codex matches…") should fade in (part of G4); 404 already has personality.

---

## Phase 3 — Flow & continuity

The site already has an implicit language — `--ease-out cubic-bezier(0.22,1,0.36,1)` for enters, `--spring cubic-bezier(0.34,1.56,0.64,1)` for hands-on feedback — and it's used consistently. Two inconsistencies to fix while implementing:

1. **Exits don't exist as a concept.** Everything that leaves (menu sheet, drawer already OK, stamp, result row) either slides via its own rule or vanishes. Adopt one exit spec: *opacity + small translate, 200 ms, ease-out, ~60% of the enter duration.*
2. **In-place state changes have no tier.** Chips, rows, sort arrows, count text need the "instant feedback" tier (150 ms, plain ease) — visible acknowledgment without perceived latency.

### The unified motion language (add as tokens, use everywhere)

```css
:root {
  /* tiers */
  --t-feedback: 150ms;   /* in-place state: chips, rows, color, borders   */
  --t-enter:    250ms;   /* things appearing: sheet, links, result rows   */
  --t-exit:     200ms;   /* things leaving: always slightly faster        */
  --t-reveal:   550ms;   /* scroll reveals (existing)                     */
  --t-emph:     400ms;   /* one-shot emphasis: stamp, pop, shake (existing) */

  /* curves (existing, now canonical) */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* every enter/exit      */
  --spring:   cubic-bezier(0.34, 1.56, 0.64, 1);/* pointer feedback only */
}
```

Rules: transform/opacity only (nothing below animates layout); stagger step 50–90 ms, never more than 5 steps; springs only respond to the hand (hover/press/drag), never to scroll or load; every rule gets a `prefers-reduced-motion` block where the end state applies instantly.

---

## Phase 4 — The implementation-ready spec

### P0 — fixes things that currently feel broken

**P0-1 · Mobile menu sheet: animated enter + exit** (G1, G2)
`Nav.tsx` + `index.css`. Trigger: open/close. Animates: sheet `opacity` + `translateY(8px)`; links keep their stagger. Timing: enter 250 ms / exit 200 ms, `--ease-out`. Why: a full-screen surface that blinks in/out breaks spatial continuity; a soft rise-and-fade tells the user the page is still underneath. Reduced motion: instant mount/unmount (current behavior).
Implementation — keep the sheet mounted during exit with a `closing` state:

```tsx
const [closing, setClosing] = useState(false)
const close = () => { setClosing(true) }                 // start exit
// on the sheet root:
<div className={`menu-sheet ${closing ? 'menu-sheet-out' : ''}`}
     onAnimationEnd={() => { if (closing) { setOpen(false); setClosing(false); burgerRef.current?.focus() } }}>
```
```css
@keyframes sheet-in  { from { opacity: 0; transform: translateY(8px) } }
@keyframes sheet-out { to   { opacity: 0; transform: translateY(6px) } }
.menu-sheet     { animation: sheet-in var(--t-enter) var(--ease-out) both; }
.menu-sheet-out { animation: sheet-out var(--t-exit) var(--ease-out) both; }
@media (prefers-reduced-motion: reduce) { .menu-sheet, .menu-sheet-out { animation: none } }
```
(With reduced motion, `onAnimationEnd` never fires — close directly when the media query matches.)

**P0-2 · Seed Scrubber: directional swap** (G3)
`SeedScrubber.tsx` + `index.css`. Trigger: prev/next/today. Animates: flag + option chips, `opacity 0→1` + `translateX(∓10px→0)` — direction follows the arrow pressed (next slides in from right, prev from left). Timing: 220 ms `--ease-out`; chips stagger 40 ms. Why: makes *cause → effect* legible — the date moved, so the round moved; this is the demo whose entire message is "watch it change." Reduced motion: instant swap (current).

```tsx
const [dir, setDir] = useState<1 | -1>(1)
// setDay(d => d - 1) → setDir(-1); +1 → setDir(1)
<div key={day} className="seed-swap" style={{ '--dx': `${dir * 10}px` } as React.CSSProperties}>
```
```css
@keyframes seed-swap { from { opacity: 0; transform: translateX(var(--dx, 10px)) } }
.seed-swap { animation: seed-swap 220ms var(--ease-out) both; }
.seed-swap li { animation: seed-swap 220ms var(--ease-out) both; }
.seed-swap li:nth-child(2) { animation-delay: 40ms } /* …3: 80ms, 4: 120ms */
@media (prefers-reduced-motion: reduce) { .seed-swap, .seed-swap li { animation: none } }
```

**P0-3 · Codex Explorer: feedback tier everywhere** (G4)
`CodexExplorer.tsx`. Trigger: chip toggle, sort click, row hover, empty state. Animates: `background-color / border-color / color` at `--t-feedback` (150 ms, plain `ease`); empty-state row fades in at `--t-enter`. Why: the data demo currently answers interaction with a hard cut; 150 ms of color is the difference between "reactive" and "twitchy." Reduced motion: color transitions are non-spatial — keep them (WCAG-safe).

```tsx
// chips + sort buttons + rows — add:
className="… transition-colors duration-150"
// empty state <td> content:
<span className="block animate-[seed-swap_250ms_var(--ease-out)_both]">Nothing in the codex matches…</span>
```

**P0-4 · Back-to-index scroll continuity** (G5)
`router.ts`. Trigger: `navigate('#work')` from the case page. Fix: don't scroll-to-top when the destination is a same-page section — let the section scroll be the only scroll.

```ts
export function navigate(to: string) {
  const isSection = /^#[a-z]+$/.test(to)
  const apply = () => {
    history.pushState(null, '', to)
    flushSync(() => set(to))
    if (!isSection) window.scrollTo(0, 0)   // pages start at top; sections handle themselves
  }
  …
}
```
Why: two scroll positions in two frames reads as a glitch. Reduced motion: unchanged (it's a scroll fix, not an animation).

**P0-5 · Copy button: reserve the stamp's space** (G6)
`Contact.tsx`. Trigger: successful copy. Fix: fixed min-width so the stamp lands *inside* a stable button; the stamp keeps its rotate-in.

```tsx
<button … className="… min-w-24 justify-center inline-flex">
  {copied ? <span className="stamp">Copied</span> : 'Copy'}
</button>
```
Why: success feedback should never push the layout around — the jolt reads as a bug. Reduced motion: stamp already degrades to static.

### P1 — high polish-per-effort

**P1-1 · Hero first-paint stagger** (G7)
`Hero.tsx`. Trigger: initial mount only. Animates: eyebrow → H1 → paragraph → CTAs → flag card, `opacity` + `translateY(10px→0)`, 350 ms each, 60 ms stagger, `--ease-out`. Why: the first screen is currently the only one without the site's entrance language; a one-time 600 ms cascade sets the tone without delaying interaction (buttons are clickable immediately — this is CSS, not gating). Reduced motion: everything at opacity 1 instantly.

```css
@keyframes hero-in { from { opacity: 0; transform: translateY(10px) } }
.hero-in { animation: hero-in 350ms var(--ease-out) both; animation-delay: var(--d, 0ms) }
@media (prefers-reduced-motion: reduce) { .hero-in { animation: none } }
```
```tsx
<span className="hero-in …" style={{'--d':'0ms'}}>…eyebrow…</span>
<h1 className="hero-in …" style={{'--d':'60ms'}}>…
<p  className="hero-in …" style={{'--d':'120ms'}}>…
<div className="hero-in …" style={{'--d':'180ms'}}>…CTAs…
<FlagGame /* wrapper gets --d: 240ms */ />
```

**P1-2 · Flag game result row: link joins the stamp** (G8)
`FlagGame.tsx`. Trigger: answering. Animates: the "Keep going — play Globalio ↗" link, `opacity` + `translateX(-6px→0)`, 250 ms `--ease-out`, delayed 120 ms so the stamp lands first, *then* the eye is guided to the CTA. Why: this is the site's #1 conversion moment — sequence it: verdict → invitation. Reduced motion: link appears instantly.

```tsx
<a … className="… result-link">Keep going — play Globalio ↗</a>
```
```css
@keyframes link-in { from { opacity: 0; transform: translateX(-6px) } }
.result-link { animation: link-in 250ms var(--ease-out) 120ms both }
@media (prefers-reduced-motion: reduce) { .result-link { animation: none } }
```

**P1-3 · Case-study header entrance on direct load** (G9)
`GlobalioCaseStudy.tsx`. Trigger: mount without a view transition (deep link / refresh). Fix: reuse the `hero-in` cascade on the header block (breadcrumb → title → chips → CTA, 60 ms stagger). When a view transition *did* run, the morph owns the moment — so gate it: add the class only when `!document.startViewTransition` or on `performance.navigation`-style first load; simplest robust rule: always apply it — the VT snapshot happens before animation start, so the cascade only ever plays on direct loads. Reduced motion: none.

### P2 — delight / nice-to-have

**P2-1 · Lazy image fade-in** (G11) — `index.css` + shared `onLoad`. Images start `opacity: 0`, add `.img-ready` on load → `opacity: 1` over 250 ms ease. Apply to fan, case-study screens, drawer shots. Reduced motion: keep (opacity-only, non-spatial). Also give the Suspense "loading experiment…" label a 1.6 s `opacity 0.5↔1` pulse.

**P2-2 · Specimen motif hovers** (G12) — `PlateMotif.tsx`. On plate `:hover` (desktop only): Flexyn bars scale up from their baseline (`transform-origin: bottom; scaleY 1→1.06`, 300 ms spring, staggered 40 ms); REX top card tilts +2°; WANTED stamp rotates −2° further. All pure transform, driven by `.plate-lift:hover .motif-*` selectors. Why: placeholders that respond make "capture pending" feel intentional. Reduced motion: none.

**P2-3 · Case-study reading progress** (G13) — thin 2 px `--color-accent` bar, fixed top, `transform: scaleX(var(--progress))` updated via one passive scroll listener (the old `useScrollProgress` hook pattern — it was deleted; 15 lines to restore scoped to the case page). Why: a 5-screen article deserves a sense of position; scoping it to the article keeps the home page clean. Reduced motion: keep — position feedback, not decoration.

### Explicitly rejected (restraint clause)

- More scroll reveals anywhere — density is already at the ceiling.
- Parallax on the paper wash, magnetic buttons, cursor effects — off-brand for "quiet atlas," and cursor work was already deferred in GAP_ANALYSIS P2.
- Animating the codex rows per keystroke — layout-thrashing risk on 197 rows for zero comprehension gain; the count line carries the feedback.
- Nav-underline FLIP slide between items — cost/benefit fails at 4 links.

---

### Performance & a11y guardrails (apply to all of the above)

- Everything specified is `transform`/`opacity`/color — no width/height/top/left anywhere; the copy-button fix *removes* a layout shift.
- No new listeners except P2-3's single passive scroll handler; all staggers are CSS `animation-delay`, not JS timers.
- Every spatial animation carries a `prefers-reduced-motion: reduce` block; color-only feedback (P0-3) intentionally persists — state changes must stay visible to everyone.
- Total added CSS ≈ 60 lines; zero dependencies; bundle impact ≈ nil.

**Suggested order:** P0-1 → P0-4 → P0-5 (the "feels broken" trio), then P0-2/P0-3 (the Lab), then P1s in one pass, P2s opportunistically.
