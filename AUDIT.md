# Portfolio Audit — Rigorous Review & Redesign Direction

**Subject:** https://seanjoudrie.github.io/SeanJoudrie/ (repo `portfolio/`, branch = deployed main)
**Date:** July 2026
**Method:** Full source read, live rendering at 1440×900 and 390×844 (Playwright), GitHub profile + all four project repos reviewed, benchmarked against current best-in-class designer-developer portfolios.

---

## 0. The verdict up front

The scaffolding is better-built than you think — and it is the **wrong portfolio**.

Everything on this page is optimized to get you hired as an **operations analyst / program manager**: the hero says "Operations that hold up under pressure," the metrics band leads with Verizon retail numbers and a GPA, the Now section literally asks for "a program-analyst, operations, or project-management role." Your stated goal is a **UI designer / builder portfolio** — proof you can design distinctive interfaces, write animated front-end code, and organize complex data.

Those are two different websites. The current one actively works against the designer story: it is a *text-only* site. There is not a single pixel of your product UI visible until three screens deep, and even there, two of four project cards have no imagery at all. A design portfolio where the work is described instead of shown fails regardless of how clean the type is.

**Recommendation: keep the chassis (Vite/React/Tailwind, the drawer mechanic, the reduced-motion discipline — all genuinely good), tear down the narrative, visual identity, and information architecture, and rebuild around the designer-builder story with Globalio as the centerpiece.** Details in §6.

---

## 1. First impressions — the 5-second test

*Loaded cold at 1440×900, as a hiring manager:*

**Seconds 0–1.5:** A cold-open overlay plays — name, gold rule, "Human-Systems Design." It's smooth, but it's 1.5 seconds of my scan budget spent on a splash screen, and "Human-Systems Design" tells me nothing hireable.

**Seconds 1.5–5:** Dark navy, warm gold, big clean Hanken Grotesk headline. Competent. Professional. And it reads **operations consultant, not designer**. The headline is about ops. The four count-up stats are revenue growth, store traffic, a GPA, and "4 products shipped." No product imagery, no interface, no motion beyond count-ups. My gut files this under "polished LinkedIn supplement for a PM role."

**What's working:** it does not look broken or lazy. Spacing is consistent, hierarchy is real, the gold-on-navy is confident, and there are no typos. This is comfortably above the median self-taught portfolio.

**What reads as amateur (specifically):**
- **A GPA in the hero metrics.** Nothing says "junior, padding the numbers" faster. Kill it.
- **Unverifiable retail sales stats presented as hero metrics** ("4.5× YoY revenue growth," "50%+ MoM store traffic"). Out of context they read inflated, and for a design role they're the wrong currency entirely.
- **"4 products shipped"** while two cards below say "In development" and "In design / build." A reviewer who notices (they will) now discounts every other claim.
- **The generic dark theme itself.** Near-black + single accent + fade-up-on-scroll + stat count-ups is, in 2026, the recognized signature of template/AI-generated sites. You're a stone's throw from the cliché even though the execution is careful.

---

## 2. Ruthless flaw audit

### 2.1 Visual design

- **Palette (navy `#0b1220` + gold `#f5b841`):** intentional and accessible, but not distinctive — dark-navy-with-gold is the default "premium" look of a thousand templates. Worse, the system doesn't hold: each project card introduces its own accent (`#7c5cff` purple, `#ff7a59` coral, `#4dd6c1` teal, `#d7263d` red), so the page runs **five unrelated accents**. The Globalio showcase then switches to a teal/mint sub-brand with its own gradient text, glow halo, and shimmer — it looks like a section from a different website glued in.
- **Contrast failures:** status chips render project accents at `0.72rem` uppercase on `navy-900`: `#7c5cff` ≈ **4.0:1** and `#d7263d` ≈ **3.5:1** — both fail WCAG AA for small text. `--color-faint #737e96` on `navy-950` is ≈ 4.6:1 — passes by a hair, but it's used at 11–12px everywhere, so there's zero margin.
- **Typography:** Hanken Grotesk + Inter is safe and low-signal. For someone selling design taste, the type system *is* the portfolio, and this one makes no decision anyone will remember. Also: `--font-mono` is mapped to **Inter** (index.css:24) — so the `font-mono` class on Experience dates renders a proportional face. A small lie in the design system.
- **Half-committed theme:** the CSS still carries a "Blueprint design system" (`.blueprint-grid`, dimension lines, corner ticks) but the grid was removed in a later commit. What survives — corner ticks on the portrait, two `dim-line`s — is vestigial decoration that no longer means anything. `.blueprint-grid`, `.eyebrow`, and `.reveal-blur` are dead CSS shipped to production.
- **Uniform bento cards:** four identical rounded-2xl cards, same padding, same radius, differing only by a 1px top rule. This is the exact "uniform card grid, no hierarchy" anti-pattern hiring reviewers now associate with generated sites — and it flattens your flagship to 25% of the grid.

