# Portfolio Redesign Brief — Restructure, Range-first, Theme Switcher, Scroll Motion

> Build spec for **Fable**. This is a *restructure*, not a rebuild: don't touch
> any standalone demo's internals (`pages/MeridianConfigurator`,
> `pages/AeroScaleDashboard`, `pages/LedgerLens`, `pages/PalisadeGrid`,
> `components/CommandPalette.tsx` + its data/hooks/lib files) except where this
> doc explicitly says to reuse a piece of Meridian's code. Everything in scope
> here is the **portfolio shell**: Hero, Work, About, Lab, Range, Now, Contact,
> Nav, `index.css` tokens, `App.tsx`, and `data/`.

---

## 0. What's wrong today (diagnosis, so the "why" is on record)

The site currently reads Hero → Work → About → Lab → Range → Now → Contact.
Walking it top to bottom:

1. **Hero** embeds `<FlagGame />` — a live Globalio widget — as its whole
   interactive centerpiece.
2. **Work**'s "Index of works" gives Globalio a giant two-column
   `FeaturedPlate` (Plate 01) with three fanned screenshots, while the other
   three projects (Flexyn, REX, Rap Sheet) get small equal-weight grid cards.
3. **Lab** ("skills demonstrated") has three experiments; **two of the three**
   (`Codex Explorer`, `Daily Seed Scrubber`) are lifted straight out of
   Globalio. Only `Swipe Deck` (REX) is a different product.
4. **Range** — the shelf that actually proves range (a 3D configurator, an
   animated dashboard, an AI extraction tool, a 10k-row enterprise grid) — sits
   dead last, after About, before only Now/Contact.

Net effect: one already-shipped game (Globalio) occupies four separate
sections, while the four builds that most directly answer "can this person do
3D / motion / AI-native product / enterprise UI" are the last thing anyone
scrolls to, if they get that far. That's the whole complaint, and it's
correct — the fix is rebalancing space, not adding content.

---

## 1. Locked decisions

1. **Range moves to position 2**, immediately after Hero. It should be the
   first thing after the fold — that's the "variety of skills, immediately"
   signal.
2. **The Meridian card inside Range gets a live embed**, not a static SVG
   thumbnail: the actual R3F watch, idle-spinning, orbit-draggable, in the
   card's thumbnail slot. Click still opens the full `#/demos/meridian`
   configurator (materials/straps/price stay page-only — nothing about the
   full configurator page changes).
3. **Work's flagship treatment moves off Globalio.** All four projects render
   as equal-weight cards (kill the oversized `FeaturedPlate`/`Plate` split, or
   repoint it at Flexyn — see §4). Globalio keeps exactly one appearance here,
   same size as everyone else.
4. **Lab drops to two experiments**, cutting the Globalio-redundant one (see
   §5) so Lab isn't quietly re-proving the same product twice.
5. **About moves up**, right after Range — name, face, one blurb, the
   military-service line stays prominent (it already is; just reposition the
   section).
6. **New order:** Hero → Range → About → Work → Lab → Now → Contact.
7. **Color scheme:** no pure white, no pure black — that's the only fixed
   rule. Build a **theme switcher** (§6) with several presets (none violating
   that rule) plus a live-preview custom mode, gated behind a small gear icon
   in the Nav next to Résumé. This replaces "pick one palette now."
8. **Animation:** go heavy, primarily scroll-driven — real scroll-linked
   transforms and light parallax, not just fade-ins, and not a "cards fly in"
   gimmick. Hand-rolled, matching this whole codebase's zero-dependency
   ethos (no framer-motion/GSAP — every demo and the palette already proved
   that pattern works here). See §7.
9. **Nothing about routing, demo internals, or the command palette changes.**
   This is a shell restructure + a theming layer + a motion layer.

---

## 2. New file tree

### New files
```
portfolio/src/data/themes.ts              # theme preset registry
portfolio/src/hooks/useTheme.ts           # apply/persist the active theme
portfolio/src/components/ThemeSwitcher.tsx # gear-icon popover (presets + custom)
portfolio/src/hooks/useScrollProgress.ts  # scroll-linked reveal (replaces/extends Reveal)
portfolio/src/lib/meridianScene.ts        # (extracted) shared watch-geometry builders
portfolio/src/components/MeridianLive.tsx # small idle-spin/orbit R3F canvas for the Range card
```

