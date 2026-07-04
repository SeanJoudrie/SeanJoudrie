# Roster 05 — Skein: an OSINT link-analysis case board

> Build spec for **Fable** (the coding LLM). This document is exhaustive on
> purpose. Every decision is made here. Do **zero** independent design. Where a
> file is given as a fenced block headed by its path, create that file with
> exactly that content. Where a hex, a ratio, a physics constant, a message
> shape, or a phase order is given, it is load-bearing — do not "improve" it.
> If something looks missing, it is in a later section; read the whole doc once,
> then build in the phase order of §13. Match the conventions already proven by
> AeroScale, Meridian, Ledger Lens (`docs/roster/1`), Palisade (`docs/roster/2`),
> and the command palette (`docs/roster/3`). Do not invent new patterns.

---

## 0 · Identity

| Field | Value |
| --- | --- |
| Product name | **Skein** |
| Tagline | *pull one thread and the whole network moves* |
| Demo slug | `skein` (route `#/demos/skein`) |
| Internal id / token prefix | `skein` (`--color-skein-*`, `.skein-root`, `.skein-label`, `body.skein-page`) |
| Range commission | **Commission `05`**, skill **"Link analysis & spatial-temporal fusion"** |
| Page dir | `portfolio/src/pages/Skein/` |
| Smoke | `portfolio/scripts/smoke-skein.mjs` |
| On-screen claim | **"Scrub the timeline and watch the network surface."** |
| Second claim (footer) | **"Force-directed link analysis, hand-rolled — no graph library, no map tiles."** |

**Why "Skein":** a skein is a coiled, tangled length of yarn — exactly what an
analyst is handed at the start of a case, and exactly what this tool untangles.
It is short (the builder types it hundreds of times), it is not a real product,
and it is not already taken (Meridian, Palisade, Ledger Lens, Atlas/CommandPalette,
and Meld are all spoken for).

**What it is:** three fused, cross-filtering views over one small, entirely
fictional financial-crime case — a trade-based money-laundering and
sanctions-evasion ring moving mislabeled cargo through a chain of shell
companies:

1. **A link chart** — a hand-rolled force-directed entity/relationship graph.
   Nodes are entities (person / organization / account / location / vessel);
   edges are typed, dated relationships (owns, controls, communicated-with,
   transferred-funds-to, met-at, travelled-with, shipped-via, registered-at,
   employed-by). Draggable nodes, pan/zoom, click-to-select with a detail panel,
   shift-click multi-select.
2. **A timeline scrubber** — every relationship carries a date. A draggable
   time-range brush filters the whole system live: edges outside the window fade,
   nodes with no in-window activity dim, the map recolours. *This is the single
   most important interaction.*
3. **A schematic geospatial pane** — an authored SVG "chart of the region" (no
   Mapbox, no Leaflet, no map tiles), plotting the case's ports and hubs. Click a
   location and everything present there **within the current time window**
   highlights across all three views.

The three views are one system: a change in any of them re-derives the other two.
That triple-linked-view fusion is the whole point.

---

## 1 · Locked decisions (do not revisit)

1. **Hand-rolled force-directed layout.** No `d3-force`, no `cytoscape`, no
   `vis-network`, no `sigma`, no graph/physics library of any kind. The physics
   in §7.4 (repulsion + spring attraction + centering + damped Verlet
   integration + alpha cooling/reheat) **is** the hiring signal, exactly the way
   Palisade hand-rolls virtualization and the command palette hand-rolls fuzzy
   matching. **Zero new dependencies** — verify `package.json` gains only the
   smoke-script line.
2. **Hand-rolled schematic map.** An authored SVG chart in the site's visual
   language — abstract sea + landmasses + plotted ports. No tile library, no
   real geography, no downloaded assets. Same spirit as Globalio drawing its own
   world.
3. **One fictional case, generated deterministically** from a single `mulberry32`
   seed (`lib/rand.ts`), byte-identical on every device. Entirely synthetic:
   invented people, shell companies, vessels, banks, ports. **Corporate-fraud /
   smuggling / illicit-trade financial territory only** — shell companies, wire
   transfers, mislabeled manifests, meetings, vessel movements. Nothing depicting
   terrorism, real violence, or real-world military targeting. This is a
   detective *case board*, in the same register as Ledger Lens processing
   fictional receipts and Globalio being a fictional geography game.
4. **Dev-only invariants file** (`generate.assert.ts`), following the exact
   Palisade / Ledger Lens convention: dynamic `import()` under
   `import.meta.env?.DEV`, throws with a bulleted list of every violation, never
   bundled in production.
5. **Dataset size:** `ENTITY_TARGET = 54` entities, `REL_TARGET = 132`
   relationships. Small enough that an O(n²) force layout stays at 60fps with
   zero library, large enough that the network reads as a real case (see §12).
6. **Cross-filter state is a `useReducer`** (`model.ts`), with a pure `derive()`
   selector — the Palisade `model.ts` reducer discipline, minus undo/redo (there
   is nothing destructive to undo here; selection/filter state is cheap and fully
   reconstructable, so an undo stack would be ceremony — justified in §7.3).
7. **All animation rides the shared ticker** (`lib/ticker.ts` `addTask`). The
   force simulation registers **one** frame task; nothing starts a second `rAF`
   loop. Every animation has a `prefers-reduced-motion` out.
8. **The demo page brings its own chrome.** It does **not** use `Reveal` /
   `useScrollProgress` (those are for the scrolling portfolio) — the standalone
   demo route renders full-bleed. The only portfolio-side entry is the Range
   card, which `Range.tsx` already animates via its own `Reveal`; nothing new is
   needed there beyond the `COMMISSIONS` entry and thumb (§5).

---

## 2 · Positioning & hiring signal

AeroScale proves *motion & data-viz*. Meridian proves *3D & WebGL*. Ledger Lens
proves *AI product*. Palisade proves *enterprise UI at scale*. Skein proves the
one thing none of them touch and the one thing a whole category of employers
screens hard for: **the ability to build a fused, interactive analysis surface —
a graph, a timeline, and a map that are all one cross-filtering system — from
first principles.**

This is deliberately, explicitly the core UX pattern of Palantir Gotham (linked
graph + timeline + map over one case), and this demo exists to signal fit for
**Forward-Deployed-Engineer / analyst-tooling / defense-tech-adjacent** roles.
The reviewer question it answers: *"Can this person build the thing our platform
is — entity resolution surfaced as a link chart, spatial-temporal correlation,
live cross-filtering — without reaching for a graph library that would hide
exactly the skills we're hiring for?"*

Hireable sub-skills on display:

- **Algorithmic craft.** A from-scratch force-directed layout with real physics
  (Coulomb repulsion, Hooke springs, damped integration, alpha annealing with
  interaction-driven reheat), a hand-rolled quadtree-free O(n²) solver tuned to
  stay smooth at the stated dataset size, and coordinate-space math for
  pan/zoom + drag. Not an `npm install`.
- **Data-fusion product sense.** Three views, one derivation. The hard part isn't
  any one view — it's making a selection in the graph, a brush on the timeline,
  and a click on the map all speak the same state and re-derive each other
  without desyncing. That is the actual job.
- **Synthetic-data discipline.** A deterministic, seeded, invariant-checked case
  that reads as a believable investigation — correlated dates, ownership chains
  that resolve, funds that flow account-to-account, vessels that call at ports in
  order. A domain reviewer's gut-check passes.
- **Honest accessibility.** A visual/spatial tool that most people would ship as
  an inaccessible `<canvas>`. Skein ships a keyboard-navigable entity list as a
  first-class equivalent to the graph, ARIA live-region announcements for every
  filter change, and reduced-motion fallbacks (§11).

### The Range-card decision (JUSTIFIED)

**This one DOES deserve a full, openable Range "Commission" card** — the opposite
of the command palette's §2 argument, and worth stating explicitly so Fable
doesn't second-guess the wiring:

- The command palette was rejected as a card because it has **no route and no
  standalone surface** — its whole value is being ambient and global. Skein is
  the reverse: it is a **standalone, self-contained product at its own route**
  (`#/demos/skein`) with its own chrome, its own theme, its own dataset — exactly
  like AeroScale, Meridian, Ledger Lens, and Palisade. It is a thing you *enter,
  explore, and leave*.
- Its value is legible only by *using* it — scrub, select, correlate. That is a
  "click to open the live demo" surface by definition.
- It is the single strongest artifact in the roster for the target role, so it
  earns a shelf slot, not a footnote.

Net: **a full Commission `05` card with an openable route.** (§5.)

---

## 3 · File tree

### New files

```
portfolio/src/pages/Skein/
  index.tsx            # page shell: chrome, 3-pane layout, orchestration, derive() memo (§7.11)
  theme.css            # .skein-root scope, selection/focus, body wash, labels, keyframes (§4.5)
  schema.ts            # Entity/Rel types, enums, rel metadata, format + date helpers (§6.2)
  generate.ts          # seeded case generator + exported CASE (entities, rels, spans) (§6.3)
  generate.assert.ts   # dev-only case invariants (dynamic import) (§6.4)
  model.ts             # cross-filter reducer + pure derive() selector (§7.3)
  layout.ts            # hand-rolled force-directed LayoutEngine (physics, no library) (§7.4)
  icons.tsx            # per-entity-type glyph set + risk dot (§7.2)
  Graph.tsx            # SVG link chart: force paint loop, drag / pan / zoom, select (§7.5)
  Timeline.tsx         # density histogram + draggable range brush + quick-range chips (§7.6)
  MapPane.tsx          # authored schematic chart: ports, lanes, click-to-filter (§7.7)
  DetailPanel.tsx      # entity / relationship / location inspector (§7.8)
  EntityList.tsx       # keyboard-accessible entity list (a11y equivalent to the graph) (§7.9)
  Legend.tsx           # type + relationship legend, "how it's built" strip (§7.10)

portfolio/scripts/smoke-skein.mjs   # playwright-core smoke (§14)
```

### Edited files (four, all spelled out in §4.3 / §5 / §14)

```
portfolio/src/index.css            # add @theme skein-* tokens (§4.3)
portfolio/src/App.tsx              # one lazy import + one DEMO_PAGES entry (§5.2)
portfolio/src/components/Range.tsx # one COMMISSIONS entry + one THUMBS entry + SkeinThumb (§5.3)
portfolio/package.json             # chain the smoke script (§14.2)
```

### Reused as-is (import, do not modify)

```
portfolio/src/lib/rand.ts     # mulberry32 (deterministic seed)
portfolio/src/lib/ticker.ts   # addTask (the single shared rAF loop), easeOutCubic
portfolio/src/lib/router.ts   # navigate() (back to the portfolio)
```

Skein starts **no** `rAF` loop of its own — the force sim rides `addTask`.

> **Numbering note for Fable:** in the live `Range.tsx`, `COMMISSIONS` currently
> ends at `'04'` (Palisade). This is Commission **`05`** and slots in right after
> it. `THUMBS` is keyed by the `n` string, so even if a sibling roster doc also
> targets `'05'`, gaps and collisions are resolved by the last writer of the map
> literal — just append `'05': SkeinThumb` to whatever entries exist. Do not
> renumber the others.

---

## 4 · Theme tokens (hex + WCAG)

A distinct "situation room" chrome: a **cool near-black violet-charcoal** with a
warm **coral-red "thread" accent** — the analyst's red string across a board.
Deliberately unlike AeroScale (slate-blue), Meridian (warm brass), Ledger Lens
(cream/charcoal), Palisade (teal-charcoal), and Meld (indigo + bright teal). Each
of the five **entity types** gets its own maximally-separable hue, all
WCAG-checked against the card surface.

### 4.1 Tokens

| Token | Hex | Role |
| --- | --- | --- |
| `--color-skein-bg` | `#0c0b12` | app background (cool near-black violet) |
| `--color-skein-card` | `#14121d` | panel / pane surface |
| `--color-skein-card-2` | `#1e1b2b` | raised chips, hover, inputs |
| `--color-skein-line` | `rgb(255 255 255 / 0.08)` | hairline borders |
| `--color-skein-ink` | `#f2eef7` | primary text |
| `--color-skein-ink-2` | `#c3bcd2` | secondary text |
| `--color-skein-muted` | `#928aa6` | labels, captions, `.skein-label` |
| `--color-skein-thread` | `#e8635f` | **brand accent** — selection, focus, active thread, CTA |
| `--color-skein-thread-2` | `#c94a48` | accent pressed / deep |
| `--color-skein-flag` | `#f0b64e` | high-risk / flagged marker (amber) |
| `--color-skein-person` | `#6aa9f0` | entity type: person (blue) |
| `--color-skein-org` | `#b48cf0` | entity type: organization (violet) |
| `--color-skein-account` | `#e07db4` | entity type: account (pink) |
| `--color-skein-location` | `#57c8a0` | entity type: location (teal-green) |
| `--color-skein-vessel` | `#5cc6d6` | entity type: vessel (cyan) |
| `--color-skein-edge` | `rgb(197 188 214 / 0.22)` | default edge stroke (non-text) |
| `--color-skein-sel` | `rgb(232 99 95 / 0.16)` | brush / selection wash (non-text) |

### 4.2 Computed WCAG contrast ratios (sRGB, WCAG 2.1)

Relative luminance computed, not eyeballed. `bg #0c0b12` L≈0.00360;
`card #14121d` L≈0.00670. Every **text-role** and every **entity-type** color
clears **4.5:1** against **both** surfaces.

| Token | Luminance | vs `bg` | vs `card` | Pass ≥4.5 |
| --- | --- | --- | --- | --- |
| `ink` `#f2eef7` | 0.8670 | **17.1 : 1** | **16.2 : 1** | ✓ |
| `ink-2` `#c3bcd2` | 0.5222 | **10.7 : 1** | **10.1 : 1** | ✓ |
| `muted` `#928aa6` | 0.2704 | **5.98 : 1** | **5.65 : 1** | ✓ |
| `thread` `#e8635f` | 0.2691 | **5.95 : 1** | **5.63 : 1** | ✓ |
| `flag` `#f0b64e` | 0.5253 | **10.7 : 1** | **10.2 : 1** | ✓ |
| `person` `#6aa9f0` | 0.3774 | **7.97 : 1** | **7.54 : 1** | ✓ |
| `org` `#b48cf0` | 0.3475 | **7.41 : 1** | **7.01 : 1** | ✓ |
| `account` `#e07db4` | 0.3380 | **7.24 : 1** | **6.84 : 1** | ✓ |
| `location` `#57c8a0` | 0.4587 | **9.51 : 1** | **8.98 : 1** | ✓ |
| `vessel` `#5cc6d6` | 0.4752 | **9.79 : 1** | **9.26 : 1** | ✓ |

`card-2 #1e1b2b` (L≈0.0128) reads as a raised chip a comfortable step above
`card`. `line`, `edge`, and `sel` are non-text (WCAG floor N/A): `edge` is the
resting graph link, `sel` the selection/brush wash. Node fills use the type
color at 18–22% alpha with the type color at full strength as the 1.5px stroke —
the stroke (≥6.8:1) carries the meaning, well past the 3:1 graphical-object floor.

> **Compute note for Fable:** do **not** retune these by eye. They are
> validator-passed. Any new color must keep text/type roles ≥4.5:1 vs both
> `#0c0b12` and `#14121d`.

### 4.3 `@theme` additions — `portfolio/src/index.css`

Append inside the existing `@theme { … }` block, immediately after the Palisade
block (after `--color-palisade-sel`, before the closing `}`):

```css
  /* ---- Skein demo — OSINT link-analysis case board (pages/Skein).
     Cool near-black violet-charcoal + a coral "thread" accent (the analyst's
     red string). Five entity-type hues, each WCAG-checked ≥4.5:1 against bg
     #0c0b12 AND card #14121d; see docs/roster/5-link-analysis.md §4. Node fills
     are the type hue at low alpha with a full-strength stroke carrying meaning.
     Do not retune by eye. ---- */
  --color-skein-bg: #0c0b12;
  --color-skein-card: #14121d;
  --color-skein-card-2: #1e1b2b;
  --color-skein-line: rgb(255 255 255 / 0.08);
  --color-skein-ink: #f2eef7;
  --color-skein-ink-2: #c3bcd2;
  --color-skein-muted: #928aa6;
  --color-skein-thread: #e8635f;
  --color-skein-thread-2: #c94a48;
  --color-skein-flag: #f0b64e;
  --color-skein-person: #6aa9f0;
  --color-skein-org: #b48cf0;
  --color-skein-account: #e07db4;
  --color-skein-location: #57c8a0;
  --color-skein-vessel: #5cc6d6;
  --color-skein-edge: rgb(197 188 214 / 0.22);
  --color-skein-sel: rgb(232 99 95 / 0.16);
```