### 2.2 Layout & flow

- **The proof arrives too late.** Page order is Hero → "How I work" → About → Work. That's ~2,500px of *text* before any evidence. For a designer portfolio the order must be inverted: work first, biography later. (Your own nav agrees — the URL you shared ends in `#work`.)
- **The "System" section (Understand people / Design the system / Lead the execution)** is the weakest thing on the page: a three-node consulting diagram that states a method with zero evidence. Its scroll-drawn line is the kind of motion that decorates rather than demonstrates.
- **Globalio is simultaneously buried and duplicated.** It's card 03 of 4 (below Flexyn and REX) *and* has its own giant showcase below the grid. Pick one: flagship-first hierarchy.
- **The skip-link targets `#work` while the first nav item is About** — a small inconsistency about what this page even thinks its main content is.
- **The case-study drawer is a good mechanic** (slide-in, Esc/overlay close, deep-linkable `#globalio` URLs — genuinely nice) **wrapped around no case study**: three one-paragraph rows and three thumbnails. See §3.1.

### 2.3 Motion & animation — your claimed specialty

What exists: cold-open, scroll progress bar, fade-up reveals, count-ups, one scroll-drawn SVG line, card hover lift, nav underline slide, drawer slide-in. All with `prefers-reduced-motion` fallbacks — that discipline is real craft and ahead of most portfolios.

But strategically: **everything is an entrance animation.** Fade-up-on-scroll is explicitly the "only motion is generic scroll fade" anti-pattern. There is:
- No signature interaction anywhere — nothing a visitor plays with.
- No physics, no springs, no gesture response, no view transitions.
- No scroll-driven storytelling (content that transforms, not just appears).
- The only continuous motion (the floating, pulsing Globalio phone) is ambient decoration, not interaction.

For someone whose pitch includes "real interactive, animated front-end code," the site *under-demonstrates by omission*. A reviewer cannot distinguish you from someone who installed an AOS library.

### 2.4 Content & copy

- **The spine sentence — "understand people, design the system, lead the execution" — appears four times** (hero, System heading, About, Now). On one page that's not a motif, it's filler. Say it once, perfectly.
- **Claim/evidence mismatches a reviewer will click:**
  - Flexyn's status chip says **"Live · Beta-tested"** — but there is no live link, and its **"Code" button links to your GitHub profile**, not a repo. A dead-end deep in the flagship grid.
  - "Four products… shipped" vs. REX "In development" and Rap Sheet "In design / build."
- **You undersell your own flagship.** The portfolio says "195 countries, 76 languages, multiple modes." globalio.app itself says **"50+ ways to play," a 2,000-flag codex, 197 countries**, subdivision/historical flags, daily challenges. The portfolio's numbers are both smaller and inconsistent with the product's. Nobody should ever learn your app is more impressive by *leaving* your portfolio.
- **Good bones:** the hook lines are genuinely strong ("Swipe to decide what to watch — then go watch it"), the drawer's problem/built/outcome rows contain real technical meat (seeded PRNG, RLS, WebRTC), and the writing is confident. The voice problem is positioning, not skill.
- **Title tag "Sean Joudrie — Human-Systems Design"** is consulting vapor. Nobody searches for it, and no design hiring manager nods at it.

### 2.5 Responsiveness & performance