### Edited files
```
portfolio/src/App.tsx                 # new section order
portfolio/src/components/Nav.tsx      # gear icon beside Résumé
portfolio/src/components/Range.tsx    # Meridian thumbnail → <MeridianLive />
portfolio/src/components/Work.tsx     # drop/repoint FeaturedPlate, equal-weight grid
portfolio/src/components/Lab.tsx      # drop Codex Explorer, renumber
portfolio/src/components/Reveal.tsx   # scroll-progress-driven, not just fade-in-up
portfolio/src/index.css               # per-theme token blocks + parallax/scroll custom props
portfolio/src/pages/MeridianConfigurator/*  # only to extract shared geometry into meridianScene.ts — no behavior change
```

### Untouched
```
Hero.tsx, About.tsx, Now.tsx, Contact.tsx (content as-is, just reordered)
Everything under pages/AeroScaleDashboard, pages/LedgerLens, pages/PalisadeGrid
CommandPalette.tsx + data/commands.ts + hooks/useCommandPalette.ts + lib/fuzzy.ts + lib/surveyGrid.ts
```

---

## 3. Range — Meridian goes live

`Range.tsx` currently renders each commission's thumbnail from the `THUMBS`
record (`{ '01': AeroThumb, '02': MeridianThumb, '03': LedgerThumb, '04':
PalisadeThumb }`), a flat SVG per card.

1. Extract Meridian's procedural watch-building functions (case, dial, hands,
   bezel, strap geometry — whatever `MeridianConfigurator` currently builds
   inline) into `portfolio/src/lib/meridianScene.ts`, parameterized by the
   current material/strap selection. Update `MeridianConfigurator` to import
   from there instead of building it locally. **No visual or behavioral change
   to the full configurator page** — this is a pure extraction so both places
   share one geometry source.
