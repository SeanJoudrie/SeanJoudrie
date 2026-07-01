# The 10/10 Portfolio — Exhaustive Gap Analysis & Blueprint

**Subject:** https://seanjoudrie.github.io/SeanJoudrie/ (Atlas redesign, live)
**Date:** July 2026
**Evidence:** full-source read; live captures at 390 / 768 / 1440 / 1920 px; touch-interaction tests; performance measurement (LCP 164 ms local, CLS 0.002, 703 KB transfer); prior benchmark research of award-tier portfolios.

---

# PHASE 1 — The 10/10 rubric, then the grades

A 10/10 portfolio: a hiring manager knows who you are and wants you within 10 seconds; a designer screenshots something on it; a developer opens devtools to see how you did it; a recruiter finds zero broken promises; and it behaves flawlessly on the phone it will most often be opened on. Weights reflect what this portfolio must prove (motion + data + shipping).

| # | Dimension | Weight | Score | Why points were lost |
|---|-----------|:-:|:-:|---|
| 1 | First impression / hero | 10% | **8** | Identity, claim, and a playable proof in the first viewport — genuinely strong. −1: the flag widget *is* the signature but nothing moves until the visitor acts; no idle motion invitation (a subtle flag-wave shader or a cycling specimen would cue "touch me"). −1: "DESIGNER-BUILDER" eyebrow is the only role signal; no one-line "what I'm for" (a *job-target* line — see Phase 2 §C1). |
| 2 | Narrative & IA | 8% | **7** | Work-first order is right; brief sections are right. −1: the story ends at Contact with no "what's next / currently building Flexyn" beat, which is your strongest urgency signal. −1: case studies live in a drawer — one level too shallow for the depth a 10/10 requires; no per-project URL pages, so nothing is individually shareable/crawlable. −1: no navigation affordance back up (no footer nav / back-to-top). |
| 3 | Visual design system | 12% | **8** | Paper/ink/vermilion + Fraunces is distinctive and coherent; single accent held. −1: the system has exactly one texture (hairline + chip); at 1920 px large paper fields go flat — needs one more layer (faint topographic contours, graticule lines, or an engraved-map corner ornament). −1: chips, buttons, and status pills share near-identical border-radius/weight — hierarchy inside components is thin. |
| 4 | Motion & interaction (headline skill) | 14% | **5.5** | Springs, stamp, shake, reveals exist and respect reduced-motion. But for a claimed motion specialist: no scroll choreography (nothing transforms on scroll — only fades), no page/view transitions (drawer slides, everything else cuts), no cursor behavior, no idle life anywhere, and — decisive — **no section that demonstrates motion as a subject**. Motion is seasoning here, never the dish. −4.5. |
| 5 | Case studies | 10% | **4** | Drawer content is honest and technical but is a *summary card*: zero images-in-context, zero process (no sketches/iterations/before-afters), zero metrics beyond feature counts, zero "what I'd do differently," zero architecture diagrams. REX/Flexyn/Rap Sheet studies are three paragraphs each. −6. |
| 6 | Proof of ability | 12% | **6** | The flag game is real embedded proof (rare, good) and Globalio screenshots are real. −2: only *one* interactive proof — data organization, motion range, and engineering breadth are claimed in Capabilities but never demonstrated. −1: Flexyn/REX/Rap Sheet plates still show specimen art, not product. −1: GitHub side of the proof chain is broken (Globalio repo has no README; Rap Sheet lives in `drinky`). |
| 7 | Copy & voice | 6% | **8** | Tight, confident, specific; "the typing is negotiable" is a personality moment. −1: Capabilities is the one section that reads like a résumé keyword list. −1: no human warmth anywhere — nothing about *why* geography, games, or building (one sentence of motive makes a person). |
| 8 | About / personal brand | 6% | **7.5** | Military used correctly (standard, not gimmick); AI workflow owned — ahead of the curve. −1: the only photo is a formal uniform portrait, which makes "soldier" the visual identity on a design portfolio; there is no image of *the designer* (desk, sketchbook, casual). −0.5: About has no "how I work" beat (3 steps, 1 line each) — employers hire process. |
| 9 | Conversion | 6% | **7** | Email + copy + résumé + LinkedIn + GitHub, all working, availability stated. −1: no response expectation ("I reply within 24h") and no scheduling path (a Cal.com link converts recruiters). −1: résumé is a generic PDF unconnected to the new brand; −1: no persistent CTA — after the hero, "contact" only exists at the very bottom (a tiny sticky "Open to work" chip pays for itself). |
| 10 | Responsive / cross-device | 8% | **5** | Desktop and tablet are solid. Mobile — the most common first view — has real defects (inventory below): translucent see-through menu, dead vertical gaps, orphaned contact headline, oversized portrait, always-opaque 120 px header. −5. |
| 11 | Performance | 6% | **9** | LCP 164 ms local / CLS 0.002 / 703 KB total / zero console errors — genuinely excellent. −1: fonts not preloaded (FOUT window on cold cache); screenshots not width-capped with `srcset` (minor). |
| 12 | Accessibility | 6% | **7.5** | Focus trap + return, reduced-motion everywhere, skip link, semantic sections. −1: flag-game result relies on color+strikethrough (add an explicit "✓ / ✗" text prefix for SR + colorblind users); mystery-flag SVG is `aria-label="Mystery flag"` but options give no post-answer SR summary beyond the stamp text. −0.5: mobile menu doesn't trap focus or lock scroll. |
| 13 | Technical & SEO polish | 4% | **7** | Meta/OG/Twitter/favicon/og-image all correct now. −1: no custom 404.html (GitHub Pages serves its default for any bad path); no sitemap/robots; no JSON-LD Person/CreativeWork schema. −1: no custom domain — `github.io/SeanJoudrie/` still reads side-project; −1: no analytics, so the next iteration argues from feelings. |
| 14 | Distinctiveness / memorability | 12% | **7.5** | Light paper atlas identity + playable daily flag is a real signature — screenshotable and unusual. −1.5: one signature moment is the floor, not the ceiling; award-tier sites carry the concept through *every* interaction (page transitions as map routes, cursor as compass, 404 as "uncharted territory"). −1: the concept currently lives only above the fold. |