- **The live Globalio iframe has no failure state.** When globalio.app is slow or blocked (corporate networks, firewalls — i.e., exactly where hiring managers browse), the phone frame renders as a **large blank white rectangle wearing a "● LIVE" badge**. I reproduced this. It's the single most embarrassing possible state of the page and it ships with no fallback, no poster, no click-to-load facade.
- The iframe also loads an entire second application on every desktop visit to `#work` — bandwidth spent before the visitor asked for it.
- Google Fonts CSS is render-blocking; two families across nine weights, not self-hosted, no `font-display` control beyond `swap` — FOUT/layout-shift on first paint.
- Bundle: 236KB JS (73KB gz) for a static one-pager. Acceptable React tax, not impressive.
- Mobile is mostly solid (no horizontal overflow — verified; screenshot phone-card fallback is smart). But drawer screenshots render in a 3-column grid → **~110px-wide images on a 390px phone**, unreadable.
- Cold-open is session-gated (good) but still costs first-visit seconds on the visit that matters most.

### 2.6 Accessibility

- **Good:** skip link, `:focus-visible` styling, universal reduced-motion handling, aria-labels, semantic sections, keyboard handlers on cards.
- **`ProjectCard` is an `<article role="button">` containing nested `<a>` elements** — nested interactive controls; screen readers announce a button whose interior contains links, and Enter/Space vs. link activation get muddy.
- **Drawer has no focus trap and never returns focus** to the invoking card on close. Tab from an open drawer walks into the page behind the overlay.
- Contrast failures listed in §2.1.

### 2.7 Technical quality & the GitHub surface (part of your portfolio whether you like it or not)

- **`og:image` points to `/og.png` — the file does not exist** in `public/` or the built `dist/`. Every share of this link on LinkedIn/iMessage/Slack renders with a broken/blank preview. **`og:url` points to `https://seanjoudrie.com`** — a domain that isn't where the site lives. Both broken at the exact moment someone shares your portfolio.
- **The Globalio repo (`SeanJoudrie/Global`) — 427 commits, your most invested project — has no README, no description, no website link, no topics.** Its front door literally says "No description, website, or topics provided," and it doesn't even link to globalio.app. Meanwhile internal AI artifacts (`.claude/`, `PLAY_REBUILD_PROMPT.md`, `UI_AUDIT.md`) sit in the repo root.
- **Rap Sheet lives in a repo named `drinky`** — a leftover working title implying a drinking game, visible to every recruiter who clicks "Code."
- Publicly visible: `claude/*` branch names, a YOLO badge (unreviewed merges), and commit histories compressed into 1–3 day bursts (drinky: 7 commits in one day jumping v1 → v1.3). A skeptical reviewer reads this as "AI generated it in a weekend" and **discounts everything** — unless your narrative owns the AI-assisted workflow explicitly (see §3.2).
- Bright spot: **REX's README is excellent** — product thesis, architecture, privacy stance, limitations, roadmap. That's the standard all four repos should meet.

---

## 3. Gap analysis — what's missing entirely

### 3.1 Real case studies (the #1 gap)

The drawer's problem/built/outcome is a *summary card*, not a case study. Design directors' most-cited red flag is "final mockups with no visible thinking." You currently show neither the thinking *nor* the mockups.

**Globalio case-study template** (a dedicated page or full-screen view, not a drawer):

1. **Hero:** one-line thesis + live playable embed *or* a 15s screen capture. Real numbers up top: 50+ modes · 4,000+ entry codex · 197 countries · zero-backend daily challenge.
2. **Context & constraint:** solo builder; no backend allowed; every player worldwide must get the same daily puzzle. One paragraph.
3. **The data problem (your "organize complex data" proof):** how a 4,000+ entry codex is structured — entities, relationships, the script-detection engine that keeps quiz distractors from leaking answers. Show a *real excerpt*: an interactive, filterable table of the actual data, embedded. This one artifact proves the data-organization claim better than any sentence.
4. **The design system:** Globalio's cream/serif game UI — show 3–4 screens large, annotate two or three deliberate decisions (why warm paper instead of quiz-app blue; how the daily ritual loop is laid out; iconography).
5. **One mechanic, deep:** pick the seeded-PRNG daily challenge. Diagram date → seed → deterministic shuffle. Small interactive widget: a date picker that regenerates the day's puzzle live. This proves "real interactive code" inline.
6. **Iteration evidence:** two before/after screens with one sentence each on what changed and why. (You have 427 commits of history to mine.)
7. **Outcome & reflection:** what shipped, what you'd do differently. Reflection reads as seniority.

