# Launch Check: prototype

Launch Check tells people who built an app with AI what they still need to do before they can release it. You describe the app and answer a few questions, and it gives you the biggest gaps first, then an ordered checklist. Every step says what to do, why it matters and how, with links to the rule or guide it comes from.

Open `index.html` by double-clicking it. There's no build step and no server.

## What's real and what isn't

- **The checklist is real and sourced.** `data.js` holds 75 steps, each with the conditions it applies under, what to do, why, how, and links. The links were checked in September 2026 (see `RESEARCH.md`).
- **The plan comes from your answers.** The prototype doesn't analyze code. It guesses answers from your description with simple keyword matching, and shows each guess next to the sentence it came from so you can correct it.
- **Nothing leaves your browser.** Pasted text and code stay on the page.
- **It isn't legal advice.** The results page says so once, next to the sources.

## Files

| File | What it is |
|---|---|
| `index.html` | All screens: landing, describe, narrow it down, questions, checking, results |
| `styles.css` | Design tokens and components |
| `app.js` | Routing, answer guessing, the plan engine, copy buttons |
| `data.js` | The master checklist: phases, steps, conditions and sources |
| `RESEARCH.md` | Sourced facts, rejection statistics and marketing lines |
| `scripts/build-artifact.py` | Builds a copy for publishing as a claude.ai Artifact |

## How a plan is built

1. **Describe:** paste a summary your AI wrote (recommended), or paste code after a privacy warning.
2. **Narrow it down:** what you built (iPhone, Android, both, website, extension), the category, and one detail for categories with extra rules.
3. **Questions:**
   - whether it's for children
   - whether it has sign-up
   - whether it charges money
   - where data lives
   - analytics and ads
   - AI
   - whether people see each other's posts
   - where a website is hosted
   - what's already done

   "Not sure" adds a step that tells you how to find out.
4. **Results:**
   - "Must fix" gaps first.
   - A cost and time table.
   - The checklist in launch order, which you can filter to "Must fix" only, tick off and copy as text.

Each item in `data.js` has `when(c)`, which decides whether it applies. Its `title`, `why`, `steps`, `gap` and `sources` can be plain values or functions of the answers, which is how web apps get web wording and Lovable users get Lovable steps.

## Design system

The direction is **careful paper**: a warm off-white page, near-black ink, one deep green accent, and serif headings. It should read like a trustworthy checklist, not a SaaS dashboard.

- **Spacing:** a 4px scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Type:** Source Serif 4 (600) for headings, Source Sans 3 (400/600) for text. Nothing is smaller than 16px.
- **Color:** one accent (`#1d5c45` light, `#7cc9a5` dark), used only for the main action and the focus ring. Severity is shown in ink and words, not in color.
- **Shape:** 8px radius everywhere, no shadows, 1px borders, a 720px column.
- **Accessibility:**
  - 44px or larger tap targets
  - a visible focus ring
  - full keyboard use
  - reduced motion respected
  - text contrast of at least 6.3:1

## User testing

Three simulated beginners went through the prototype:
- a meditation app built with Cursor and Expo
- a recipe-sharing site built with Lovable
- a kids' spelling game built with Replit, answered mostly "Not sure"

Their findings are fixed in this version:
- guesses now respect "no" and "maybe later"
- every "Not sure" answer leads to a step
- websites get their own wording and steps
- kids' apps get an early section for both stores
- the must-fix count matches the labels
- database advice now fits public content

## Publishing

`python3 scripts/build-artifact.py OUT_DIR` writes a copy without the outer `<html>`, `<head>` and `<body>` tags, for hosts that add their own.