**Weighted total: ≈ 6.6 / 10.**
Strong identity and honest engineering, dragged down by the three things the site exists to prove: **motion depth (5.5), case-study depth (4), and mobile quality (5)**. Those three dimensions carry 32% of the weight and are exactly where the next work goes.

---

# PHASE 2 — Exhaustive "what's missing" inventory

## A. Mobile defects (your instinct was right — found and reproduced at 390×844)

1. **Translucent mobile menu (worst defect on the site).** The dropdown is `bg-paper/95 + backdrop-blur` but page content visibly bleeds through the item rows, and the page below the dropdown stays fully visible and scrollable. It reads broken. *Fix:* full-screen overlay sheet — opaque `bg-paper`, covers viewport, locks body scroll (`useBodyLock`), traps focus, staggers the 5 links in with 30 ms delays (a free motion moment), big Fraunces links (text-3xl), contact + socials pinned at sheet bottom.
2. **Dead vertical gaps.** Hero bottom (pb-16) + Work top (py-20) + the index label creates ~350 px of empty paper; same between About photo → Capabilities, and Capabilities → Contact. Mobile sections need `py-14`-ish rhythm, roughly half the desktop value, and the hero's bottom padding should shrink when the flag card is the last element.
3. **Contact headline orphans.** "Have something worth / building *well*?" is manually `<br>`-broken; at 390 px it wraps to three centered lines with "worth" stranded. *Fix:* remove the `<br>` below `sm:`, let it wrap naturally, or use shorter mobile copy ("Worth building *well*?").
4. **Uniform portrait dominates mobile About.** `max-w-[240px] mx-auto` centers a large formal military photo as the visual climax of the section. *Fix:* on mobile render it as a small floated square (96–120 px) beside the first paragraph, caption inline — the photo becomes a stamp on the page, not a poster.
5. **Header never gets out of the way.** Fixed, always-opaque, ~120 px with the wordmark — on a 844 px viewport that's 14% of every screen forever. *Fix:* hide-on-scroll-down / reveal-on-scroll-up (12 lines of hook code), or shrink to a compact 56 px bar after scroll.
6. **Availability line wraps badly**: "Wakefield, MA · Boston · Remote · Open to work" orphans "work". *Fix:* two stacked lines on mobile (`flex-col`), or drop "Boston · Remote" into the line above.
7. **Featured-plate button pair** ("Play it live ↗" / "Case study →") sits flush left while chips above wrap full-width — fine, but at 390 px the two buttons crowd; stack them (`w-full` each) below 420 px for fat-thumb targets.
8. **Flag options are 2×2 at 44 px height** — passable, but give them `py-3` on touch devices; Apple HIG minimum is 44 pt and they're right at the line.