Same skeleton, shorter, for REX (the on-device taste model is the star) and Rap Sheet (the weighted 325-card deck system is the star — and is *also* a data-organization proof).

### 3.2 Proof of process — and owning the AI workflow

You describe yourself as a vibe coder. The public evidence (branch names, commit bursts) already reveals it, so the only losing move is pretending otherwise. Reframe it as the skill it is: *"I design the system and direct AI agents to build it — the taste, the architecture, and the quality bar are mine."* Then show the process: prompts-to-product examples, what you rejected, how you audited output. In 2026 "can direct AI to ship production software" is a hireable skill — but only when presented deliberately, not discovered by a suspicious reviewer.

### 3.3 An animation/craft showcase

The single highest-leverage addition for your goals: a **Craft/Lab section** — a grid of 4–6 small, embedded, *touchable* experiments (the rauno.me/craft pattern, the de facto standard for design-engineer portfolios). You don't need to invent content; extract it:
- The weighted card-draw balancer from Rap Sheet, visualized live.
- REX's taste-vector — swipe five posters, watch the model update.
- The seeded daily-challenge generator with a date scrubber.
- A flag-construction toy from Globalio's "Build-the-Flag" mechanic.

Each is simultaneously an animation demo, a code demo, and proof the products are real.

### 3.4 Social proof & metrics

Zero usage numbers, zero testimonials anywhere. Even without big traffic: Globalio's mode count, codex size, commit count, "no sign-up, free, live since X," beta-tester quotes for Flexyn. If globalio.app has any analytics, surface players/countries-reached. Numbers beat adjectives ("polished," "beautiful" — currently self-awarded in meta descriptions).

### 3.5 About & credibility

The military background is used well in copy (discipline, standards, accountability — not as an excuse). But on a *design* portfolio, a uniformed portrait as the only photo makes "soldier" the primary identity and "designer" the caption. Flip it: lead with the builder, keep OCS as one strong line and the uniform photo smaller/secondary.

### 3.6 CTAs

Actually in good shape: email, résumé, LinkedIn, GitHub all present and frictionless. Keep. Add a copy-email button (mailto-only loses people whose default mail client is unconfigured).

---

## 4. Benchmark — where you stand

Against the current reference class:

- **Rauno Freiberg (rauno.me/craft):** grid of dated interactive UI experiments. *This is your missing section.* You have game mechanics to mine; he built his from scratch.
- **Emil Kowalski (emilkowal.ski):** near-text-only minimalism, but every interaction is spring-perfect. Proof that one flawless micro-interaction beats ten fade-ups. Your current motion is ten fade-ups.
- **Brittany Chiang (brittanychiang.com):** the "quiet but flawless" pole — index-style single page, zero gimmicks, perfect type. Proof you don't need WebGL; you need *decisions*. (Also so heavily cloned that navy-dark-single-accent now reads as "Brittany clone" — another reason to leave the navy.)
- **Bruno Simon / Dustin Brett / Jesse Zhou:** the "site as playable demo" pole. You can't out-WebGL them — but you have something they didn't: **a real shipped game.** Embedding *actual product* beats simulating one.
- **Lynn Fisher (lynnandtonic.com):** annual redesigns, archived — a self-taught-growth narrative machine.

**The 2026 bar:** one memorable self-demonstrating signature + 2–4 outcome-driven case studies with visible process + type/motion decisions that couldn't come from a default. **The failure mode isn't being too plain — it's being statistically average.** Dark navy + Inter-family + uniform cards + count-up stats + scroll fades is statistically average, executed well.

**Your unfair advantages, currently unused:** (1) a real, live, free, no-signup game a reviewer can play in 10 seconds; (2) a 4,000-entry dataset that can be turned into a beautiful interactive artifact; (3) a genuinely differentiated bio. Nothing on the current page exploits any of the three.

---

## 5. Prioritized action plan

### P0 — Critical (actively costing you opportunities)

