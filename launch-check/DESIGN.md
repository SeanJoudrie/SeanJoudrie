---
name: Launch Check
description: Pre-flight check for apps built with AI. Instrument panel and departures board; one yellow action per screen.
colors:
  primary: "#ffc700" # = signal: the one next action
  bg: "#eef1f4"
  surface: "#ffffff"
  raised: "#f6f8fa"
  ink: "#0b0e12"
  muted: "#4f5966"
  line: "#d6dce3"
  control: "#7a8591"
  signal: "#ffc700"
  signal-hover: "#ffd633"
  on-signal: "#0b0e12"
  go: "#0f7a45"
  go-bg: "#daf3e5"
  alert: "#c2302a"
  alert-bg: "#fde6e4"
  focus: "#1b64f2"
  dark-bg: "#0b0e12"
  dark-surface: "#141920"
  dark-raised: "#1b222b"
  dark-ink: "#f2f5f8"
  dark-muted: "#9ca6b2"
  dark-line: "#28313b"
  dark-control: "#6d7885"
  dark-go: "#3dd68c"
  dark-go-bg: "#0f2b1d"
  dark-alert: "#ff6b61"
  dark-alert-bg: "#3a1714"
  dark-focus: "#6fa0ff"
  night: "#0b0e12"
  night-2: "#161c24"
  night-line: "#2a333e"
  night-ink: "#f2f5f8"
  night-muted: "#a3adb9"
  night-alert: "#ff6b61"
typography:
  display-xl:
    fontFamily: Archivo
    fontSize: 72px
    fontWeight: 800
    lineHeight: 0.95
    fontVariation: "'wdth' 68"
  display-xl-phone:
    fontFamily: Archivo
    fontSize: 44px
    fontWeight: 800
    lineHeight: 0.95
    fontVariation: "'wdth' 68"
  display-lg:
    fontFamily: Archivo
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.0
    fontVariation: "'wdth' 70"
  display-lg-phone:
    fontFamily: Archivo
    fontSize: 34px
    fontWeight: 800
    lineHeight: 1.0
    fontVariation: "'wdth' 70"
  title:
    fontFamily: Archivo
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.15
    fontVariation: "'wdth' 80"
  subtitle:
    fontFamily: Archivo
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: Archivo
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: Archivo
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.06em
  numeric:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "'tnum'"
rounded:
  md: 8px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  ml: 20px
  lg: 24px
  xl: 32px
  xxl: 40px
  section-sm: 48px
  section: 64px
  section-lg: 80px
components:
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    typography: "{typography.subtitle}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 12px 20px
  button-signal-hover:
    backgroundColor: "{colors.signal-hover}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.md}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.subtitle}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 12px 20px
  choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 12px 16px
  gap-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 16px
  gap-stamp:
    backgroundColor: "{colors.alert-bg}"
    textColor: "{colors.alert}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 4px 8px
  task-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: 16px 0
  flap-tile:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.night-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  runway-light:
    backgroundColor: "{colors.night-line}"
    size: 12px
  runway-light-on:
    backgroundColor: "{colors.signal}"
    size: 12px
  gauge:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.night-ink}"
    typography: "{typography.numeric}"
    size: 240px
  report-header:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-ink}"
    typography: "{typography.display-lg}"
    padding: 48px 24px
---

# Launch Check design

This file is the source of truth for how Launch Check looks and moves. When it and `styles.css`
disagree, change the code to match this file, or change this file on purpose and say why in the
commit. The repo-wide rules in `/CLAUDE.md` ("nothing that looks vibe coded") still apply on top.

## Overview

Launch Check is a **pre-flight check** for apps built with AI. The page should feel like an instrument
panel and a departures board: calm, exact, and readable at a glance. Every screen answers one
question: what's the next thing to do?

Key characteristics:

- **The product is the hero.** The landing page shows a working mini-checklist from the sample plan,
  not a drawing of one.
- **One yellow thing per screen.** Runway yellow means "do this next". If two things are yellow,
  one of them is wrong.
- **Status is always said in words too.** CLEAR, GAP and MUST FIX are written out; colour only
  repeats them.
- **Motion explains.** Every animation shows where something came from, what changed, or what's
  finished. Anything that only decorates gets cut.

## Colors

| Role | Token | Use it for | Never for |
|---|---|---|---|
| Signal | `--signal` #ffc700 | The single next action; answered runway lights; the gauge fill | Decoration, headings, more than one button per screen |
| Go | `--go` | Done, CLEAR, ticked | Buttons |
| Alert | `--alert` | MUST FIX, GAP, errors | Anything that isn't a problem the person must act on |
| Night | `--night`, `--night-2` | The instrument panel: header, hero, report header, step-by-step bar | Long reading text |
| Focus | `--focus` | Keyboard focus ring only | Links or accents |

