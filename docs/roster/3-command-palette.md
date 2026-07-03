# Roster 3 — Command Palette (⌘K)

> Build spec for **Fable**. This document is exhaustive on purpose. Every
> decision is made, every file is named, every module is written out
> paste-ready. Do **not** design anything yourself — copy the code in §7 and
> the diffs in §5 verbatim, adjusting only if a path genuinely differs.

---

## 0. Identity

- **Feature name:** **Atlas Command Palette** (internal id `cmdk`).
- **One-liner:** A hand-rolled ⌘K command palette baked into the live
  portfolio — jump to any section, open any Range demo, copy the email,
  download the résumé, and flip on a cartographic "survey grid" — all from the
  keyboard, styled in the site's warm Atlas paper theme.
- **Trigger keys:**
  - `⌘K` (macOS) **and** `Ctrl+K` (Windows/Linux) — bind **both**, always,
    regardless of detected OS.
  - `/` — casual secondary trigger (GitHub/Discord style). Fires **only** when
    focus is **not** in an input/textarea/select/contenteditable **and** no
    modifier key (⌘/Ctrl/Alt) is held.
- **Where it lives:** Global on the **main light site** and the **case-study
  pages** (anywhere `<Nav />` renders). It does **not** mount on the standalone
  demo routes (`#/demos/*`), which bring their own chrome.

---

## 1. Locked decisions

1. **Real feature, not a faked demo.** It operates on the actual site — the
   commands really navigate, really copy, really download.
2. **Triggers:** `⌘K` + `Ctrl+K` (both, unconditionally) + `/` (guarded, see §0).
3. **Actions shipped:** jump to any page section; open any Range demo directly
   (typing `watch`/`meridian` → Meridian, `aeroscale`/`dashboard` → AeroScale);
   open a case study; copy email; download résumé; toggle the **Survey Grid**
   easter egg.
4. **No search library.** The fuzzy matcher is **hand-rolled** (§7.1). Do not
   add `cmdk`, `kbar`, `fuse.js`, or any dependency. The hand-rolling is the
   craft signal — that is the whole point.
5. **No full-text search.** The site is too small. Items are made findable by
   **keyword aliases** on each command instead.
6. **Atlas theme, not a dark palette.** Paper surface, ink text, vermilion
   accent on the active row, hairline `--color-line` borders. Uses the site's
   existing `@theme` tokens — never a scoped dark system.
7. **Enter/exit animation echoes the mobile menu-sheet pattern** (`sheet-in` /
   `sheet-out` + staggered links). Every animation has a
   `prefers-reduced-motion` out.
8. **Full a11y:** `role="dialog"` (modal) wrapping a combobox+listbox, focus
   trap, Esc closes and restores focus, background scroll-locked, click-outside
   closes, live-region result-count announcements.
9. **Discovery affordance:** a small `⌘K` pill in the desktop Nav and a search
   icon tap-target on mobile — both open the same palette.
10. **Not a Range "Commission" card** — see §2 for the argument. It is a nav
    feature with, at most, a one-line mention.

---

## 2. Positioning & hiring signal

Every other roster item is a standalone demo that shows a *domain* (a
dashboard, a configurator, a game). This one shows something different and
arguably rarer: **taste in developer-facing UX and the discipline to build a
"boring" power-user primitive correctly.** A command palette is the kind of
feature that separates people who *use* tools from people who *build* tools.
The signal to a hiring manager:

- **Craft under the hood.** A from-scratch fuzzy matcher with real scoring
  (subsequence, contiguous runs, word-boundary, earliness) and match
  highlighting — not an `npm install`. It says "I understand the algorithm, I
  didn't just wire up a library."
- **Accessibility fluency.** Correct combobox+listbox+dialog ARIA, focus
  trapping, focus restoration, `aria-activedescendant` roving, live-region
  announcements, reduced-motion. This is the hardest part of the widget and the
  part most people skip.
- **Product judgment.** Dogfooding — the palette actually runs the portfolio.
  Keyword aliases instead of over-engineered full-text search. A tasteful
  easter egg in the site's own voice. Knowing what *not* to build.
- **Cross-platform correctness.** Both `⌘K` and `Ctrl+K`, plus a guarded `/`
  that respects form fields. The details that betray whether someone has
  actually shipped this before.

### The Range-card decision (JUSTIFIED)

**Recommendation: NOT a full openable Range "Commission" card. Keep it as a
nav affordance plus, optionally, a single annotation line in the Range
section.** Reasoning:

- The Range shelf is a gallery of **standalone, openable products** (AeroScale,
  Meridian) that live at their own routes with their own chrome. The palette is
  the opposite: it has **no route and no standalone surface** — its entire
  value is being ambient and global. Forcing it into a "card you click to open"
  contradicts what it *is* and teaches visitors the wrong mental model.
- The palette is **self-demonstrating**. The `⌘K` pill in the Nav is a
  permanent, discoverable invitation on every page. A card would be redundant
  signage for a feature that already advertises itself.
- A card implies a demo you *enter and leave*. The palette should be triggered
  in-context, over whatever the visitor is already looking at. A card breaks
  that.
- **Optional, low-cost nod:** if Sean wants the craft called out for recruiters
  who scan visually, add **one annotation line** near the Range heading, e.g.
  a `.coord`/`.annotation`-styled aside: `⌘K — this site runs on a command
  palette. Press it.` This is provided as an optional diff in §5.4; it is *not*
  a Range card and adds no new openable surface.

Net: **a nav pill + mobile tap target + one optional annotation line.** No
Commission card.

---

## 3. File tree

### New files
```
portfolio/src/lib/fuzzy.ts                 # hand-rolled matcher + highlight + dev assert
portfolio/src/lib/surveyGrid.ts            # easter-egg toggle
portfolio/src/data/commands.ts             # typed Command registry (data)
portfolio/src/hooks/useCommandPalette.ts   # module opener singleton + typing-guard helper
portfolio/src/components/CommandPalette.tsx # the dialog/combobox/listbox component
```

### Edited files
```
portfolio/src/App.tsx        # mount <CommandPalette /> on home + case-study branches
portfolio/src/components/Nav.tsx  # desktop ⌘K pill + mobile search tap-target
portfolio/src/index.css      # palette enter/exit keyframes + .survey-grid styles
portfolio/src/components/Range.tsx  # (OPTIONAL, §5.4) one annotation line
```

### Reused as-is (import, do not modify)
```
portfolio/src/lib/router.ts        # navigate()
portfolio/src/data/site.ts         # site.email, site.github, site.resumeUrl
portfolio/src/hooks/useBodyLock.ts # scroll lock (already used by Nav)
```

---

## 4. Styling