### 4.4 Type → token map (single source of truth for JS)

The five entity-type colors are read from CSS in components via the shared
`TYPE_COLOR` record in `schema.ts` (§6.2). Keep the hexes there in lockstep with
the `@theme` block above — they are the same values, duplicated once into JS
because canvas/SVG fills need literal strings, not CSS custom props resolved at
paint. (This is the identical pattern AeroScale uses for its series colors.)

### 4.5 `portfolio/src/pages/Skein/theme.css`

```css
/* Skein — link-analysis case board, demo-scoped "situation room" chrome.
   Color tokens live in index.css @theme (skein-*); this sheet carries what
   utilities can't: color-scheme, selection, focus, the body wash, the small-caps
   label, and the few keyframes the board uses. Every animation has a
   reduced-motion out. */
.skein-root {
  color-scheme: dark;
  font-family: var(--font-sans);
}
.skein-root ::selection {
  background: var(--color-skein-thread);
  color: var(--color-skein-bg);
}
.skein-root :focus-visible {
  outline: 2px solid var(--color-skein-thread);
  outline-offset: 2px;
  border-radius: 3px;
}

/* The demo owns the whole viewport — swapping the body color too means
   overscroll rubber-banding never flashes the portfolio's paper. */
body.skein-page {
  background-color: var(--color-skein-bg);
}

/* Small-caps mono label — the Skein twin of the portfolio's .annotation. */
.skein-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-skein-muted);
}

/* Tabular numerals for money + dates so columns align. */
.skein-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

/* The graph canvas never shows a text caret and never lets touch-scroll steal a
   drag — pan/drag needs the whole gesture. */
.skein-canvas {
  touch-action: none;
  cursor: grab;
}
.skein-canvas.skein-panning { cursor: grabbing; }
.skein-canvas.skein-dragging { cursor: grabbing; }

/* First-paint cascade — header + panes settle in (mirrors Meridian's hero-in). */
@keyframes skein-in { from { opacity: 0; transform: translateY(10px); } }
.skein-in {
  animation: skein-in 350ms var(--ease-out) both;
  animation-delay: var(--d, 0ms);
}

/* The "waiting to settle" dot pulses only while the sim is hot. */
@keyframes skein-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.skein-pulse { animation: skein-pulse 1.4s var(--ease-out) infinite; }

/* Detail panel swaps content with a soft fade. */
.skein-fade { animation: skein-in var(--t-enter) var(--ease-out) both; }

@media (prefers-reduced-motion: reduce) {
  .skein-in, .skein-pulse, .skein-fade { animation: none; opacity: 1; transform: none; }
}
```

---

## 5 · Router + App + Range integration

### 5.1 Router — no change required

`portfolio/src/lib/router.ts` already parses `#/demos/<slug>` into `demoSlug`;
`skein` matches the existing `[a-z0-9-]+`. Do **not** edit the router. The main
page section order (Hero → Range → About → Work → Lab → Now → Contact) is
unchanged — Range is already second and needs no reordering.

### 5.2 `portfolio/src/App.tsx` — two additions

Add the lazy import beside the others (after the `PalisadeGrid` line):

```tsx
const Skein = lazy(() => import('./pages/Skein'))
```

Add one entry to `DEMO_PAGES` (after the `palisade` entry):

```tsx
  skein: {
    Page: Skein,
    label: 'Skein link-analysis demo',
    shell: 'bg-skein-bg',
    spinner: 'text-skein-muted',
  },
```

That is the whole App wiring — the standalone `Suspense` render already handles
the rest.

### 5.3 `portfolio/src/components/Range.tsx` — one commission + one thumb

Add the commission object to `COMMISSIONS` (after the Palisade `'04'` object):

```tsx
  {
    n: '05',
    skill: 'Link analysis & spatial-temporal fusion',
    title: 'Skein — OSINT link-analysis case board',
    caption:
      'One fictional smuggling case, three fused views: a hand-rolled force-directed link chart (no graph library), a timeline scrubber, and a schematic map (no map tiles). Drag the time brush and watch the network surface — nodes dim, edges fade, the map recolours; click an entity or a port and everything present there in that window lights up across all three. Deterministic synthetic data, real physics, the Palantir-style triple-linked view built from scratch.',
    href: '#/demos/skein',
  },
```

Register the thumbnail in the `THUMBS` map (extend the existing literal — keep the
other entries):

```tsx
const THUMBS: Record<string, () => ReactNode> = { '01': AeroThumb, '02': MeridianThumb, '03': LedgerThumb, '04': PalisadeThumb, '05': SkeinThumb }
```

Add the `SkeinThumb` component (place it beside the other thumbs). Complete,
paste-ready SVG — a miniature link chart with typed nodes, a red "thread" edge, a
timeline strip, and a plotted port, echoing the palette:

```tsx
/** A miniature of the case board — typed nodes wired by a red thread, a
    timeline strip beneath, a port pin off to the side. */
function SkeinThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0c0b12" />
      {/* edges (resting) */}
      <g stroke="#c5bcd6" strokeOpacity="0.28" strokeWidth="1.5">
        <line x1="96" y1="52" x2="150" y2="40" />
        <line x1="150" y1="40" x2="204" y2="66" />
        <line x1="96" y1="52" x2="120" y2="104" />
        <line x1="120" y1="104" x2="188" y2="112" />
      </g>
      {/* the highlighted "thread" — a selected relationship */}
      <line x1="150" y1="40" x2="120" y2="104" stroke="#e8635f" strokeWidth="2.5" />
      {/* nodes, one per type color */}
      {[
        { x: 96, y: 52, c: '#6aa9f0', r: 11 },  /* person */
        { x: 150, y: 40, c: '#b48cf0', r: 13 }, /* org (hub) */
        { x: 204, y: 66, c: '#e07db4', r: 9 },  /* account */
        { x: 120, y: 104, c: '#5cc6d6', r: 10 },/* vessel */
        { x: 188, y: 112, c: '#57c8a0', r: 9 }, /* location */
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} fillOpacity="0.2" stroke={n.c} strokeWidth="2" />
        </g>
      ))}
      {/* selection ring on the hub */}
      <circle cx="150" cy="40" r="17" fill="none" stroke="#e8635f" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* timeline strip */}
      <rect x="14" y="136" width="252" height="12" rx="3" fill="#1e1b2b" />
      {[22, 40, 58, 92, 120, 150, 176, 210, 236].map((x, i) => (
        <rect key={i} x={x} y={140 - (i % 3) * 2} width="4" height={4 + (i % 3) * 2} rx="1" fill="#928aa6" />
      ))}
      {/* the brush window */}
      <rect x="86" y="134" width="86" height="16" rx="3" fill="none" stroke="#e8635f" strokeWidth="1.5" />
      <rect x="86" y="134" width="86" height="16" fill="#e8635f" fillOpacity="0.14" />
    </svg>
  )
}
```

`COMMISSIONS.length` in the header counter, the card layout, the gold skill tag,
the Fraunces title, the accent button, and the `plate-lift` thumbnail all render
`'05'` automatically once the entry + thumb exist. No other Range edits.

---

## 6 · Dataset — the synthetic case

### 6.1 The case & the story

**Case: "Operation Longshore" (fictional).** A trade-based money-laundering and
sanctions-evasion ring. A financier controls a holding company that owns a lattice
of shell trading firms; those firms move mislabeled bulk cargo on flag-of-
convenience vessels through a free-trade zone, over-/under-invoice the trades, and
wash the proceeds through nominee-held accounts at a correspondent bank. The
window spans **18 months (2024-01-01 → 2025-06-30)**, structured in three "waves"
of activity so scrubbing the timeline visibly reveals the network assembling,
transacting, then unwinding.

The seed encodes patterns a domain reviewer gut-checks:

- **Ownership resolves.** Every shell has a controller path that reaches the
  ultimate beneficial owner (no dangling ownership).
- **Funds flow account→account** (or org→account), never person→port; amounts
  cluster in the $5k–$2.4M band with a believable long tail.
- **Vessels call at ports in date order**, so the map's shipping lanes are
  chronologically coherent.
- **Meetings and travel carry a location**; communications and transfers do not.
- **Risk correlates with role** — the UBO, holding company, and primary shells
  are `high`; couriers and the correspondent bank are `low`/`medium`.

### 6.2 `portfolio/src/pages/Skein/schema.ts`

```ts
/* Skein schema — the case's entity + relationship model, the enums, the
   per-relationship metadata (direction, whether it carries money / a location),
   the type→color map every view shares, and the format + date helpers. One
   place defines what an entity IS and what a relationship MEANS; graph, timeline,
   map, detail panel, and list all read from here. */

export const ENTITY_TYPES = ['person', 'org', 'account', 'location', 'vessel'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const RISKS = ['low', 'medium', 'high'] as const
export type Risk = (typeof RISKS)[number]

export const REL_TYPES = [
  'owns', 'controls', 'communicated', 'transferred', 'met',
  'travelled', 'shipped', 'registered', 'employed',
] as const
export type RelType = (typeof REL_TYPES)[number]

/** Metadata per relationship type. `carriesMoney` gates the amount field;
    `carriesLocation` gates the locationId field; `directed` picks the arrow. */
export interface RelMeta {
  label: string          // human label ("transferred funds to")
  short: string          // legend short form ("funds")
  directed: boolean
  carriesMoney: boolean
  carriesLocation: boolean
}
export const REL_META: Record<RelType, RelMeta> = {
  owns:         { label: 'owns',                 short: 'owns',    directed: true,  carriesMoney: false, carriesLocation: false },
  controls:     { label: 'controls',             short: 'controls',directed: true,  carriesMoney: false, carriesLocation: false },
  communicated: { label: 'communicated with',    short: 'comms',   directed: false, carriesMoney: false, carriesLocation: false },
  transferred:  { label: 'transferred funds to', short: 'funds',   directed: true,  carriesMoney: true,  carriesLocation: false },
  met:          { label: 'met with',             short: 'met',     directed: false, carriesMoney: false, carriesLocation: true },
  travelled:    { label: 'travelled with',       short: 'travel',  directed: false, carriesMoney: false, carriesLocation: true },
  shipped:      { label: 'shipped cargo via',    short: 'ship',    directed: true,  carriesMoney: false, carriesLocation: true },
  registered:   { label: 'registered at',        short: 'reg',     directed: true,  carriesMoney: false, carriesLocation: false },
  employed:     { label: 'employed by',          short: 'employ',  directed: true,  carriesMoney: false, carriesLocation: false },
}

export interface Entity {
  id: string
  type: EntityType
  name: string
  subtitle: string       // role / registry / flag
  risk: Risk
  aliases: string[]
  note: string
  /** Location entities only: schematic map coords in 0..1. */
  mx?: number
  my?: number
  country?: string       // location entities: jurisdiction label
}

/** A relationship IS a timeline event — it carries the date. */
export interface Rel {
  id: string
  type: RelType
  source: string         // entity id
  target: string         // entity id
  date: string           // ISO 'YYYY-MM-DD'
  amount?: number        // USD, only when REL_META[type].carriesMoney
  locationId?: string    // entity id of a location, only when carriesLocation
  note?: string
}

export interface Case {
  entities: Entity[]
  rels: Rel[]
  /** Inclusive [start, end] epoch-ms of the whole event span. */
  span: [number, number]
  name: string           // "Operation Longshore"
}

/* ---- Type → color (mirrors the @theme skein-* hexes; see §4.4) ---- */
export const TYPE_COLOR: Record<EntityType, string> = {
  person: '#6aa9f0',
  org: '#b48cf0',
  account: '#e07db4',
  location: '#57c8a0',
  vessel: '#5cc6d6',
}
export const TYPE_LABEL: Record<EntityType, string> = {
  person: 'Person',
  org: 'Organization',
  account: 'Account',
  location: 'Location',
  vessel: 'Vessel',
}
export const THREAD = '#e8635f'
export const FLAG = '#f0b64e'

/* ---- Date helpers (UTC, ISO 'YYYY-MM-DD') ---- */
export const DAY = 86_400_000
export const ms = (isoDate: string): number => Date.parse(`${isoDate}T00:00:00Z`)
export const iso = (epochMs: number): string => new Date(epochMs).toISOString().slice(0, 10)

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
export const fmtDate = (isoDate: string): string => dateFmt.format(new Date(`${isoDate}T00:00:00Z`))

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const fmtMoney = (n: number): string => usd.format(n)

/** Short money for edge labels: $1.2M, $840k. */
export function fmtMoneyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

/** True when an entity is a location (has map coords). */
export const isLocation = (e: Entity): boolean => e.type === 'location'
```

### 6.3 `portfolio/src/pages/Skein/generate.ts`

Authored core cast (the story) + seeded procedural filler (shells, accounts,
couriers, extra transactions), exactly the Palisade pattern: hand-author the
skeleton, let `mulberry32` fill the volume, so the case is byte-identical
everywhere. Every filler entity is wired into at least one relationship as it is
created, so there are **no orphan nodes**.

