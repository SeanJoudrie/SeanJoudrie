# What to build next — brainstorm

**Date:** August 2026
**Subject:** the shelf as it stands — 9 shipped products, 13 Range commissions, 2 Lab
experiments, 1 written-but-unbuilt commission (Meld, `docs/roster/4-collab-canvas.md`).
**Question:** what is the highest-value next build?

---

## 0 · The premise

Volume is no longer the problem. The index runs a dozen entries deep, the Range runs
thirteen, and every one of them is real. The question has changed from *is there enough*
to *is the next thing worth the week it costs*.

Two structural findings drive everything below.

---

## 1 · Finding one: the Range is 69% graphics

| Territory | Commissions | Count |
|---|---|:-:|
| GPU particles | Terra, Cortex, Skull, Spine, Pulse | **5** |
| Other 3D / WebGL | Meridian, Bloom, Riff, Relief | **4** |
| Everything else | AeroScale, Ledger Lens, Palisade, Skein | **4** |

Nine of thirteen commissions are graphics work. The stated job target is
*product / UI design and design-engineer roles* (`site.ts` → `seeking`).

The consequence is a marginal-value inversion. A fourteenth particle demo proves nothing
the fifth didn't; the reviewer already believes the claim. The **first** demo in an empty,
screened-for territory changes what they believe. Every hour spent on graphics from here
is an hour spent past the point of persuasion.

**Rule for the next commission: it must land in a territory the Range does not already
hold.**

---

## 2 · Finding two: the anatomy series is one product, filed as four

Cortex (brain), Skull, Spine and Pulse (heart) share a bake pipeline, a particle engine, a
region-selector interaction, and a data source (BodyParts3D). Four adjacent cards on one
shelf read as repetition — the reviewer learns the technique on Cortex and skims the rest.

Assembled behind one shell with a body-region selector, they read as an interactive
anatomy atlas: a single flagship, unusual, and clearly harder than any one of its parts.

This is the cheapest high-value move available. It is consolidation, not new work.

---

## 3 · Candidates

### 1. Foreman — an agentic AI work surface
**Skill claimed:** agent interfaces, streaming tool use, human-in-the-loop control
**Territory:** unclaimed (Ledger Lens covers one-shot vision extraction, nothing else)

A visitor states a goal against a fixed synthetic codebase. Claude plans, then works —
and the demo is the *surface around the agent*, not the agent:

- a visible plan that updates as the model revises it
- each tool call streamed as a card that expands to its arguments and result
- interruption mid-run, with steering ("no, not that file")
- a proposed diff the visitor approves or rejects hunk by hunk
- a token / cost meter that runs live
- honest failure states — the tool call that errored, the retry, the give-up

**Why this one ranks first.** Every company shipping AI right now is designing this exact
surface, and almost none of them design it well — there is no settled language for it yet.
It is also the one territory where the claim is already staked in prose: the About section
says the AI-agent workflow is deliberate and the architecture calls are yours. This turns
that paragraph into an artifact.

**Cost is lower than it looks.** The backend pattern is already solved and shipped —
`supabase/functions/extract` holds the key server-side, rate-limits, and streams. Ledger
Lens is the proof it works. Foreman is a second consumer of a pipeline that already exists.

### 2. Corpus — the anatomy four, assembled
**Skill claimed:** nothing new — it protects what is already claimed
See §2. One shell, one region selector, one bake pipeline, four bodies of points. Range
goes 13 → 10 and the best engineering on the shelf stops looking like a rut.

### 3. Drift — a local-first sync inspector
**Skill claimed:** offline-first sync, conflict resolution, optimistic UI
**Territory:** unclaimed

Two device panes side by side, one shared document, a network switch between them. Edit
both while offline, flip the switch, watch them converge — with the operation log visible
the whole time, so the reviewer sees *why* it converged.

**Why this over Meld** (the written, unbuilt whiteboard commission): whiteboards are a
saturated demo genre and the interesting part — the merge — is invisible inside one. Drift
shows the hard part instead of hiding it. The CRDT is hand-rolled, which is the signature
move already established by Palisade (no grid library) and Skein (no graph library).

### 4. Foundry — a live design-token studio
**Skill claimed:** design systems, tokens, contrast and theming
**Territory:** unclaimed, and it is the single most-requested design-engineer artifact

Edit a token graph and watch a real interface retheme live. APCA and WCAG contrast checks
that fail loudly rather than quietly. Light and dark derived, not hand-maintained. Export
to Tailwind config, CSS custom properties, and JSON.

**Cost:** the lowest on this list. Five distinct visual systems already ship here (Atlas
paper, AeroScale slate, Palisade teal, Meridian brass, Skein), and `data/themes.ts`
already exists. This is mostly surfacing a system that is already built.

### 5. An accessibility demo
**Skill claimed:** accessibility engineering
**Territory:** unclaimed, and almost nobody demos it at all

One interface, three lenses: the live accessibility tree as the visitor tabs through it,
the keyboard path visualized, and a low-vision / colour-vision simulation over the top —
with a per-component WCAG pass/fail readout. It is a genuine differentiator precisely
because it is unglamorous, and it pairs with the standards side of the Army background.

### 6. Cutaway — a timeline editor
**Skill claimed:** precision editing UI, 60fps interaction under load
**Territory:** unclaimed

Trim, snap, ripple, multi-track drag, frame-accurate scrub, a real undo stack. Timeline
UI is hard in ways that are immediately legible to anyone who has built one, and Riff
already proved the Web Audio half.

---

## 4 · The candidates that are not demos

The Range is the fun part of the shelf, and that is exactly why it deserves suspicion as a
default answer.

**Ship Flexyn.** It is described in `projects.ts` as the next flagship and the most
architecturally complete build here — and a visitor cannot see one pixel of it. The Now
section has pointed at a public launch for some time. No new commission outranks making
the flagship visible.

**Close the case-study hole.** `GAP_ANALYSIS.md` scores case studies **4 / 10** at 10%
weight, on the reasoning that the drawers are summary cards: no process artifacts, no
before/afters, no rejected directions, no metrics, no "what I'd do differently." Three
projects have dedicated pages; the rest do not. A fourteenth demo does not move this
number, and it is the largest single scoring hole on the site.

---

## 5 · Recommendation

**If the goal is a stronger shelf:** Corpus first (cheap, protects existing work), then
Foreman (the real build, in the most valuable empty territory).

**If the goal is landing the role:** Flexyn public + case-study depth on the top three
outranks both, and it is not close. The shelf is already persuasive; what it lacks is
depth on the things a hiring manager reads *after* being persuaded.

---

## 6 · The filter for anything not on this list

Before committing a week, three questions:

1. **Is the territory already held?** If the Range can already answer the question the
   demo answers, the demo is decoration.
2. **Does it survive a screenshot?** Every entry here earns its place in a scroll-past.
   If it needs a paragraph before it reads, it is a case study, not a commission.
3. **Does it prove something the job description asks for?** Graphics is a specialty the
   shelf has established beyond doubt. The open questions are systems, collaboration,
   AI-native product surfaces, and accessibility.