| # | Problem | Fix | Why it matters |
|---|---------|-----|----------------|
| 1 | Positioning: the entire site sells an ops analyst | Rewrite hero/title/Now/Contact around designer-builder (copy direction in §6) | Every reviewer currently sorts you into the wrong pile in 5 seconds |
| 2 | `og:image` → nonexistent `/og.png`; `og:url` → wrong domain | Ship a real 1200×630 OG card; point `og:url` at the actual URL | Every share of your portfolio currently previews as broken |
| 3 | Zero product imagery on Flexyn/REX/Rap Sheet cards; Work section is text-only | Real screenshots or 10–15s captures on every card | A design portfolio that describes instead of shows is self-refuting |
| 4 | Globalio iframe fails to a white rectangle labeled "LIVE" | Poster-image facade; load iframe on click; error fallback to screenshot | The flagship's worst state is currently a blank void with a badge on it |
| 5 | Flexyn "Code" → your profile; "Live · Beta-tested" with no live link | Link truthfully or remove the buttons/chip | Dead-end links from a flagship card destroy trust in one click |
| 6 | `Global` repo: 427 commits, no README/description/link; Rap Sheet in a repo named `drinky`; AI artifacts in repo roots | READMEs to REX's standard; rename `drinky`→`rap-sheet`; move `.claude`/prompt files out or gitignore | Reviewers always click through to GitHub; the flagship's repo is currently its worst ad |
| 7 | Hero metrics: GPA + retail sales numbers | Replace with product numbers (50+ modes, 4,000+ codex entries, 3 live products) | Wrong currency for design hiring; GPA reads junior |

### P1 — High impact per unit effort

| # | Problem | Fix |
|---|---------|-----|
| 8 | No real case study anywhere | Build the Globalio case study per §3.1 template; promote drawer content into it |
| 9 | No interactive proof of skill | Craft/Lab section with 3–4 embedded widgets (§3.3) |
| 10 | No signature moment | One bespoke hero interaction on-theme (see §6 directions) |
| 11 | Motion is 100% entrance animations | Add spring micro-interactions (buttons, cards), View Transitions for drawer→case-study, one scroll-driven sequence in the case study; delete the cold-open (it spends your scarcest seconds on a splash) |
| 12 | Flagship buried as card 03 + duplicated showcase | Restructure Work: Globalio hero-sized first, others in a row below |
| 13 | Numbers inconsistent with globalio.app (195 vs 197, missing 50+ modes/codex) | Single source of truth in `projects.ts`, use the real (bigger) numbers |
| 14 | "Understand people…" spine repeated 4× | Once, in About |

### P2 — Polish

15. Contrast: fix status-chip accent colors on dark (`#7c5cff`, `#d7263d` fail AA at small sizes); nudge `--color-faint`.
16. A11y: replace `role="button"` article with a real `<button>` overlay pattern; focus-trap the drawer and restore focus on close.
17. Self-host fonts (two families, three weights max), preload the display face.
18. Custom domain (`seanjoudrie.com` is already in your OG tags — buy it, wire it up, or stop claiming it).
19. Kill dead CSS (`.blueprint-grid`, `.eyebrow`, `.reveal-blur`); fix `--font-mono` to an actual mono or remove its use.
20. Drawer screenshots: full-width stacked on mobile, not 3-up.
21. Analytics (Plausible/GoatCounter) so the next iteration argues from data.
22. Résumé: confirm it tells the same story the redesigned site tells.

---

## 6. Direction & rebuild recommendation

Two directions, both reusing the existing stack (Vite + React + TS + Tailwind), the drawer/deep-link mechanic, the hooks, and the reduced-motion discipline. This is a re-skin + re-narrate + re-structure, not a from-zero rewrite.

### Direction A — "The Atlas" (recommended)

Inherit your flagship's own design language: cartography, codex, expedition. Globalio's in-game UI is warm cream, editorial serif, plate-like cards — *it's already distinctive*. A portfolio that visibly shares DNA with its flagship product reads as a designer with a system, and a **light, paper-warm portfolio is instantly differentiated** in an ocean of dark-mode developer sites (including your current one).