```ts
import { mulberry32 } from '../../lib/rand'
import {
  DAY, ms, iso,
  type Case, type Entity, type EntityType, type Rel, type RelType, type Risk,
} from './schema'

/** One seed drives the whole case. */
export const SKEIN_SEED = 20_240_117
export const CASE_NAME = 'Operation Longshore'

export const WINDOW_START = '2024-01-01'
export const WINDOW_END = '2025-06-30'
const T0 = ms(WINDOW_START)
const T1 = ms(WINDOW_END)
const SPAN_DAYS = Math.round((T1 - T0) / DAY) // 546

export const ENTITY_TARGET = 50 // 29 authored core + 21 seeded filler (8 shells + 8 accounts + 5 couriers)
export const REL_TARGET = 132

/* Three activity "waves" (fractions of the span) so scrubbing reveals phases. */
const WAVES: [number, number][] = [
  [0.02, 0.28], // assembly
  [0.34, 0.62], // transaction
  [0.70, 0.98], // unwind
]

/* ---------- authored core cast (the story) ---------- */

const CORE_ENTITIES: Entity[] = [
  // people
  { id: 'p.alderisle', type: 'person', name: 'Corwin Alderisle', subtitle: 'Financier · ultimate beneficial owner', risk: 'high', aliases: ['C.A.', 'Alderisle Holdings'], note: 'Sits behind every controlling stake in the lattice.' },
  { id: 'p.brant', type: 'person', name: 'Odile Brant', subtitle: 'Nominee director', risk: 'high', aliases: ['O. Brant'], note: 'Signs for the holding company; never travels.' },
  { id: 'p.sowerby', type: 'person', name: 'Reginald Sowerby', subtitle: 'Nominee director', risk: 'medium', aliases: [], note: 'Co-director on paper; retired notary.' },
  { id: 'p.vance', type: 'person', name: 'Elena Vance', subtitle: 'Accountant · bookkeeper', risk: 'high', aliases: ['E.V.'], note: 'Reconciles the invoicing spread across shells.' },
  { id: 'p.kessler', type: 'person', name: 'Milan Kessler', subtitle: 'Freight forwarder', risk: 'medium', aliases: [], note: 'Books cargo and files the manifests.' },
  { id: 'p.dray', type: 'person', name: 'Tomas Dray', subtitle: 'Master, MV Aurelian', risk: 'medium', aliases: ['Capt. Dray'], note: 'Sails the primary bulk carrier.' },
  { id: 'p.oduya', type: 'person', name: 'Grace Oduya', subtitle: 'Customs broker', risk: 'medium', aliases: [], note: 'Clears consignments through the free zone.' },
  { id: 'p.renn', type: 'person', name: 'Piotr Renn', subtitle: 'Courier', risk: 'low', aliases: ['the bagman'], note: 'Moves documents and cash between principals.' },

  // organizations
  { id: 'o.bs', type: 'org', name: 'Brant & Sowerby Holdings', subtitle: 'Holding company', risk: 'high', aliases: ['B&S'], note: 'Apex of the ownership lattice.' },
  { id: 'o.halcyon', type: 'org', name: 'Halcyon Trading Ltd', subtitle: 'Shell trading co · Kaltis FZ', risk: 'high', aliases: ['Halcyon'], note: 'Primary invoicing shell.' },
  { id: 'o.cinderbay', type: 'org', name: 'Cinder Bay Logistics', subtitle: 'Freight forwarder', risk: 'medium', aliases: [], note: 'Books the vessels and cargo slots.' },
  { id: 'o.osprey', type: 'org', name: 'Osprey Maritime SA', subtitle: 'Vessel registrant · flag of convenience', risk: 'high', aliases: [], note: 'Registers the fleet under a soft flag.' },
  { id: 'o.veridian', type: 'org', name: 'Veridian Commodity Partners', subtitle: 'Trade counterparty (front)', risk: 'medium', aliases: [], note: 'The "buyer" on the over-invoiced side.' },
  { id: 'o.stallpine', type: 'org', name: 'Stallpine Metals', subtitle: 'Consignee · mislabeled cargo', risk: 'high', aliases: [], note: 'Receives cargo declared as scrap.' },
  { id: 'o.grindwall', type: 'org', name: 'Grindwall Bank', subtitle: 'Correspondent bank', risk: 'low', aliases: [], note: 'Holds the operating and nominee accounts.' },
  { id: 'o.casselvane', type: 'org', name: 'Cassel & Vane Trust', subtitle: 'Registered agent · escrow', risk: 'medium', aliases: ['C&V'], note: 'Registers shells and holds escrow.' },

  // locations (schematic map coords in 0..1)
  { id: 'l.ferro', type: 'location', name: 'Ferro City', subtitle: 'Financial hub', risk: 'low', aliases: [], note: 'Where the banking and meetings happen.', mx: 0.30, my: 0.34, country: 'Ferran Republic' },
  { id: 'l.kaltis', type: 'location', name: 'Kaltis Free Zone', subtitle: 'Free-trade port', risk: 'high', aliases: ['Kaltis FZ'], note: 'Cargo re-labeled and re-invoiced here.', mx: 0.78, my: 0.40, country: 'Kaltis Territory' },
  { id: 'l.vantry', type: 'location', name: 'Port Vantry', subtitle: 'Bulk terminal', risk: 'medium', aliases: [], note: 'Loading port for the bulk carrier.', mx: 0.18, my: 0.62, country: 'Ferran Republic' },
  { id: 'l.cresswick', type: 'location', name: 'Cresswick Terminal', subtitle: 'Container feeder port', risk: 'medium', aliases: [], note: 'Transshipment for containers.', mx: 0.46, my: 0.70, country: 'Cress Union' },
  { id: 'l.dorne', type: 'location', name: 'Dorne Harbour', subtitle: 'Roll-on/roll-off port', risk: 'low', aliases: [], note: 'Occasional call for the Ro-Ro vessel.', mx: 0.64, my: 0.20, country: 'Dorn Coast' },
  { id: 'l.ostgate', type: 'location', name: 'Ostgate Anchorage', subtitle: 'Ship-to-ship transfer zone', risk: 'high', aliases: [], note: 'Where cargo quietly changes hulls.', mx: 0.86, my: 0.72, country: 'Intl. waters' },

  // accounts
  { id: 'a.halcyonop', type: 'account', name: 'Halcyon Operating ****4471', subtitle: 'Grindwall Bank', risk: 'high', aliases: [], note: 'Primary operating account.' },
  { id: 'a.bshold', type: 'account', name: 'B&S Holding ****0198', subtitle: 'Grindwall Bank', risk: 'high', aliases: [], note: 'Holding-company account.' },
  { id: 'a.ospreyop', type: 'account', name: 'Osprey Maritime ****7732', subtitle: 'Grindwall Bank', risk: 'medium', aliases: [], note: 'Vessel-registrant account.' },
  { id: 'a.cvescrow', type: 'account', name: 'Cassel & Vane Escrow ****5510', subtitle: 'Grindwall Bank', risk: 'medium', aliases: [], note: 'Escrow for shell registrations.' },

  // vessels
  { id: 'v.aurelian', type: 'vessel', name: 'MV Aurelian', subtitle: 'Bulk carrier · Osprey flag', risk: 'high', aliases: ['IMO 7731004'], note: 'Primary cargo hull.' },
  { id: 'v.saltmarsh', type: 'vessel', name: 'MV Saltmarsh', subtitle: 'Container feeder', risk: 'medium', aliases: ['IMO 7731188'], note: 'Feeds containers to Cresswick.' },
  { id: 'v.kettering', type: 'vessel', name: 'MV Kettering', subtitle: 'Roll-on/roll-off', risk: 'low', aliases: ['IMO 7731272'], note: 'Peripheral Ro-Ro.' },
]

/* ---------- authored core relationships (the spine of the story) ----------
   Dates here are given as a wave index + fraction so §6.4 can prove the span is
   covered; the generator resolves them against the calendar. */
type CoreRel = Omit<Rel, 'id' | 'date'> & { wave: number; at: number }

const CORE_RELS: CoreRel[] = [
  // ownership lattice → resolves to the UBO
  { type: 'controls', source: 'p.alderisle', target: 'o.bs', wave: 0, at: 0.05 },
  { type: 'owns', source: 'o.bs', target: 'o.halcyon', wave: 0, at: 0.10 },
  { type: 'owns', source: 'o.bs', target: 'o.cinderbay', wave: 0, at: 0.12 },
  { type: 'owns', source: 'o.bs', target: 'o.osprey', wave: 0, at: 0.14 },
  { type: 'controls', source: 'p.brant', target: 'o.bs', wave: 0, at: 0.06 },
  { type: 'controls', source: 'p.sowerby', target: 'o.bs', wave: 0, at: 0.07 },
  { type: 'registered', source: 'o.halcyon', target: 'o.casselvane', wave: 0, at: 0.09 },
  { type: 'registered', source: 'o.cinderbay', target: 'o.casselvane', wave: 0, at: 0.11 },

  // employment / roles
  { type: 'employed', source: 'p.vance', target: 'o.bs', wave: 0, at: 0.16 },
  { type: 'employed', source: 'p.kessler', target: 'o.cinderbay', wave: 0, at: 0.18 },
  { type: 'employed', source: 'p.oduya', target: 'o.halcyon', wave: 0, at: 0.20 },
  { type: 'employed', source: 'p.dray', target: 'o.osprey', wave: 0, at: 0.22 },

  // accounts belong to orgs
  { type: 'owns', source: 'o.halcyon', target: 'a.halcyonop', wave: 0, at: 0.15 },
  { type: 'owns', source: 'o.bs', target: 'a.bshold', wave: 0, at: 0.16 },
  { type: 'owns', source: 'o.osprey', target: 'a.ospreyop', wave: 0, at: 0.17 },
  { type: 'owns', source: 'o.casselvane', target: 'a.cvescrow', wave: 0, at: 0.13 },

  // vessels registered to the flag
  { type: 'registered', source: 'v.aurelian', target: 'o.osprey', wave: 0, at: 0.19 },
  { type: 'registered', source: 'v.saltmarsh', target: 'o.osprey', wave: 0, at: 0.21 },
  { type: 'registered', source: 'v.kettering', target: 'o.osprey', wave: 0, at: 0.23 },

  // assembly meetings (carry a location)
  { type: 'met', source: 'p.alderisle', target: 'p.brant', locationId: 'l.ferro', wave: 0, at: 0.24 },
  { type: 'met', source: 'p.vance', target: 'p.kessler', locationId: 'l.ferro', wave: 0, at: 0.26 },

  // wave 1: the money moves
  { type: 'transferred', source: 'a.bshold', target: 'a.halcyonop', amount: 1_800_000, wave: 1, at: 0.10 },
  { type: 'transferred', source: 'a.halcyonop', target: 'a.ospreyop', amount: 620_000, wave: 1, at: 0.28 },
  { type: 'transferred', source: 'a.halcyonop', target: 'a.cvescrow', amount: 240_000, wave: 1, at: 0.30 },
  { type: 'communicated', source: 'p.vance', target: 'p.alderisle', wave: 1, at: 0.05 },
  { type: 'communicated', source: 'p.kessler', target: 'p.dray', wave: 1, at: 0.34 },

  // wave 1: the cargo sails (shipped carries a destination location)
  { type: 'shipped', source: 'v.aurelian', target: 'o.stallpine', locationId: 'l.kaltis', wave: 1, at: 0.20 },
  { type: 'shipped', source: 'v.saltmarsh', target: 'o.stallpine', locationId: 'l.cresswick', wave: 1, at: 0.40 },
  { type: 'travelled', source: 'p.renn', target: 'p.oduya', locationId: 'l.kaltis', wave: 1, at: 0.44 },

  // wave 1: the front counterparty (over-invoicing)
  { type: 'transferred', source: 'o.veridian', target: 'a.halcyonop', amount: 2_400_000, wave: 1, at: 0.50 } as CoreRel,
  { type: 'communicated', source: 'p.alderisle', target: 'o.veridian', wave: 1, at: 0.48 } as CoreRel,

  // wave 2: the unwind
  { type: 'transferred', source: 'a.halcyonop', target: 'a.bshold', amount: 960_000, wave: 2, at: 0.30 },
  { type: 'shipped', source: 'v.aurelian', target: 'o.stallpine', locationId: 'l.ostgate', wave: 2, at: 0.55 },
  { type: 'met', source: 'p.alderisle', target: 'p.vance', locationId: 'l.ferro', wave: 2, at: 0.90 },
]

/* ---------- generation ---------- */

const pick = <T,>(rnd: () => number, arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]

/** Resolve a wave-index + 0..1 fraction to an ISO date inside that wave. */
function waveDate(wave: number, at: number): string {
  const [a, b] = WAVES[wave]
  const frac = a + (b - a) * Math.max(0, Math.min(1, at))
  return iso(T0 + Math.round(frac * SPAN_DAYS) * DAY)
}

const FILLER_SHELL = ['Marlowe', 'Kestrel', 'Ansel', 'Ferro', 'Brackwater', 'Otis', 'Verrin', 'Quill', 'Saltus', 'Larkspur']
const FILLER_SUFFIX = ['Trading Ltd', 'Commodities', 'Shipping SA', 'Holdings', 'Exports', 'Freight Ltd']
const FILLER_FIRST = ['Anders', 'Lena', 'Marek', 'Sofia', 'Ivo', 'Talia', 'Bram', 'Nadia', 'Cato', 'Ruth']
const FILLER_LAST = ['Holt', 'Marsh', 'Prno', 'Vale', 'Serra', 'Dunn', 'Okafor', 'Rask', 'Lund', 'Ferre']

export function buildCase(seed: number = SKEIN_SEED): Case {
  const rnd = mulberry32(seed)
  const entities: Entity[] = CORE_ENTITIES.map((e) => ({ ...e }))
  const byId = new Map(entities.map((e) => [e.id, e]))
  const rels: Rel[] = []
  let relSeq = 0

  const addRel = (r: Omit<Rel, 'id'>): void => {
    rels.push({ ...r, id: `r${(relSeq++).toString(36)}` })
  }

  // authored spine
  for (const c of CORE_RELS) {
    const { wave, at, ...rest } = c
    addRel({ ...(rest as Omit<Rel, 'id' | 'date'>), date: waveDate(wave, at) })
  }

  const orgs = () => entities.filter((e) => e.type === 'org')
  const accounts = () => entities.filter((e) => e.type === 'account')
  const persons = () => entities.filter((e) => e.type === 'person')
  const locations = entities.filter((e) => e.type === 'location')
  const vessels = () => entities.filter((e) => e.type === 'vessel')
  const risk = (rnd: () => number): Risk => (rnd() < 0.18 ? 'high' : rnd() < 0.5 ? 'medium' : 'low')

  // --- filler shell orgs, each owned by B&S and registered by C&V ---
  for (let i = 0; i < 8; i++) {
    const id = `o.shell${i}`
    const name = `${FILLER_SHELL[i % FILLER_SHELL.length]} ${pick(rnd, FILLER_SUFFIX)}`
    const e: Entity = { id, type: 'org', name, subtitle: 'Shell trading co', risk: risk(rnd), aliases: [], note: 'Peripheral invoicing shell.' }
    entities.push(e); byId.set(id, e)
    addRel({ type: 'owns', source: 'o.bs', target: id, date: waveDate(0, 0.12 + rnd() * 0.1) })
    addRel({ type: 'registered', source: id, target: 'o.casselvane', date: waveDate(0, 0.1 + rnd() * 0.1) })
  }

  // --- filler accounts, each owned by a random org + fed by a transfer ---
  for (let i = 0; i < 8; i++) {
    const id = `a.f${i}`
    const owner = pick(rnd, orgs())
    const e: Entity = { id, type: 'account', name: `${owner.name.split(' ')[0]} ****${1000 + Math.floor(rnd() * 8999)}`, subtitle: 'Grindwall Bank', risk: risk(rnd), aliases: [], note: 'Secondary account.' }
    entities.push(e); byId.set(id, e)
    addRel({ type: 'owns', source: owner.id, target: id, date: waveDate(0, 0.14 + rnd() * 0.1) })
    const src = pick(rnd, accounts().filter((a) => a.id !== id))
    addRel({ type: 'transferred', source: src.id, target: id, amount: 5_000 + Math.floor(rnd() * 480_000), date: waveDate(1, rnd()) })
  }

  // --- filler couriers, each employed by an org + communicating with a principal ---
  for (let i = 0; i < 5; i++) {
    const id = `p.f${i}`
    const e: Entity = { id, type: 'person', name: `${pick(rnd, FILLER_FIRST)} ${pick(rnd, FILLER_LAST)}`, subtitle: pick(rnd, ['Courier', 'Clerk', 'Agent', 'Broker']), risk: risk(rnd), aliases: [], note: 'Peripheral operative.' }
    entities.push(e); byId.set(id, e)
    const employer = pick(rnd, orgs())
    addRel({ type: 'employed', source: id, target: employer.id, date: waveDate(0, 0.16 + rnd() * 0.1) })
    const principal = pick(rnd, persons().filter((p) => p.id !== id))
    addRel({ type: 'communicated', source: id, target: principal.id, date: waveDate(1 + Math.floor(rnd() * 2), rnd()) })
  }

  // --- density: extra transfers, communications, shipments spread across waves ---
  while (rels.length < REL_TARGET) {
    const roll = rnd()
    if (roll < 0.45) {
      const a = pick(rnd, accounts()); let b = pick(rnd, accounts())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, accounts())
      if (a.id === b.id) continue
      addRel({ type: 'transferred', source: a.id, target: b.id, amount: 5_000 + Math.floor(rnd() * 700_000), date: waveDate(Math.floor(rnd() * 3), rnd()) })
    } else if (roll < 0.72) {
      const a = pick(rnd, persons()); let b = pick(rnd, persons())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, persons())
      if (a.id === b.id) continue
      addRel({ type: 'communicated', source: a.id, target: b.id, date: waveDate(Math.floor(rnd() * 3), rnd()) })
    } else if (roll < 0.88) {
      const v = pick(rnd, vessels()); const dst = pick(rnd, [byId.get('o.stallpine')!, ...orgs().slice(0, 3)])
      const loc = pick(rnd, locations)
      addRel({ type: 'shipped', source: v.id, target: dst.id, locationId: loc.id, date: waveDate(1 + Math.floor(rnd() * 2), rnd()) })
    } else {
      const a = pick(rnd, persons()); let b = pick(rnd, persons())
      let guard = 0; while (b.id === a.id && guard++ < 8) b = pick(rnd, persons())
      if (a.id === b.id) continue
      addRel({ type: 'met', source: a.id, target: b.id, locationId: pick(rnd, locations).id, date: waveDate(Math.floor(rnd() * 3), rnd()) })
    }
  }

  // sort rels chronologically (timeline + shipping-lane order read cleaner)
  rels.sort((a, b) => ms(a.date) - ms(b.date) || (a.id < b.id ? -1 : 1))

  const span: [number, number] = [ms(rels[0].date), ms(rels[rels.length - 1].date)]
  const c: Case = { entities, rels, span, name: CASE_NAME }

  if (import.meta.env?.DEV) {
    void import('./generate.assert').then(({ assertCase }) => assertCase(c)).catch(() => {})
  }
  return c
}

/** The single, deterministic case (built once, never mutated). */
export const CASE: Case = buildCase()
```