All colors come from the existing Atlas `@theme` tokens in `index.css`
(`--color-paper`, `--color-ink`, `--color-accent`, `--color-line`, …). Use the
Tailwind color utilities that map to them: `bg-paper`, `text-ink`,
`text-ink-2`, `text-faint`, `border-line`, `text-accent`, `bg-accent`,
`text-paper`, plus `font-display`, `font-mono`, and the `.coord` /
`.annotation` utility classes.

### 4.1 Surface & layout (built into the component markup in §7.4)

- **Backdrop:** `fixed inset-0 z-[80]` with `bg-ink/30 backdrop-blur-[2px]`.
  Class `palette-overlay` (or `palette-overlay-out` while closing).
- **Panel:** centered near the top — `fixed left-1/2 top-[12vh] z-[90]
  w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2`. Surface `bg-paper`, border
  `border border-line`, `rounded-xl`, `shadow-[0_30px_80px_-32px_rgba(33,27,18,0.5)]`,
  `overflow-hidden`. Class `palette-panel` (or `palette-panel-out`).
- **Input row:** `border-b border-line`, a leading mono `‹›`/search glyph in
  `text-faint`, an `<input>` that is `bg-transparent text-ink placeholder:text-faint`,
  `text-base`, `outline-none`, `px-4 py-3.5`.
- **Group heading:** `.annotation` (small-caps, `text-faint`) with `px-4 pt-3 pb-1`.
- **Option row (idle):** `text-ink-2`, `px-4 py-2.5`, `flex items-center gap-3`,
  a `.coord` right-aligned hint in `text-faint`.
- **Option row (active — `aria-selected`):** `bg-accent text-paper`, the hint
  becomes `text-paper/70`. This is the vermilion active row.
- **Match highlight:** matched characters wrapped in
  `<mark class="bg-transparent text-accent font-semibold">` on idle rows; on the
  **active** (vermilion) row highlight is `underline decoration-paper/60
  underline-offset-2` (so it stays legible on the accent fill — do **not** use
  `text-accent` there).
- **Footer hint row:** `border-t border-line px-4 py-2.5`, `.coord` text,
  `flex items-center justify-between`. Left: `↑↓ navigate · ↵ open · esc close`.
  Right: the live toast (`Email copied ✓`) or a count.
- **Empty state:** centered `text-faint` `py-10`, `.coord`, e.g.
  `no commands match "<query>"`.

### 4.2 Enter/exit animation (echoes the menu-sheet pattern)

Append to `portfolio/src/index.css` (near the existing `menu-sheet` block):

```css
/* ============================================================
   Command palette (⌘K) — overlay fades, panel drops in from the
   top like a survey plate settling; both leave a touch faster.
   Mirrors the mobile menu-sheet enter/exit choreography.
   ============================================================ */
@keyframes palette-overlay-in  { from { opacity: 0; } }
@keyframes palette-overlay-out { to   { opacity: 0; } }
@keyframes palette-panel-in {
  from { opacity: 0; transform: translate(-50%, -10px) scale(0.98); }
}
@keyframes palette-panel-out {
  to   { opacity: 0; transform: translate(-50%, -6px) scale(0.985); }
}
.palette-overlay     { animation: palette-overlay-in  var(--t-enter) var(--ease-out) both; }
.palette-overlay-out { animation: palette-overlay-out var(--t-exit)  var(--ease-out) both; }
.palette-panel       { animation: palette-panel-in    var(--t-enter) var(--ease-out) both; }
.palette-panel-out   { animation: palette-panel-out   var(--t-exit)  var(--ease-out) both; }

/* Result rows stagger in on open, like menu-link — capped so long lists
   never feel slow. Uses the same --stagger custom-prop convention. */
@keyframes palette-row-in { from { opacity: 0; transform: translateY(6px); } }
.palette-row {
  opacity: 0;
  animation: palette-row-in var(--t-feedback) var(--ease-out) both;
  animation-delay: var(--stagger, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  .palette-overlay, .palette-overlay-out,
  .palette-panel,   .palette-panel-out,
  .palette-row { animation: none; opacity: 1; transform: none; }
}
```

> The panel `transform` keeps the `-50%` X-centering inside the keyframe so the
> animation composes with the `-translate-x-1/2` layout without fighting it.
> (The element's own class also sets `-translate-x-1/2`; during the animation
> the keyframe's `transform` wins, and it preserves `-50%` X, so there is no
> jump.)

### 4.3 Survey-grid easter egg styles

Also append to `portfolio/src/index.css`:

```css
/* ============================================================
   Survey Grid — the ⌘K easter egg. A faint cartographic
   graticule washes over the whole page with corner coordinate
   ticks, as if the site were laid out on a surveyor's sheet.
   Toggled by adding `.survey-grid` to <html>. Esc removes it.
   ============================================================ */
.survey-grid::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  background-image:
    linear-gradient(to right,  rgba(189, 58, 28, 0.10) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(189, 58, 28, 0.10) 1px, transparent 1px),
    linear-gradient(to right,  rgba(133, 123, 99, 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(133, 123, 99, 0.16) 1px, transparent 1px);
  background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px;
  animation: survey-in var(--t-enter, 250ms) var(--ease-out, ease) both;
}
.survey-grid::after {
  content: "N 42.5047°  ·  W 71.0728°  ·  ATLAS SURVEY — press esc to clear";
  position: fixed;
  bottom: 0.75rem;
  right: 0.9rem;
  z-index: 41;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-paper) 82%, transparent);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-line);
  border-radius: 3px;
  animation: survey-in var(--t-enter, 250ms) var(--ease-out, ease) both;
}
@keyframes survey-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .survey-grid::before, .survey-grid::after { animation: none; }
}
```

> The coordinates `N 42.5047° · W 71.0728°` are Wakefield, MA (from
> `site.location`). Real place, cartographic voice.

---

## 5. Integration diffs

### 5.1 `portfolio/src/App.tsx` — mount once, on the non-demo branches

Add the import:

```tsx
import { CommandPalette } from './components/CommandPalette'
```

In the **case-study** branch, add `<CommandPalette />` right before `<Footer />`:

```tsx
  if (CasePage) {
    return (
      <>
        <Nav />
        <main aria-label="Case study">
          <Suspense
            fallback={
              <div className="grid min-h-svh place-items-center">
                <span className="coord">loading plate…</span>
              </div>
            }
          >
            <CasePage />
          </Suspense>
        </main>
        <CommandPalette />
        <Footer />
      </>
    )
  }
```

In the **home** branch, add `<CommandPalette />` right before `<Footer />`:

```tsx
      <main aria-label="Portfolio">
        <Hero />
        <Work />
        <About />
        <Lab />
        <Range />
        <Now />
        <Contact />
      </main>
      <CommandPalette />
      <Footer />
    </>
```

> Do **not** add it to the `demo` branch — demos are standalone and get no
> palette. `<CommandPalette />` renders `null` when closed, so it is cheap to
> keep mounted; it installs the global key listener via its own effect.

### 5.2 `portfolio/src/components/Nav.tsx` — the desktop ⌘K pill

Add the import at the top:

```tsx
import { openCommandPalette } from '../hooks/useCommandPalette'
```

In the desktop `<ul className="hidden items-center gap-8 md:flex">`, insert this
`<li>` **before** the Résumé `<li>`:

```tsx
            <li>
              <button
                id="cmdk-pill"
                type="button"
                onClick={() => openCommandPalette()}
                aria-label="Open command palette"
                aria-keyshortcuts="Meta+K Control+K"
                className="springy hidden items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-ink-2 hover:border-accent hover:text-accent lg:inline-flex"
              >
                <span className="text-sm font-medium">Search</span>
                <kbd className="coord rounded border border-line px-1.5 py-0.5 text-[0.65rem] leading-none">
                  ⌘K
                </kbd>
              </button>
            </li>
```

### 5.3 `portfolio/src/components/Nav.tsx` — the mobile search tap-target

In the header, the mobile burger `<button>` is the last child of `<nav>`. Wrap
the burger and a new search button in a small flex group, or simply insert this
search button **immediately before** the burger `<button ref={burgerRef} …>`:

```tsx
          <button
            type="button"
            onClick={() => openCommandPalette()}
            aria-label="Open command palette"
            className="mr-1 p-1 text-ink md:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
```

> Both Nav buttons call the same `openCommandPalette()` singleton (§7.3). The
> `id="cmdk-pill"` on the desktop button is the focus-restore fallback target
> (see §7.4) when the original trigger element is gone.

### 5.4 (OPTIONAL) `portfolio/src/components/Range.tsx` — one annotation line

Only if Sean wants the craft called out in the Range section. Place near the
Range heading (match the surrounding markup; this is a standalone aside):

```tsx
      <p className="annotation mt-2">
        <span className="coord text-accent">⌘K</span> — this site runs on a
        command palette. Press it.
      </p>
```

This is the *entire* Range integration. **No Commission card.** (See §2.)

### 5.5 How it reads real content from `src/data`

- `commands.ts` imports `{ site }` from `../data/site` and uses:
  - `site.email` → `sjoudrie@gmail.com` (copy-email action + mailto fallback).
  - `site.github` → `https://github.com/SeanJoudrie` (open GitHub action).
  - `site.resumeUrl` → `resume.pdf` (download résumé, resolved against
    `import.meta.env.BASE_URL` = `/SeanJoudrie/`).
  - `site.location` → `Wakefield, MA` (informs the survey-grid coordinates,
    already hard-coded in the CSS).
- Section ids (`work`, `about`, `skills`, `range`, `now`, `contact`) and route
  slugs (`#/work/globalio`, `#/work/rex`, `#/work/flexyn`, `#/demos/aeroscale`,
  `#/demos/meridian`) are the real anchors used by `Nav.tsx` and `router.ts`.

---

## 6. The command registry (complete)

Groups: `'Pages'` | `'Demos'` | `'Actions'`. 16 commands. Real sections, real
demos, real case studies, real contact data, keyword aliases for fuzzy finding.

| id | group | title | route/action | keyword aliases |
|----|-------|-------|--------------|-----------------|
| `home` | Pages | Go to top | scroll top | home, top, intro, hero, start |
| `work` | Pages | Work | `#work` | projects, portfolio, case studies, builds, ships |
| `about` | Pages | About | `#about` | bio, sean, who, background, story |
| `lab` | Pages | Lab | `#skills` | experiments, playground, skills, sandbox, lab |
| `range` | Pages | Range | `#range` | demos, shelf, showcase, gallery |
| `now` | Pages | Now | `#now` | current, today, status, up to |
| `contact` | Pages | Contact | `#contact` | hire, reach, get in touch, message, hello |
| `cs-globalio` | Pages | Globalio case study | `#/work/globalio` | geography, game, globe, daily challenge, prng, read |
| `cs-rex` | Pages | REX case study | `#/work/rex` | movies, tv, swipe, recommendation, tmdb, read |
| `cs-flexyn` | Pages | Flexyn case study | `#/work/flexyn` | fitness, workout, social, supabase, xp, read |
| `demo-aeroscale` | Demos | Open AeroScale dashboard | `#/demos/aeroscale` | dashboard, analytics, charts, saas, metrics, ui |
| `demo-meridian` | Demos | Open Meridian configurator | `#/demos/meridian` | watch, configurator, product, customizer, 3d, meridian |
| `copy-email` | Actions | Copy email address | copy `site.email` | email, mail, contact, address, sjoudrie, clipboard |
| `download-resume` | Actions | Download résumé | `resume.pdf` | cv, resume, pdf, hire, download |
| `open-github` | Actions | Open GitHub | `site.github` | code, repos, source, git, profile |
| `survey-grid` | Actions | Toggle survey grid | easter egg | grid, graticule, map, overlay, coordinates, secret, cartography |

Full paste-ready registry is §7.2.

---

## 7. Complete modules (paste-ready)

### 7.1 `portfolio/src/lib/fuzzy.ts` — hand-rolled matcher + highlight + dev assert