- Text on `--signal` is always `--on-signal` (ink). Never white on yellow.
- The night panel stays dark in both themes. It is one deliberate device; nothing else ignores the theme.
- `<meta name="theme-color">` matches the top of the page in each theme.
- No gradients, glows or neon. The only "light" effects are runway lights and the gauge, and they
  are flat fills.

## Typography

Two families: **Archivo** (its width axis gives condensed headings) and **JetBrains Mono** (counters,
labels, split-flap tiles). The ramp in the front matter is the whole ramp: eight roles, no one-off sizes.

- Display roles are uppercase, condensed (68-70% width), tight leading. They read like a checklist.
  Use `text-wrap: balance`.
- Body is 17px at 1.6 for reading comfort; `small` is the smallest text anywhere.
- **Labels (mono, uppercase) are rationed: at most one per three sections.** A step's own name is its
  label; "Step 1 of 3" is replaced by the runway-lights progress.
- Every number that can change (counts, costs, percentages, dates) uses `numeric` (tabular figures), so
  columns line up and rolling numbers don't jitter.
- Punctuation: real ellipsis in "Checking…", no em dashes as separators, at most one "·" per line.
- Fonts are preloaded (or self-hosted) so headings don't jump when Archivo arrives.

## Layout

- Phone first: every screen works at 375px before desktop gets polished.
- Two widths only: `--container` (760px) for forms and reading, `--wide` (1120px) for the landing hero
  and the results report header. Left edges line up from section to section.
- Landing sections do **not** repeat one layout. Each band has its own shape: hero with the live
  mini-checklist, one big sourced statistic, a "how it works" shown as the real flow (not three
  numbered boxes), and the start band.
- The 75-step checklist is a **timeline**: steps sit on one vertical rule, with the step's mono counter on
  the left rail. Phases are sections of that rule, not separate boxes.
- Long lists use `content-visibility: auto`. Sheets and the step-by-step deck use
  `overscroll-behavior: contain`. Full-height screens use `100dvh`.

## Tokens the front matter can't hold

- **Theme:** `dark-*` colours replace their light twins under `prefers-color-scheme: dark` or
  `data-theme="dark"`. `night*` colours are the same in both themes.
- **Borders:**
  - `2px` for controls (inputs, choices, buttons)
  - `1px` for dividers (rows, sections, table lines)
  - `4px` for the left status edge of a must-fix or done row
  - nothing else
- **Layout:**
  - container 760px (forms and reading)
  - wide 1120px (landing hero, report header)
  - minimum tap target 48px
- **Motion:**
  - Durations: fast 120ms (colour/border), enter 200ms, exit 150ms, move 400ms, longest single
    animation 700ms. The whole checking sequence stays under 3s.
  - Easing: out `cubic-bezier(0.2, 0.7, 0.2, 1)`; in `cubic-bezier(0.4, 0, 1, 1)`; `back.out(1.4)`
    for the gauge needle only.

## Elevation and depth

One style: a **surface ladder**, no shadows.

- `bg` → `surface` → `raised`, and `night` for the panel. A thing is "above" another because its
  surface is one step up, not because of a shadow.
- Borders mark edges people touch or read across:
  - 2px for controls
  - 1px for dividers
  - a 4px left edge for status rows
- **No boxes inside boxes.** A row inside a card is a divided row, not another bordered box. Sources
  under a step are a plain list.

## Shapes

- One radius: 8px, everywhere.
- The only circles are status lights (runway lights, CLEAR/GAP dots next to their words) and the gauge.
- Icons are line icons at text size; never larger than the text beside them. No emoji as icons.

## Components

- **Signal button:** yellow, ink text, 48px tall, one per screen. Hover darkens colour only; press
  is `transform: scale(0.98)` for 120ms. No lift, no shadow.
- **Quiet button:** transparent with a 2px control border. Same press feedback.
- **Choice:** full-width row, 2px border, 48px+ tall. Selected means an ink border and a tick drawn
  in, plus the word "Selected" for screen readers.
- **Guess chip:** the answer Launch Check guessed from the description. It links to the sentence it
  came from; that sentence highlights while the chip is focused or hovered.
- **Gap row:** must-fix item. 4px alert edge, the MUST FIX stamp, what/why in one line, "Do it".
- **Task row:** one checklist step on the timeline rail. Tick, title, one-line why, sources on demand.
- **Rocket and launch pad:** a flat rocket in the site's colours (night-ink body, signal nose,
  night-muted fins), centred under the hero copy, with "Tap the rocket to start" (touch) or "Click the rocket
  to start" (mouse) under it. Tapping, Enter, or the Check my app button launches it; dragging it up past
  40px also works. It flies above its own curtain, and the curtain is always the next screen's `--bg`.
  It plays once per visit, on the way in.