> **Implementation note for Fable:** `addRel` is the **single id authority** — it
> stamps a unique `r<base36>` id on every relationship, so **no** call site passes
> an `id` (an earlier draft had call sites pre-computing ids that `addRel` then
> overwrote, double-incrementing `relSeq` and leaving a dead `if (r.id === '')`
> fix-up; that is removed — do not reintroduce it). Every `addRel` path yields a
> real, unique id before the case is returned, and `generate.assert.ts` verifies
> uniqueness (throwing in dev if that ever regresses). The two `as CoreRel` casts
> on the Veridian rows are only there because those literals omit optional keys the
> rest of the array shares — harmless; keep or drop.

### 6.4 `portfolio/src/pages/Skein/generate.assert.ts`

Dev-only invariants (dynamic import from `generate.ts`, never in the prod chunk).
These *prove* the case instead of trusting it.

```ts
import {
  ENTITY_TYPES, REL_META, REL_TYPES, ms,
  type Case, type Entity,
} from './schema'
import { WINDOW_START, WINDOW_END, ENTITY_TARGET, REL_TARGET } from './generate'

/**
 * The case contract, enforced in dev only. If any of these fail the demo's whole
 * premise ("a believable, self-consistent investigation") is a lie, so we throw
 * loudly with every violation listed.
 */
export function assertCase(c: Case): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)
  const T0 = ms(WINDOW_START)
  const T1 = ms(WINDOW_END)
  const byId = new Map<string, Entity>(c.entities.map((e) => [e.id, e]))

  // --- entities ---
  if (c.entities.length < ENTITY_TARGET - 1) fail(`expected ~${ENTITY_TARGET} entities, got ${c.entities.length}`)
  if (new Set(c.entities.map((e) => e.id)).size !== c.entities.length) fail('entity ids not unique')
  for (const t of ENTITY_TYPES) if (!c.entities.some((e) => e.type === t)) fail(`no entities of type ${t}`)
  for (const e of c.entities) {
    if (!ENTITY_TYPES.includes(e.type)) fail(`${e.id}: bad type ${e.type}`)
    if (!e.name) fail(`${e.id}: empty name`)
    if (e.type === 'location' && (e.mx == null || e.my == null)) fail(`${e.id}: location missing map coords`)
    if (e.type === 'location' && (e.mx! < 0 || e.mx! > 1 || e.my! < 0 || e.my! > 1)) fail(`${e.id}: map coords out of 0..1`)
  }

  // --- relationships ---
  if (c.rels.length < REL_TARGET - 1) fail(`expected ~${REL_TARGET} rels, got ${c.rels.length}`)
  if (new Set(c.rels.map((r) => r.id)).size !== c.rels.length) fail('rel ids not unique (some blank/duplicated)')
  const degree = new Map<string, number>()
  for (const r of c.rels) {
    if (!REL_TYPES.includes(r.type)) fail(`${r.id}: bad rel type ${r.type}`)
    if (!byId.has(r.source)) fail(`${r.id}: source ${r.source} is not a real entity`)
    if (!byId.has(r.target)) fail(`${r.id}: target ${r.target} is not a real entity`)
    if (r.source === r.target) fail(`${r.id}: self-loop on ${r.source}`)
    const t = ms(r.date)
    if (Number.isNaN(t) || t < T0 || t > T1) fail(`${r.id}: date ${r.date} outside the window`)
    const meta = REL_META[r.type]
    if (meta.carriesMoney && !(typeof r.amount === 'number' && r.amount > 0)) fail(`${r.id}: ${r.type} missing positive amount`)
    if (!meta.carriesMoney && r.amount != null) fail(`${r.id}: ${r.type} should not carry an amount`)
    if (meta.carriesLocation) {
      if (!r.locationId || byId.get(r.locationId)?.type !== 'location') fail(`${r.id}: ${r.type} needs a valid location`)
    } else if (r.locationId != null) fail(`${r.id}: ${r.type} should not carry a location`)
    degree.set(r.source, (degree.get(r.source) ?? 0) + 1)
    degree.set(r.target, (degree.get(r.target) ?? 0) + 1)
  }

  // --- no orphan nodes ---
  for (const e of c.entities) if (!degree.get(e.id)) fail(`${e.id} (${e.name}) is an orphan — no relationships`)

  // --- ownership resolves to the UBO (p.alderisle) via owns/controls edges ---
  const controlAdj = new Map<string, string[]>()
  for (const r of c.rels) {
    if (r.type === 'owns' || r.type === 'controls') {
      // walk UPWARD: child -> its owner/controller
      controlAdj.set(r.target, [...(controlAdj.get(r.target) ?? []), r.source])
    }
  }
  const reachesUBO = (start: string): boolean => {
    const seen = new Set<string>()
    const stack = [start]
    while (stack.length) {
      const cur = stack.pop()!
      if (cur === 'p.alderisle') return true
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const up of controlAdj.get(cur) ?? []) stack.push(up)
    }
    return false
  }
  for (const e of c.entities) {
    if (e.type === 'org' && e.id !== 'o.grindwall' && e.id !== 'o.casselvane' && e.id !== 'o.veridian' && e.id !== 'o.stallpine') {
      if (!reachesUBO(e.id)) fail(`${e.id} (${e.name}) ownership does not resolve to the UBO`)
    }
  }

  // --- timeline spans a believable window (uses most of the 18 months) ---
  const [s, en] = c.span
  const covered = (en - s) / (T1 - T0)
  if (covered < 0.85) fail(`event span covers only ${(covered * 100).toFixed(0)}% of the window`)

  if (errs.length) throw new Error(`Skein case invariants failed:\n${errs.join('\n')}`)
  // eslint-disable-next-line no-console
  console.info(`[Skein] ${c.entities.length} entities · ${c.rels.length} rels · span ${WINDOW_START}…${WINDOW_END} OK`)
}
```

---

## 7 · Components & modules (dependency order, paste-ready)

Dependency order: **schema → generate → model → layout → icons → Graph →
Timeline → MapPane → DetailPanel → EntityList → Legend → index**. (schema /
generate are §6.)

### 7.1 State shape at a glance

`index.tsx` holds one reducer (`model.ts`) and one `LayoutEngine` (`layout.ts`).
It computes `derive(state, CASE)` once per state change (memoized) into a
`Derived` object every view reads:

```
Derived = {
  nodeState: Map<entityId, { dim: boolean; hi: boolean }>
  edgeState: Map<relId,    { dim: boolean; hi: boolean }>
  activeRelCount: number
  activeNodeCount: number
  locations: LocationSummary[]   // per-location active-entity counts for the map
}
```

- **`dim`** = filtered out by the current time window and/or location filter →
  rendered faded.
- **`hi`** (highlight) = part of the current selection's neighborhood (a selected
  node, its incident in-window edges, and the nodes on their far side), or the
  selected relationship, or entities present at the filtered location.

### 7.2 `portfolio/src/pages/Skein/icons.tsx`

Per-type glyphs (24×24 path data, `currentColor`) used as node centers, in the
detail panel, the entity list, and the legend. Plus a small risk dot.

```tsx
import type { EntityType, Risk } from './schema'
import { FLAG } from './schema'

/** 24×24 path(s) per entity type; stroke uses currentColor. Exported as the
    single source of glyph geometry — Graph.tsx imports these to draw node
    centers directly (no nested <svg> per node), so there is only one copy. */
export const PATHS: Record<EntityType, string> = {
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
  org: 'M4 21V6l7-3 7 3v15M4 21h16M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  account: 'M3 7h18v10H3zM3 11h18M7 15h4',
  location: 'M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 9a2 2 0 100 0.01',
  vessel: 'M3 15l1.5 4h15L21 15M5 15V8l7-3 7 3v7M12 5v10M5 15h14',
}

export function TypeGlyph({ type, size = 15, className = '' }: { type: EntityType; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[type]} />
    </svg>
  )
}

/** Risk dot: high = flag amber (hollow ring), medium = solid, low = faint. */
export function RiskDot({ risk }: { risk: Risk }) {
  const title = `${risk} risk`
  if (risk === 'high') return <span title={title} className="inline-block h-2 w-2 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${FLAG}` }} aria-label={title} />
  return <span title={title} className="inline-block h-2 w-2 rounded-full" style={{ background: risk === 'medium' ? 'var(--color-skein-muted)' : 'var(--color-skein-line)' }} aria-label={title} />
}
```

### 7.3 `portfolio/src/pages/Skein/model.ts`

The single source of cross-filter truth. A `useReducer` state plus a pure
`derive()`.

> **Why no undo/redo (deviating from Palisade):** Palisade edits *mutate a
> dataset*, so undo is a real feature. Skein never mutates the case — the reducer
> only tracks *view state* (time window, selection, location filter, hover). That
> state is small, always reconstructable, and has no destructive action to
> reverse; a "Reset view" action (`{t:'reset'}`) restores the neutral state in
> one step. Adding an undo stack here would be ceremony, not craft. This is the
> justified simpler approach §1.6 promised.

```ts
import { ms } from './schema'
import type { Case, Rel } from './schema'
import { CASE } from './generate'

export interface SkeinState {
  /** Inclusive [start, end] epoch-ms of the current time brush. */
  window: [number, number]
  /** The full event span (brush bounds). */
  fullSpan: [number, number]
  /** Selected entity ids (multi-select via shift). */
  selected: string[]
  /** A selected relationship (clicking an edge), or null. */
  selectedRel: string | null
  /** A location filter set by clicking the map, or null. */
  locationFilter: string | null
  /** Hovered entity id (graph/list hover sync), or null. */
  hover: string | null
  /** aria-live message. */
  announce: string
}

export function initialState(c: Case = CASE): SkeinState {
  return {
    window: [...c.span] as [number, number],
    fullSpan: [...c.span] as [number, number],
    selected: [],
    selectedRel: null,
    locationFilter: null,
    hover: null,
    announce: '',
  }
}

export type Action =
  | { t: 'window'; range: [number, number] }
  | { t: 'select'; id: string; additive: boolean }
  | { t: 'selectRel'; id: string | null }
  | { t: 'selectLocation'; id: string }
  | { t: 'hover'; id: string | null }
  | { t: 'clearSelection' }
  | { t: 'reset' }
  | { t: 'announce'; msg: string }

export function reducer(s: SkeinState, a: Action): SkeinState {
  switch (a.t) {
    case 'window': {
      const lo = Math.min(a.range[0], a.range[1])
      const hi = Math.max(a.range[0], a.range[1])
      return { ...s, window: [Math.max(s.fullSpan[0], lo), Math.min(s.fullSpan[1], hi)] }
    }
    case 'select': {
      if (a.additive) {
        const has = s.selected.includes(a.id)
        return {
          ...s,
          selected: has ? s.selected.filter((x) => x !== a.id) : [...s.selected, a.id],
          selectedRel: null,
        }
      }
      return { ...s, selected: [a.id], selectedRel: null, locationFilter: null }
    }
    case 'selectRel':
      return { ...s, selectedRel: a.id, selected: [] }
    case 'selectLocation':
      return {
        ...s,
        locationFilter: s.locationFilter === a.id ? null : a.id,
        selected: [a.id],
        selectedRel: null,
      }
    case 'hover':
      return s.hover === a.id ? s : { ...s, hover: a.id }
    case 'clearSelection':
      return { ...s, selected: [], selectedRel: null, locationFilter: null }
    case 'reset':
      return { ...initialState(), announce: 'View reset' }
    case 'announce':
      return { ...s, announce: a.msg }
    default:
      return s
  }
}

/* ---------- derivation (pure; memoize on state in index.tsx) ---------- */

export interface NodeState { dim: boolean; hi: boolean }
export interface LocationSummary {
  id: string
  activeEntities: number   // distinct entities present here in-window
  activeRels: number
}
export interface Derived {
  nodeState: Map<string, NodeState>
  edgeState: Map<string, NodeState>
  activeRelCount: number
  activeNodeCount: number
  locations: LocationSummary[]
}

/** Is a relationship inside the current time window? */
const inWindow = (r: Rel, w: [number, number]): boolean => {
  const t = ms(r.date)
  return t >= w[0] && t <= w[1]
}

/**
 * The one derivation the three views share. Rules:
 *  - A rel is ACTIVE if it is in the time window AND (no locationFilter OR its
 *    locationId === the filter).
 *  - A node is ACTIVE if it touches an active rel (or, when a locationFilter is
 *    set, IS that location). Inactive nodes/edges render dimmed.
 *  - HIGHLIGHT (hi): the selection neighborhood — selected nodes, their active
 *    incident edges, and the far nodes on those edges; the selected rel and its
 *    two endpoints; every active node when a location filter is on.
 */
export function derive(state: SkeinState, c: Case = CASE): Derived {
  const { window: w, selected, selectedRel, locationFilter } = state
  const nodeState = new Map<string, NodeState>()
  const edgeState = new Map<string, NodeState>()
  for (const e of c.entities) nodeState.set(e.id, { dim: true, hi: false })
  for (const r of c.rels) edgeState.set(r.id, { dim: true, hi: false })

  const activeNodes = new Set<string>()
  const locAgg = new Map<string, { ents: Set<string>; rels: number }>()

  let activeRelCount = 0
  for (const r of c.rels) {
    const active = inWindow(r, w) && (!locationFilter || r.locationId === locationFilter)
    if (!active) continue
    activeRelCount++
    edgeState.set(r.id, { dim: false, hi: false })
    activeNodes.add(r.source)
    activeNodes.add(r.target)
    if (r.locationId) {
      const agg = locAgg.get(r.locationId) ?? { ents: new Set<string>(), rels: 0 }
      agg.ents.add(r.source); agg.ents.add(r.target); agg.rels++
      locAgg.set(r.locationId, agg)
    }
  }
  if (locationFilter) activeNodes.add(locationFilter)
  for (const id of activeNodes) nodeState.set(id, { dim: false, hi: false })

  // --- highlight pass ---
  const hiNodes = new Set<string>()
  const hiEdges = new Set<string>()
  if (selectedRel) {
    const r = c.rels.find((x) => x.id === selectedRel)
    if (r) { hiEdges.add(r.id); hiNodes.add(r.source); hiNodes.add(r.target) }
  } else if (selected.length) {
    const sel = new Set(selected)
    for (const id of sel) hiNodes.add(id)
    for (const r of c.rels) {
      if (edgeState.get(r.id)!.dim) continue // only active edges
      if (sel.has(r.source) || sel.has(r.target)) {
        hiEdges.add(r.id); hiNodes.add(r.source); hiNodes.add(r.target)
      }
    }
  }
  if (locationFilter) for (const id of activeNodes) hiNodes.add(id)

  for (const id of hiNodes) { const st = nodeState.get(id); if (st) { st.hi = true; st.dim = false } }
  for (const id of hiEdges) { const st = edgeState.get(id); if (st) { st.hi = true; st.dim = false } }

  const locations: LocationSummary[] = c.entities
    .filter((e) => e.type === 'location')
    .map((e) => ({ id: e.id, activeEntities: locAgg.get(e.id)?.ents.size ?? 0, activeRels: locAgg.get(e.id)?.rels ?? 0 }))

  return {
    nodeState,
    edgeState,
    activeRelCount,
    activeNodeCount: activeNodes.size,
    locations,
  }
}
```

### 7.4 `portfolio/src/pages/Skein/layout.ts` — the hand-rolled force layout

Pure physics, no React, no library. Coulomb repulsion between every node pair
(O(n²), fine at n≈50), Hooke springs along deduped edges (rest length grows with
endpoint degree so hubs breathe), gentle centering, damped Euler integration with
a velocity clamp, and **alpha annealing**: alpha decays each tick and is
*reheated* on any interaction (drag, filter, resize), so the graph settles when
idle and re-relaxes when the analyst touches it. Dragged nodes are pinned.

```ts
import { mulberry32 } from '../../lib/rand'
import type { Entity, Rel } from './schema'

export interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
  degree: number
}

/* Tuned for n≈50 / m≈132 in the WORLD box below. Do not retune by eye —
   these produce a legible, non-jittery settle in ~120 frames. */