2. Build `components/MeridianLive.tsx`: a small `<Canvas>` (roughly the same
   footprint as the current thumbnail slot, e.g. `h-40` to `h-48`) rendering
   the watch via `meridianScene.ts` with a fixed default material/strap combo.
   - Idle state: slow constant auto-rotate (same idle-spin behavior already
     proven on the full configurator page — reuse it, don't re-derive it).
   - On pointer: drag-to-orbit (reuse `@react-three/drei`'s `OrbitControls`
     with rotate-only, no pan/zoom-out-of-frame — this is a teaser, not the
     full configurator) — dragging pauses auto-rotate, releasing resumes it
     after a short idle delay.
   - No material/strap swapping controls here — that's the click-through
     page's job. A small caption under the canvas: *"Click to customize —
     swap the case, dial, and strap →"*.
   - Same lazy/idle-render discipline the full configurator already uses
     (don't re-render every frame when nothing's moving) — this canvas sits in
     a scroll shelf, not a full page, so it must be cheap.
3. In `Range.tsx`, replace `MeridianThumb` in the `THUMBS` map with
   `MeridianLive` for `'02'` only. Every other commission keeps its existing
   static SVG thumbnail unchanged.
4. Move the whole `<Range />` section to render second, right after `<Hero
   />`, in `App.tsx`.

---

## 4. Work — equal-weight cards, no single flagship

Current `Work.tsx` destructures `const [flagship, ...rest] = projects` and
gives index 0 (Globalio) the giant `FeaturedPlate` treatment. Two options —
pick whichever is faster to implement cleanly, both satisfy the brief:

- **Option A (recommended): drop `FeaturedPlate` entirely.** Render all four
  projects through the existing `Plate` grid-card component, in a uniform
  `sm:grid-cols-2 lg:grid-cols-4`-style grid (adjust from the current
  three-column `rest` grid now that it holds four, not three). Every project —
  Globalio included — gets the same visual weight.
- **Option B: keep one featured slot, but stop defaulting it to array index 0.**
  Flexyn's own case-study copy already calls itself *"the next flagship of
  this portfolio"* — if a single hero-plate treatment is kept, point it at
  Flexyn instead of Globalio, and reorder the `projects` array (or add an
  explicit `flagship: true` field to `data/projects.ts`) so this isn't
  hardcoded to array position.

Either way: Globalio ends this section with **exactly the same visual
footprint as every other project** — no two-column feature, no fanned
screenshots larger than anyone else's.

---

## 5. Lab — cut the redundant experiment

Drop **Experiment 01, Codex Explorer** — it re-proves the same flags/countries
surface the Hero's `<FlagGame />` already demonstrates live. Keep:

- **Daily Seed Scrubber** (renumber to `01`) — proves "Systems" (determinism),
  a skill nothing else in the Lab shows.
- **Swipe Deck** (renumber to `02`) — proves "Interaction," and it's REX, not
  Globalio.

Update the `{EXPERIMENTS.length} experiments` counter automatically (it
already derives from the array length — no hardcoded "3" to hunt down).
Leave a one-line code comment noting this slot is intentionally open for the
next non-Globalio experiment once one exists — don't backfill with a
placeholder.

---

## 6. Theme switcher (gear icon, presets + live custom)

**Rule:** no theme may be pure white or pure black. Beyond that, ship variety
— this replaces committing to one palette today.

### 6.1 `portfolio/src/data/themes.ts`
```ts
export type ThemeTokens = {
  paper: string; paperTwo: string; ink: string; ink2: string;
  faint: string; line: string; accent: string; accentDeep: string; gold: string;
}
export type ThemePreset = { id: string; name: string; tokens: ThemeTokens }

export const THEMES: ThemePreset[] = [
  { id: 'atlas', name: 'Atlas (default)', tokens: { /* current warm paper/ink/vermilion values, copied verbatim from today's :root */ } },
  { id: 'fatigues', name: 'Fatigues', tokens: { /* dark navy/charcoal base, brass/gold accent — Army + college colors */ } },
  { id: 'slate', name: 'Slate', tokens: { /* cool graphite/steel-blue base, a clearly different accent (e.g. amber or cyan) */ } },
]
export const CUSTOM_THEME_ID = 'custom'
```
Fill in the three presets' exact hex values yourself, honoring the "not pure
white, not pure black" rule and keeping enough ink/paper contrast for text to
stay legible (spot-check against the existing WCAG note in `index.css` §4).

### 6.2 `portfolio/src/hooks/useTheme.ts`
- Reads/writes `localStorage['sj-theme']` — stores either a preset id or,
  for custom, the id plus the three edited hex values.
- Applies the active theme by setting `data-theme="<id>"` on `<html>`.
- For `custom`, additionally pushes the three edited values as inline
  `style.setProperty('--color-paper', …)` overrides on `document.
  documentElement` (inline wins over the `[data-theme]` CSS block).
- Defaults to `atlas` on first visit (no regression for anyone who never
  opens the switcher).

### 6.3 `index.css`
Keep `:root`'s existing token block as the `atlas` default. Add sibling
blocks that re-declare the same variable names:
```css
[data-theme='fatigues'] { --color-paper: …; --color-ink: …; --color-accent: …; /* full token set */ }
[data-theme='slate']    { --color-paper: …; --color-ink: …; --color-accent: …; /* full token set */ }
```
Because every component already consumes these as Tailwind-mapped CSS custom
properties, this reskins the entire site with zero per-component changes.

### 6.4 `components/ThemeSwitcher.tsx`
- A small gear-icon `<button>` in `Nav.tsx`'s desktop `<ul>`, placed beside the
  `⌘K` pill and Résumé link (`aria-label="Theme settings"`).
- Opens a small popover (reuse the same enter/exit animation convention as
  the command palette / mobile menu sheet — `--t-enter`/`--t-exit` keyframes,
  reduced-motion safe): swatch buttons for each preset (Atlas / Fatigues /
  Slate), plus a "Custom" tab with three color `<input type="color">` pickers
  (paper, ink, accent minimum) that **apply live** on change, not on submit —
  Sean needs to see it update in real time to actually evaluate it.
- Selection persists via `useTheme`. This is a testing/dev control for Sean,
  not a marketed visitor feature — unobtrusive, not hidden-secret (a labeled
  gear icon, not an easter egg).

---

## 7. Scroll-driven motion

Keep the zero-dependency rule that's held for every demo and the command
palette so far — hand-roll this, no framer-motion/GSAP.

### 7.1 `hooks/useScrollProgress.ts`
An `IntersectionObserver`-based hook (extending, not replacing, the existing
`Reveal` component's approach) that tracks each section/card's visible ratio
and writes it as a CSS custom property (`--reveal: 0..1`) on the observed
element via `style.setProperty`, updated on intersection-ratio change (not on
every scroll-frame — stay cheap). `Reveal.tsx` consumes this instead of (or
in addition to) its current one-shot fade-in-up, so cards can translate/scale
proportionally to how far into view they are, not just snap to "revealed."

### 7.2 Motion rules
- **Section reveals:** transform-driven (translateY + slight scale, e.g. `0.98
  → 1`), not opacity-only — driven by `--reveal` in CSS, not JS-animated
  values, so it stays scroll-scrubbed (reverses smoothly if you scroll back
  up) rather than a one-shot animation.
- **Parallax:** 2–3 background layers max (e.g. the `dim-line` rules, plate
  motifs) drifting at a different rate than foreground content, using the
  same `--reveal`-style progress at a different multiplier. Subtle — this is
  an editorial/Atlas-styled site, not a game landing page.
- **Idle/ambient motion:** the Meridian Range card's idle spin (§3) is one
  instance of this pattern — extend the instinct, don't invent a second
  mechanism. Existing `springy` button micro-interactions and `hero-in`
  stagger stay as-is; this is additive, not a replacement.
- **Explicitly not:** card-flip/tilt-in gimmicks, bouncy easing, anything that
  reads as playful rather than calm/editorial — matches the `.coord`/
  `.annotation`/dim-line "survey plate" visual language already established.
- **Reduced motion:** every new keyframe/transform gets a
  `prefers-reduced-motion: reduce` no-op, same as everywhere else in this
  codebase.

---

## 8. Build order

1. Extract `meridianScene.ts`; confirm the full Meridian configurator page
   still renders and behaves identically after the extraction (regression
   check before building anything new on top of it).
2. Build `MeridianLive.tsx`; wire it into `Range.tsx`'s `THUMBS` map.
3. Reorder `App.tsx`: Hero → Range → About → Work → Lab → Now → Contact.
4. Rework `Work.tsx` (equal-weight grid — Option A or B from §4).
5. Trim `Lab.tsx` to two experiments.
6. Build the theme system (§6): `data/themes.ts`, `useTheme.ts`, `index.css`
   token blocks, `ThemeSwitcher.tsx`, Nav gear icon.
7. Build `useScrollProgress.ts`, extend `Reveal.tsx`, add parallax layers.
8. `npm run build` clean; `npm run smoke` — all existing suites must still
   pass (Meridian's own smoke especially, given the extraction in step 1).
   Add or extend smoke coverage for: new section order (`#work`/`#about` etc.
   still resolve to the right section), the Meridian Range card renders a
   `<canvas>` and is draggable, and the theme switcher changes `data-theme`
   and persists across reload.
9. Commit, stop for review — same discipline as every prior demo in this
   repo: don't touch `main`, don't deploy.

---

## 9. Definition of done

- Section order is Hero → Range → About → Work → Lab → Now → Contact.
- The Meridian card in Range is a live, idle-spinning, orbit-draggable
  `<canvas>`, not a static SVG — clicking it still opens the full
  configurator, which behaves identically to before the geometry extraction.
- Work shows all four projects at equal visual weight; Globalio no longer
  gets a double-wide feature treatment.
- Lab has two experiments, neither of which is Globalio's Codex Explorer.
- A gear icon in Nav opens a theme switcher with at least three presets (none
  pure white, none pure black) plus a live-preview custom mode; the choice
  persists across reloads.
- Scroll motion is real (transform-driven, scroll-scrubbed, reversible) with
  light parallax, not a one-shot fade-in; nothing is cards-flying-in; reduced
  motion is honored everywhere new.
- `npm run build` and `npm run smoke` both pass, including regression
  coverage on Meridian's own demo after the geometry extraction.