- **Split-flap tiles:** mono characters on `night-2` half-cards. Used for the landing headline, phase
  names turning to CLEAR, and "COPIED". Nowhere else.
- **Runway lights:** one per question in the progress row. Off, current, answered, done.
- **Readiness gauge:** a flat SVG dial: a signal fill for ready, an alert arc for the must-fix share,
  and the percentage written underneath in `numeric`.
- **Loading:** a skeleton of the real results layout that fills in as checks finish. No generic spinner.
- **Undo:** deleting a project or unticking many steps gives a 6-second Undo, not a confirm dialog.

## Motion

Motion must clarify, guide or reward. Only `transform` and `opacity` are animated (DrawSVG strokes
and CSS custom-highlight colour are the exceptions). No `transition: all`, no infinite loops, no
scroll-jacking or smooth-scroll libraries, and every animation can be interrupted.

**Reduced motion is designed, not switched off.** Under `prefers-reduced-motion: reduce` each
animation below shows its final state immediately, as listed in the last column. In code, every GSAP
timeline sits inside `gsap.matchMedia()`; CSS animations have a reduced variant.

| Moment | Animation | Why it exists | Duration | Reduced motion |
|---|---|---|---|---|
| Start (signature moment) | Rocket launch: tap the rocket (or press Check my app); it launches and pulls the next screen up behind it like a curtain: a flat edge rising from the bottom with a pointed tip that stays on the rocket's tail | The one signature device: starting feels like take-off, and the move reads as one continuous step instead of a page swap | 1.1s launch, 220ms reveal | Straight to the next screen |
| Rocket nudge | Every 6s the rocket twitches (up 6px, a 3° wobble). Only while it's on screen; stops after five nudges or as soon as someone touches, focuses or presses a key | Says "tap me" without more words. The one deliberate exception to "motion only follows what the person did", kept small and finite | 700ms, every 6s, max 5 | None |
| Landing headline | "CLEARED FOR LAUNCH?" settles on split-flap tiles, once | Sets the pre-flight idea in one glance | ≤1.2s total, 12-18 tiles | Static headline |
| Paste | A signal line sweeps the textarea edge; a mono counter reads "412 CHARACTERS RECEIVED" | Confirms the paste landed and how much | 400ms | Counter only |
| Guessed answers | The source sentence highlights; the chip travels (Flip) into its answer slot | Shows how each guess was made, so people trust or correct it | 400ms | Static highlight and outline |
| Each question | Answered question collapses to a one-line summary; next rises 12px and fades in | Keeps place; shows what's done | 200ms in / 150ms out | Instant swap |
| Progress | Runway lights: one per question. Answered turns yellow; finishing runs a chase down the row | Progress without "Step 1 of 9" labels | 40ms stagger, 400ms chase | Solid states |
| Checking | Each check's name scrambles into place, then flips PENDING → CLEAR or GAP; the results skeleton fills behind | Makes the real checks visible; nothing fake | ≤3s total | Names and statuses appear; the live region announces them |
| Results reveal | The app summary card becomes the report header (view transition, shared element) | Connects "what you told us" to "what to do" | 400ms | Cut |
| Readiness gauge | Needle swings to the score and settles; the must-fix arc draws in | One number for "how close am I" | 700ms, settle ease | Final position |
| Must-fix rows | Enter one by one; the MUST FIX stamp lands with one small shake (±2px, twice) | Severity you can feel, once | 60ms stagger, 200ms stamp | Static stamp |
| Cost and time | (Not built: the costs are words like "$99 a year", so there is no total to roll. Revisit if the table gets a numeric total.) | | | |
| Tick a step | The tick draws, the row gets its green edge, counts roll, the meter grows (`scaleX`) | Reward and progress in one motion | 150ms tick, 200ms rest | Instant state |
| Phase complete | The phase name flips to CLEAR on split-flap tiles | A milestone worth marking | 600ms | Text swap |
| Filter "Must fix only" | Rows reflow with Flip instead of jumping | Keeps your place in the list | 400ms | Instant |
| Step-by-step deck | Next card comes from the right, back from the left; "Done, next" leaves with a green edge | Direction matches order | 200ms / 150ms | Crossfade |
| Map | Branch and goal bars fill in when the map opens (the map is a list of branches, not a drawn tree, so there are no paths to draw) | Shows how far along each branch is | 600ms | Filled bars |
| Copy | Button reads COPIED on flap tiles and turns green | Confirms the copy worked | 1.2s then back | Text swap |