const REPULSION = 5400   // Coulomb constant
const SPRING = 0.05      // Hooke stiffness
const REST = 82          // base edge rest length (px)
const CENTER = 0.014     // pull toward the world centroid
const DAMP = 0.85        // velocity retained per tick
const MAX_V = 24         // per-tick velocity clamp (px)
const MIN_D2 = 100       // (10px)² floor to avoid the 1/d² singularity
const ALPHA_MIN = 0.02
const ALPHA_DECAY = 0.985
const ALPHA_HOT = 0.7

/** The layout's private world coordinate box (Graph maps it into the SVG). */
export const WORLD = { w: 960, h: 660 }

export class LayoutEngine {
  nodes: Node[] = []
  index = new Map<string, number>()
  private springs: { a: number; b: number; rest: number }[] = []
  alpha = ALPHA_HOT

  constructor(entities: Entity[], rels: Rel[], seed = 20_240_117) {
    const rnd = mulberry32(seed)
    const deg = new Map<string, number>()
    for (const r of rels) {
      deg.set(r.source, (deg.get(r.source) ?? 0) + 1)
      deg.set(r.target, (deg.get(r.target) ?? 0) + 1)
    }
    // Seed positions on a phyllotaxis spiral so the first frame is not a blob
    // and the settle is deterministic across devices.
    entities.forEach((e, i) => {
      const ang = i * 2.399963229 // golden angle (rad)
      const rad = 20 * Math.sqrt(i) + rnd() * 10
      this.index.set(e.id, i)
      this.nodes.push({
        id: e.id,
        x: WORLD.w / 2 + Math.cos(ang) * rad,
        y: WORLD.h / 2 + Math.sin(ang) * rad,
        vx: 0, vy: 0, pinned: false, degree: deg.get(e.id) ?? 0,
      })
    })
    // One spring per unique pair (parallel edges share a spring).
    const seen = new Set<string>()
    for (const r of rels) {
      const a = this.index.get(r.source)
      const b = this.index.get(r.target)
      if (a == null || b == null || a === b) continue
      const key = a < b ? `${a}:${b}` : `${b}:${a}`
      if (seen.has(key)) continue
      seen.add(key)
      const rest = REST + Math.min(64, (this.nodes[a].degree + this.nodes[b].degree) * 3)
      this.springs.push({ a, b, rest })
    }
  }

  node(id: string): Node | undefined {
    const i = this.index.get(id)
    return i == null ? undefined : this.nodes[i]
  }

  /** Wake the simulation (call on drag / filter / resize). */
  reheat(a = ALPHA_HOT): void {
    this.alpha = Math.max(this.alpha, a)
  }

  hot(): boolean {
    return this.alpha > ALPHA_MIN
  }

  pin(id: string, x: number, y: number): void {
    const n = this.node(id)
    if (n) { n.pinned = true; n.x = x; n.y = y; n.vx = 0; n.vy = 0 }
  }
  moveTo(id: string, x: number, y: number): void {
    const n = this.node(id)
    if (n) { n.x = x; n.y = y }
  }
  unpin(id: string): void {
    const n = this.node(id)
    if (n) n.pinned = false
  }

  /** Advance one frame. Returns true while still hot (Graph keeps the loop). */
  step(): boolean {
    const a = this.alpha
    const N = this.nodes.length
    const ns = this.nodes

    // repulsion — every unordered pair
    for (let i = 0; i < N; i++) {
      const ni = ns[i]
      for (let j = i + 1; j < N; j++) {
        const nj = ns[j]
        let dx = nj.x - ni.x
        let dy = nj.y - ni.y
        let d2 = dx * dx + dy * dy
        if (d2 < MIN_D2) { dx = dx || 0.5; dy = dy || 0.5; d2 = MIN_D2 }
        const d = Math.sqrt(d2)
        const f = (REPULSION / d2) * a
        const fx = (dx / d) * f
        const fy = (dy / d) * f
        ni.vx -= fx; ni.vy -= fy
        nj.vx += fx; nj.vy += fy
      }
    }

    // spring attraction along edges
    for (const s of this.springs) {
      const na = ns[s.a]
      const nb = ns[s.b]
      const dx = nb.x - na.x
      const dy = nb.y - na.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const f = SPRING * (d - s.rest) * a
      const fx = (dx / d) * f
      const fy = (dy / d) * f
      na.vx += fx; na.vy += fy
      nb.vx -= fx; nb.vy -= fy
    }

    // centering + integrate (pinned nodes are held by the pointer)
    const cx = WORLD.w / 2
    const cy = WORLD.h / 2
    for (const n of ns) {
      if (n.pinned) { n.vx = 0; n.vy = 0; continue }
      n.vx += (cx - n.x) * CENTER * a
      n.vy += (cy - n.y) * CENTER * a
      n.vx *= DAMP
      n.vy *= DAMP
      if (n.vx > MAX_V) n.vx = MAX_V; else if (n.vx < -MAX_V) n.vx = -MAX_V
      if (n.vy > MAX_V) n.vy = MAX_V; else if (n.vy < -MAX_V) n.vy = -MAX_V
      n.x += n.vx
      n.y += n.vy
    }

    this.alpha *= ALPHA_DECAY
    return this.hot()
  }

  /** Run a batch of ticks synchronously (used for the reduced-motion pre-settle). */
  settle(iterations = 260): void {
    this.alpha = ALPHA_HOT
    for (let i = 0; i < iterations; i++) this.step()
    this.alpha = 0
  }
}
```

### 7.5 `portfolio/src/pages/Skein/Graph.tsx` — link chart: force paint, drag/pan/zoom, select

Renders edges + nodes declaratively (so selection/dim styling is data-driven),
positions them **imperatively** every frame via element refs (so ~50 nodes ×
~132 edges never trigger a React re-render mid-simulation). One `addTask` task
owns the paint loop; it stops when the sim cools and is re-armed by
`ensureRunning()` on any interaction. Pan/zoom live in a ref-backed viewport
`<g>`.

```tsx
import { useEffect, useMemo, useRef } from 'react'
import { addTask } from '../../lib/ticker'
import { CASE } from './generate'
import { LayoutEngine, WORLD } from './layout'
import { REL_META, TYPE_COLOR, THREAD } from './schema'
import { PATHS } from './icons'
import type { Derived } from './model'
import type { Action } from './model'

type Props = {
  engine: LayoutEngine
  derived: Derived
  selected: string[]
  selectedRel: string | null
  hover: string | null
  reduceMotion: boolean
  dispatch: (a: Action) => void
}

type View = { x: number; y: number; k: number }