- **Palette:** warm paper `#f6f1e7` base, deep ink `#1c1a17` text, one saturated accent (vermilion `#d7482f` or cobalt `#2547d0`), muted gold `#b98a2e` for annotations. Dark mode optional later — as a designed moment, not a default.
- **Type:** an expressive display serif — Fraunces (variable, free) — for headlines and project "plate" titles; a clean grotesk (Inter can stay, or Geist) for body/UI. The serif is the memorability decision the current site never makes.
- **Layout concept:** an **atlas/index**. The top of the page is a numbered table of contents — like a codex — where each entry is a project "plate": PLATE 01 — GLOBALIO, big serif, live thumbnail, three stats. Clicking a plate morphs (View Transition) into the full case study. A visible grid, hairline rules, small-caps annotations — your existing "blueprint" instincts, matured into cartography.
- **Motion language:** drawn map-lines and routes (you already have the `draw-path` scroll hook — reuse it properly), View Transitions between index and case study, spring hovers on plates, and **one signature hero interaction**: a small playable strip — "guess today's flag" — powered by your real seeded-PRNG code. One guess, instant feedback, "play the full game →". The visitor has *used your product* inside your portfolio in the first ten seconds. Nobody you're compared against can do that.
- **Why it wins:** every claimed skill is demonstrated by the medium itself — data organization (the codex/index structure + embedded data table), UI design (a distinctive system inherited from a real product), animation (map-draw + transitions + the playable hero), shipping (the live game embedded).

### Direction B — "Control Room"

Keep the military/ops DNA but express it as *craft*: dark, precise, HUD-like — mono type for telemetry (a real mono this time, e.g. Geist Mono/Berkeley Mono), amber-on-black, live status readouts, radar-sweep motifs, tactile switch/toggle micro-interactions. Projects presented as "missions" with AARs (after-action reviews) as case studies.

- **Why it can work:** genuinely yours (nobody else's bio supports it), and AAR-style case studies are a memorable process format.
- **Why it's second:** it stays in the crowded dark-portfolio space; the theme risks kitsch if not executed perfectly; and it keeps "military/ops" as the headline identity when your goal is design-first. Better as seasoning than as the dish.

### New information architecture (Direction A)

```
/                 Hero: name, one-line designer-builder claim,
                  playable flag-guess strip, 3 real product stats
  ↓
  INDEX           Numbered plates: 01 Globalio · 02 REX · 03 Flexyn · 04 Rap Sheet
                  (flagship visually 2× the others)
  ↓
  CRAFT           4–6 embedded interactive experiments (the lab)
  ↓
  ABOUT           Builder-first bio; OCS/Guard as one strong line + small photo;
                  explicit "how I build with AI" paragraph
  ↓
  CONTACT         email (copy button) · résumé · LinkedIn · GitHub

/globalio         Full case study (template §3.1)   ← View Transition from plate
/rex, /flexyn, /rap-sheet   Shorter case studies
```

Tech: stay Vite+React; add client-side routes (or pre-rendered pages via `vite-ssg`) for case studies so they're crawlable and sharable with their own OG images; View Transitions API with the drawer slide as fallback; self-hosted variable fonts.

**Hero copy direction** (replace "Operations that hold up under pressure"):

> **I design interfaces you can play.**
> Self-taught designer-builder. I shipped a geography game with 50+ modes and a 4,000-entry codex — solo. Army officer candidate; I hold my work to that standard.

*(First line = claim, second = proof, third = differentiator. Adjust to taste; the structure is the point.)*

---

## Appendix — evidence index

- Blank-iframe failure state, text-only work cards, ops-positioned hero, buried flagship: captured at 1440×900 and 390×844, July 2026.
- Contrast math: `#7c5cff` on `#0f1a2e` ≈ 3.97:1; `#d7263d` ≈ 3.5:1; `#737e96` on `#0b1220` ≈ 4.6:1.
- Missing `og.png`: absent from `portfolio/public/` and built `dist/`; `index.html:22–23, 32`.
- Flexyn repo link → profile: `src/data/projects.ts:36`. Status chip: `projects.ts:35`.
- `--font-mono` → Inter: `src/index.css:24`; used at `Experience.tsx:36`.
- Dead CSS: `.eyebrow` (index.css:56), `.blueprint-grid` (:151), `.reveal-blur` (:267) — no usages in `src/components/`.
- Repo-surface findings (no-README Global repo, `drinky` naming, commit-burst patterns, REX README quality): GitHub review, July 2026.