Library: step two (rocket, headline, checking, gauge) ships with **no library**, in `motion.js` (Web
Animations API, CSS and a few lines of maths). If later pieces need it (Flip for list reflows, DrawSVG for
the map), add GSAP 3.15 (free for commercial use) from jsDelivr, loaded after first paint. Everything else is CSS, IntersectionObserver or the
View Transitions API. Not used: Lenis/smooth scroll, three.js/Vanta or any WebGL background, React
Bits code (ideas only; its licence allows private ports, never republishing them).

## Copy

- Plain words, second person, short sentences. Say what to do, why, then how.
- No cute AI wordplay, no generic taglines, no em dashes as separators.
- Errors say how to fix the problem ("Paste at least two sentences about your app").
- "Checking…" uses the real ellipsis. Numbers carry units.
- Sourced claims keep their source link. It isn't legal advice, and the results page says so once.

## Responsive behavior

- 375px first. Tap targets are 48px. Display type steps down to the phone sizes in the ramp.
- The results report header stacks: title, gauge, next action.
- Cost rows stack into label/value pairs on phones.
- The deck swipes with a finger and also works with buttons and arrow keys.

## Do's and don'ts

**Do:**
- Keep one yellow action per screen.
- Write every status in words.
- Show the working product rather than pictures of it.
- Test every animation at 375px, with reduced motion on, and with the CPU throttled.

**Don't:**
- Purple gradients, neon, glows, sparkles, emoji as UI.
- Hover lifts, tilts or bounces. Hover changes colour or border only.
- Fake previews, fake counts or unlabeled example content.
- Boxes inside boxes, or a second radius.
- Motion that runs on its own, loops, or exists only to look cool.

## Verifying

Use `playwright-cli` (`npm i -g @playwright/cli@latest`) in the build loop:

- Open at `--device="Pixel 7"`. Pause each GSAP timeline at 0, 25, 50 and 100% (timelines are exposed on
  `window.__tl` in development) and take a still of each.
- Run `set-reduced-motion reduce` and walk the whole flow. Final states must appear at once, and
  `document.getAnimations().length` must be about 0.
- Throttle the CPU 6× and record one pass to check nothing stutters.
- After each screen change, take a `snapshot` to confirm focus moved to the new heading and the live
  region spoke.

## Built so far

- **Step one:** this file.
- **Step two** (`motion.js`, September 2026):
  - the rocket launch
  - the split-flap landing headline
  - the checking sequence (names scramble in, a runway light replaces the spinner, statuses flip to CHECKED)
  - the readiness gauge in the results header (yellow = steps done, red = must-fix steps still ahead,
    written as "N% ready" and "N must-fix tasks left")
- **Step three:**
  - The landing example is a real checklist: tick a row and its status and the count flip.
  - Runway lights replace "Step 1 of 3" (the step number stays for screen readers).
  - Must-fix rows arrive one by one with a MUST FIX stamp, only when the results open.
  - A ticked task's row flashes done, and the gauge moves.
  - Copy prompt flips to Copied.
  - Pasting confirms "N characters received".
  - Changing numbers use tabular figures.
- **Step four:**
  - The launch curtain is one smooth curve: it leaves the rocket's tail almost vertically and flares
    down to both screen edges, with no corners.
  - Guessed answers highlight the sentence they came from as the question appears.
  - The step-by-step card follows your finger sideways, and snaps back if you don't swipe far enough.
  - A phase that's just been finished flips to CLEAR on split-flap letters.
  - Progress bars on the map and projects screens fill in when you open them.
  - Long checklists only render what's near the screen, and full-height screens use `100dvh`.
- **Step two limitation:** the checking statuses say CHECKED, not CLEAR or GAP, because the checks don't
  yet report which area produced a gap. Wire that up before promising CLEAR/GAP.

## Known gaps (what the current code still does differently)

Found in the September 2026 review; fix them during the overhaul.

- **Radius:** README said 10px; `styles.css` uses 8px. 8px is correct.
- **Borders:** 1, 2 and 3px borders are mixed. Move to the three roles above; 3px goes.
- **Type:** about 25 font sizes are in use. Map them onto the eight roles.
- **Labels:** chained "·" separators remain in some meta lines.
- **Loading:** the checking sequence still uses a fixed per-item timer in `app.js`, and there's no
  results skeleton yet.
- **Meter:** animates `width`. Use `scaleX`.
- **Fonts:** render-blocking Google Fonts link with no preload.
- **Depth:** results nest bordered boxes (gaps, tasks, sources).
- **Reduced motion:** one global kill switch instead of designed fallbacks.