```tsx
// portfolio/src/lib/fuzzy.ts
//
// A hand-rolled fuzzy subsequence matcher. No dependency — the point is the
// algorithm. Given a query and a target string it decides whether the query is
// a subsequence of the target and, if so, scores the quality of that match:
//
//   +1   base, per matched character
//   +5   contiguous-run bonus (this match sits right after the previous one)
//   +8   word-boundary / CamelCase-boundary bonus (start of a word)
//   +0..3 earliness bonus (matches near the front of the target score higher)
//   +0..10 density bonus (shorter targets that the query nearly fills)
//
// The matcher is greedy (first-occurrence). For a registry of ~16 short
// strings this is more than good enough and stays trivially fast; a full
// Needleman–Wunsch DP would be over-engineering here.

export type MatchResult = {
  matched: boolean
  score: number
  /** Indices in `target` that matched query characters (for highlighting). */
  positions: number[]
}

const BOUNDARY = /[\s\-_/.:,]/

function isWordBoundary(target: string, i: number): boolean {
  if (i === 0) return true
  const prev = target[i]! // char at i
  const before = target[i - 1]!
  if (BOUNDARY.test(before)) return true
  // CamelCase boundary: lower/digit followed by an uppercase letter.
  const beforeIsLower = before === before.toLowerCase() && before !== before.toUpperCase()
  const hereIsUpper = prev === prev.toUpperCase() && prev !== prev.toLowerCase()
  return beforeIsLower && hereIsUpper
}

export function fuzzyMatch(query: string, target: string): MatchResult {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return { matched: true, score: 0, positions: [] }
  if (q.length > target.length) return { matched: false, score: 0, positions: [] }

  const t = target.toLowerCase()
  const positions: number[] = []
  let score = 0
  let qi = 0
  let prevMatch = -2 // so the first match is never "contiguous"

  for (let ti = 0; ti < target.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue

    let charScore = 1
    if (prevMatch === ti - 1) charScore += 5 // contiguous run
    if (isWordBoundary(target, ti)) charScore += 8 // start-of-word / CamelCase
    charScore += Math.max(0, 3 - Math.floor(ti / 4)) // earliness

    score += charScore
    positions.push(ti)
    prevMatch = ti
    qi++
  }

  if (qi < q.length) return { matched: false, score: 0, positions: [] }

  // Density: reward targets the query nearly fills, so "lab" ranks "Lab"
  // above "Flag Lab Bench".
  score += Math.max(0, 10 - (target.length - q.length))
  return { matched: true, score, positions }
}

/** Split a label into segments for rendering, marking matched runs. */
export type Segment = { text: string; hit: boolean }

export function highlightSegments(label: string, positions: number[]): Segment[] {
  if (positions.length === 0) return [{ text: label, hit: false }]
  const hit = new Set(positions)
  const segs: Segment[] = []
  let buf = ''
  let bufHit = hit.has(0)
  for (let i = 0; i < label.length; i++) {
    const h = hit.has(i)
    if (h === bufHit) {
      buf += label[i]
    } else {
      if (buf) segs.push({ text: buf, hit: bufHit })
      buf = label[i]!
      bufHit = h
    }
  }
  if (buf) segs.push({ text: buf, hit: bufHit })
  return segs
}

// ---- Dev-only self-check (tree-shaken out of production builds) ----------
if (import.meta.env.DEV) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) console.error('[fuzzy] assertion failed:', msg)
  }
  // Empty query matches everything with score 0.
  assert(fuzzyMatch('', 'Work').matched, 'empty query matches')
  // Subsequence match.
  assert(fuzzyMatch('wk', 'Work').matched, '"wk" ⊆ "Work"')
  // Non-subsequence fails.
  assert(!fuzzyMatch('zzz', 'Work').matched, '"zzz" ⊄ "Work"')
  // Longer-than-target fails.
  assert(!fuzzyMatch('working', 'Work').matched, 'over-length fails')
  // Boundary/contiguous beats scattered: "cs" scores higher on "Case Study"
  // (both at word starts) than on "Chaos Slush".
  assert(
    fuzzyMatch('cs', 'Case Study').score > fuzzyMatch('cs', 'Chaos Slush').score,
    'word-boundary match outranks scattered match',
  )
  // Exact prefix outranks a mid-string match: "me" on "Meridian" > on "Home".
  assert(
    fuzzyMatch('me', 'Meridian').score > fuzzyMatch('me', 'Home').score,
    'earliness/boundary favors the prefix',
  )
  // Highlight positions land on the matched chars.
  const r = fuzzyMatch('mer', 'Meridian')
  assert(r.positions.join(',') === '0,1,2', 'positions track the match')
}
```

### 7.2 `portfolio/src/data/commands.ts` — the registry (data)