## B. The missing section you asked for — **"The Lab" (skills demonstrated, not listed)**

This is the single highest-leverage addition on the entire list, and it should **replace** the current Capabilities bullet list (which is the one résumé-flavored section left). Five embedded, touchable demos — each labeled with the skill it proves, each ~1 screen tall, lazy-loaded:

| Demo | Skill proven | Spec |
|---|---|---|
| **Codex Explorer** | DATA — "organize large, messy data" | An embedded, instantly-filterable table of ~250 real codex entries (country, flag thumbnail, capital, adoption year, aspect ratio). Search-as-you-type, facet chips (region, century), sort on every column, virtualized rows, count readout ("showing 34 of 250 — 4,000+ in production"). This turns your data claim into an artifact a reviewer *uses*. |
| **Motion Workbench** | MOTION — the headline skill | A flag card animated by a spring you control: two sliders (stiffness, damping) + three trigger buttons (enter / hover / exit). Readout shows the actual cubic-bézier/spring values. Proves you understand easing as a *material*, not a library default. |
| **Swipe Deck** | INTERACTION / GESTURE | Three poster cards you can actually drag — spring release, rotation follows drag, ♥/✕ threshold commit — the real REX mechanic, miniaturized. Touch-first; this is the demo that makes mobile visitors grin. |
| **Daily Seed Scrubber** | SYSTEMS / DETERMINISM | A date input + arrows scrubbing through past/future Daily Challenges, regenerating the same 4-option round from the seed live, with the mulberry32 seed value displayed. Proves the zero-backend claim interactively — and doubles as an explainer of your cleverest engineering. |
| **Deck Balancer** | DATA + GAME DESIGN | Rap Sheet's weighted card-draw: tap "draw" repeatedly, watch a live histogram show escalation/recency weighting doing its job vs. a "pure random" toggle that visibly degrades the experience. One toggle communicates *why* the system exists. |

Format: same plate language — "Experiment 01 · DATA", coord labels, one-line caption under each stating what it proves. Every widget is code you largely already own; the section also becomes your Rauno-style `/craft` seed that grows over time.

## C. Missing content & copy