export function Graph({ engine, derived, selected, selectedRel, hover, reduceMotion, dispatch }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewportRef = useRef<SVGGElement | null>(null)
  const nodeEls = useRef(new Map<string, SVGGElement>())
  const edgeEls = useRef(new Map<string, SVGLineElement>())
  const view = useRef<View>({ x: 0, y: 0, k: 1 })
  const running = useRef(false)
  const unsub = useRef<(() => void) | null>(null)
  const drag = useRef<{ id: string; moved: boolean } | null>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)

  const selSet = useMemo(() => new Set(selected), [selected])

  // --- imperative paint (positions only; styling is React below) ---
  const applyView = () => {
    const g = viewportRef.current
    if (g) g.setAttribute('transform', `translate(${view.current.x} ${view.current.y}) scale(${view.current.k})`)
  }
  const paint = () => {
    for (const r of CASE.rels) {
      const el = edgeEls.current.get(r.id)
      if (!el) continue
      const a = engine.node(r.source)
      const b = engine.node(r.target)
      if (!a || !b) continue
      el.setAttribute('x1', String(a.x)); el.setAttribute('y1', String(a.y))
      el.setAttribute('x2', String(b.x)); el.setAttribute('y2', String(b.y))
    }
    for (const e of CASE.entities) {
      const el = nodeEls.current.get(e.id)
      if (!el) continue
      const n = engine.node(e.id)
      if (n) el.setAttribute('transform', `translate(${n.x} ${n.y})`)
    }
  }

  const ensureRunning = () => {
    if (running.current) return
    running.current = true
    unsub.current = addTask(() => {
      const hot = drag.current ? true : engine.step()
      paint()
      if (!hot) { running.current = false; unsub.current = null; return true }
      return false
    })
  }

  // Boot the simulation once.
  useEffect(() => {
    if (reduceMotion) {
      engine.settle()  // synchronous pre-settle; no animation
      paint()
      applyView()
      return
    }
    engine.reheat()
    applyView()
    ensureRunning()
    return () => { unsub.current?.(); running.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reheat ONLY when the active topology changes (timeline scrub / location
  // filter) — those move which edges pull. Keyed on the active counts, NOT the
  // whole `derived` object: hovering or selecting a node mints a fresh `derived`
  // reference every render, and keying on it would reheat the sim on every
  // mouse-move, so the graph would jiggle continuously while you explore. The
  // counts change only on a real window/filter change, which is exactly when a
  // relax is wanted.
  useEffect(() => {
    if (reduceMotion) return
    engine.reheat(0.35)
    ensureRunning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived.activeNodeCount, derived.activeRelCount])

  // --- coordinate helpers ---
  const toWorld = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * WORLD.w
    const py = ((clientY - rect.top) / rect.height) * WORLD.h
    return { x: (px - view.current.x) / view.current.k, y: (py - view.current.y) / view.current.k }
  }

  // --- pointer: node drag OR background pan ---
  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element
    const nodeG = target.closest('[data-node-id]') as SVGGElement | null
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
    if (nodeG) {
      const id = nodeG.getAttribute('data-node-id')!
      drag.current = { id, moved: false }
      const w = toWorld(e.clientX, e.clientY)
      engine.pin(id, w.x, w.y)
      svgRef.current?.classList.add('skein-dragging')
      // Under reduced motion the rAF loop is never started; onPointerMove paints
      // the dragged node directly. Starting the loop here would run a live settle
      // on release — exactly what reduced motion should avoid.
      if (!reduceMotion) ensureRunning()
    } else {
      pan.current = { x: e.clientX, y: e.clientY }
      svgRef.current?.classList.add('skein-panning')
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const w = toWorld(e.clientX, e.clientY)
      engine.moveTo(drag.current.id, w.x, w.y)
      engine.pin(drag.current.id, w.x, w.y)
      drag.current.moved = true
      if (reduceMotion) paint()
    } else if (pan.current) {
      const dx = (e.clientX - pan.current.x) * (WORLD.w / (svgRef.current!.getBoundingClientRect().width))
      const dy = (e.clientY - pan.current.y) * (WORLD.h / (svgRef.current!.getBoundingClientRect().height))
      view.current.x += dx
      view.current.y += dy
      pan.current = { x: e.clientX, y: e.clientY }
      applyView()
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current) {
      const { id, moved } = drag.current
      engine.unpin(id) // let it rejoin the sim; comment out this line to keep drags pinned
      if (!moved) dispatch({ t: 'select', id, additive: e.shiftKey })
      drag.current = null
      svgRef.current?.classList.remove('skein-dragging')
    } else if (pan.current) {
      pan.current = null
      svgRef.current?.classList.remove('skein-panning')
    }
  }

  // --- wheel zoom about the cursor ---
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * WORLD.w
    const py = ((e.clientY - rect.top) / rect.height) * WORLD.h
    const factor = Math.exp(-e.deltaY * 0.0015)
    const k2 = Math.min(3.5, Math.max(0.4, view.current.k * factor))
    // keep the world point under the cursor fixed
    view.current.x = px - ((px - view.current.x) * k2) / view.current.k
    view.current.y = py - ((py - view.current.y) * k2) / view.current.k
    view.current.k = k2
    applyView()
  }

  const onBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-node-id]') || (e.target as Element).closest('[data-edge-id]')) return
    dispatch({ t: 'clearSelection' })
  }

  return (
    <svg
      ref={svgRef}
      data-skein="graph"
      viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
      className="skein-canvas h-full w-full select-none"
      role="img"
      aria-label={`Link chart: ${derived.activeNodeCount} active entities, ${derived.activeRelCount} relationships in the current window. An equivalent keyboard-navigable list is provided.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onClick={onBackgroundClick}
    >
      <g ref={viewportRef}>
        {/* edges */}
        <g>
          {CASE.rels.map((r) => {
            const st = derived.edgeState.get(r.id)!
            const isSel = selectedRel === r.id
            const money = REL_META[r.type].carriesMoney && r.amount
            const stroke = st.hi || isSel ? THREAD : 'var(--color-skein-edge)'
            const width = isSel ? 3 : money ? Math.min(4, 1 + Math.log10(r.amount!) / 2) : 1.4
            return (
              <line
                key={r.id}
                data-edge-id={r.id}
                ref={(el) => { if (el) edgeEls.current.set(r.id, el); else edgeEls.current.delete(r.id) }}
                stroke={stroke}
                strokeWidth={width}
                strokeOpacity={st.dim ? 0.05 : st.hi || isSel ? 0.95 : 0.5}
                style={{ cursor: 'pointer', pointerEvents: st.dim ? 'none' : 'stroke' }}
                onClick={(e) => { e.stopPropagation(); dispatch({ t: 'selectRel', id: r.id }) }}
              />
            )
          })}
        </g>
        {/* nodes */}
        <g>
          {CASE.entities.map((e) => {
            const st = derived.nodeState.get(e.id)!
            const n = engine.node(e.id)
            const deg = n?.degree ?? 1
            const rad = 8 + Math.min(12, Math.sqrt(deg) * 3)
            const color = TYPE_COLOR[e.type]
            const isSel = selSet.has(e.id)
            const isHover = hover === e.id
            return (
              <g
                key={e.id}
                data-node-id={e.id}
                ref={(el) => { if (el) nodeEls.current.set(e.id, el); else nodeEls.current.delete(e.id) }}
                style={{ cursor: 'pointer', opacity: st.dim && !isSel ? 0.16 : 1 }}
                onPointerEnter={() => dispatch({ t: 'hover', id: e.id })}
                onPointerLeave={() => dispatch({ t: 'hover', id: null })}
              >
                {(isSel || st.hi) && (
                  <circle r={rad + 6} fill="none" stroke={THREAD} strokeWidth={isSel ? 2 : 1.25} strokeDasharray={isSel ? undefined : '3 3'} />
                )}
                <circle r={rad} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={isHover ? 2.5 : 1.6} />
                {/* type glyph as a small mark; kept as a path to avoid a nested svg per node */}
                <g transform={`translate(${-rad * 0.5} ${-rad * 0.5}) scale(${(rad * 0.9) / 24})`} stroke={color} fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} pointerEvents="none">
                  <path d={PATHS[e.type]} />
                </g>
                {(isSel || isHover || st.hi) && (
                  <text y={rad + 13} textAnchor="middle" fontSize="11" fill="var(--color-skein-ink)" style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                    {e.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </g>
    </svg>
  )
}
```

> **Node glyphs reuse `PATHS` from `icons.tsx`** (imported at the top). Node
> centers draw the raw `<path d={PATHS[type]} />` inside the already-open node
> `<g>` — no nested `<svg>` per node, and no second copy of the path data to keep
> in lockstep (an earlier draft duplicated a local `GLYPH` record here; it had
> already drifted out of sync with `icons.tsx`, so it was removed).

> **Note on the drag-release behavior:** `engine.unpin(id)` on pointer-up lets a
> dragged node rejoin the simulation (the graph "heals" around it). If a reviewer
> prefers dragged nodes to *stay put* (a common analyst preference), delete that
> one line — the node keeps `pinned = true` and never drifts. Documented here so
> the choice is deliberate, not accidental.

### 7.6 `portfolio/src/pages/Skein/Timeline.tsx` — density histogram + range brush

A horizontal SVG: a weekly event-density histogram behind a draggable two-handle
brush, plus quick-range chips ("Full span", "Wave I/II/III"). Dragging either
handle or the middle band dispatches `{t:'window'}`; the graph and map re-derive
live. **This is the headline interaction.** Pointer math only — no animation, so
it is inherently reduced-motion safe.

```tsx
import { useMemo, useRef } from 'react'
import { CASE } from './generate'
import { DAY, ms, iso, fmtDate } from './schema'
import type { Action, SkeinState } from './model'

type Props = { state: SkeinState; dispatch: (a: Action) => void }

const VB_W = 1000
const VB_H = 96
const PAD = 8
const AXIS_Y = 74

export function Timeline({ state, dispatch }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [t0, t1] = state.fullSpan
  const drag = useRef<null | 'start' | 'end' | 'band'>(null)
  const bandGrab = useRef(0)

  // weekly buckets (histogram)
  const bins = useMemo(() => {
    const WEEK = 7 * DAY
    const count = Math.max(1, Math.ceil((t1 - t0) / WEEK))
    const arr = new Array(count).fill(0)
    for (const r of CASE.rels) {
      const i = Math.min(count - 1, Math.floor((ms(r.date) - t0) / WEEK))
      arr[i]++
    }
    const max = Math.max(1, ...arr)
    return { arr, max, count }
  }, [t0, t1])

  const xOf = (t: number) => PAD + ((t - t0) / (t1 - t0)) * (VB_W - PAD * 2)
  const tOf = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * VB_W
    const frac = (px - PAD) / (VB_W - PAD * 2)
    return Math.max(t0, Math.min(t1, t0 + frac * (t1 - t0)))
  }

  const [ws, we] = state.window
  const xs = xOf(ws)
  const xe = xOf(we)

  const onDown = (which: 'start' | 'end' | 'band') => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = which
    if (which === 'band') bandGrab.current = tOf(e.clientX) - ws
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const t = tOf(e.clientX)
    if (drag.current === 'start') dispatch({ t: 'window', range: [Math.min(t, we - DAY), we] })
    else if (drag.current === 'end') dispatch({ t: 'window', range: [ws, Math.max(t, ws + DAY)] })
    else {
      const span = we - ws
      let ns = t - bandGrab.current
      ns = Math.max(t0, Math.min(t1 - span, ns))
      dispatch({ t: 'window', range: [ns, ns + span] })
    }
  }
  const onUp = () => {
    if (drag.current) {
      dispatch({ t: 'announce', msg: `Window ${fmtDate(iso(ws))} to ${fmtDate(iso(we))}` })
      drag.current = null
    }
  }

  // quick ranges: full + three waves (see generate WAVES)
  const span = t1 - t0
  const chip = (label: string, a: number, b: number) => (
    <button
      key={label}
      onClick={() => dispatch({ t: 'window', range: [t0 + span * a, t0 + span * b] })}
      className="skein-num rounded-md border border-skein-line px-2.5 py-1 text-xs text-skein-ink-2 hover:border-skein-thread hover:text-skein-ink"
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="skein-label">Timeline · scrub to filter</span>
        <span className="skein-num text-xs text-skein-ink-2">
          {fmtDate(iso(ws))} — {fmtDate(iso(we))}
        </span>
      </div>
      <svg
        ref={svgRef}
        data-skein="timeline"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-24 w-full touch-none"
        role="group"
        aria-label="Time range brush over event density. Drag the handles or the window band to filter every view."
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* histogram */}
        <g>
          {bins.arr.map((c, i) => {
            const bx = PAD + (i / bins.count) * (VB_W - PAD * 2)
            const bw = (VB_W - PAD * 2) / bins.count
            const bh = (c / bins.max) * (AXIS_Y - 12)
            const binT = t0 + (i + 0.5) * 7 * DAY
            const inWin = binT >= ws && binT <= we
            return <rect key={i} x={bx + 0.5} y={AXIS_Y - bh} width={Math.max(1, bw - 1)} height={bh} fill={inWin ? 'var(--color-skein-thread)' : 'var(--color-skein-muted)'} fillOpacity={inWin ? 0.7 : 0.35} rx="1" />
          })}
        </g>
        {/* axis */}
        <line x1={PAD} y1={AXIS_Y} x2={VB_W - PAD} y2={AXIS_Y} stroke="var(--color-skein-line)" />
        {/* selection band */}
        <rect x={xs} y={4} width={Math.max(2, xe - xs)} height={AXIS_Y - 4} fill="var(--color-skein-sel)" stroke="var(--color-skein-thread)" strokeOpacity="0.6"
          style={{ cursor: 'grab' }} onPointerDown={onDown('band')} />
        {/* handles */}
        {(['start', 'end'] as const).map((h) => {
          const x = h === 'start' ? xs : xe
          return (
            <g key={h} onPointerDown={onDown(h)} style={{ cursor: 'ew-resize' }}>
              <line x1={x} y1={2} x2={x} y2={AXIS_Y} stroke="var(--color-skein-thread)" strokeWidth="2" />
              <rect x={x - 5} y={AXIS_Y / 2 - 10} width="10" height="20" rx="2" fill="var(--color-skein-thread)" />
              {/* wide invisible hit target */}
              <rect x={x - 10} y={0} width="20" height={AXIS_Y} fill="transparent" />
            </g>
          )
        })}
        {/* end-date ticks */}
        <text x={PAD} y={VB_H - 4} fontSize="11" fill="var(--color-skein-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(iso(t0))}</text>
        <text x={VB_W - PAD} y={VB_H - 4} textAnchor="end" fontSize="11" fill="var(--color-skein-muted)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtDate(iso(t1))}</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {chip('Full span', 0, 1)}
        {chip('Wave I', 0.0, 0.3)}
        {chip('Wave II', 0.33, 0.63)}
        {chip('Wave III', 0.68, 1)}
      </div>
    </div>
  )
}
```

### 7.7 `portfolio/src/pages/Skein/MapPane.tsx` — schematic chart, click-to-filter

An authored SVG "chart of the region" — abstract sea, two landmasses, plotted
ports at their `mx,my` coords — with derived **shipping lanes** (for each vessel,
its active shipment ports connected in date order) and per-port activity badges
that update with the window. Click a port → `{t:'selectLocation'}`.

```tsx
import { useMemo } from 'react'
import { CASE } from './generate'
import { ms } from './schema'
import type { Action, SkeinState } from './model'
import type { Derived } from './model'

type Props = { state: SkeinState; derived: Derived; dispatch: (a: Action) => void }

const VB = 480
const locs = () => CASE.entities.filter((e) => e.type === 'location')

export function MapPane({ state, derived, dispatch }: Props) {
  const byId = useMemo(() => new Map(CASE.entities.map((e) => [e.id, e])), [])
  const sum = useMemo(() => new Map(derived.locations.map((l) => [l.id, l])), [derived])

  // shipping lanes: per vessel, active shipments in date order → consecutive ports
  const lanes = useMemo(() => {
    const [ws, we] = state.window
    const byVessel = new Map<string, { locId: string; t: number }[]>()
    for (const r of CASE.rels) {
      if (r.type !== 'shipped' || !r.locationId) continue
      const t = ms(r.date)
      if (t < ws || t > we) continue
      if (state.locationFilter && r.locationId !== state.locationFilter) continue
      const arr = byVessel.get(r.source) ?? []
      arr.push({ locId: r.locationId, t })
      byVessel.set(r.source, arr)
    }
    const segs: { ax: number; ay: number; bx: number; by: number; key: string }[] = []
    for (const [, calls] of byVessel) {
      calls.sort((a, b) => a.t - b.t)
      for (let i = 0; i + 1 < calls.length; i++) {
        const a = byId.get(calls[i].locId)!
        const b = byId.get(calls[i + 1].locId)!
        if (a.id === b.id) continue
        segs.push({ ax: a.mx! * VB, ay: a.my! * VB, bx: b.mx! * VB, by: b.my! * VB, key: `${a.id}-${b.id}-${i}` })
      }
    }
    return segs
  }, [state.window, state.locationFilter, byId])

  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="skein-label">Geospatial · click a port</span>
        {state.locationFilter && (
          <button onClick={() => dispatch({ t: 'clearSelection' })} className="skein-num text-xs text-skein-thread hover:underline">
            clear filter ✕
          </button>
        )}
      </div>
      <svg data-skein="map" viewBox={`0 0 ${VB} ${VB}`} className="aspect-square w-full" role="group" aria-label="Schematic chart of the region's ports. Click a port to filter every view to entities present there in the current window.">
        {/* sea */}
        <rect width={VB} height={VB} rx="10" fill="#0f1622" />
        {/* two abstract landmasses (authored, not real geography) */}
        <path d="M -20 120 C 80 90, 120 160, 90 220 C 60 280, 140 300, 120 360 L -20 380 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        <path d="M 500 60 C 400 100, 430 180, 470 220 C 520 270, 470 340, 500 420 L 520 -20 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        <path d="M 250 430 C 300 400, 360 440, 380 500 L 180 500 C 190 460, 210 450, 250 430 Z" fill="#161b26" stroke="var(--color-skein-line)" />
        {/* graticule */}
        {[120, 240, 360].map((g) => (
          <g key={g} stroke="var(--color-skein-line)" strokeOpacity="0.5">
            <line x1={g} y1="0" x2={g} y2={VB} />
            <line x1="0" y1={g} x2={VB} y2={g} />
          </g>
        ))}
        {/* shipping lanes */}
        <g>
          {lanes.map((s) => (
            <line key={s.key} x1={s.ax} y1={s.ay} x2={s.bx} y2={s.by} stroke="var(--color-skein-thread)" strokeOpacity="0.5" strokeWidth="1.75" strokeDasharray="5 4" />
          ))}
        </g>
        {/* ports */}
        {locs().map((l) => {
          const s = sum.get(l.id)
          const active = (s?.activeEntities ?? 0) > 0
          const isFilter = state.locationFilter === l.id
          const cx = l.mx! * VB
          const cy = l.my! * VB
          return (
            <g key={l.id} data-loc data-loc-id={l.id} style={{ cursor: 'pointer' }}
              onClick={() => dispatch({ t: 'selectLocation', id: l.id })}>
              {isFilter && <circle cx={cx} cy={cy} r="18" fill="none" stroke="var(--color-skein-thread)" strokeWidth="2" />}
              <circle cx={cx} cy={cy} r={active ? 9 : 6} fill="var(--color-skein-location)" fillOpacity={active ? 0.85 : 0.3} stroke="var(--color-skein-location)" strokeWidth="1.5" />
              {active && s!.activeEntities > 0 && (
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fill="#0c0b12" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, pointerEvents: 'none' }}>
                  {s!.activeEntities}
                </text>
              )}
              <text x={cx} y={cy - 13} textAnchor="middle" fontSize="10" fill={active ? 'var(--color-skein-ink)' : 'var(--color-skein-muted)'} style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                {l.name}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="skein-num mt-2 text-xs text-skein-muted">
        Badge = distinct entities present in-window. Dashed lines = vessel port calls in date order.
      </p>
    </div>
  )
}
```

### 7.8 `portfolio/src/pages/Skein/DetailPanel.tsx` — inspector

Shows the current focus: a selected entity (type, risk, aliases, note, its
in-window relationships), a selected relationship (endpoints, date, amount /
location, note), or the empty prompt. When a location is filtered it summarizes
who is present.

```tsx
import { useMemo } from 'react'
import { CASE } from './generate'
import { REL_META, TYPE_COLOR, TYPE_LABEL, fmtDate, fmtMoney, ms } from './schema'
import type { Entity } from './schema'
import { TypeGlyph, RiskDot } from './icons'
import type { Action, SkeinState } from './model'

type Props = { state: SkeinState; dispatch: (a: Action) => void }

export function DetailPanel({ state, dispatch }: Props) {
  const byId = useMemo(() => new Map(CASE.entities.map((e) => [e.id, e])), [])
  const { selected, selectedRel, window: w } = state

  if (selectedRel) {
    const r = CASE.rels.find((x) => x.id === selectedRel)
    if (!r) return null
    const a = byId.get(r.source)!
    const b = byId.get(r.target)!
    const meta = REL_META[r.type]
    return (
      <Shell title="Relationship">
        <p className="text-sm text-skein-ink">
          <button className="underline decoration-skein-line hover:decoration-skein-thread" onClick={() => dispatch({ t: 'select', id: a.id, additive: false })}>{a.name}</button>
          {' '}<span className="text-skein-thread">{meta.label}</span>{' '}
          <button className="underline decoration-skein-line hover:decoration-skein-thread" onClick={() => dispatch({ t: 'select', id: b.id, additive: false })}>{b.name}</button>
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row k="Date" v={fmtDate(r.date)} />
          {meta.carriesMoney && r.amount != null && <Row k="Amount" v={fmtMoney(r.amount)} />}
          {meta.carriesLocation && r.locationId && <Row k="Location" v={byId.get(r.locationId)?.name ?? r.locationId} />}
          {r.note && <Row k="Note" v={r.note} />}
        </dl>
      </Shell>
    )
  }

  if (selected.length === 1) {
    const e = byId.get(selected[0])
    if (!e) return null
    const rels = CASE.rels
      .filter((r) => (r.source === e.id || r.target === e.id) && ms(r.date) >= w[0] && ms(r.date) <= w[1])
      .sort((a, b) => ms(a.date) - ms(b.date))
    return (
      <Shell title={TYPE_LABEL[e.type]}>
        <div className="flex items-start gap-3">
          <span style={{ color: TYPE_COLOR[e.type] }}><TypeGlyph type={e.type} size={22} /></span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-skein-ink">{e.name}</h3>
            <p className="text-sm text-skein-ink-2">{e.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-skein-muted">
          <RiskDot risk={e.risk} /> <span className="uppercase tracking-wide">{e.risk} risk</span>
          {e.country && <><span aria-hidden>·</span> <span>{e.country}</span></>}
        </div>
        {e.aliases.length > 0 && <p className="mt-2 text-xs text-skein-muted">aka {e.aliases.join(', ')}</p>}
        <p className="mt-3 text-sm text-skein-ink-2">{e.note}</p>
        <p className="skein-label mt-4">{rels.length} link{rels.length === 1 ? '' : 's'} in window</p>
        <ul className="mt-1.5 max-h-56 space-y-1 overflow-y-auto pr-1">
          {rels.map((r) => {
            const other = byId.get(r.source === e.id ? r.target : r.source)!
            return (
              <li key={r.id}>
                <button
                  onClick={() => dispatch({ t: 'selectRel', id: r.id })}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm text-skein-ink-2 hover:bg-skein-card-2"
                >
                  <span className="truncate"><span className="text-skein-thread">{REL_META[r.type].short}</span> {other.name}</span>
                  <span className="skein-num shrink-0 text-xs text-skein-muted">{fmtDate(r.date)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Shell>
    )
  }

  if (selected.length > 1) {
    return (
      <Shell title={`${selected.length} entities selected`}>
        <ul className="space-y-1">
          {selected.map((id) => {
            const e = byId.get(id)!
            return <li key={id} className="flex items-center gap-2 text-sm text-skein-ink-2"><span style={{ color: TYPE_COLOR[e.type] }}><TypeGlyph type={e.type} size={14} /></span> {e.name}</li>
          })}
        </ul>
        <button onClick={() => dispatch({ t: 'clearSelection' })} className="skein-num mt-3 text-xs text-skein-thread hover:underline">clear selection</button>
      </Shell>
    )
  }

  return (
    <Shell title="Inspector">
      <p className="text-sm text-skein-ink-2">
        Select an entity in the graph or the list, click a relationship thread, or click a port on the map.
        Scrub the timeline to change the window everything is filtered to.
      </p>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="skein-fade rounded-xl border border-skein-line bg-skein-card p-4">
      <p className="skein-label mb-2">{title}</p>
      {children}
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-skein-muted">{k}</dt>
      <dd className="skein-num text-right text-skein-ink">{v}</dd>
    </div>
  )
}
```

### 7.9 `portfolio/src/pages/Skein/EntityList.tsx` — accessible equivalent to the graph

A `role="listbox"` of every entity — filterable, keyboard-navigable (↑/↓, Home/
End, Enter to select, typeahead) — that stays in sync with the graph selection.
This is the **accessible alternative** promised in §11: everything you can do by
clicking a node, you can do here from the keyboard.

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { CASE } from './generate'
import { TYPE_COLOR, TYPE_LABEL } from './schema'
import { TypeGlyph, RiskDot } from './icons'
import type { Action, SkeinState } from './model'
import type { Derived } from './model'

type Props = { state: SkeinState; derived: Derived; dispatch: (a: Action) => void }

export function EntityList({ state, derived, dispatch }: Props) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return CASE.entities
      .filter((e) => !needle || e.name.toLowerCase().includes(needle) || e.subtitle.toLowerCase().includes(needle) || e.aliases.some((a) => a.toLowerCase().includes(needle)))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  }, [q])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    document.getElementById(`skein-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const selSet = new Set(state.selected)

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(rows.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(rows.length - 1) }
    else if (e.key === 'Enter' && rows[active]) { e.preventDefault(); dispatch({ t: 'select', id: rows[active].id, additive: e.shiftKey }) }
  }

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-skein-line bg-skein-card p-3">
      <label className="skein-label mb-2" htmlFor="skein-filter">Entities · {rows.length}</label>
      <input
        id="skein-filter"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKey}
        placeholder="Filter entities…"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded="true"
        aria-controls="skein-entity-list"
        aria-activedescendant={rows[active] ? `skein-opt-${active}` : undefined}
        className="mb-2 w-full rounded-lg border border-skein-line bg-skein-card-2 px-3 py-2 text-sm text-skein-ink outline-none placeholder:text-skein-muted"
      />
      <ul id="skein-entity-list" ref={listRef} role="listbox" aria-label="Case entities" className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((e, i) => {
          const st = derived.nodeState.get(e.id)!
          const isSel = selSet.has(e.id)
          return (
            <li
              key={e.id}
              id={`skein-opt-${i}`}
              role="option"
              aria-selected={isSel}
              onClick={(ev) => { setActive(i); dispatch({ t: 'select', id: e.id, additive: ev.shiftKey }) }}
              onMouseEnter={() => dispatch({ t: 'hover', id: e.id })}
              onMouseLeave={() => dispatch({ t: 'hover', id: null })}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${
                isSel ? 'bg-skein-sel text-skein-ink' : i === active ? 'bg-skein-card-2 text-skein-ink' : 'text-skein-ink-2'
              } ${st.dim && !isSel ? 'opacity-45' : ''}`}
            >
              <span style={{ color: TYPE_COLOR[e.type] }} title={TYPE_LABEL[e.type]}><TypeGlyph type={e.type} size={15} /></span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              <RiskDot risk={e.risk} />
            </li>
          )
        })}
        {rows.length === 0 && <li role="option" aria-selected={false} className="px-2 py-6 text-center text-sm text-skein-muted">no entities match “{q}”</li>}
      </ul>
    </div>
  )
}
```

### 7.10 `portfolio/src/pages/Skein/Legend.tsx` — legend + "how it's built"

```tsx
import { ENTITY_TYPES, TYPE_COLOR, TYPE_LABEL } from './schema'