```tsx
// portfolio/src/data/commands.ts
import { navigate } from '../lib/router'
import { site } from './site'
import { toggleSurveyGrid } from '../lib/surveyGrid'

export type CommandGroup = 'Pages' | 'Demos' | 'Actions'

/** Passed to every command's perform() so the command decides whether to
 *  close the palette and/or surface a toast — the component stays dumb. */
export type CommandContext = {
  /** Play the exit animation and close, restoring focus to the trigger. */
  close: () => void
  /** Show a transient line in the footer + announce it to screen readers. */
  toast: (message: string) => void
}

export type Command = {
  id: string
  title: string
  group: CommandGroup
  keywords: string[]
  /** Right-aligned meta shown in `.coord` style (e.g. "#work", ".pdf"). */
  hint?: string
  perform: (ctx: CommandContext) => void
}

/** Jump to an on-page section the same way Nav's <a href="#id"> does: set the
 *  hash and let the browser smooth-scroll. Works from case-study routes too —
 *  changing the hash re-renders home, then App's effect scrolls to the id. */
function goSection(id: string) {
  window.location.hash = id
}

function downloadResume() {
  const a = document.createElement('a')
  a.href = `${import.meta.env.BASE_URL}${site.resumeUrl}` // /SeanJoudrie/resume.pdf
  a.download = 'Sean-Joudrie-Resume.pdf'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function copyEmail(ctx: CommandContext) {
  try {
    await navigator.clipboard.writeText(site.email)
    ctx.toast(`Copied ${site.email} ✓`)
  } catch {
    // Clipboard blocked (insecure context / permissions) — fall back to mailto.
    window.location.href = `mailto:${site.email}`
    ctx.close()
  }
}

export const commands: Command[] = [
  // ---- Pages ----
  {
    id: 'home', title: 'Go to top', group: 'Pages', hint: 'top',
    keywords: ['home', 'top', 'intro', 'hero', 'start'],
    perform: (ctx) => {
      ctx.close()
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    },
  },
  {
    id: 'work', title: 'Work', group: 'Pages', hint: '#work',
    keywords: ['projects', 'portfolio', 'case studies', 'builds', 'ships'],
    perform: (ctx) => { ctx.close(); goSection('#work') },
  },
  {
    id: 'about', title: 'About', group: 'Pages', hint: '#about',
    keywords: ['bio', 'sean', 'who', 'background', 'story'],
    perform: (ctx) => { ctx.close(); goSection('#about') },
  },
  {
    id: 'lab', title: 'Lab', group: 'Pages', hint: '#skills',
    keywords: ['experiments', 'playground', 'skills', 'sandbox', 'lab'],
    perform: (ctx) => { ctx.close(); goSection('#skills') },
  },
  {
    id: 'range', title: 'Range', group: 'Pages', hint: '#range',
    keywords: ['demos', 'shelf', 'showcase', 'gallery'],
    perform: (ctx) => { ctx.close(); goSection('#range') },
  },
  {
    id: 'now', title: 'Now', group: 'Pages', hint: '#now',
    keywords: ['current', 'today', 'status', 'up to'],
    perform: (ctx) => { ctx.close(); goSection('#now') },
  },
  {
    id: 'contact', title: 'Contact', group: 'Pages', hint: '#contact',
    keywords: ['hire', 'reach', 'get in touch', 'message', 'hello'],
    perform: (ctx) => { ctx.close(); goSection('#contact') },
  },
  {
    id: 'cs-globalio', title: 'Globalio case study', group: 'Pages', hint: 'case study',
    keywords: ['geography', 'game', 'globe', 'daily challenge', 'prng', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/globalio') },
  },
  {
    id: 'cs-rex', title: 'REX case study', group: 'Pages', hint: 'case study',
    keywords: ['movies', 'tv', 'swipe', 'recommendation', 'tmdb', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/rex') },
  },
  {
    id: 'cs-flexyn', title: 'Flexyn case study', group: 'Pages', hint: 'case study',
    keywords: ['fitness', 'workout', 'social', 'supabase', 'xp', 'read'],
    perform: (ctx) => { ctx.close(); navigate('#/work/flexyn') },
  },

  // ---- Demos ----
  {
    id: 'demo-aeroscale', title: 'Open AeroScale dashboard', group: 'Demos', hint: 'demo',
    keywords: ['dashboard', 'analytics', 'charts', 'saas', 'metrics', 'ui'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/aeroscale') },
  },
  {
    id: 'demo-meridian', title: 'Open Meridian configurator', group: 'Demos', hint: 'demo',
    keywords: ['watch', 'configurator', 'product', 'customizer', '3d', 'meridian'],
    perform: (ctx) => { ctx.close(); navigate('#/demos/meridian') },
  },

  // ---- Actions ----
  {
    id: 'copy-email', title: 'Copy email address', group: 'Actions', hint: site.email,
    keywords: ['email', 'mail', 'contact', 'address', 'sjoudrie', 'clipboard'],
    perform: (ctx) => { void copyEmail(ctx) }, // stays open to show the toast
  },
  {
    id: 'download-resume', title: 'Download résumé', group: 'Actions', hint: '.pdf',
    keywords: ['cv', 'resume', 'résumé', 'pdf', 'hire', 'download'],
    perform: (ctx) => { downloadResume(); ctx.close() },
  },
  {
    id: 'open-github', title: 'Open GitHub', group: 'Actions', hint: 'github.com',
    keywords: ['code', 'repos', 'source', 'git', 'profile'],
    perform: (ctx) => {
      ctx.close()
      window.open(site.github, '_blank', 'noopener,noreferrer')
    },
  },
  {
    id: 'survey-grid', title: 'Toggle survey grid', group: 'Actions', hint: 'easter egg',
    keywords: ['grid', 'graticule', 'map', 'overlay', 'coordinates', 'secret', 'cartography'],
    perform: (ctx) => {
      const on = toggleSurveyGrid()
      ctx.toast(on ? 'Survey grid on — press esc to clear' : 'Survey grid off')
      // Keep the palette open only briefly is unnecessary; close and let the
      // overlay stand on its own.
      ctx.close()
    },
  },
]

// ---- Scoring a command against a query (title + keyword aliases) ----------
import { fuzzyMatch } from '../lib/fuzzy'

export type ScoredCommand = { cmd: Command; score: number; positions: number[] }

/** Best fuzzy score across the title and every keyword. Highlight positions
 *  come from the title match only (keywords aren't shown, so nothing to mark).
 *  A keyword-only hit is nudged down slightly so a title hit always wins. */
export function scoreCommand(query: string, cmd: Command): ScoredCommand | null {
  const q = query.trim()
  if (q.length === 0) return { cmd, score: 0, positions: [] }

  const title = fuzzyMatch(q, cmd.title)
  let best = title.matched ? title.score : -Infinity
  let positions = title.matched ? title.positions : []

  for (const kw of cmd.keywords) {
    const r = fuzzyMatch(q, kw)
    if (r.matched && r.score - 3 > best) {
      best = r.score - 3
      if (!title.matched) positions = [] // no title chars to highlight
    }
  }

  if (best === -Infinity) return null
  return { cmd, score: best, positions }
}
```

### 7.3 `portfolio/src/hooks/useCommandPalette.ts` — opener singleton + typing guard

```tsx
// portfolio/src/hooks/useCommandPalette.ts
//
// A tiny module singleton lets the Nav pill (and anything else) open the
// palette without prop-drilling. The CommandPalette component registers its
// own `open()` here on mount and unregisters on unmount. Everything else —
// keyboard triggers, focus, state — lives inside the component (§7.4).

let opener: (() => void) | null = null

/** Called by CommandPalette on mount to expose its open() to the app. */
export function registerPaletteOpener(fn: (() => void) | null): void {
  opener = fn
}

/** Open the palette from anywhere (Nav pill, mobile search button). No-op if
 *  the component isn't mounted (e.g. on a standalone demo route). */
export function openCommandPalette(): void {
  opener?.()
}

/** True when `target` is a text-entry surface, so the "/" trigger must NOT
 *  fire. Covers <input>, <textarea>, <select>, and contenteditable. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}
```

### 7.4 `portfolio/src/components/CommandPalette.tsx` — the dialog