1. **A job-target line ("job description").** Nowhere does the site say what role you're actually applying for. Add one sentence under the hero eyebrow or in Contact: *"Looking for: product / UI designer or design-engineer roles (full-time or contract), Boston or remote."* Recruiters route you by this line; its absence costs real matches.
2. **Case-study depth** (per project, currently absent): problem framing → constraints → 2–3 process artifacts (early screenshot, rejected direction, before/after) → key decision with rationale → technical challenge → outcome metrics → "what I'd do differently." Globalio template instantiated in Phase 4.
3. **Process artifacts.** Zero sketches, wireframes, or iterations anywhere. You have 427 Globalio commits — mine two before/afters from git history screenshots alone. AI-directed workflow makes this *more* important, not less: show the director's cut (prompt → first output → your correction → shipped).
4. **A "Now / Next" beat** (2 lines, above Contact): *"Currently: taking Flexyn from private beta to launch. Next: [X]."* Signals momentum; it's also your Flexyn teaser slot until captures exist.
5. **One sentence of why.** "I build geography games because I've memorized flags since I was a kid" (or whatever's true). Humanity is a ranking factor with human reviewers.
6. **Testimonials / social proof:** one line from a Flexyn beta tester, Globalio player counts if analytics exist, GitHub commit count ("427 commits, solo"). Numbers you already own, currently unsurfaced.
7. **Photo:** position is fine on desktop (not "too low") — the issue is *content*: the only human image is ceremonial. Add one candid working photo (desk/sketchbook/laptop) as primary; keep the uniform portrait smaller with its caption as the credibility stamp. On mobile, shrink (see A4).
8. **Contact info sufficiency:** email + LinkedIn + GitHub + résumé is the correct set — do **not** add phone (spam) or a contact form (friction + backend). Add: response-time line, optional Cal.com "book 15 min" link, and make the résumé PDF match the new brand (it's now the only artifact still wearing the old identity).

## D. Missing motion (the skill-gap inventory)

1. **Scroll choreography:** plates should settle in with 6–8 px rotation→0 and stagger; the Index dim-line should draw across on entry; featured-plate screenshots should fan *open* from stacked as they enter viewport. (CSS scroll-driven animations or one IO hook; no library needed.)
2. **View Transitions:** drawer → dedicated case-study page morph (plate title/image are shared elements). Progressive enhancement: `document.startViewTransition` with the current drawer as fallback.
3. **Idle life in the hero:** the mystery flag gently sways (2° skew loop, paused for reduced-motion), or the № counter ticks up on load. One ambient cue that the page is alive.
4. **Cursor (desktop only, restrained):** a small compass-needle dot that rotates toward the nearest interactive element — on-theme, one `mousemove` listener, disabled on touch/reduced-motion. This is the kind of detail that gets screenshotted.
5. **Micro-moments:** copy-email button should stamp "COPIED" (you have the stamp animation already); nav underline should slide *between* items (shared layout position), not scale in each.
6. **404 as theme:** "Uncharted territory" + a torn-map illustration + link home. GitHub Pages needs a literal `404.html` — currently missing entirely (D8 below).

## E. Missing trust/technical items

1. `404.html` (custom, on-theme) — currently GitHub's default.
2. Analytics (Plausible or GoatCounter, 1 script tag, cookieless) — you're flying blind on real visitors.
3. JSON-LD `Person` + `CreativeWork` schema — 10 lines in index.html.
4. `sitemap.xml` + `robots.txt` — trivial; matters once case-study pages exist.
5. Font `<link rel="preload">` for the two woff2 files — closes the FOUT window.
6. `srcset`/`sizes` on plate screenshots once real captures land.
7. Custom domain (`seanjoudrie.com` or `.design`) — $12/yr; also makes OG URLs durable.
8. Repo hygiene (external to this repo but part of the portfolio surface): Globalio repo README with hero image + link to case study; rename `drinky` → `rap-sheet`; add descriptions/topics to all four repos.
9. Skip-link targets `#work` — correct — but there's no `main` landmark label; add `aria-label="Portfolio"` to `<main>`. (30 seconds.)

## F. Breadth check

Four projects is the right count — do not add more. The breadth problem is *depth per project* and the fact that three of four plates still show specimen art. Globalio can and should be stretched into the multi-angle proof: its case study covers design + data + systems, the Lab covers motion + interaction using its mechanics. Flexyn's "next flagship" framing is correct and should stay until it launches publicly.

---

# PHASE 3 — Benchmark deltas (specific, replicable)

| Technique (source) | Where you stand | What closes the gap |
|---|---|---|
| `/craft` grid of dated interactive experiments (rauno.me) | Absent | The Lab (§B) — five widgets, coord-labeled, grows over time |
| One perfect spring micro-interaction as brand (emilkowal.ski) | Springs exist but generic | Motion Workbench + tuned button/copy-stamp springs with *your* curve values displayed |
| Playable site-as-proof (bruno-simon.com, neal.fun) | Flag game ✓ — keep | Extend: seed scrubber + swipe deck make it a *pattern*, not a moment |
| Scroll-driven storytelling (2026 award standard) | Absent (fades only) | Plate fan-open, dim-line draw, case-study scroll sequence |
| View Transitions between list/detail (Figma 2026 trend) | Absent (drawer slide) | Case-study pages with shared-element morphs, drawer as fallback |
| Committed single metaphor everywhere (jesse-zhou.com) | Above the fold only | Carry atlas into menu (sheet = folded map), 404 ("uncharted"), cursor (compass), transitions (route-draw) |
| Quiet-but-flawless mobile (brittanychiang.com) | 5/10 | Inventory §A — eight fixes |
| Writing as proof (Comeau, Rauno) | Absent | Optional P2: two short "field notes" (how the daily seed works; directing AI agents) — doubles as SEO surface |

---

# PHASE 4 — The blueprint

## Direction: **Atlas v2 — "Expedition"** (deepen, don't replace)

The identity is right and one week old; award-tier comes from *carrying it through*, not restarting. (Alternative considered and rejected: "Control Room" dark-ops HUD — re-skins into the crowded dark-portfolio sea and re-couples you to the ops story.)

- **Palette (unchanged core + one addition):** paper `#f4eee1`, ink `#211b12`, vermilion `#bd3a1c`, gold `#9c7420`, map-blue `#2b4a8a`, **+ contour `#e9e0cb`** for topographic line-work texture on large fields.
- **Type system (unchanged):** Fraunces display / Inter text / mono coords. Add one usage rule: italics = product voice, roman = your voice.
- **Layout concept:** single page → **hub + spokes**: home keeps Hero → Index → Lab → About → Now → Contact; each plate links to `/work/globalio` etc. as full case-study pages (pre-rendered, own OG images).
- **Motion language:** "surveying" — lines draw, plates settle, routes trace between views; springs on touch; everything ≤ 400 ms, reduced-motion honored.
- **Signature moment (already have #1):** daily flag. Add #2: the view-transition route-draw into case studies.

## Information architecture

```
/            Hero (+ job-target line) → Index of Works → The Lab →
             About (candid photo + uniform stamp; "how I work" 3-liner) →
             Now/Next → Contact (+ response time, Cal link)
/work/globalio     Full case study (template below)
/work/rex, /work/flexyn, /work/rap-sheet   Shorter studies, same skeleton
404.html     "Uncharted territory"
```

## Globalio case-study template (instantiated)

1. **Opening plate:** title, hook, 15-sec autoplay-muted screen capture, chips (50+ modes · 4,000+ entries · 197 countries · 1 week).
2. **The bet** (2 sentences): a daily geography game everyone plays together, with no server to coordinate it.
3. **Constraint ledger** (3 bullets): solo; zero backend; ship in days not months.
4. **Decision 1 — the seed** (with Seed Scrubber embedded): why deterministic PRNG beats an API; code excerpt (10 lines).
5. **Decision 2 — the codex** (with Codex Explorer embedded): schema sketch, script-detection engine, why distractor quality is the real difficulty knob.
6. **Decision 3 — the interface:** 3 annotated screens; why warm paper beats quiz-app blue; before/after of one iterated screen (from git history).
7. **What shipped:** live link, feature list, PWA/offline note.
8. **Honest ledger:** what I'd redo; what the AI-directed workflow did and didn't do.
9. **Footer route:** "Next expedition → REX" (view-transition link).

## Tech approach

- Stay Vite + React + Tailwind. Add `vite-ssg` (or route-level pre-render) for `/work/*` so each study is crawlable with its own OG card.
- Motion: CSS transitions + one 2 KB spring hook for the Lab; `document.startViewTransition` behind feature detection. **No animation framework** until a demo demands it (Motion One, 4 KB, if ever) — bundle stays under 250 KB.
- Lab widgets `React.lazy` + IO-triggered so home LCP is untouched; codex data as a static 30 KB JSON chunk.
- Guardrails: LCP < 1.5 s on Fast-3G, CLS < 0.05, every widget keyboard-operable, reduced-motion = fully functional static variants, axe-core clean.

## Prioritized backlog

**P0 — defects visible to any visitor (≈ half a day total)**
1. Mobile menu → full-screen opaque sheet with scroll-lock + focus trap. *(1–2 h)*
2. Mobile rhythm: halve section paddings < 640 px; fix hero-bottom gap. *(1 h)*
3. Contact headline `<br>` removal on mobile; availability line stacking. *(15 min)*
4. Mobile About portrait → small floated stamp. *(30 min)*
5. Hide-on-scroll header on mobile. *(45 min)*
6. `404.html`, font preloads, JSON-LD, `aria-label` on main. *(1 h)*

**P1 — the 10/10 movers (roughly a weekend each)**
7. **The Lab** — Codex Explorer + Seed Scrubber first (both mostly exist as logic), then Swipe Deck, Motion Workbench, Deck Balancer. Replaces Capabilities list.
8. **Globalio case-study page** per template, with View Transition entry + real before/afters from git history.
9. Scroll choreography pass (plate settle, line draws, fan-open) + copy-stamp + nav underline slide.
10. Job-target line + Now/Next section + response-time line + Cal link.
11. Real captures into Flexyn/REX/Rap Sheet plates (you supply screenshots; slots are one-line swaps).
12. Analytics (Plausible) + custom domain.

**P2 — polish**
13. Candid photo; résumé PDF re-set in Fraunces/Inter; testimonial line; cursor compass (desktop); 2 field notes; contour texture on wide viewports; REX/Flexyn/Rap Sheet study pages; repo hygiene (Globalio README, `drinky` rename).

## Roadmap

- **Phase A (today):** P0 items 1–6. Mobile stops undermining everything else.
- **Phase B (next):** Codex Explorer + Seed Scrubber + job-target/Now/Next copy. The site now *demonstrates* data + systems.
- **Phase C:** Globalio case-study page + scroll choreography + View Transitions. Motion score jumps from 5.5 toward 9.
- **Phase D:** remaining Lab widgets, captures, domain, analytics, résumé, photo, field notes.

Run the rubric again after Phase C — the weighted score projects to ≈ 8.7, with the remaining gap being real captures, social proof, and time-in-market.