export function Legend() {
  return (
    <div className="rounded-xl border border-skein-line bg-skein-card p-3">
      <p className="skein-label mb-2">Legend</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {ENTITY_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-2 text-xs text-skein-ink-2">
            <span className="h-3 w-3 rounded-full" style={{ background: TYPE_COLOR[t], opacity: 0.85 }} />
            {TYPE_LABEL[t]}
          </li>
        ))}
      </ul>
      <p className="skein-num mt-3 text-[0.68rem] leading-relaxed text-skein-muted">
        Force-directed layout, timeline, and map are hand-rolled — no graph library, no map tiles.
        The whole case is one seeded, deterministic dataset.
      </p>
    </div>
  )
}
```

### 7.11 `portfolio/src/pages/Skein/index.tsx` — page shell + orchestration

Owns the reducer, the `LayoutEngine` (built once from `CASE`), the memoized
`derive()`, the aria-live region, and the 3-pane responsive layout. Mirrors
Meridian's shell (sticky header, body-class swap, `skein-in` cascade, footer).

```tsx
import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
import { CASE } from './generate'
import { LayoutEngine } from './layout'
import { reducer, initialState, derive } from './model'
import { Graph } from './Graph'
import { Timeline } from './Timeline'
import { MapPane } from './MapPane'
import { DetailPanel } from './DetailPanel'
import { EntityList } from './EntityList'
import { Legend } from './Legend'
import './theme.css'

const d = (msDelay: number) => ({ '--d': `${msDelay}ms` }) as CSSProperties

/** Wordmark — a coiled thread resolving into a straight line. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M3 15c3 0 3-4 6-4s3 4 6 4" fill="none" stroke="var(--color-skein-thread)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 9c3 0 3-4 6-4s3 4 8 4" fill="none" stroke="var(--color-skein-thread)" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

export default function Skein() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(CASE))
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const engineRef = useRef<LayoutEngine | null>(null)
  if (!engineRef.current) engineRef.current = new LayoutEngine(CASE.entities, CASE.rels)

  // derive() doesn't read `hover`, so memoize on the fields it actually uses.
  // This keeps `derived`'s reference stable across hover — cheaper, and it means
  // hovering never churns the three views (see the Graph reheat note in §7.5).
  const derived = useMemo(
    () => derive(state, CASE),
    [state.window, state.selected, state.selectedRel, state.locationFilter],
  )

  useEffect(() => {
    document.body.classList.add('skein-page')
    const prev = document.title
    document.title = 'Skein — link-analysis case board'
    return () => { document.body.classList.remove('skein-page'); document.title = prev }
  }, [])

  return (
    <div className="skein-root flex min-h-svh flex-col bg-skein-bg text-skein-ink">
      <header className="sticky top-0 z-20 border-b border-skein-line bg-skein-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => navigate('#range')} className="skein-in font-mono text-xs tracking-wide text-skein-muted transition-colors hover:text-skein-ink" style={d(0)}>
            ← Portfolio
          </button>
          <span aria-hidden className="h-4 w-px bg-skein-line" />
          <div className="skein-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Skein</span>
            <span className="rounded-full border border-skein-thread/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-skein-thread">Demo</span>
            <span className="hidden text-xs text-skein-muted sm:inline">· {CASE.name}</span>
          </div>
          <span className="skein-in ml-auto hidden font-mono text-xs text-skein-muted md:block" style={d(80)}>
            Scrub the timeline and watch the network surface.
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[15rem_1fr_19rem]">
        {/* left rail: entity list (a11y equivalent) + legend */}
        <aside className="skein-in order-2 flex min-h-0 flex-col gap-4 lg:order-1" style={d(120)}>
          <div className="min-h-0 flex-1"><EntityList state={state} derived={derived} dispatch={dispatch} /></div>
          <Legend />
        </aside>

        {/* center: graph + timeline */}
        <section className="skein-in order-1 flex min-h-[60vh] flex-col gap-4 lg:order-2" style={d(60)}>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-skein-line bg-skein-card">
            <Graph
              engine={engineRef.current}
              derived={derived}
              selected={state.selected}
              selectedRel={state.selectedRel}
              hover={state.hover}
              reduceMotion={reduceMotion}
              dispatch={dispatch}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex gap-3 rounded-lg border border-skein-line bg-skein-bg/70 px-3 py-1.5 backdrop-blur">
              <span className="skein-num text-xs text-skein-ink-2">{derived.activeNodeCount} entities</span>
              <span className="skein-num text-xs text-skein-ink-2">{derived.activeRelCount} links</span>
            </div>
          </div>
          <Timeline state={state} dispatch={dispatch} />
        </section>

        {/* right rail: map + inspector */}
        <aside className="skein-in order-3 flex flex-col gap-4" style={d(180)}>
          <MapPane state={state} derived={derived} dispatch={dispatch} />
          <DetailPanel state={state} dispatch={dispatch} />
        </aside>
      </main>

      <footer className="border-t border-skein-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="font-mono text-xs text-skein-muted">
            Force-directed link analysis, hand-rolled — no graph library, no map tiles. Synthetic case built for Sean Joudrie's portfolio.
          </p>
          <button onClick={() => navigate('#range')} className="font-mono text-xs text-skein-muted transition-colors hover:text-skein-ink">
            Back to the portfolio →
          </button>
        </div>
      </footer>

      {/* screen-reader live region: filter + selection announcements */}
      <div role="status" aria-live="polite" className="sr-only">{state.announce}</div>
    </div>
  )
}
```

> **Announcement wiring:** the reducer already emits `announce` on `reset` and the
> Timeline on brush-release. Additionally, add this small effect inside `Skein()`
> so every window/selection change speaks a live count (kept out of the reducer
> so it stays pure):
>
> ```tsx
> useEffect(() => {
>   dispatch({ t: 'announce', msg: `${derived.activeNodeCount} entities, ${derived.activeRelCount} links in view` })
>   // eslint-disable-next-line react-hooks/exhaustive-deps
> }, [derived.activeNodeCount, derived.activeRelCount])
> ```

---

## 8 · Interactions & micro-interactions (every key/mouse path)

**Graph**
- **Click a node** → select it (single); detail panel shows it; its in-window
  edges + neighbors highlight; map ports it touches highlight.
- **Shift-click a node** → add/remove from multi-selection.
- **Click a node's incident edge (thread)** → select that relationship; detail
  panel shows the dated event.
- **Drag a node** → pins it under the pointer, sim relaxes around it; on release
  it rejoins (or stays pinned — see §7.5 note). A drag that doesn't move is
  treated as a click (select).
- **Drag the background** → pan. **Wheel** → zoom about the cursor (0.4×–3.5×).
- **Click empty background** → clear selection + location filter.
- **Hover a node** → thicker stroke + name label; syncs `hover` so the entity
  list highlights the same row (and vice-versa).

**Timeline (the headline interaction)**
- **Drag left/right handle** → grow/shrink the window from that edge (min 1 day).
- **Drag the window band** → slide the whole window, clamped to the span.
- **Quick-range chips** → jump to Full span / Wave I / II / III.
- Every change re-derives graph + map live; on release the live region announces
  the new date range.
- Histogram bars inside the window render in thread-red, outside in muted grey —
  the window is legible at a glance.

**Map**
- **Click a port** → set/toggle the location filter; graph + timeline dim to
  entities/edges tied to that port in-window; the port gets a thread ring; detail
  panel focuses it.
- **Clear filter** button (or background click in the graph) → remove it.
- Port badges show the live in-window entity count; dashed lanes show vessel port
  calls in date order.

**Entity list (keyboard)**
- **Type** in the filter → live-filter by name/subtitle/alias.
- **↑/↓, Home/End** → move the active option (`aria-activedescendant`).
- **Enter** → select; **Shift+Enter** → add to multi-selection.
- **Click/hover a row** → select/hover-sync with the graph.

**Global**
- All positional animation rides the shared ticker; the sim stops when cool and
  reheats on interaction. **Reduced motion**: the layout pre-settles synchronously
  (`engine.settle()`), no live jiggle; all CSS keyframes no-op.

---

## 9 · States (real markup lives in §7)

- **Loading:** App's `Suspense` fallback (`bg-skein-bg`, `text-skein-muted`
  spinner) while the chunk loads. The case is built at module import
  (deterministic, ~1ms), so there is no data spinner.
- **First paint / settling:** nodes seed on the phyllotaxis spiral and relax over
  ~120 frames; the count chip reads live. (Reduced motion → already settled.)
- **Neutral (no selection, full window):** every node/edge active, nothing
  dimmed; inspector shows the prompt copy.
- **Windowed (timeline scrubbed):** out-of-window edges fade to 0.05 opacity,
  their orphaned nodes drop to 0.16; the map badges shrink/disappear; the count
  chip and live region update.
- **Entity selected:** selection ring (solid thread), neighborhood highlighted,
  everything else dimmed; detail panel lists the entity's in-window links.
- **Relationship selected:** the single thread turns solid red at 3px; its two
  endpoints ring; detail panel shows the dated event.
- **Location filtered:** only entities/edges tied to that port in-window stay
  bright; the port shows a thread ring; a "clear filter ✕" affordance appears.
- **Multi-select:** detail panel lists the chosen entities with a "clear
  selection" action.
- **Empty entity-filter:** the list shows `no entities match "<q>"`.

---

## 10 · Edge cases & handling

- **Parallel edges (same pair, multiple dated rels):** the physics dedupes to one
  spring per pair (§7.4), but **all** rels render as separate selectable threads
  and appear individually in the timeline and the detail panel. Correct: the
  layout shouldn't double-pull, but every event is real.
- **A node with no in-window edges:** dims to 0.16 but stays in the DOM (so its
  position is stable when it re-enters the window). Its `pointer-events` on edges
  are disabled while dimmed to avoid catching clicks.
- **Dragging a node off-screen:** `toWorld()` accounts for pan/zoom, so the pin
  tracks the cursor at any zoom; the centering force pulls it back once released.
- **Zoom extremes:** clamped to 0.4×–3.5×; the viewBox keeps the world framed.
- **Very narrow time window (1 day):** handles are clamped so `start < end`; the
  window may contain zero events → graph fully dimmed, count chip reads `0` — an
  honest, non-broken state (the live region says "0 entities … in view").
- **Location with no in-window activity:** renders small + faint with no badge;
  still clickable (sets an empty filter, which the user clears).
- **Reduced motion:** `engine.settle()` runs the sim to rest synchronously before
  first paint; drags call `paint()` directly (no rAF task); nothing animates.
- **Resize:** the SVG is `viewBox`-scaled, so world→screen math is
  resolution-independent; no re-layout needed. (If the container aspect changes
  drastically, the graph simply letterboxes within the viewBox — acceptable.)
- **Determinism:** the seed drives entities, rels, dates, amounts, and the
  layout's initial spiral, so two devices show the identical board. The dev
  invariants (§6.4) fail loudly if any generator change breaks the contract.
- **Pointer capture on touch:** `setPointerCapture` on the SVG keeps drag/pan
  gestures attached even if the finger leaves the element; `touch-action: none`
  (via `.skein-canvas`) stops the page from scrolling mid-gesture.

---

## 11 · Accessibility (honest and thorough)

A spatial graph is the hardest thing to make accessible; most tools ship it as an
opaque `<canvas>` and stop. Skein does not.

- **Keyboard-navigable equivalent:** the **EntityList** (§7.9) is a full
  `role="listbox"` combobox — filter, ↑/↓/Home/End, Enter/Shift+Enter — that does
  everything node-clicking does (select, multi-select, hover-sync). It is not a
  second-class fallback; it sits in the primary layout. Anything achievable by
  pointing at the graph is achievable from the keyboard here.
- **The graph SVG** carries `role="img"` with an `aria-label` that states the live
  active counts and explicitly points to the list equivalent, so a screen-reader
  user is told the visual conveys a network and where to operate it.
- **Live region:** a visually-hidden `role="status" aria-live="polite"` announces
  every window change ("142 entities, 132 links in view" → new counts on scrub),
  selection changes, filter clears, and reset. Spoken text is the count + date
  range, never raw coordinates.
- **Timeline** is a labeled `role="group"`; the quick-range chips are real
  `<button>`s reachable and operable by keyboard (Tab + Enter), giving a
  keyboard-only path to every meaningful window without needing to drag.
- **Map** ports are `<g>` click targets inside a labeled `role="group"`; the
  chips + list already give keyboard paths to the same filtering (selecting a
  location entity in the list applies the same neighborhood highlight), and the
  location filter is also reachable by selecting the port entity from the list.
- **Contrast:** every text and entity-type color clears WCAG AA ≥4.5:1 on both
  surfaces (§4.2); node meaning is carried by the full-strength stroke (≥6.8:1),
  not the low-alpha fill, and never by color alone — each node also shows a type
  glyph, and each list row shows a glyph + risk dot + label.
- **Focus:** the shared `:focus-visible` thread-red outline (theme.css) applies to
  the filter input, chips, buttons, and links; the list uses
  `aria-activedescendant` roving (focus stays on the input, the correct combobox
  pattern).
- **Reduced motion:** honored everywhere — the sim pre-settles, CSS keyframes
  no-op, and the `.skein-in` cascade and detail-panel fade disable.

---

## 12 · Performance budget & how met

- **Dataset:** `ENTITY_TARGET = 50`, `REL_TARGET = 132` (§6.3). Chosen so the
  O(n²) force solver is cheap: 50 nodes → 1,225 pair interactions/tick +
  ≤132 spring passes + 50 integrations ≈ **~1.4k float ops/frame** — sub-
  millisecond, comfortably inside a 16ms frame with headroom to spare. No
  quadtree needed at this scale (Barnes–Hut would be over-engineering here — noted
  as a "later" item in §16).
- **One rAF loop:** the sim is a single `addTask` task on the shared ticker
  (§1.7); it **stops** when alpha cools below `ALPHA_MIN` (idle CPU = 0) and
  re-arms only on interaction. The graph never re-renders React during the
  simulation — positions are written imperatively to element refs; React
  re-renders only on selection/filter/hover state change.
- **Derivation:** `derive()` is O(entities + rels) ≈ 182 ops, memoized on the
  fields it reads (window / selection / location filter — not hover); it runs once
  per discrete interaction, not per frame.
- **Timeline/map** recompute their memoized bins/lanes only when the window or
  filter changes.
- **No dependencies added** → zero bundle-size hit beyond the page's own modules,
  lazy-loaded via the existing `Suspense` route split.
- **Determinism cost:** the case + initial layout spiral are built once at import
  (~1ms); no network, no assets.
- **Target:** 60fps during a settle and during a timeline drag on a mid-range
  laptop; instant (single-frame) response to selection/filter.

---

## 13 · Build order (numbered phases + exit criteria)

1. **Schema.** Create `schema.ts`. Exit: `tsc` clean; `REL_META`, `TYPE_COLOR`,
   date/money helpers exported.
2. **Generator + invariants.** Create `generate.ts` + `generate.assert.ts`. Exit:
   `npm run dev`, console shows `[Skein] 50 entities · 132 rels … OK`, no thrown
   invariant error; `CASE.entities.length === 50`, `CASE.rels.length ≈ 132`.
3. **Theme.** Append the `@theme` block to `index.css`; create `theme.css`. Exit:
   `bg-skein-bg` / `text-skein-*` utilities resolve; body swap works.
4. **Model.** Create `model.ts`. Exit: `tsc` clean; `derive(initialState())`
   returns all-active with nothing dimmed.
5. **Layout.** Create `layout.ts`. Exit: a scratch `new LayoutEngine(...).settle()`
   leaves finite, spread-out positions (no NaN, no overlap collapse).
6. **Icons.** Create `icons.tsx`. Exit: glyphs render at 15px.
7. **Graph.** Create `Graph.tsx`. Exit: mounted in a scratch page, nodes settle
   and are draggable, pan/zoom work, clicking a node logs a select.
8. **Timeline.** Create `Timeline.tsx`. Exit: dragging a handle changes the
   window; histogram recolors; graph dims accordingly.
9. **Map.** Create `MapPane.tsx`. Exit: ports plot, badges reflect the window,
   clicking a port filters the graph.
10. **Detail + List + Legend.** Create `DetailPanel.tsx`, `EntityList.tsx`,
    `Legend.tsx`. Exit: selecting anywhere updates the panel; list keyboard nav
    works and syncs selection.
11. **Shell.** Create `index.tsx`; wire `App.tsx` + `Range.tsx` + `index.css`
    tokens (§5). Exit: `#/demos/skein` opens; the Range card appears as
    Commission 05 and opens the demo.