```tsx
// portfolio/src/components/CommandPalette.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBodyLock } from '../hooks/useBodyLock'
import { highlightSegments } from '../lib/fuzzy'
import {
  commands,
  scoreCommand,
  type Command,
  type CommandContext,
  type CommandGroup,
  type ScoredCommand,
} from '../data/commands'
import {
  registerPaletteOpener,
  isTypingTarget,
} from '../hooks/useCommandPalette'

const GROUP_ORDER: CommandGroup[] = ['Pages', 'Demos', 'Actions']

type Grouped = { group: CommandGroup; items: ScoredCommand[] }

/** Build the grouped + flat result model for a query. Flat order === visual
 *  order, so the roving activeIndex maps straight onto rendered rows. */
function computeResults(query: string): { groups: Grouped[]; flat: ScoredCommand[] } {
  const scored: ScoredCommand[] = []
  for (const cmd of commands) {
    const s = scoreCommand(query, cmd)
    if (s) scored.push(s)
  }
  const groups: Grouped[] = []
  const flat: ScoredCommand[] = []
  for (const group of GROUP_ORDER) {
    const items = scored
      .filter((s) => s.cmd.group === group)
      // Empty query → keep registry order (score 0). Otherwise best first.
      .sort((a, b) => (b.score - a.score) || 0)
    if (items.length === 0) continue
    groups.push({ group, items })
    flat.push(...items)
  }
  return { groups, flat }
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')

  const triggerRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useBodyLock(open)

  const { groups, flat } = useMemo(() => computeResults(query), [query])

  // --- open -----------------------------------------------------------------
  const doOpen = useCallback(() => {
    triggerRef.current = (document.activeElement as HTMLElement) ?? null
    setQuery('')
    setActiveIndex(0)
    setToast(null)
    setClosing(false)
    setOpen(true)
  }, [])

  // Expose open() to the Nav pill / mobile button.
  useEffect(() => {
    registerPaletteOpener(doOpen)
    return () => registerPaletteOpener(null)
  }, [doOpen])

  // --- close ----------------------------------------------------------------
  const finishClose = useCallback(() => {
    setOpen(false)
    setClosing(false)
    const t = triggerRef.current
    if (t && document.contains(t) && typeof t.focus === 'function') {
      t.focus()
    } else {
      document.getElementById('cmdk-pill')?.focus()
    }
  }, [])

  const doClose = useCallback(() => {
    if (reducedMotion()) {
      finishClose()
      return
    }
    setClosing(true) // onAnimationEnd → finishClose
  }, [finishClose])

  const onPanelAnimationEnd = (e: React.AnimationEvent) => {
    if (closing && e.target === e.currentTarget) finishClose()
  }

  // --- global hotkeys (always mounted; guard "/" against form fields) -------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')
      if (cmdK) {
        e.preventDefault()
        open ? doClose() : doOpen()
        return
      }
      if (
        e.key === '/' &&
        !open &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault()
        doOpen()
        return
      }
      // Esc clears the survey-grid easter egg when the palette is closed.
      if (
        e.key === 'Escape' &&
        !open &&
        document.documentElement.classList.contains('survey-grid')
      ) {
        document.documentElement.classList.remove('survey-grid')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, doOpen, doClose])

  // --- focus the input on open ----------------------------------------------
  useEffect(() => {
    if (open && !closing) {
      // rAF so the element exists and the browser doesn't fight the animation.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, closing])

  // --- reset selection + announce count on query change ---------------------
  useEffect(() => {
    setActiveIndex(0)
    if (open) {
      setAnnounce(
        flat.length === 0
          ? `No commands match ${query}`
          : `${flat.length} ${flat.length === 1 ? 'command' : 'commands'}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open])

  // --- keep the active row in view ------------------------------------------
  useEffect(() => {
    if (!open) return
    const el = document.getElementById(`cmdk-opt-${activeIndex}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  // --- toast lifecycle ------------------------------------------------------
  const showToast = useCallback((message: string) => {
    setToast(message)
    setAnnounce(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // --- run a command --------------------------------------------------------
  const runCommand = useCallback(
    (cmd: Command) => {
      const ctx: CommandContext = { close: doClose, toast: showToast }
      cmd.perform(ctx)
    },
    [doClose, showToast],
  )

  // --- input keyboard nav ---------------------------------------------------
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const len = flat.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (len) setActiveIndex((i) => (i + 1) % len)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (len) setActiveIndex((i) => (i - 1 + len) % len)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        if (len) setActiveIndex(len - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (len && flat[activeIndex]) runCommand(flat[activeIndex].cmd)
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        doClose()
        break
      case 'Tab':
        // Focus trap: the input is the only focusable element, so keep it here.
        e.preventDefault()
        break
    }
  }

  if (!open) return null

  const activeId = flat.length ? `cmdk-opt-${activeIndex}` : undefined

  return (
    <div
      className={`fixed inset-0 z-[80] bg-ink/30 backdrop-blur-[2px] ${
        closing ? 'palette-overlay-out' : 'palette-overlay'
      }`}
      // Click-outside: only when the backdrop itself is the click target.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) doClose()
      }}
      role="presentation"
    >
      <div
        className={`fixed left-1/2 top-[12vh] z-[90] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-paper shadow-[0_30px_80px_-32px_rgba(33,27,18,0.5)] ${
          closing ? 'palette-panel-out' : 'palette-panel'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onAnimationEnd={onPanelAnimationEnd}
      >
        {/* Input / combobox */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span aria-hidden="true" className="coord text-faint">‹›</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-listbox"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Command palette search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <ul
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-label="Commands"
          className="max-h-[52vh] overflow-y-auto py-1"
        >
          {flat.length === 0 && (
            <li role="presentation" className="fade-in px-4 py-10 text-center">
              <span className="coord text-faint">
                no commands match “{query}”
              </span>
            </li>
          )}

          {groups.map((g) => (
            <li key={g.group} role="presentation">
              <div
                id={`cmdk-group-${g.group}`}
                role="presentation"
                className="annotation px-4 pb-1 pt-3"
              >
                {g.group}
              </div>
              <ul role="group" aria-labelledby={`cmdk-group-${g.group}`}>
                {g.items.map((s) => {
                  const idx = flat.indexOf(s)
                  const active = idx === activeIndex
                  const segs = highlightSegments(s.cmd.title, s.positions)
                  return (
                    <li
                      key={s.cmd.id}
                      id={`cmdk-opt-${idx}`}
                      role="option"
                      aria-selected={active}
                      className={`palette-row mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
                        active ? 'bg-accent text-paper' : 'text-ink-2'
                      }`}
                      style={{ ['--stagger' as string]: `${Math.min(idx, 8) * 18}ms` }}
                      onMouseMove={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault() // keep focus in the input
                        runCommand(s.cmd)
                      }}
                    >
                      <span className="truncate text-sm font-medium">
                        {segs.map((seg, i) =>
                          seg.hit ? (
                            <mark
                              key={i}
                              className={`bg-transparent ${
                                active
                                  ? 'text-paper underline decoration-paper/60 underline-offset-2'
                                  : 'text-accent font-semibold'
                              }`}
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          ),
                        )}
                      </span>
                      {s.cmd.hint && (
                        <span
                          className={`coord shrink-0 ${
                            active ? 'text-paper/70' : 'text-faint'
                          }`}
                        >
                          {s.cmd.hint}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>

        {/* Footer hint row */}
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="coord text-faint">
            ↑↓ navigate · ↵ open · esc close
          </span>
          <span className="coord text-accent" aria-hidden="true">
            {toast ?? ''}
          </span>
        </div>
      </div>

      {/* Screen-reader live region: result counts + toasts. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>
  )
}
```

### 7.5 `portfolio/src/lib/surveyGrid.ts` — the easter egg

```tsx
// portfolio/src/lib/surveyGrid.ts
//
// Toggles a cartographic "survey grid" graticule over the whole page by adding
// `.survey-grid` to <html>. All visuals live in index.css (§4.3). Esc clears
// it (handled by the global key listener in CommandPalette). Returns the new
// on/off state so the caller can toast the right message.

export function toggleSurveyGrid(): boolean {
  return document.documentElement.classList.toggle('survey-grid')
}

export function isSurveyGridOn(): boolean {
  return document.documentElement.classList.contains('survey-grid')
}
```

---

## 8. Interactions (every key)

- **`⌘K` / `Ctrl+K`:** `preventDefault`; toggles — opens if closed, closes if
  open. Bound globally, both combos, any OS.
- **`/`:** opens **only** if closed, no modifier held, and focus is not in an
  input/textarea/select/contenteditable. Otherwise the keystroke is left alone
  (types a literal `/`).
- **Nav pill / mobile search button:** click → `openCommandPalette()` → opens.
- **Type:** filters live; `activeIndex` resets to `0`; live region announces the
  count; matched characters in titles are highlighted.
- **`ArrowDown` / `ArrowUp`:** roving selection across the **flat** list, which
  spans all groups — arrowing past the last Pages row lands on the first Demos
  row. Wraps at both ends.
- **`Home` / `End`:** jump to first / last result.
- **`Enter`:** runs `flat[activeIndex]`. Pages set the hash (smooth-scroll),
  demos/case-studies `navigate()` (View Transition), actions do their thing.
- **Mouse:** `mousemove` over a row sets it active (pointer and keyboard agree);
  `mousedown` runs it (`preventDefault` keeps focus in the input, no flash).
- **`Esc` (palette open):** plays the exit animation, then closes and restores
  focus. `stopPropagation` so it doesn't also hit Nav's Esc handler.
- **`Esc` (palette closed, survey grid on):** clears the survey grid.
- **`Tab` (palette open):** `preventDefault` — focus is trapped on the input
  (the only focusable element inside the dialog).
- **Click outside (backdrop):** closes (only when the backdrop itself is the
  mousedown target, so a drag-select that ends outside doesn't close it).
- **Reduced motion:** no enter/exit keyframes; open/close are instant;
  scroll-to-top uses `auto`.

---

## 9. States

- **Closed:** component returns `null`. Global key listener + opener
  registration stay active via effects.
- **Empty query (just opened):** all 16 commands shown in registry order,
  grouped Pages → Demos → Actions. This *is* the "recent/suggested" state — for
  a 16-item registry, showing everything is the honest, useful default. Row 0
  (`Go to top`) is pre-selected.
- **Typing, matches:** filtered + best-score-first within each group; titles
  highlighted; first result selected.
- **Typing, no match:** empty-state line `no commands match "<query>"`; live
  region says `No commands match <query>`; `Enter` is a no-op.
- **Toast active (copy email / survey toggle):** palette either stays open
  (copy email) or has just closed (survey toggle); the footer shows
  `Copied … ✓` for 1.8s and the live region announces it.
- **Survey grid active:** `.survey-grid` on `<html>` paints the graticule +
  coordinate readout globally, independent of the palette; cleared by Esc or by
  toggling the command again.

---

## 10. Edge cases

- **Trigger while already open:** `⌘K`/`Ctrl+K` toggles → closes. The pill and
  `/` call `doOpen`, which is idempotent-ish (resets query/selection); since the
  pill isn't reachable while the modal covers the page and `/` is suppressed by
  the input focus guard, re-opening-while-open effectively only happens via the
  toggle, which closes. No double-mount.
- **`/` inside a form field:** `isTypingTarget()` returns true for
  input/textarea/select/contenteditable, so `/` types normally and the palette
  does not open. (The palette's own search input is inside the dialog, but `/`
  there is just a character — the global handler early-returns because `open` is
  true.)
- **Focus restore when the trigger navigated away:** on open we snapshot
  `document.activeElement`. On close we only refocus it if
  `document.contains(t)` is still true; otherwise we fall back to
  `#cmdk-pill` (the desktop Nav button). Selecting a command that routes away
  (e.g. a case study) destroys the old trigger — the fallback handles it
  gracefully.
- **Mobile:** the pill is `lg:` only; a search-icon button (`md:hidden`) opens
  the same palette. The panel is `w-[min(40rem,calc(100vw-2rem))]` so it never
  overflows small screens; `max-h-[52vh]` list scrolls. Body scroll is locked
  via `useBodyLock` while open. Tapping a row runs it.
- **Rapid open/close:** the exit animation uses a `closing` flag committed by
  `onAnimationEnd`; if `⌘K` toggles again mid-exit, `doOpen` sets
  `closing=false` and `open=true`, cancelling the exit cleanly. `useBodyLock`
  is driven by `open` only, so the lock never desyncs.
- **SSR / no-window:** this is a pure client SPA (Vite, hash router that already
  touches `window` at import time). `commands.ts` and `router.ts` reference
  `window`/`document` at module scope, which is fine because the app only ever
  runs in the browser. No hydration guards are needed; do **not** add
  `typeof window` checks — they would be dead code and inconsistent with the
  existing `router.ts`.
- **Clipboard unavailable:** `navigator.clipboard.writeText` can reject
  (insecure context, denied permission); `copyEmail` falls back to a `mailto:`
  and closes.
- **View Transition + palette:** demo/case-study commands call `navigate()`,
  which wraps the swap in a View Transition. We `doClose()` (or `ctx.close()`)
  *before* `navigate()` so the palette is already animating out and doesn't get
  captured mid-transition.

---

## 11. Accessibility

- **Dialog:** `role="dialog"` + `aria-modal="true"` + `aria-label="Command
  palette"` on the panel. Backdrop is `role="presentation"`.
- **Combobox:** the `<input>` has `role="combobox"`, `aria-expanded="true"`
  (results are always shown while open), `aria-controls="cmdk-listbox"`,
  `aria-activedescendant` pointing at the active option's id (or omitted when
  the list is empty), `aria-autocomplete="list"`, and an `aria-label`.
- **Listbox / options:** `<ul id="cmdk-listbox" role="listbox">`; each group is
  a nested `<ul role="group" aria-labelledby="cmdk-group-…">` under a small-caps
  heading; each result is `<li role="option" id="cmdk-opt-N"
  aria-selected={active}>`. The active option carries the vermilion fill *and*
  `aria-selected`, so sighted and AT users agree.
- **Roving selection:** focus stays on the input; selection moves via
  `aria-activedescendant` (no per-row `tabindex`). This is the correct
  combobox pattern.
- **Focus trap:** `Tab` is `preventDefault`ed; the input is the only focusable
  element in the dialog.
- **Focus restore:** snapshot on open, restore on close (with the `#cmdk-pill`
  fallback).
- **Scroll lock:** `useBodyLock(open)` freezes the background.
- **Live region:** a visually-hidden `role="status" aria-live="polite"` node
  announces result counts and toasts. Exact spoken text:
  - open / type with results → `"3 commands"` (or `"1 command"`).
  - no match → `"No commands match watchh"`.
  - copy email → `"Copied sjoudrie@gmail.com ✓"`.
  - survey grid → `"Survey grid on — press esc to clear"` / `"Survey grid off"`.
- **Visible focus:** the input inherits the global `:focus-visible` vermilion
  outline; the Nav pill/button too. Keyboard-only operation is fully supported.
- **Reduced motion:** every keyframe (`palette-*`, `palette-row`, `survey-in`)
  has a `prefers-reduced-motion: reduce` no-op; open/close/scroll go instant.

---

## 12. Performance

- **Matcher cost:** `fuzzyMatch` is O(target length) per string, greedy, no
  allocation beyond the positions array. Per keystroke we score 16 commands ×
  (1 title + ≤6 keywords) ≈ ~110 short-string scans — sub-millisecond. No
  memo needed on individual scores.
- **`computeResults` is `useMemo`'d on `query`**, so it only recomputes when the
  query changes, not on every render (e.g. `activeIndex` changes don't re-score).
- **`commands` is a module-level constant** built once at import.
- **Rows** are keyed by `cmd.id`; the stagger delay is capped
  (`Math.min(idx, 8) * 18ms`) so long lists never feel sluggish.
- **`flat.indexOf(s)`** in render is O(n) over ≤16 items — negligible; keeping
  the flat array as the single source of truth is worth the trivial cost.
- **No dependency added** → zero bundle-size hit beyond the ~4 small modules.

---

## 13. Build order (numbered phases + exit criteria)

1. **Matcher.** Create `lib/fuzzy.ts`. Exit: `npm run dev`, open the console, no
   `[fuzzy] assertion failed` logs; `tsc` clean.
2. **Easter egg + CSS.** Create `lib/surveyGrid.ts`; append the palette
   keyframes and `.survey-grid` blocks to `index.css`. Exit: adding
   `document.documentElement.classList.add('survey-grid')` in the console shows
   the graticule; removing it clears it.
3. **Registry.** Create `data/commands.ts`. Exit: `tsc` clean; importing
   `commands` gives 16 entries; `scoreCommand('watch', <meridian>)` is non-null.
4. **Opener hook.** Create `hooks/useCommandPalette.ts`. Exit: `tsc` clean.
5. **Component.** Create `components/CommandPalette.tsx`. Exit: `tsc` clean.
6. **Mount.** Edit `App.tsx` (both non-demo branches). Exit: `⌘K` opens the
   palette on home and on a case-study page; nothing on `#/demos/*`.
7. **Nav affordance.** Edit `Nav.tsx` (desktop pill + mobile button). Exit:
   clicking either opens the palette; the pill shows `⌘K`.
8. **(Optional) Range line.** Edit `Range.tsx` per §5.4.
9. **Polish pass.** Verify highlight colors on the active (vermilion) row are
   legible; verify reduced-motion; verify focus restore. Exit: §14 checklist
   passes; `npm run build` succeeds.

---

## 14. Smoke-test checklist

Add a script `portfolio/scripts/smoke-cmdk.mjs` (playwright-core, `PW_CHROMIUM`,
exit-code ✓/✗, mirroring the existing `smoke-*.mjs`). It must assert:

1. **`⌘K` opens** — `keyboard.press('Meta+k')` → `[role=dialog][aria-label="Command palette"]` visible.
2. **Esc closes** — after open, `Escape` → dialog gone; and `document.activeElement`
   is the `#cmdk-pill` (or the prior trigger).
3. **`Ctrl+K` opens** — `keyboard.press('Control+k')` → dialog visible.
4. **`/` opens outside inputs** — with `<body>` focused, press `/` → dialog opens.
5. **`/` does NOT open in a field** — focus the palette input, close, focus any
   text input on the page, press `/` → no dialog / literal `/` typed. (Simplest:
   open palette, type `/` in its own input — global handler must early-return
   because `open` is true; assert the char registers and no second dialog.)
6. **Typing filters + highlights** — open, type `watch` → exactly one visible
   `[role=option]` whose text contains "Meridian"; assert a `<mark>` exists.
7. **`↑↓` + `Enter` routes** — open, type `aero`, `Enter` → URL hash becomes
   `#/demos/aeroscale`.
8. **Section jump** — open, type `contact`, `Enter` → `location.hash === '#contact'`.
9. **Copy email** — open, type `copy email`, `Enter` → footer shows `Copied` and
   `navigator.clipboard.readText()` equals `sjoudrie@gmail.com` (grant clipboard
   permission in the Playwright context).
10. **Survey grid** — open, type `grid`, `Enter` → `<html>` has class
    `survey-grid`; then `Escape` → class removed.
11. **ARIA present** — assert `[role=combobox]`, `#cmdk-listbox[role=listbox]`,
    and at least one `[role=option][aria-selected]` exist while open.
12. **No page errors** — no `console.error` / `pageerror` across the run
    (this also catches any `[fuzzy] assertion failed`).

Also run the existing smokes to confirm no regressions. Wire the new smoke into
whatever `deploy.yml` runs the others.

---

## 15. Definition of done

- All five new files exist and compile under TS strict; `App.tsx`, `Nav.tsx`,
  `index.css` edited exactly as in §5.
- `⌘K`, `Ctrl+K`, and guarded `/` all open the palette; the Nav pill and mobile
  button open it; nothing mounts on `#/demos/*`.
- Fuzzy filtering works with highlighted matches; keyword aliases resolve
  (`watch`→Meridian, `dashboard`→AeroScale, `cv`→résumé, `grid`→survey).
- Keyboard nav crosses groups; `Enter` routes/acts; `Esc` closes and restores
  focus; `Tab` is trapped; click-outside closes.
- Full ARIA wiring (dialog + combobox + listbox + options + live region);
  visible focus; reduced-motion honored everywhere.
- Copy-email copies real `sjoudrie@gmail.com` with a toast; résumé downloads
  `/SeanJoudrie/resume.pdf`; GitHub opens; survey grid toggles and Esc clears.
- Atlas theming only — paper/ink/vermilion/line tokens, no dark palette.
- `npm run build` succeeds; `smoke-cmdk.mjs` exits ✓; existing smokes still ✓;
  no console errors.

---

## 16. Later / out of scope

- Full-text search over Lab/Work copy (deliberately skipped — site too small).
- Recent-commands history / MRU ordering persisted to `localStorage`.
- Nested/sub-command flows (e.g. "Copy →" submenu of email/GitHub/LinkedIn).
- A dedicated Range "Commission" card (rejected in §2).
- Multi-key chords or a customizable keymap.
- Theming the palette per-route (it is intentionally Atlas-only).
- Analytics on which commands get used.
```