12. **Polish pass.** Reduced-motion path, aria-live announcements, contrast spot-
    check, focus rings. Exit: §15 DoD holds; `npm run build` succeeds.
13. **Smoke.** Create `scripts/smoke-skein.mjs`; chain it in `package.json`
    (§14). Exit: `smoke-skein.mjs` exits ✓; existing smokes still ✓.
14. **Professional polish (§17).** Frame-coalesce the timeline scrub (§17.1),
    confirm responsive/touch posture (§17.2), focus the entity filter on entry
    (§17.3). Exit: a fast brush drag holds 60fps; the demo is usable on a tablet;
    the first Tab lands in the tool.
15. **Ship (§18).** Run the ship gate; if fully green, merge to `main` and let
    Pages deploy — this demo is pre-authorized to go live. Exit: the deploy run is
    green and `#/demos/skein` is live on the portfolio.

---

## 14 · Smoke test

### 14.1 `portfolio/scripts/smoke-skein.mjs`

```js
#!/usr/bin/env node
/**
 * Skein link-analysis smoke — same shape as smoke-palisade.mjs. Verifies the
 * page loads, the graph renders typed nodes, timeline scrubbing changes the
 * visible (non-dimmed) node count, clicking a node opens the detail panel and
 * highlights the map, clicking a map port filters the graph, and there are zero
 * page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/skein`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(700) // let the force sim settle

const graph = p.locator('svg[data-skein="graph"]')
check('graph mounts', (await graph.count()) === 1)
check('claim on screen', (await p.locator('text=Scrub the timeline and watch the network surface').count()) >= 1)

const totalNodes = await p.locator('svg[data-skein="graph"] [data-node-id]').count()
check('graph renders many typed nodes', totalNodes >= 40, `${totalNodes} nodes`)

// full window: count non-dimmed nodes (opacity via inline style is not queryable,
// so we read the live count chip instead — it reflects derived.activeNodeCount).
const readCount = async () => {
  const txt = (await p.locator('text=/\\d+ entities/').first().textContent()) ?? ''
  return parseInt(txt.match(/(\d+)\s+entities/)?.[1] ?? '0', 10)
}
const fullCount = await readCount()
check('full-window active count is high', fullCount >= 40, `${fullCount} active`)

// Scrub: click the "Wave I" quick-range chip → the window narrows → fewer active.
await p.locator('button:has-text("Wave I")').click()
await p.waitForTimeout(300)
const waveCount = await readCount()
check('timeline scrub reduces active node count', waveCount < fullCount, `${waveCount} < ${fullCount}`)

// back to full span for the selection tests
await p.locator('button:has-text("Full span")').click()
await p.waitForTimeout(200)

// Click a node → detail panel populates + at least one map port highlights.
const firstNode = p.locator('svg[data-skein="graph"] [data-node-id]').first()
await firstNode.click({ force: true })
await p.waitForTimeout(200)
const detail = p.locator('[data-skein="graph"]') // sanity: graph still there
check('graph still present after select', (await detail.count()) === 1)
check('detail panel shows a link count', (await p.locator('text=/link.* in window/').count()) >= 1)

// Click a map port → graph filters (active count drops or map shows a filter clear).
const port = p.locator('svg[data-skein="map"] [data-loc-id]').first()
await port.click({ force: true })
await p.waitForTimeout(300)
check('map click sets a location filter', (await p.locator('text=clear filter').count()) >= 1)
const filteredCount = await readCount()
check('map filter narrows the graph', filteredCount <= fullCount, `${filteredCount} ≤ ${fullCount}`)

// Entity list keyboard path exists.
check('accessible entity list present', (await p.locator('#skein-entity-list[role="listbox"]').count()) === 1)
check('graph exposes an aria-label equivalent', ((await graph.getAttribute('aria-label')) ?? '').includes('keyboard-navigable'))

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
```

### 14.2 `portfolio/package.json` — chain it in

Replace the existing `smoke` script's value by appending
`&& node scripts/smoke-skein.mjs` before `smoke-shell.mjs` (keep it grouped with
the other demo smokes):

```json
    "smoke": "node scripts/smoke-meridian.mjs && node scripts/smoke-aeroscale.mjs && node scripts/smoke-ledger-lens.mjs && node scripts/smoke-palisade.mjs && node scripts/smoke-skein.mjs && node scripts/smoke-cmdk.mjs && node scripts/smoke-shell.mjs"
```

---

## 15 · Definition of done

- All new files exist and compile under TS strict; `index.css`, `App.tsx`,
  `Range.tsx`, `package.json` edited exactly as in §4/§5/§14.
- `#/demos/skein` opens a full-bleed, self-chromed demo; the Range shelf shows
  **Commission 05 — Skein** with the `SkeinThumb` and opens the route.
- The force layout is hand-rolled (no graph/physics dependency in
  `package.json`), settles smoothly, and nodes drag / the canvas pans+zooms.
- The three views are one system: scrubbing the timeline dims/undims the graph
  and recolours the map live; selecting an entity highlights its neighborhood and
  the ports it touches; clicking a port filters the graph and timeline to that
  location in-window.
- The case is a single seeded, deterministic dataset; the dev invariants pass
  (`[Skein] … OK` in the console) and would throw on any contract break.
- Accessibility: keyboard-navigable entity list equivalent, `role="img"` graph
  with a pointer-to-the-list label, aria-live filter announcements, AA contrast,
  reduced-motion pre-settle.
- Performance: 60fps settle + scrub; idle CPU returns to zero when the sim cools;
  one shared `rAF` loop, no second timer.
- `npm run build` succeeds; `smoke-skein.mjs` exits ✓; existing smokes still ✓;
  no console errors.

---

## 16 · Later / out of scope (deliberate)

- **Real map tiles / real geography.** The schematic chart is the craft signal;
  Mapbox/Leaflet would hide it and add a dependency.
- **Barnes–Hut / quadtree force approximation.** Unnecessary at n≈50; it becomes
  worth it past a few hundred nodes. Explicitly parked so the O(n²) choice reads
  as deliberate, not naïve.
- **Multi-case support / case switcher.** One case tells the story; a picker is
  scope creep.
- **Entity resolution / de-duplication UI** (merging aliased entities). The data
  is pre-resolved; a merge workflow is a different product.
- **Saved views / shareable filter URLs.** Nice, but the demo's value is live
  exploration, not persistence.
- **Natural-language query** ("show me everyone who met Alderisle in Kaltis").
  A tempting Gotham-style feature and a good future extension; out of scope for a
  zero-backend portfolio demo.
- **Collaborative / multiplayer investigation.** That is Meld's territory
  (WebRTC); Skein stays single-analyst.
- **Editing the graph** (adding nodes/edges). Skein is read-and-analyze, not
  author — no mutation, hence no undo stack (§7.3).
- **Path-finding / centrality analytics** (shortest path between two entities,
  betweenness ranking). Strong future signal; deferred to keep the first build
  focused on the triple-linked-view fusion that is the point.

---

## 17 · Polish the spec didn't yet nail (do these — they're the difference between "works" and "professional")

### 17.1 Frame-coalesce the timeline scrub (the headline interaction must never jank)

`Timeline.onMove` currently dispatches `{t:'window'}` on **every** `pointermove`.
Each dispatch re-derives and re-renders the graph + map, so a fast drag can fire
dozens of full reconciliations per second. Coalesce to **one dispatch per frame**
— the same discipline Palisade uses for scroll. Keep the latest pointer value in a
ref and flush it on the next `requestAnimationFrame`:

```tsx
// inside Timeline(), alongside the other refs
const pending = useRef<[number, number] | null>(null)
const rafId = useRef(0)
const flush = () => {
  rafId.current = 0
  if (pending.current) { dispatch({ t: 'window', range: pending.current }); pending.current = null }
}
const schedule = (range: [number, number]) => {
  pending.current = range
  if (!rafId.current) rafId.current = requestAnimationFrame(flush)
}
// …and in onMove, replace each `dispatch({ t: 'window', range })` with `schedule(range)`.
// Cancel on unmount: useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current) }, [])
```

The quick-range **chips** dispatch directly (a single discrete change — no
coalescing needed). Result: the brush stays glued to the pointer and the graph
re-derives at most once per frame.

### 17.2 Responsive & touch (state it, don't leave it to chance)

The `index.tsx` grid already collapses from `lg:grid-cols-[15rem_1fr_19rem]` to a
single column below `lg`, stacking **graph+timeline → entity list + legend → map +
detail** (the `order-*` classes). That order is intentional — keep it. Beyond that:

- **Touch:** the graph already uses Pointer Events + `touch-action: none` (§4.5),
  so one-finger drag pans / drags a node on touch. Pinch-zoom is **out of scope**
  for v1 (wheel-zoom is desktop-only); document that, don't fake it.
- **Timeline handles on touch:** each handle already carries a 20px-wide invisible
  hit target (§7.6) — keep it; do not shrink it for looks.
- **Graph height on small screens:** the center column is `min-h-[60vh]`; that is
  the intended comfortable minimum on phone/tablet. The SVG `viewBox` letterboxes,
  so no re-layout is needed at any width.
- **Honesty:** Skein is **best on a laptop/desktop**, fully usable on tablet, and
  legible-but-tight on a phone. That is the correct posture for an analyst tool —
  do not compromise the desktop layout to chase a perfect phone experience.

### 17.3 Focus on route entry

When the demo mounts, keyboard users should land on its primary control, not the
top of `<body>`. In `Skein()`'s mount effect, after the title swap, move focus to
the entity filter (the graph's keyboard equivalent):

```tsx
// in the mount useEffect, once:
requestAnimationFrame(() => document.getElementById('skein-filter')?.focus())
```

Guard it under `!reduceMotion`? No — focus is not motion; always do it. It costs
nothing and makes the very first Tab land inside the tool. (The `← Portfolio` link
remains the first Shift+Tab target.)

---

## 18 · Deployment (AUTHORIZED — ship it when the gate is green)

> **Standing rule override, granted by Sean for this build.** Every prior demo in
> this roster carried "develop on the feature branch, stop for review, never touch
> `main`, never deploy." **Skein is different: it is pre-authorized to ship to the
> live portfolio once — and only once — the gate below is fully green.** No
> separate "make it live" confirmation is required for this demo.

**Ship gate (ALL must pass — if any fails, do not ship; fix or report):**

1. `npm run build` is clean under TS strict — zero errors.
2. `npm run smoke` runs **every** suite green, including the new
   `smoke-skein.mjs` (and the existing meridian / aeroscale / ledger-lens /
   palisade / cmdk / shell suites — no regressions).
3. The dev console prints `[Skein] 50 entities · 132 rels · span … OK` with **no**
   thrown invariant (§6.4).
4. A quick visual check on the built preview confirms the three-view fusion is
   real: the graph settles without jitter, dragging the timeline brush visibly
   dims/undims the graph and recolours the map, and clicking a port filters the
   graph — plus the Range shelf shows **Commission 05 — Skein** and opens it.

**Ship steps (only after the gate is green):**

1. Commit the Skein work + its four wiring edits (§4.3 / §5 / §14.2) to the feature
   branch with a clear message; push the branch.
2. Merge the feature branch into `main` (PR or fast-forward — either is fine).
   GitHub Pages `deploy.yml` builds and deploys automatically on push to `main`
   under `portfolio/**`.
3. Confirm the deploy run goes green, then report the live status. Done.

**Guardrails:** ship **only** the Skein feature and its wiring — do not sweep
unrelated in-flight changes into the same merge. If the gate can't be made green
without a design change this spec didn't anticipate, stop and surface it rather
than shipping something half-right to production.


---

## 19 · Build-run errata (found while building; the shipped code is the source of truth)

Five defects survived the pre-build review and were caught by the smoke suite +
screenshot verification during the build. Each is fixed in the shipped code;
recorded here so the doc doesn't mislead a future reader:

1. **Locations were orphans.** Locations participate via `rel.locationId`, never
   as `source`/`target` — so `derive()` never activated them and §6.4's degree
   check called all six ports orphans (dev invariant would throw). Fixed: both
   `derive()` and the assert count `locationId` as connectivity.
2. **Pointer capture killed every click.** `setPointerCapture` on the SVG
   retargets `pointerup`, so the browser computed the composed `click`'s target
   as the SVG — the per-element `onClick` on edges could never fire, and the
   svg-level background-click handler cleared every node selection immediately
   after it was made. Fixed: all click semantics live in `onPointerUp`
   (`elementFromPoint` for edge hits); the per-element and svg `onClick`
   handlers are gone.
3. **`toWorld()` ignored letterboxing.** Mapping the pointer across the element
   rect is wrong whenever the pane's aspect ≠ 960:660 (`preserveAspectRatio`
   letterboxes) — pinning teleported nodes away from the cursor. Fixed: client →
   viewBox via `svg.getScreenCTM().inverse()`; pan and wheel-zoom use the same
   mapping. A pan-release also no longer counts as a background click.
4. **The left rail never clipped.** The 50-row entity list stretched the grid
   row to ~1700px, so the board didn't fit any viewport. Fixed: on `lg` the left
   aside is sticky and viewport-height and the section column is
   viewport-height, with `h-full` on the EntityList root so the list scrolls
   internally; on mobile the list caps at 24rem.
5. **Smoke robustness.** `has-text("Wave I")` substring-matches all three wave
   chips (use exact role queries); `.skein-label` uppercases via CSS so text
   regexes need `/i`; and a mid-settle or mid-reheat node can sit outside the
   clipped SVG box (or off-viewport after chip-click auto-scroll), so the node
   to click is picked from inside the viewport∩svg intersection after the sim
   cools.

Also applied from the earlier review + §17: `addRel` as the sole id authority,
reheat keyed on active counts (not the `derived` reference), `PATHS` as the
single glyph source, the dev-assert import without a swallowing `.catch`,
frame-coalesced brush dispatches, and focus-on-entry to the entity filter.
