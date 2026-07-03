# Build Spec — Commission 04: **Palisade** (enterprise data grid)

> THE definitive, paste-ready build doc for one portfolio demo. Hand it to Fable. Every decision is made here; do zero independent design. Where a fenced block has a **file-path heading**, create/overwrite that exact file with that exact content. Match the existing AeroScale/Meridian conventions precisely.

---

## 0. Identity

| | |
|---|---|
| **Product name** | **Palisade** — "the enterprise data grid, hand-rolled." |
| **Slug / route** | `palisade` → `#/demos/palisade` |
| **Range commission** | `04` |
| **Skill headline** | Enterprise UI & performance at scale |
| **Token namespace** | `palisade-*` (CSS), `.palisade-root` / `body.palisade-page` |
| **Directory** | `portfolio/src/pages/PalisadeGrid/` |
| **On-screen claim** | `10,000 rows · hand-rolled virtualization · zero grid libraries` |
| **Palette family** | Teal-tinted deep charcoal (a "dispatch control-room" feel) — deliberately distinct from AeroScale slate-blue and Meridian warm-brass |

**Why "Palisade":** a palisade is a wall of vertical stakes — columns. It reads enterprise, it reads structure, it is not a real product, and the slug is short and clean.

**The fictional company shown in the grid:** **Cascadia Freight Systems (CFS)** — an LTL (less-than-truckload) freight carrier founded 2009, HQ Portland OR, running ~40 terminals across the western US and BC. Palisade is CFS's *dispatch-floor shipment manifest*: one screen listing every active and recently-closed shipment (10,000 rows). Palisade is the UI product; CFS is the fictional customer whose data fills it. This keeps Palisade cleanly independent of AeroScale's fintech world.

---

## 1. Locked decisions (do not revisit)

1. **Fresh fictional company + dataset**, fully independent of AeroScale: **Cascadia Freight Systems**, a freight carrier; the table is a **shipment manifest**. Invented schema + backstory below (§6).
2. **~10,000 seeded rows** (`ROW_COUNT = 10_000`) via `mulberry32` — deterministic, identical on every device. Enough that virtualization is *visibly* required (a naïve render would mount ~120,000 cells).
3. **Fully hand-rolled windowed virtualization.** No table/grid/virtual library. No `react-window`, `react-virtual`, `ag-grid`, `mui`, `tanstack`. The virtualization math **is** the skill on display; importing it would defeat the demo. Zero new dependencies (verify `package.json` is unchanged except the smoke script).
4. **Editing is session-only.** Edits live in an in-memory overlay `Map`, never persisted; a page reload restores the pristine seeded dataset. No backend, no `localStorage`.

---

## 2. Positioning & hiring signal

AeroScale proves *motion & data-viz*; Meridian proves *3D & WebGL*. Palisade proves the least glamorous, most commonly-required senior front-end skill: **making a large, interactive, accessible data surface fast.** The reviewer question it answers is: *"Can this person build the thing every B2B/enterprise app eventually needs — a grid with 10k+ rows that stays at 60fps, edits inline, keyboards like Excel, and is screen-reader-correct — without reaching for AG Grid?"*

The demo must *feel* boringly professional and be secretly hard: silky scroll to row 9,999, an active-cell that rovs with arrow keys, range-select + copy/paste as TSV, click-to-sort, a filter row, column resize/reorder/pin, CSV export that honours the current view, undo/redo. The on-screen claim and the "How this is built" strip make the difficulty legible to a non-engineer.

---

## 3. File tree

```
portfolio/src/pages/PalisadeGrid/
  index.tsx            # page shell: chrome, toolbar, grid, "how it's built" strip
  theme.css            # .palisade-root scope, selection/focus, body class, label
  schema.ts            # Row type, enums, COLUMNS meta, format + parse/validate
  generate.ts          # seeded 10k-row generator + exported ROWS
  generate.assert.ts   # dev-only dataset invariants (dynamic import)
  model.ts             # grid reducer: state, actions, view derivation, commands
  useVirtual.ts        # windowed virtualization hook (start/end from scrollTop)
  useGridKeys.ts       # Excel-grade keyboard controller
  clipboard.ts         # copy/paste selection as TSV
  csv.ts               # CSV export respecting filter+sort+column order
  cells.tsx            # CellView (per type) + CellEditor (per type) + StatusBadge
  HeaderRow.tsx        # sticky header + filter row: sort/filter/resize/reorder/pin
  Grid.tsx             # the virtualized grid (scroll container, spacer, rows)
  Toolbar.tsx          # search, jump-to-row, undo/redo, export, reset, counts

portfolio/scripts/smoke-palisade.mjs   # playwright-core smoke
```

Touched shared files: `portfolio/src/index.css` (add `@theme` tokens), `portfolio/src/App.tsx` (one lazy import + one `DEMO_PAGES` entry), `portfolio/src/components/Range.tsx` (one commission + one thumb), `portfolio/package.json` (smoke script).

---

## 4. Theme tokens (hex + WCAG)

Distinct palette: **teal-tinted deep charcoal** with a **teal accent** and a **good/warn/bad** status set. All contrast ratios below are computed (sRGB relative luminance, WCAG 2.1) against **bg `#0a1214`** and **card `#0f1a1d`**; every text-role token clears **4.5:1** against both surfaces.

### 4.1 Tokens & ratios

| Token | Hex | Role | vs bg `#0a1214` | vs card `#0f1a1d` |
|---|---|---|---|---|
| `--color-palisade-bg` | `#0a1214` | app background | — | — |
| `--color-palisade-card` | `#0f1a1d` | grid / card surface | — | — |
| `--color-palisade-card-2` | `#16262b` | header, row hover, editor | — | — |
| `--color-palisade-line` | `rgb(255 255 255 / 0.08)` | hairline borders | (non-text) | (non-text) |
| `--color-palisade-ink` | `#eef4f3` | primary text | **17.0:1** | **15.9:1** |
| `--color-palisade-ink-2` | `#b3c2c1` | secondary text | **10.3:1** | **9.6:1** |
| `--color-palisade-muted` | `#7d908f` | labels, muted | **5.6:1** | **5.3:1** |
| `--color-palisade-accent` | `#2dd4bf` | active cell, focus, links, selection edge | **10.2:1** | **9.5:1** |
| `--color-palisade-accent-2` | `#14b8a6` | accent pressed / deep | 6.9:1 | 6.5:1 |
| `--color-palisade-good` | `#34d399` | Delivered / valid | 9.9:1 | **9.2:1** |
| `--color-palisade-warn` | `#fbbf24` | Delayed / Scheduled | 11.4:1 | **10.6:1** |
| `--color-palisade-bad` | `#f87171` | Exception / invalid | 6.9:1 | **6.4:1** |
| `--color-palisade-info` | `#60a5fa` | In Transit | 6.6:1 | 6.2:1 |
| `--color-palisade-sel` | `rgb(45 212 191 / 0.16)` | range-selection fill | (non-text) | (non-text) |

**State ratios that matter:** status badges are **icon/dot + text label** (never colour alone), and each badge's *text colour* already clears 4.5:1 on the card surface (good 9.2, warn 10.6, bad 6.4, info 6.2), so they pass without relying on the pill tint. Active-cell outline uses `--color-palisade-accent` (9.5:1 vs card ⇒ comfortably above the 3:1 non-text floor). Selection fill is a low-alpha teal wash; the selected cell's text stays `ink` (still >12:1 over the blended surface).

> Compute note for Fable: do **not** retune these by eye. They are validator-passed. If you must add a colour, keep text roles ≥4.5:1 vs both `#0a1214` and `#0f1a1d`.

### 4.2 `@theme` additions — `portfolio/src/index.css`

Append inside the existing `@theme { … }` block (right after the Meridian block, before the closing `}`):

```css
  /* ---- Palisade demo — enterprise data grid (pages/PalisadeGrid).
     Teal-tinted deep charcoal; text roles WCAG-checked ≥4.5:1 against
     bg #0a1214 and card #0f1a1d. Status colors pair icon+text (see
     docs/roster/2-data-grid.md §4). Do not retune by eye. ---- */
  --color-palisade-bg: #0a1214;
  --color-palisade-card: #0f1a1d;
  --color-palisade-card-2: #16262b;
  --color-palisade-line: rgb(255 255 255 / 0.08);
  --color-palisade-ink: #eef4f3;
  --color-palisade-ink-2: #b3c2c1;
  --color-palisade-muted: #7d908f;
  --color-palisade-accent: #2dd4bf;
  --color-palisade-accent-2: #14b8a6;
  --color-palisade-good: #34d399;
  --color-palisade-warn: #fbbf24;
  --color-palisade-bad: #f87171;
  --color-palisade-info: #60a5fa;
  --color-palisade-sel: rgb(45 212 191 / 0.16);
```

### 4.3 `portfolio/src/pages/PalisadeGrid/theme.css`

```css
/* Palisade — enterprise data grid, demo-scoped dark chrome. Color tokens
   live in index.css @theme (palisade-*); this sheet carries what utilities
   can't: color-scheme, selection, focus, the body wash, and the grid's
   structural rules (sticky, tabular numerals, no-select while range-dragging). */
.palisade-root {
  color-scheme: dark;
  font-family: var(--font-sans);
}
.palisade-root ::selection {
  background: var(--color-palisade-accent);
  color: var(--color-palisade-bg);
}
.palisade-root :focus-visible {
  outline-color: var(--color-palisade-accent);
}

/* The demo owns the viewport — swap the body color so overscroll never
   flashes the portfolio's paper. Toggled on mount (index.tsx). */
body.palisade-page {
  background-color: var(--color-palisade-bg);
}

/* Small-caps label — the dark twin of the portfolio's .annotation. */
.palisade-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-palisade-muted);
}

/* Numeric cells share one tabular rhythm so columns of money align. */
.palisade-num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* While a range drag is in flight the body must not select text. */
.palisade-dragging,
.palisade-dragging * {
  user-select: none !important;
  cursor: cell;
}

/* Active cell ring is drawn with box-shadow (inset) so it never affects
   layout / row height — critical for the fixed-height virtualization. */
.palisade-active {
  box-shadow: inset 0 0 0 2px var(--color-palisade-accent);
}

/* Invalid-edit flash — a one-shot shake, reduced-motion safe. */
@keyframes palisade-nudge {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.palisade-invalid {
  box-shadow: inset 0 0 0 2px var(--color-palisade-bad);
  animation: palisade-nudge 0.18s ease;
}

/* Column drop indicator during header reorder. */
.palisade-dropline {
  box-shadow: inset 2px 0 0 var(--color-palisade-accent);
}

@media (prefers-reduced-motion: reduce) {
  .palisade-invalid { animation: none; }
}
```

---

## 5. Router + App + Range integration

### 5.1 Router — no change

`portfolio/src/lib/router.ts` already parses `#/demos/<slug>` → `demoSlug`. `palisade` matches the existing `[a-z0-9-]+`. Nothing to edit.

### 5.2 `portfolio/src/App.tsx`

Add the lazy import beside the others (after the Meridian line):

```tsx
const PalisadeGrid = lazy(() => import('./pages/PalisadeGrid'))
```

Add one entry to `DEMO_PAGES` (after the `meridian` entry):

```tsx
  palisade: {
    Page: PalisadeGrid,
    label: 'Palisade data grid demo',
    shell: 'bg-palisade-bg',
    spinner: 'text-palisade-muted',
  },
```

That is the whole App wiring — the standalone Suspense render already handles it.

### 5.3 `portfolio/src/components/Range.tsx`

Add one commission object to `COMMISSIONS` (after the Meridian `'02'` object):

```tsx
  {
    n: '04',
    skill: 'Enterprise UI & performance at scale',
    title: 'Palisade — enterprise data grid',
    caption:
      'Ten thousand freight-manifest rows in the browser, hand-rolled: windowed virtualization (no grid library), Excel-grade keyboard nav with a single roving active cell, range copy/paste as TSV, click-to-sort, a filter row, column resize / reorder / pin, undo-redo, and CSV export that honours the current view. Session-only edits, one seeded dataset, zero table dependencies.',
    href: '#/demos/palisade',
  },
```

> Note on numbering: this doc is commission **04**. Commission **03** is its own sibling roster doc; if `03` is not yet in `COMMISSIONS` when you build this, still add `04` with `n: '04'` — the `THUMBS` map is keyed by the `n` string, so gaps are harmless. Do not renumber.

Register the thumbnail. Add to the `THUMBS` record:

```tsx
const THUMBS: Record<string, () => ReactNode> = { '01': AeroThumb, '02': MeridianThumb, '04': PalisadeThumb }
```

Add the `PalisadeThumb` component (place it next to `MeridianThumb`/`AeroThumb`). Complete SVG — a miniature grid: pinned first column, sorted header caret, one status badge, tabular right-aligned numbers, an active-cell ring.

```tsx
/** A miniature of the data grid — pinned column, a sort caret, a status
    badge, and the teal active-cell ring peeking through the paper. */
function PalisadeThumb() {
  const rowY = [58, 76, 94, 112, 130]
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0a1214" />
      {/* toolbar hint */}
      <rect x="14" y="14" width="90" height="10" rx="5" fill="#16262b" />
      <rect x="228" y="13" width="38" height="12" rx="6" fill="#0f1a1d" stroke="#2dd4bf" strokeWidth="1" />
      {/* header row */}
      <rect x="14" y="34" width="252" height="16" rx="3" fill="#16262b" />
      <rect x="20" y="40" width="30" height="4" rx="2" fill="#7d908f" />
      <rect x="84" y="40" width="34" height="4" rx="2" fill="#7d908f" />
      {/* sort caret on a column */}
      <path d="M 150 39 l 4 5 l 4 -5 Z" fill="#2dd4bf" />
      <rect x="164" y="40" width="26" height="4" rx="2" fill="#7d908f" />
      {/* pinned first column band */}
      <rect x="14" y="50" width="60" height="88" fill="#0f1a1d" />
      <line x1="74" y1="34" x2="74" y2="138" stroke="rgb(255,255,255)" strokeOpacity="0.12" strokeWidth="1" />
      {/* body rows */}
      {rowY.map((y, i) => (
        <g key={y}>
          <rect x="20" y={y - 4} width="44" height="4" rx="2" fill="#b3c2c1" />
          <rect x="84" y={y - 4} width="40" height="4" rx="2" fill="#b3c2c1" />
          {/* status badge */}
          <rect x="150" y={y - 6} width="46" height="9" rx="4.5"
            fill={i === 1 ? 'rgba(52,211,153,0.15)' : i === 3 ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)'} />
          <circle cx="156" cy={y - 1.5} r="2" fill={i === 1 ? '#34d399' : i === 3 ? '#f87171' : '#60a5fa'} />
          {/* right-aligned tabular number */}
          <rect x="228" y={y - 4} width="34" height="4" rx="2" fill="#eef4f3" />
        </g>
      ))}
      {/* active-cell ring */}
      <rect x="82" y="86" width="44" height="16" rx="2" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
    </svg>
  )
}
```

---

## 6. Dataset — Cascadia Freight Systems

### 6.1 The company & the story

**Cascadia Freight Systems (CFS)** — an LTL freight carrier, HQ Portland OR, ~40 western-US/BC terminals. Palisade is its dispatch-floor manifest: 10,000 shipment records spanning a 45-day window that straddles a fixed "today" of **2026-06-30**. The seed encodes believable operational patterns so a logistics reviewer's gut-check passes:

- Faster services (Overnight/Expedited) skew to higher priority and higher freight value/kg.
- `eta` is always ≥ `shipDate` and scales with service transit time.
- Shipments whose `eta` is in the past are mostly **Delivered**, with a realistic minority **Exception**/**Delayed**; future `shipDate` ⇒ **Scheduled**; otherwise **In Transit**/**Delayed**.
- Weight ≈ pieces × per-piece weight; freight value ≈ weight × per-kg rate × service multiplier.

### 6.2 `portfolio/src/pages/PalisadeGrid/schema.ts`

```ts
/* Palisade schema — the shipment-manifest row, its column metadata, and the
   type-aware format + parse/validate helpers every cell and editor share.
   One place defines what a column IS; renderers, editors, sort, filter, CSV
   and TSV all read from here. */

export const HUBS = [
  'Seattle', 'Portland', 'Oakland', 'Sacramento', 'Boise', 'Spokane',
  'Reno', 'Salt Lake City', 'Denver', 'Phoenix', 'Vancouver BC', 'Los Angeles',
] as const
export type Hub = (typeof HUBS)[number]

export const SERVICES = ['Standard', 'Expedited', 'Overnight', 'Freight'] as const
export type Service = (typeof SERVICES)[number]

export const STATUSES = ['Scheduled', 'In Transit', 'Delayed', 'Delivered', 'Exception'] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type Priority = (typeof PRIORITIES)[number]

export type Row = {
  id: string          // 'CFS-100000' … unique, read-only
  customer: string    // free text, editable
  origin: Hub
  destination: Hub
  service: Service
  status: Status
  priority: Priority
  pieces: number      // integer ≥ 1
  weight: number      // kg, > 0
  freightValue: number // USD, ≥ 0
  shipDate: string    // ISO 'YYYY-MM-DD'
  eta: string         // ISO 'YYYY-MM-DD', ≥ shipDate
}

export type ColId = keyof Row
export type ColType = 'text' | 'enum' | 'status' | 'priority' | 'number' | 'currency' | 'date'

export type ColDef = {
  id: ColId
  header: string
  type: ColType
  width: number                 // default px
  editable: boolean
  align?: 'left' | 'right'
  options?: readonly string[]   // enum/status/priority
  min?: number                  // numeric floor
  integer?: boolean
}

/* Authoring order (== initial column order). `id` is pinned by default. */
export const COLUMNS: ColDef[] = [
  { id: 'id', header: 'Shipment', type: 'text', width: 116, editable: false },
  { id: 'customer', header: 'Customer', type: 'text', width: 190, editable: true },
  { id: 'origin', header: 'Origin', type: 'enum', width: 130, editable: true, options: HUBS },
  { id: 'destination', header: 'Destination', type: 'enum', width: 130, editable: true, options: HUBS },
  { id: 'service', header: 'Service', type: 'enum', width: 120, editable: true, options: SERVICES },
  { id: 'status', header: 'Status', type: 'status', width: 130, editable: true, options: STATUSES },
  { id: 'priority', header: 'Priority', type: 'priority', width: 110, editable: true, options: PRIORITIES },
  { id: 'pieces', header: 'Pieces', type: 'number', width: 92, editable: true, align: 'right', min: 1, integer: true },
  { id: 'weight', header: 'Weight (kg)', type: 'number', width: 116, editable: true, align: 'right', min: 0.1 },
  { id: 'freightValue', header: 'Freight Value', type: 'currency', width: 132, editable: true, align: 'right', min: 0 },
  { id: 'shipDate', header: 'Ship Date', type: 'date', width: 124, editable: true },
  { id: 'eta', header: 'ETA', type: 'date', width: 124, editable: true },
]

export const COLUMN_BY_ID: Record<ColId, ColDef> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c]),
) as Record<ColId, ColDef>

export const DEFAULT_PINNED: ColId[] = ['id']
export const ROW_COUNT = 10_000
/** Fixed "today" the dataset is authored around (UTC midnight). */
export const DATA_TODAY = '2026-06-30'

/* ---- Formatting ---- */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const int = new Intl.NumberFormat('en-US')
const num1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** Human display for a cell value (used in <CellView>). */
export function formatValue(type: ColType, v: unknown): string {
  if (v == null || v === '') return ''
  switch (type) {
    case 'currency': return usd.format(Number(v))
    case 'number': return Number.isInteger(Number(v)) ? int.format(Number(v)) : num1.format(Number(v))
    case 'date': return dateFmt.format(new Date(`${v}T00:00:00Z`))
    default: return String(v)
  }
}

/** Raw value for CSV/TSV — numbers unformatted, dates ISO, strings as-is. */
export function rawValue(type: ColType, v: unknown): string {
  if (v == null) return ''
  return String(v)
}

/** Comparable key for sorting. */
export function sortKey(type: ColType, v: unknown): number | string {
  switch (type) {
    case 'number':
    case 'currency': return Number(v)
    case 'date': return Date.parse(`${v}T00:00:00Z`)
    case 'priority': return PRIORITIES.indexOf(v as Priority)
    default: return String(v).toLowerCase()
  }
}

export type ParseResult =
  | { ok: true; value: Row[ColId] }
  | { ok: false; error: string }

/**
 * Coerce + validate a raw string (from a text editor or a pasted TSV cell)
 * into a typed value for `col`. `row` is the *current* row so cross-field
 * checks (eta ≥ shipDate) can run. Returns a typed value or an error string.
 */
export function parseValue(col: ColDef, raw: string, row: Row): ParseResult {
  const s = raw.trim()
  switch (col.type) {
    case 'text': {
      if (col.id === 'customer' && s.length === 0) return { ok: false, error: 'Customer cannot be empty' }
      return { ok: true, value: s }
    }
    case 'enum':
    case 'status':
    case 'priority': {
      const opts = col.options ?? []
      const hit = opts.find((o) => o.toLowerCase() === s.toLowerCase())
      if (!hit) return { ok: false, error: `Must be one of: ${opts.join(', ')}` }
      if ((col.id === 'origin' || col.id === 'destination')) {
        const other = col.id === 'origin' ? row.destination : row.origin
        if (hit === other) return { ok: false, error: 'Origin and destination must differ' }
      }
      return { ok: true, value: hit }
    }
    case 'number':
    case 'currency': {
      const n = Number(s.replace(/[$,\s]/g, ''))
      if (!Number.isFinite(n)) return { ok: false, error: 'Not a number' }
      if (col.integer && !Number.isInteger(n)) return { ok: false, error: 'Must be a whole number' }
      if (col.min != null && n < col.min) return { ok: false, error: `Must be ≥ ${col.min}` }
      return { ok: true, value: col.integer ? Math.round(n) : Math.round(n * 100) / 100 }
    }
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`)))
        return { ok: false, error: 'Use YYYY-MM-DD' }
      if (col.id === 'eta' && Date.parse(`${s}T00:00:00Z`) < Date.parse(`${row.shipDate}T00:00:00Z`))
        return { ok: false, error: 'ETA cannot precede ship date' }
      if (col.id === 'shipDate' && Date.parse(`${s}T00:00:00Z`) > Date.parse(`${row.eta}T00:00:00Z`))
        return { ok: false, error: 'Ship date cannot follow ETA' }
      return { ok: true, value: s }
    }
  }
}
```

### 6.3 `portfolio/src/pages/PalisadeGrid/generate.ts`

```ts
import { mulberry32 } from '../../lib/rand'
import {
  DATA_TODAY, HUBS, PRIORITIES, ROW_COUNT, SERVICES, STATUSES,
  type Hub, type Priority, type Row, type Service, type Status,
} from './schema'

/**
 * The Cascadia Freight Systems manifest — 10,000 shipment rows from one
 * mulberry32 seed, so the whole grid is byte-identical on every device.
 * Values are correlated the way a real manifest would be: service drives
 * transit time, priority and $/kg; dates drive status. Invariants are
 * checked in dev by generate.assert.ts.
 */
export const PALISADE_SEED = 730_026

const TODAY_MS = Date.parse(`${DATA_TODAY}T00:00:00Z`)
const DAY = 86_400_000
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/* A believable roster of shippers — reused across rows (a carrier has repeat
   customers), suffixed so the column reads varied. */
const CUSTOMER_BASE = [
  'Harbor Provisions', 'Timberline Supply', 'Cascade Components', 'Rainier Foods',
  'Summit Industrial', 'Puget Paper', 'Emerald Textiles', 'Basin Agriculture',
  'Cedar Mill Works', 'Coastal Ceramics', 'Ironwood Tools', 'Sockeye Seafood',
  'Highline Electronics', 'Prairie Grain Co', 'Sierra Bottling', 'Klamath Lumber',
  'Delta Chemicals', 'Northwind Apparel', 'Cobalt Metals', 'Orchard Fresh',
  'Granite Fixtures', 'Bayshore Plastics', 'Wildfire Outdoor', 'Sound Beverage',
  'Meadowlark Dairy', 'Copper Canyon Mining', 'Tideflat Marine', 'Aurora Glass',
  'Redwood Furnishings', 'Pinecrest Nursery', 'Vantage Appliances', 'Silverton Steel',
] as const
const SUFFIX = ['', ' Inc', ' LLC', ' Co', ' Group', ' West', ' Logistics', ' Partners']

/* Per-service transit windows (days), value multiplier, and priority skew. */
const SERVICE_META: Record<Service, { tMin: number; tMax: number; mult: number; prio: number }> = {
  Overnight: { tMin: 1, tMax: 1, mult: 2.4, prio: 0.85 },
  Expedited: { tMin: 2, tMax: 3, mult: 1.6, prio: 0.55 },
  Standard: { tMin: 3, tMax: 6, mult: 1.0, prio: 0.3 },
  Freight: { tMin: 5, tMax: 10, mult: 0.75, prio: 0.2 },
}
const SERVICE_WEIGHTS: [Service, number][] = [
  ['Standard', 0.48], ['Freight', 0.27], ['Expedited', 0.17], ['Overnight', 0.08],
]

const pick = <T,>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const weighted = <T,>(rand: () => number, table: [T, number][]): T => {
  let x = rand()
  for (const [v, w] of table) { if ((x -= w) <= 0) return v }
  return table[table.length - 1][0]
}

export function buildRows(seed: number = PALISADE_SEED): Row[] {
  const rand = mulberry32(seed)
  const rows: Row[] = new Array(ROW_COUNT)

  for (let i = 0; i < ROW_COUNT; i++) {
    const id = `CFS-${100000 + i}`

    const customer = CUSTOMER_BASE[Math.floor(rand() * CUSTOMER_BASE.length)] +
      SUFFIX[Math.floor(rand() * SUFFIX.length)]

    const origin = pick<Hub>(rand, HUBS)
    let destination = pick<Hub>(rand, HUBS)
    while (destination === origin) destination = pick<Hub>(rand, HUBS)

    const service = weighted<Service>(rand, SERVICE_WEIGHTS)
    const sm = SERVICE_META[service]

    // Ship date: uniformly across a 45-day window ending ~10 days after today,
    // so we get a healthy mix of past (delivered) and future (scheduled).
    const shipMs = TODAY_MS + Math.round((rand() * 45 - 35)) * DAY
    const transit = sm.tMin + Math.floor(rand() * (sm.tMax - sm.tMin + 1))
    const etaMs = shipMs + transit * DAY

    // Status derived from the calendar, with a realistic exception minority.
    let status: Status
    if (shipMs > TODAY_MS) status = 'Scheduled'
    else if (etaMs <= TODAY_MS) {
      const r = rand()
      status = r < 0.9 ? 'Delivered' : r < 0.96 ? 'Exception' : 'Delayed'
    } else {
      const r = rand()
      status = r < 0.82 ? 'In Transit' : r < 0.94 ? 'Delayed' : 'Exception'
    }

    // Priority skews with service; Overnight rarely Low.
    let priority: Priority
    const p = rand()
    if (p < sm.prio * 0.4) priority = 'Critical'
    else if (p < sm.prio) priority = 'High'
    else if (p < sm.prio + 0.45) priority = 'Medium'
    else priority = 'Low'

    const pieces = 1 + Math.floor(rand() * 40)
    const perPiece = 4 + rand() * 56 // kg
    const weight = Math.round(pieces * perPiece * 10) / 10
    const ratePerKg = 0.9 + rand() * 1.6 // USD/kg base lane rate
    const freightValue = Math.round(weight * ratePerKg * sm.mult + 45)

    rows[i] = {
      id, customer, origin, destination, service, status, priority,
      pieces, weight, freightValue, shipDate: iso(shipMs), eta: iso(etaMs),
    }
  }
  return rows
}

/** The grid's single, deterministic dataset (built once, never mutated). */
export const ROWS: Row[] = buildRows()

if (import.meta.env?.DEV) {
  void import('./generate.assert').then(({ assertRows }) => assertRows(ROWS))
}

/* Silence unused-import lint if PRIORITIES/STATUSES tree-shake oddly. */
void PRIORITIES
void STATUSES
```

### 6.4 `portfolio/src/pages/PalisadeGrid/generate.assert.ts`

```ts
import { DATA_TODAY, HUBS, PRIORITIES, ROW_COUNT, SERVICES, STATUSES, type Row } from './schema'

/**
 * The manifest's contract, enforced in dev only (dynamic import from
 * generate.ts, never in the production chunk). Freight reviewers gut-check
 * demo data; these prove the numbers instead of trusting them.
 */
export function assertRows(rows: Row[]): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)
  const today = Date.parse(`${DATA_TODAY}T00:00:00Z`)
  const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)

  if (rows.length !== ROW_COUNT) fail(`expected ${ROW_COUNT} rows, got ${rows.length}`)
  if (new Set(rows.map((r) => r.id)).size !== rows.length) fail('shipment ids not unique')

  const statusCount: Record<string, number> = {}
  let exceptions = 0

  rows.forEach((r, i) => {
    const at = `${r.id} (row ${i}):`
    if (r.origin === r.destination) fail(`${at} origin == destination`)
    if (!HUBS.includes(r.origin) || !HUBS.includes(r.destination)) fail(`${at} bad hub`)
    if (!SERVICES.includes(r.service)) fail(`${at} bad service`)
    if (!STATUSES.includes(r.status)) fail(`${at} bad status`)
    if (!PRIORITIES.includes(r.priority)) fail(`${at} bad priority`)
    if (!(r.pieces >= 1) || !Number.isInteger(r.pieces)) fail(`${at} pieces not int ≥1`)
    if (!(r.weight > 0)) fail(`${at} weight not > 0`)
    if (!(r.freightValue >= 0)) fail(`${at} freightValue < 0`)
    if (ms(r.eta) < ms(r.shipDate)) fail(`${at} eta < shipDate`)
    if (r.status === 'Scheduled' && ms(r.shipDate) <= today) fail(`${at} Scheduled but shipped`)
    if (r.status === 'Delivered' && ms(r.eta) > today) fail(`${at} Delivered but eta future`)
    statusCount[r.status] = (statusCount[r.status] ?? 0) + 1
    if (r.status === 'Exception') exceptions++
  })

  for (const s of STATUSES) if (!statusCount[s]) fail(`no rows with status ${s}`)
  const exRate = exceptions / rows.length
  if (exRate < 0.01 || exRate > 0.12) fail(`exception rate ${(exRate * 100).toFixed(1)}% out of 1–12% band`)

  if (errs.length) throw new Error(`Palisade dataset invariants failed:\n${errs.join('\n')}`)
   
  // eslint-disable-next-line no-console
  console.info(`[Palisade] ${rows.length} rows OK · statuses`, statusCount)
}
```

---

## 7. Components & modules (dependency order, paste-ready)

Dependency order: **schema → generate → model → useVirtual → clipboard → csv → cells → HeaderRow → useGridKeys → Grid → Toolbar → index**. (schema/generate are §6.)

### 7.1 `portfolio/src/pages/PalisadeGrid/model.ts`

The single source of grid truth. A `useReducer` state + a pure `deriveView` (memoized in `index.tsx`). Edits are an overlay `Map<rowId, Partial<Row>>` — never clone 10k rows. Undo/redo hold `EditCmd` objects only (structural ops are intentionally not undoable — see §16).

```ts
import { COLUMNS, COLUMN_BY_ID, DEFAULT_PINNED, sortKey,
  type ColId, type Row } from './schema'
import { ROWS } from './generate'

export type Cell = { r: number; c: number }   // r = view-row index, c = ordered-col index
export type Sort = { col: ColId; dir: 'asc' | 'desc' } | null
export type EditCmd = { kind: 'edit'; cells: { rowId: string; colId: ColId; prev: unknown; next: unknown }[] }

const UNDO_CAP = 100

export type State = {
  cols: ColId[]                       // full column order (pinned + unpinned)
  pinned: ColId[]                     // subset, rendered first, sticky-left
  widths: Record<string, number>      // colId -> px (session-only)
  sort: Sort
  filters: Record<string, string>     // colId -> filter text/enum value
  search: string                      // global quick filter
  edits: Map<string, Partial<Row>>
  active: Cell
  selection: { anchor: Cell; focus: Cell } | null
  editing: Cell | null
  editError: string | null
  undo: EditCmd[]
  redo: EditCmd[]
  announce: string                    // aria-live message
}

export function initialState(): State {
  const widths: Record<string, number> = {}
  for (const c of COLUMNS) widths[c.id] = c.width
  return {
    cols: COLUMNS.map((c) => c.id),
    pinned: [...DEFAULT_PINNED],
    widths,
    sort: null,
    filters: {},
    search: '',
    edits: new Map(),
    active: { r: 0, c: 0 },
    selection: null,
    editing: null,
    editError: null,
    undo: [],
    redo: [],
    announce: '',
  }
}

/** Ordered visible columns: pinned (in cols order) then the rest (in cols order). */
export function orderedCols(s: State): ColId[] {
  const pin = s.cols.filter((c) => s.pinned.includes(c))
  const rest = s.cols.filter((c) => !s.pinned.includes(c))
  return [...pin, ...rest]
}

/** Value of a cell honouring the edit overlay. */
export function cellValue(edits: State['edits'], rowIdx: number, colId: ColId): Row[ColId] {
  const base = ROWS[rowIdx]
  const e = edits.get(base.id)
  return e && colId in e ? (e[colId] as Row[ColId]) : base[colId]
}

/** Merge a base row with its edits (used for cross-field validation). */
export function mergedRow(edits: State['edits'], rowIdx: number): Row {
  const base = ROWS[rowIdx]
  const e = edits.get(base.id)
  return e ? { ...base, ...e } : base
}

/**
 * Pure view derivation: filter + sort → array of BASE indices. Memoize on
 * (edits, sort, filters, search) in the component. ~10k rows filter+sort in
 * a few ms — well under one frame.
 */
export function deriveView(s: State): number[] {
  const active = COLUMNS.filter((c) => (s.filters[c.id] ?? '') !== '')
  const search = s.search.trim().toLowerCase()

  const out: number[] = []
  for (let i = 0; i < ROWS.length; i++) {
    let keep = true
    for (const c of active) {
      const v = String(cellValue(s.edits, i, c.id)).toLowerCase()
      const f = s.filters[c.id].toLowerCase()
      // enum/status/priority filters are exact; text/number/date are substring.
      if (c.type === 'enum' || c.type === 'status' || c.type === 'priority') {
        if (v !== f) { keep = false; break }
      } else if (!v.includes(f)) { keep = false; break }
    }
    if (keep && search) {
      keep = COLUMNS.some((c) => String(cellValue(s.edits, i, c.id)).toLowerCase().includes(search))
    }
    if (keep) out.push(i)
  }

  if (s.sort) {
    const { col, dir } = s.sort
    const type = COLUMN_BY_ID[col].type
    const mul = dir === 'asc' ? 1 : -1
    out.sort((a, b) => {
      const ka = sortKey(type, cellValue(s.edits, a, col))
      const kb = sortKey(type, cellValue(s.edits, b, col))
      if (ka < kb) return -1 * mul
      if (ka > kb) return 1 * mul
      return a - b // stable tiebreak by base index
    })
  }
  return out
}

export type Action =
  | { t: 'active'; cell: Cell; extend?: boolean }
  | { t: 'selectAll'; rows: number; cols: number }
  | { t: 'beginEdit'; cell: Cell }
  | { t: 'cancelEdit' }
  | { t: 'setCell'; rowId: string; colId: ColId; next: unknown }
  | { t: 'applyEdits'; cells: { rowId: string; colId: ColId; next: unknown }[] }
  | { t: 'editError'; msg: string | null }
  | { t: 'undo' } | { t: 'redo' }
  | { t: 'sort'; col: ColId }
  | { t: 'setFilter'; col: ColId; value: string }
  | { t: 'search'; value: string }
  | { t: 'resize'; col: ColId; width: number }
  | { t: 'reorder'; from: ColId; to: ColId }
  | { t: 'togglePin'; col: ColId }
  | { t: 'reset' }
  | { t: 'announce'; msg: string }

const clampCell = (cell: Cell, rows: number, cols: number): Cell => ({
  r: Math.max(0, Math.min(rows - 1, cell.r)),
  c: Math.max(0, Math.min(cols - 1, cell.c)),
})

function applyCmd(edits: State['edits'], cmd: EditCmd, dir: 'do' | 'undo'): State['edits'] {
  const next = new Map(edits)
  for (const ch of cmd.cells) {
    const val = dir === 'do' ? ch.next : ch.prev
    const base = next.get(ch.rowId) ?? {}
    next.set(ch.rowId, { ...base, [ch.colId]: val })
  }
  return next
}

export function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'active': {
      const selection = a.extend
        ? { anchor: s.selection?.anchor ?? s.active, focus: a.cell }
        : null
      return { ...s, active: a.cell, selection, editing: null, editError: null }
    }
    case 'selectAll':
      return {
        ...s,
        selection: { anchor: { r: 0, c: 0 }, focus: { r: a.rows - 1, c: a.cols - 1 } },
        announce: `Selected all ${a.rows} rows`,
      }
    case 'beginEdit':
      return { ...s, editing: a.cell, active: a.cell, editError: null }
    case 'cancelEdit':
      return { ...s, editing: null, editError: null }
    case 'editError':
      return { ...s, editError: a.msg }
    case 'setCell': {
      const prev = (s.edits.get(a.rowId) ?? {})[a.colId] ??
        (ROWS.find((r) => r.id === a.rowId) as Row)[a.colId]
      if (prev === a.next) return { ...s, editing: null, editError: null }
      const cmd: EditCmd = { kind: 'edit', cells: [{ rowId: a.rowId, colId: a.colId, prev, next: a.next }] }
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        redo: [],
        editing: null,
        editError: null,
      }
    }
    case 'applyEdits': {
      const cells = a.cells.map((c) => {
        const cur = (s.edits.get(c.rowId) ?? {})[c.colId] ??
          (ROWS.find((r) => r.id === c.rowId) as Row)[c.colId]
        return { rowId: c.rowId, colId: c.colId, prev: cur, next: c.next }
      }).filter((c) => c.prev !== c.next)
      if (!cells.length) return s
      const cmd: EditCmd = { kind: 'edit', cells }
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        redo: [],
        announce: `Pasted ${cells.length} cell${cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'undo': {
      if (!s.undo.length) return { ...s, announce: 'Nothing to undo' }
      const cmd = s.undo[s.undo.length - 1]
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'undo'),
        undo: s.undo.slice(0, -1),
        redo: [...s.redo, cmd].slice(-UNDO_CAP),
        announce: `Undo ${cmd.cells.length} cell${cmd.cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'redo': {
      if (!s.redo.length) return { ...s, announce: 'Nothing to redo' }
      const cmd = s.redo[s.redo.length - 1]
      return {
        ...s,
        edits: applyCmd(s.edits, cmd, 'do'),
        redo: s.redo.slice(0, -1),
        undo: [...s.undo, cmd].slice(-UNDO_CAP),
        announce: `Redo ${cmd.cells.length} cell${cmd.cells.length === 1 ? '' : 's'}`,
      }
    }
    case 'sort': {
      const cur = s.sort
      const dir: 'asc' | 'desc' | null =
        !cur || cur.col !== a.col ? 'asc' : cur.dir === 'asc' ? 'desc' : null
      const header = COLUMN_BY_ID[a.col].header
      return {
        ...s,
        sort: dir ? { col: a.col, dir } : null,
        active: { ...s.active, r: 0 },
        announce: dir ? `Sorted by ${header} ${dir === 'asc' ? 'ascending' : 'descending'}` : `Sort cleared`,
      }
    }
    case 'setFilter': {
      const filters = { ...s.filters }
      if (a.value === '') delete filters[a.col]
      else filters[a.col] = a.value
      return { ...s, filters, active: { ...s.active, r: 0 }, selection: null }
    }
    case 'search':
      return { ...s, search: a.value, active: { ...s.active, r: 0 }, selection: null }
    case 'resize':
      return { ...s, widths: { ...s.widths, [a.col]: Math.max(60, Math.round(a.width)) } }
    case 'reorder': {
      if (a.from === a.to) return s
      const cols = s.cols.filter((c) => c !== a.from)
      const idx = cols.indexOf(a.to)
      cols.splice(idx, 0, a.from)
      return { ...s, cols, announce: `Moved ${COLUMN_BY_ID[a.from].header}` }
    }
    case 'togglePin': {
      const pinned = s.pinned.includes(a.col)
        ? s.pinned.filter((c) => c !== a.col)
        : [...s.pinned, a.col]
      return { ...s, pinned, announce: `${pinned.includes(a.col) ? 'Pinned' : 'Unpinned'} ${COLUMN_BY_ID[a.col].header}` }
    }
    case 'reset':
      return { ...initialState(), announce: 'Grid reset' }
    case 'announce':
      return { ...s, announce: a.msg }
    default:
      return s
  }
}

/** Selection rectangle (inclusive) in view coordinates. */
export function selRect(sel: State['selection']): { r0: number; r1: number; c0: number; c1: number } | null {
  if (!sel) return null
  return {
    r0: Math.min(sel.anchor.r, sel.focus.r),
    r1: Math.max(sel.anchor.r, sel.focus.r),
    c0: Math.min(sel.anchor.c, sel.focus.c),
    c1: Math.max(sel.anchor.c, sel.focus.c),
  }
}
export { clampCell }
```

### 7.2 `portfolio/src/pages/PalisadeGrid/useVirtual.ts`

Pure math, no measurement per row. Fixed `ROW_H`; `overscan` rows above/below.

```ts
import { useMemo } from 'react'

export const ROW_H = 36       // px — fixed row height (never measured)
export const HEADER_H = 40    // sticky header
export const FILTER_H = 36    // sticky filter row
export const STICKY = HEADER_H + FILTER_H
export const OVERSCAN = 8     // rows rendered beyond each edge

export type Window = { start: number; end: number; padTop: number; totalHeight: number }

/**
 * Compute the visible row window from the container's scrollTop + height.
 * Rows live below the sticky header+filter (STICKY px), so we subtract that
 * offset. No per-row DOM measurement — every row is exactly ROW_H, so the
 * window is pure arithmetic and layout never thrashes.
 */
export function computeWindow(scrollTop: number, viewportH: number, total: number): Window {
  const scrolled = Math.max(0, scrollTop - STICKY)
  const start = Math.max(0, Math.floor(scrolled / ROW_H) - OVERSCAN)
  const visible = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2
  const end = Math.min(total, start + visible)
  return { start, end, padTop: start * ROW_H, totalHeight: total * ROW_H }
}

export function useVirtual(scrollTop: number, viewportH: number, total: number): Window {
  return useMemo(() => computeWindow(scrollTop, viewportH, total), [scrollTop, viewportH, total])
}

/** Desired scrollTop so view-row `r` is fully visible below the sticky head. */
export function scrollToRow(r: number, scrollTop: number, viewportH: number): number {
  const top = STICKY + r * ROW_H
  const bottom = top + ROW_H
  if (top < scrollTop + STICKY) return top - STICKY
  if (bottom > scrollTop + viewportH) return bottom - viewportH
  return scrollTop
}

/** Rows that fit in the viewport (for PageUp/PageDown). */
export function pageRows(viewportH: number): number {
  return Math.max(1, Math.floor((viewportH - STICKY) / ROW_H) - 1)
}
```

### 7.3 `portfolio/src/pages/PalisadeGrid/clipboard.ts`

```ts
import { COLUMN_BY_ID, parseValue, rawValue, type ColId, type Row } from './schema'
import { cellValue, mergedRow, type State } from './model'
import { ROWS } from './generate'

/**
 * Build a TSV string for the selection rectangle. Reads through the edit
 * overlay so copied values match what's on screen.
 */
export function selectionToTSV(
  view: number[], cols: ColId[], edits: State['edits'],
  rect: { r0: number; r1: number; c0: number; c1: number },
): string {
  const lines: string[] = []
  for (let r = rect.r0; r <= rect.r1; r++) {
    const rowIdx = view[r]
    const cells: string[] = []
    for (let c = rect.c0; c <= rect.c1; c++) {
      const col = COLUMN_BY_ID[cols[c]]
      cells.push(rawValue(col.type, cellValue(edits, rowIdx, col.id)))
    }
    lines.push(cells.join('\t'))
  }
  return lines.join('\n')
}

export type PasteResult = {
  cells: { rowId: string; colId: ColId; next: unknown }[]
  rejected: number
}

/**
 * Parse pasted TSV into edit cells, starting at (startR,startC) and clamped
 * to the grid bounds. Read-only and invalid cells are skipped and counted.
 */
export function tsvToEdits(
  tsv: string, view: number[], cols: ColId[], edits: State['edits'],
  startR: number, startC: number,
): PasteResult {
  const matrix = tsv.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'))
  const out: { rowId: string; colId: ColId; next: unknown }[] = []
  let rejected = 0

  for (let dr = 0; dr < matrix.length; dr++) {
    const vr = startR + dr
    if (vr >= view.length) break
    const rowIdx = view[vr]
    const rowId = ROWS[rowIdx].id
    // merged row + any earlier edits in this same paste, for cross-field checks
    const working: Row = { ...mergedRow(edits, rowIdx) }
    for (const e of out) if (e.rowId === rowId) (working as Record<string, unknown>)[e.colId] = e.next

    for (let dc = 0; dc < matrix[dr].length; dc++) {
      const vc = startC + dc
      if (vc >= cols.length) break
      const col = COLUMN_BY_ID[cols[vc]]
      if (!col.editable) { rejected++; continue }
      const res = parseValue(col, matrix[dr][dc], working)
      if (!res.ok) { rejected++; continue }
      ;(working as Record<string, unknown>)[col.id] = res.value
      out.push({ rowId, colId: col.id, next: res.value })
    }
  }
  return { cells: out, rejected }
}
```

### 7.4 `portfolio/src/pages/PalisadeGrid/csv.ts`

```ts
import { COLUMN_BY_ID, rawValue, type ColId } from './schema'
import { cellValue, type State } from './model'

/** RFC-4180 field quoting. */
const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/**
 * Export the CURRENT view — current filter, current sort, current column
 * order (pinned first) — as CSV, and trigger a download. Session edits are
 * reflected. Nothing hits a server.
 */
export function exportCSV(view: number[], cols: ColId[], edits: State['edits']): void {
  const header = cols.map((id) => q(COLUMN_BY_ID[id].header)).join(',')
  const body = view.map((rowIdx) =>
    cols.map((id) => q(rawValue(COLUMN_BY_ID[id].type, cellValue(edits, rowIdx, id)))).join(','),
  )
  const csv = [header, ...body].join('\r\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cascadia-manifest-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

### 7.5 `portfolio/src/pages/PalisadeGrid/cells.tsx`

```tsx
import { useEffect, useRef, useState } from 'react'
import {
  COLUMN_BY_ID, PRIORITIES, formatValue, parseValue,
  type ColDef, type Row, type Status,
} from './schema'

/* ---- Status badge — icon/dot + text, never colour alone (a11y) ---- */
const STATUS_STYLE: Record<Status, { color: string; dot: string }> = {
  Delivered: { color: 'text-palisade-good', dot: 'bg-palisade-good' },
  'In Transit': { color: 'text-palisade-info', dot: 'bg-palisade-info' },
  Scheduled: { color: 'text-palisade-muted', dot: 'bg-palisade-muted' },
  Delayed: { color: 'text-palisade-warn', dot: 'bg-palisade-warn' },
  Exception: { color: 'text-palisade-bad', dot: 'bg-palisade-bad' },
}

function StatusBadge({ value }: { value: Status }) {
  const st = STATUS_STYLE[value] ?? STATUS_STYLE.Scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 ${st.color}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
      <span className="truncate">{value}</span>
    </span>
  )
}

const PRIORITY_COLOR: Record<string, string> = {
  Critical: 'text-palisade-bad',
  High: 'text-palisade-warn',
  Medium: 'text-palisade-ink',
  Low: 'text-palisade-muted',
}

/** Read-only display of a cell. */
export function CellView({ col, value }: { col: ColDef; value: unknown }) {
  if (col.type === 'status') return <StatusBadge value={value as Status} />
  if (col.type === 'priority')
    return <span className={PRIORITY_COLOR[String(value)] ?? ''}>{String(value)}</span>
  const cls = col.align === 'right' ? 'palisade-num tabular-nums' : ''
  return <span className={`block truncate ${cls}`}>{formatValue(col.type, value)}</span>
}

/* ---- Editors ---- */
export function CellEditor({
  col, row, initial, onCommit, onCancel,
}: {
  col: ColDef
  row: Row               // merged row (for cross-field validation)
  initial: string        // starting text ('' when opened by a typed char handled by caller)
  onCommit: (value: Row[keyof Row], move: 'down' | 'right' | 'none') => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initial)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement) el.select()
  }, [])

  const tryCommit = (move: 'down' | 'right' | 'none') => {
    const res = parseValue(col, text, row)
    if (!res.ok) { setErr(res.error); return false }
    onCommit(res.value, move)
    return true
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation() // the grid controller must not double-handle these
    if (e.key === 'Enter') { e.preventDefault(); tryCommit('down') }
    else if (e.key === 'Tab') { e.preventDefault(); tryCommit(e.shiftKey ? 'none' : 'right') }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  const shared =
    'absolute inset-0 h-full w-full bg-palisade-card-2 px-2 text-[0.82rem] text-palisade-ink ' +
    'outline-none ring-2 ring-inset ' + (err ? 'ring-palisade-bad' : 'ring-palisade-accent')

  if (col.type === 'enum' || col.type === 'status' || col.type === 'priority') {
    const opts = col.options ?? PRIORITIES
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        className={shared}
        value={text || String(row[col.id])}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => tryCommit('none')}
      >
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  const inputType = col.type === 'date' ? 'date' : col.type === 'text' ? 'text' : 'text'
  return (
    <>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={inputType}
        inputMode={col.type === 'number' || col.type === 'currency' ? 'decimal' : undefined}
        className={`${shared} ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}
        value={text}
        onChange={(e) => { setText(e.target.value); if (err) setErr(null) }}
        onKeyDown={onKeyDown}
        onBlur={() => tryCommit('none')}
        aria-invalid={!!err}
        aria-label={`Edit ${col.header}`}
      />
      {err && (
        <span role="alert" className="pointer-events-none absolute left-0 top-full z-40 mt-0.5 whitespace-nowrap rounded bg-palisade-bad px-1.5 py-0.5 text-[0.68rem] font-medium text-palisade-bg shadow-lg">
          {err}
        </span>
      )}
    </>
  )
}

export { COLUMN_BY_ID }
```

### 7.6 `portfolio/src/pages/PalisadeGrid/HeaderRow.tsx`

Sticky header + sticky filter row. Handles sort (click), resize (drag handle), reorder (drag header), pin (context/aux button). Pinned cells are `position: sticky; left: <offset>`.

```tsx
import { useRef } from 'react'
import { COLUMN_BY_ID, type ColId } from './schema'
import { HEADER_H, FILTER_H } from './useVirtual'
import type { State } from './model'

type Props = {
  cols: ColId[]
  state: State
  totalWidth: number
  leftOf: (c: number) => number       // sticky-left px for pinned col index c
  isPinned: (id: ColId) => boolean
  onSort: (id: ColId) => void
  onFilter: (id: ColId, v: string) => void
  onResize: (id: ColId, w: number) => void
  onReorder: (from: ColId, to: ColId) => void
  onTogglePin: (id: ColId) => void
}

export function HeaderRow(p: Props) {
  const dragCol = useRef<ColId | null>(null)

  const startResize = (id: ColId, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startW = p.state.widths[id]
    const move = (ev: PointerEvent) => p.onResize(id, startW + (ev.clientX - startX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div role="rowgroup" className="sticky top-0 z-30" style={{ width: p.totalWidth }}>
      {/* Header row */}
      <div role="row" className="flex" style={{ height: HEADER_H }}>
        {p.cols.map((id, c) => {
          const col = COLUMN_BY_ID[id]
          const pinned = p.isPinned(id)
          const sorted = p.state.sort?.col === id ? p.state.sort.dir : null
          return (
            <div
              key={id}
              role="columnheader"
              aria-colindex={c + 1}
              aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
              draggable={!pinned}
              onDragStart={() => (dragCol.current = id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragCol.current && dragCol.current !== id) p.onReorder(dragCol.current, id); dragCol.current = null }}
              className={`group relative flex items-center gap-1 border-b border-r border-palisade-line bg-palisade-card-2 px-2 text-palisade-ink-2 ${pinned ? 'sticky z-10' : ''}`}
              style={{ width: p.state.widths[id], left: pinned ? p.leftOf(c) : undefined }}
            >
              <button
                type="button"
                onClick={() => p.onSort(id)}
                className="flex min-w-0 flex-1 items-center gap-1 truncate text-left text-[0.7rem] font-semibold uppercase tracking-wide hover:text-palisade-ink"
                title={`Sort by ${col.header}`}
              >
                <span className="truncate">{col.header}</span>
                <span aria-hidden="true" className={`text-palisade-accent ${sorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                  {sorted === 'desc' ? '▾' : '▴'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => p.onTogglePin(id)}
                title={pinned ? 'Unpin column' : 'Pin column'}
                aria-pressed={pinned}
                className={`shrink-0 rounded px-1 text-[0.7rem] ${pinned ? 'text-palisade-accent' : 'text-palisade-muted opacity-0 hover:text-palisade-ink group-hover:opacity-100'}`}
              >
                {pinned ? '📌' : '📍'}
              </button>
              {/* resize handle */}
              <span
                onPointerDown={(e) => startResize(id, e)}
                className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-palisade-accent/60"
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize ${col.header}`}
              />
            </div>
          )
        })}
      </div>

      {/* Filter row */}
      <div role="row" className="flex" style={{ height: FILTER_H }}>
        {p.cols.map((id, c) => {
          const col = COLUMN_BY_ID[id]
          const pinned = p.isPinned(id)
          const val = p.state.filters[id] ?? ''
          const isEnum = col.type === 'enum' || col.type === 'status' || col.type === 'priority'
          return (
            <div
              key={id}
              className={`flex items-center border-b border-r border-palisade-line bg-palisade-card px-1.5 ${pinned ? 'sticky z-10' : ''}`}
              style={{ width: p.state.widths[id], left: pinned ? p.leftOf(c) : undefined }}
            >
              {isEnum ? (
                <select
                  aria-label={`Filter ${col.header}`}
                  value={val}
                  onChange={(e) => p.onFilter(id, e.target.value)}
                  className="w-full bg-transparent py-1 text-[0.72rem] text-palisade-ink-2 outline-none focus-visible:text-palisade-ink"
                >
                  <option value="">All</option>
                  {(col.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  aria-label={`Filter ${col.header}`}
                  value={val}
                  onChange={(e) => p.onFilter(id, e.target.value)}
                  placeholder="Filter…"
                  className="w-full bg-transparent py-1 text-[0.72rem] text-palisade-ink-2 placeholder:text-palisade-muted/60 outline-none focus-visible:text-palisade-ink"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 7.7 `portfolio/src/pages/PalisadeGrid/useGridKeys.ts`

The Excel-grade keyboard controller. Returns a single `onKeyDown` for the grid div. Pure movement math; dispatches to the reducer and calls `ensureVisible`.

```ts
import { COLUMN_BY_ID, type ColId } from './schema'
import { clampCell, type Action, type Cell, type State } from './model'
import { pageRows } from './useVirtual'

export type KeyCtx = {
  state: State
  dispatch: (a: Action) => void
  view: number[]                 // base indices
  cols: ColId[]                  // ordered visible cols
  viewportH: number
  ensureVisible: (r: number, c: number) => void
  beginEdit: (cell: Cell, seedChar?: string) => void
  copySelection: () => void
  pasteFrom: () => void          // reads clipboard, dispatches applyEdits
}

export function handleGridKey(e: React.KeyboardEvent, ctx: KeyCtx): void {
  const { state, dispatch, view, cols } = ctx
  const rows = view.length
  const nCols = cols.length
  if (rows === 0 || nCols === 0) return
  if (state.editing) return // editor owns keys while open

  const a = state.active
  const move = (r: number, c: number, extend = false) => {
    const cell = clampCell({ r, c }, rows, nCols)
    dispatch({ t: 'active', cell, extend })
    ctx.ensureVisible(cell.r, cell.c)
  }

  const mod = e.ctrlKey || e.metaKey
  const key = e.key

  // ---- Clipboard ----
  if (mod && (key === 'c' || key === 'C')) { e.preventDefault(); ctx.copySelection(); return }
  if (mod && (key === 'v' || key === 'V')) { e.preventDefault(); ctx.pasteFrom(); return }
  if (mod && (key === 'a' || key === 'A')) {
    e.preventDefault(); dispatch({ t: 'selectAll', rows, cols: nCols }); return
  }
  if (mod && (key === 'z' || key === 'Z')) { e.preventDefault(); dispatch({ t: e.shiftKey ? 'redo' : 'undo' }); return }
  if (mod && (key === 'y' || key === 'Y')) { e.preventDefault(); dispatch({ t: 'redo' }); return }

  const page = pageRows(ctx.viewportH)

  switch (key) {
    case 'ArrowUp': e.preventDefault(); move(a.r - 1, a.c, e.shiftKey); return
    case 'ArrowDown': e.preventDefault(); move(a.r + 1, a.c, e.shiftKey); return
    case 'ArrowLeft': e.preventDefault(); move(a.r, a.c - 1, e.shiftKey); return
    case 'ArrowRight': e.preventDefault(); move(a.r, a.c + 1, e.shiftKey); return
    case 'Home':
      e.preventDefault()
      mod ? move(0, 0) : move(a.r, 0, e.shiftKey); return
    case 'End':
      e.preventDefault()
      mod ? move(rows - 1, nCols - 1) : move(a.r, nCols - 1, e.shiftKey); return
    case 'PageUp': e.preventDefault(); move(a.r - page, a.c, e.shiftKey); return
    case 'PageDown': e.preventDefault(); move(a.r + page, a.c, e.shiftKey); return
    case 'Tab':
      e.preventDefault()
      if (e.shiftKey) move(a.c === 0 ? a.r - 1 : a.r, a.c === 0 ? nCols - 1 : a.c - 1)
      else move(a.c === nCols - 1 ? a.r + 1 : a.r, a.c === nCols - 1 ? 0 : a.c + 1)
      return
    case 'Enter':
      e.preventDefault()
      if (COLUMN_BY_ID[cols[a.c]].editable) ctx.beginEdit(a)
      else move(a.r + 1, a.c)
      return
    case 'F2':
      e.preventDefault()
      if (COLUMN_BY_ID[cols[a.c]].editable) ctx.beginEdit(a)
      return
    case 'Delete':
    case 'Backspace': {
      const col = COLUMN_BY_ID[cols[a.c]]
      if (col.type === 'text' && col.editable && col.id !== 'customer') {
        e.preventDefault(); ctx.beginEdit(a, '')
      }
      return
    }
    case 'Escape':
      dispatch({ t: 'active', cell: a }) // clears range selection
      return
    default:
      // Typing a printable char starts an edit seeded with that char.
      if (key.length === 1 && !mod && !e.altKey && COLUMN_BY_ID[cols[a.c]].editable) {
        e.preventDefault()
        ctx.beginEdit(a, key)
      }
  }
}
```

### 7.8 `portfolio/src/pages/PalisadeGrid/Grid.tsx`

The heart: the scroll container, sticky header/filter, the spacer, and only the windowed slice of absolutely-positioned rows. `role="grid"` with virtualized ARIA indices and `aria-activedescendant`.

```tsx
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { COLUMN_BY_ID, ROW_COUNT, type ColId, type Row } from './schema'
import { ROWS } from './generate'
import {
  cellValue, mergedRow, orderedCols, selRect,
  type Action, type Cell, type State,
} from './model'
import { HEADER_H, FILTER_H, ROW_H, STICKY, scrollToRow, useVirtual } from './useVirtual'
import { HeaderRow } from './HeaderRow'
import { CellEditor, CellView } from './cells'
import { handleGridKey } from './useGridKeys'
import { selectionToTSV, tsvToEdits } from './clipboard'

type Props = {
  state: State
  dispatch: (a: Action) => void
  view: number[]
  scrollToRowSignal: number | null   // jump-to-row target (view index) from toolbar
  onScrollHandled: () => void
}

export function Grid({ state, dispatch, view, scrollToRowSignal, onScrollHandled }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportH, setViewportH] = useState(600)
  const rafPending = useRef(false)
  const [editSeed, setEditSeed] = useState('')

  const cols = useMemo(() => orderedCols(state), [state])
  const pinnedSet = useMemo(() => new Set(state.pinned), [state.pinned])
  const isPinned = useCallback((id: ColId) => pinnedSet.has(id), [pinnedSet])

  // Sticky-left offset for the pinned column at ordered index c.
  const leftOf = useCallback((c: number) => {
    let x = 0
    for (let i = 0; i < c; i++) if (isPinned(cols[i])) x += state.widths[cols[i]]
    return x
  }, [cols, isPinned, state.widths])

  const totalWidth = useMemo(
    () => cols.reduce((w, id) => w + state.widths[id], 0),
    [cols, state.widths],
  )

  const win = useVirtual(scrollTop, viewportH, view.length)

  // rAF-coalesced scroll: never setState more than once per frame.
  const onScroll = useCallback(() => {
    if (rafPending.current) return
    rafPending.current = true
    requestAnimationFrame(() => {
      rafPending.current = false
      const el = scroller.current
      if (!el) return
      setScrollTop(el.scrollTop)
      setScrollLeft(el.scrollLeft)
    })
  }, [])

  // Track viewport height.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight))
    ro.observe(el)
    setViewportH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const ensureVisible = useCallback((r: number, c: number) => {
    const el = scroller.current
    if (!el) return
    const top = scrollToRow(r, el.scrollTop, el.clientHeight)
    if (top !== el.scrollTop) el.scrollTop = top
    // horizontal: bring column into view past the pinned band
    let x = 0
    for (let i = 0; i < c; i++) x += state.widths[cols[i]]
    const w = state.widths[cols[c]]
    const pinW = leftOf(cols.length) // total pinned width
    if (x < el.scrollLeft + pinW && !isPinned(cols[c])) el.scrollLeft = Math.max(0, x - pinW)
    else if (x + w > el.scrollLeft + el.clientWidth) el.scrollLeft = x + w - el.clientWidth
  }, [cols, state.widths, leftOf, isPinned])

  // Jump-to-row from the toolbar.
  useEffect(() => {
    if (scrollToRowSignal == null) return
    ensureVisible(scrollToRowSignal, state.active.c)
    dispatch({ t: 'active', cell: { r: scrollToRowSignal, c: state.active.c } })
    onScrollHandled()
  }, [scrollToRowSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Editing helpers ----
  const beginEdit = useCallback((cell: Cell, seed = '') => {
    setEditSeed(seed)
    dispatch({ t: 'beginEdit', cell })
  }, [dispatch])

  const commitEdit = useCallback((cell: Cell, value: Row[keyof Row], move: 'down' | 'right' | 'none') => {
    const rowIdx = view[cell.r]
    const colId = cols[cell.c]
    dispatch({ t: 'setCell', rowId: ROWS[rowIdx].id, colId, next: value })
    if (move === 'down') { const next = { r: Math.min(view.length - 1, cell.r + 1), c: cell.c }; dispatch({ t: 'active', cell: next }); ensureVisible(next.r, next.c) }
    else if (move === 'right') { const next = { r: cell.r, c: Math.min(cols.length - 1, cell.c + 1) }; dispatch({ t: 'active', cell: next }); ensureVisible(next.r, next.c) }
  }, [view, cols, dispatch, ensureVisible])

  // ---- Clipboard ----
  const copySelection = useCallback(() => {
    const rect = selRect(state.selection) ?? { r0: state.active.r, r1: state.active.r, c0: state.active.c, c1: state.active.c }
    const tsv = selectionToTSV(view, cols, state.edits, rect)
    navigator.clipboard?.writeText(tsv).catch(() => {})
    dispatch({ t: 'announce', msg: `Copied ${(rect.r1 - rect.r0 + 1) * (rect.c1 - rect.c0 + 1)} cells` })
  }, [state.selection, state.active, view, cols, state.edits, dispatch])

  const pasteFrom = useCallback(async () => {
    let tsv = ''
    try { tsv = await navigator.clipboard.readText() } catch { return }
    if (!tsv) return
    const { cells, rejected } = tsvToEdits(tsv, view, cols, state.edits, state.active.r, state.active.c)
    if (cells.length) dispatch({ t: 'applyEdits', cells })
    if (rejected) dispatch({ t: 'announce', msg: `Pasted ${cells.length}, skipped ${rejected} invalid/locked` })
  }, [view, cols, state.edits, state.active, dispatch])

  // Native copy/paste events (fire when the focused grid is the target) —
  // synchronous clipboard access, no permission prompt.
  const onCopy = useCallback((e: React.ClipboardEvent) => {
    if (state.editing) return
    const rect = selRect(state.selection) ?? { r0: state.active.r, r1: state.active.r, c0: state.active.c, c1: state.active.c }
    e.clipboardData.setData('text/plain', selectionToTSV(view, cols, state.edits, rect))
    e.preventDefault()
  }, [state.editing, state.selection, state.active, view, cols, state.edits])

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    if (state.editing) return
    const tsv = e.clipboardData.getData('text/plain')
    if (!tsv) return
    e.preventDefault()
    const { cells, rejected } = tsvToEdits(tsv, view, cols, state.edits, state.active.r, state.active.c)
    if (cells.length) dispatch({ t: 'applyEdits', cells })
    if (rejected) dispatch({ t: 'announce', msg: `Pasted ${cells.length}, skipped ${rejected} invalid/locked` })
  }, [state.editing, view, cols, state.edits, state.active, dispatch])

  const rect = selRect(state.selection)
  const activeId = `pal-cell-${state.active.r}-${state.active.c}`

  // Rendered slice.
  const slice: number[] = []
  for (let i = win.start; i < win.end; i++) slice.push(i)

  return (
    <div
      ref={scroller}
      role="grid"
      aria-label="Cascadia Freight Systems shipment manifest"
      aria-rowcount={view.length + 1}
      aria-colcount={cols.length}
      aria-multiselectable="true"
      aria-activedescendant={activeId}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => handleGridKey(e, {
        state, dispatch, view, cols, viewportH,
        ensureVisible, beginEdit, copySelection, pasteFrom,
      })}
      onCopy={onCopy}
      onPaste={onPaste}
      className="relative h-full w-full overflow-auto bg-palisade-card outline-none"
    >
      <div style={{ width: totalWidth, position: 'relative' }}>
        <HeaderRow
          cols={cols}
          state={state}
          totalWidth={totalWidth}
          leftOf={leftOf}
          isPinned={isPinned}
          onSort={(id) => dispatch({ t: 'sort', col: id })}
          onFilter={(id, v) => dispatch({ t: 'setFilter', col: id, value: v })}
          onResize={(id, w) => dispatch({ t: 'resize', col: id, width: w })}
          onReorder={(from, to) => dispatch({ t: 'reorder', from, to })}
          onTogglePin={(id) => dispatch({ t: 'togglePin', col: id })}
        />

        {/* Spacer: full virtual height so the scrollbar is honest. */}
        <div role="rowgroup" style={{ height: win.totalHeight, position: 'relative' }}>
          {slice.map((vr) => {
            const rowIdx = view[vr]
            const base = ROWS[rowIdx]
            const zebra = vr % 2 === 1
            return (
              <div
                key={base.id}
                role="row"
                aria-rowindex={vr + 2}          // +1 for 1-based, +1 for header row
                aria-selected={rect ? vr >= rect.r0 && vr <= rect.r1 : vr === state.active.r}
                className="absolute left-0 flex"
                style={{ transform: `translateY(${vr * ROW_H}px)`, height: ROW_H, width: totalWidth }}
              >
                {cols.map((id, c) => {
                  const col = COLUMN_BY_ID[id]
                  const pinned = isPinned(id)
                  const isActive = state.active.r === vr && state.active.c === c
                  const inSel = rect && vr >= rect.r0 && vr <= rect.r1 && c >= rect.c0 && c <= rect.c1
                  const editing = state.editing?.r === vr && state.editing?.c === c
                  const value = cellValue(state.edits, rowIdx, id)
                  return (
                    <div
                      key={id}
                      id={`pal-cell-${vr}-${c}`}
                      role="gridcell"
                      aria-colindex={c + 1}
                      aria-selected={!!inSel}
                      onMouseDown={(e) => {
                        if (e.detail === 2) return
                        dispatch({ t: 'active', cell: { r: vr, c }, extend: e.shiftKey })
                      }}
                      onDoubleClick={() => { if (col.editable) beginEdit({ r: vr, c }) }}
                      className={[
                        'relative flex items-center border-b border-r border-palisade-line px-2 text-[0.82rem]',
                        col.align === 'right' ? 'justify-end' : '',
                        pinned ? 'sticky z-10' : '',
                        editing ? '' : zebra ? 'bg-palisade-card' : 'bg-palisade-bg',
                        inSel && !isActive ? 'palisade-sel-cell' : '',
                        isActive ? 'palisade-active' : '',
                        state.editError && isActive ? 'palisade-invalid' : '',
                      ].join(' ')}
                      style={{
                        width: state.widths[id],
                        left: pinned ? leftOf(c) : undefined,
                        backgroundColor: inSel && !isActive ? 'var(--color-palisade-sel)' : undefined,
                      }}
                    >
                      {editing ? (
                        <CellEditor
                          col={col}
                          row={mergedRow(state.edits, rowIdx)}
                          initial={editSeed || String(value)}
                          onCommit={(v, move) => commitEdit({ r: vr, c }, v, move)}
                          onCancel={() => dispatch({ t: 'cancelEdit' })}
                        />
                      ) : (
                        <CellView col={col} value={value} />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Keeps scrollLeft referenced so pinned math re-runs on horizontal scroll. */}
      <span hidden aria-hidden="true" data-sl={scrollLeft} />
    </div>
  )
}

export { ROW_COUNT }
```

> Tailwind note: `bg-palisade-sel` isn't a text/opacity utility, so the selection fill is applied via inline `backgroundColor: var(--color-palisade-sel)` (above). The `palisade-active` / `palisade-invalid` classes come from `theme.css`. No `palisade-sel-cell` class is required — the inline style covers it; leave the extra className harmless or delete it.

### 7.9 `portfolio/src/pages/PalisadeGrid/Toolbar.tsx`

```tsx
import { useState } from 'react'
import type { Action, State } from './model'

type Props = {
  state: State
  dispatch: (a: Action) => void
  viewCount: number
  onExport: () => void
  onJump: (viewRow: number) => void
}

export function Toolbar({ state, dispatch, viewCount, onExport, onJump }: Props) {
  const [jump, setJump] = useState('')
  const editCount = state.edits.size
  const filtered = viewCount !== 10000

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-palisade-line bg-palisade-card px-3 py-2">
      <input
        type="search"
        value={state.search}
        onChange={(e) => dispatch({ t: 'search', value: e.target.value })}
        placeholder="Search all columns…"
        aria-label="Search all columns"
        className="h-8 w-56 rounded-md border border-palisade-line bg-palisade-bg px-2.5 text-sm text-palisade-ink placeholder:text-palisade-muted outline-none focus-visible:border-palisade-accent"
      />

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => dispatch({ t: 'undo' })} disabled={!state.undo.length}
          className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2 disabled:opacity-40"
          title="Undo (Ctrl+Z)">↶ Undo</button>
        <button type="button" onClick={() => dispatch({ t: 'redo' })} disabled={!state.redo.length}
          className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2 disabled:opacity-40"
          title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); const n = parseInt(jump, 10); if (n >= 1 && n <= viewCount) onJump(n - 1) }}
        className="flex items-center gap-1"
      >
        <label htmlFor="pal-jump" className="palisade-label">Row</label>
        <input id="pal-jump" value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric" placeholder="#" aria-label="Jump to row number"
          className="h-8 w-20 rounded-md border border-palisade-line bg-palisade-bg px-2 text-sm text-palisade-ink outline-none focus-visible:border-palisade-accent" />
        <button type="submit" className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2">Go</button>
      </form>

      <button type="button" onClick={onExport}
        className="h-8 rounded-md border border-palisade-accent/50 bg-palisade-accent/10 px-2.5 text-sm font-medium text-palisade-accent hover:bg-palisade-accent/20">
        Export CSV
      </button>

      <button type="button" onClick={() => dispatch({ t: 'reset' })}
        className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2">
        Reset
      </button>

      <div className="ml-auto flex items-center gap-3 font-mono text-xs text-palisade-muted">
        {editCount > 0 && <span className="text-palisade-accent">{editCount} edited</span>}
        <span aria-live="off">
          {filtered ? <><span className="text-palisade-ink-2">{viewCount.toLocaleString()}</span> / 10,000 rows</> : <>10,000 rows</>}
        </span>
      </div>
    </div>
  )
}
```

### 7.10 `portfolio/src/pages/PalisadeGrid/index.tsx`

The page shell: portfolio chrome, on-screen claim, toolbar, grid, aria-live region, "how it's built" strip. Toggles `body.palisade-page` on mount.

```tsx
import { useEffect, useMemo, useReducer, useState } from 'react'
import { navigate } from '../../lib/router'
import { Toolbar } from './Toolbar'
import { Grid } from './Grid'
import { deriveView, initialState, orderedCols, reducer } from './model'
import { exportCSV } from './csv'
import './theme.css'

/** Wordmark spark — a tiny stack of grid rows. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect width="20" height="20" rx="5" fill="var(--color-palisade-accent)" opacity="0.16" />
      <rect x="4" y="5" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-accent)" />
      <rect x="4" y="9" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-ink-2)" />
      <rect x="4" y="13" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-ink-2)" />
    </svg>
  )
}

export default function PalisadeGrid() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [jumpSignal, setJumpSignal] = useState<number | null>(null)

  const view = useMemo(() => deriveView(state), [state.edits, state.sort, state.filters, state.search])
  const cols = useMemo(() => orderedCols(state), [state.cols, state.pinned])

  useEffect(() => {
    document.body.classList.add('palisade-page')
    const prev = document.title
    document.title = 'Palisade — Cascadia Freight manifest'
    return () => { document.body.classList.remove('palisade-page'); document.title = prev }
  }, [])

  return (
    <div className="palisade-root flex h-svh flex-col bg-palisade-bg text-palisade-ink">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-palisade-line bg-palisade-bg/85 px-5 backdrop-blur sm:px-6">
        <button onClick={() => navigate('#work')}
          className="font-mono text-xs tracking-wide text-palisade-muted transition-colors hover:text-palisade-ink">
          ← Portfolio
        </button>
        <span aria-hidden="true" className="h-4 w-px bg-palisade-line" />
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-semibold tracking-tight">Palisade</span>
          <span className="rounded-full border border-palisade-accent/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-palisade-accent">Demo</span>
        </div>
        <p className="palisade-label ml-auto hidden sm:block">10,000 rows · hand-rolled virtualization · zero grid libraries</p>
      </header>

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 px-5 pt-4 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Shipment manifest</h1>
          <p className="text-xs text-palisade-ink-2">Cascadia Freight Systems · one seeded dataset · edits are session-only</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-5 pb-4 pt-3 sm:px-6">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-palisade-line">
          <Toolbar
            state={state}
            dispatch={dispatch}
            viewCount={view.length}
            onExport={() => exportCSV(view, cols, state.edits)}
            onJump={(r) => setJumpSignal(r)}
          />
          <div className="relative min-h-0 flex-1">
            {view.length === 0 ? (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <p className="text-sm text-palisade-ink-2">No shipments match your filters.</p>
                  <button onClick={() => dispatch({ t: 'reset' })}
                    className="mt-2 text-sm font-medium text-palisade-accent hover:underline">Clear filters</button>
                </div>
              </div>
            ) : (
              <Grid
                state={state}
                dispatch={dispatch}
                view={view}
                scrollToRowSignal={jumpSignal}
                onScrollHandled={() => setJumpSignal(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Screen-reader status line — the active cell + result summary. */}
      <div aria-live="polite" className="sr-only">{state.announce}</div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-palisade-line px-5 py-2.5 sm:px-6">
        <p className="font-mono text-[0.7rem] text-palisade-muted">
          Windowed virtualization · roving active cell · TSV copy/paste · undo-redo — no grid library, no backend.
        </p>
        <button onClick={() => navigate('#work')}
          className="font-mono text-xs text-palisade-muted transition-colors hover:text-palisade-ink">Back to the portfolio →</button>
      </footer>
    </div>
  )
}
```

---

## 8. Interactions & micro-interactions (all reduced-motion safe)

| Interaction | Behaviour | Motion |
|---|---|---|
| Active-cell move | `.palisade-active` inset ring (teal) drawn with `box-shadow` (no layout cost). | Instant; no transition (a moving cursor must not lag). |
| Range extend (Shift+arrow / shift-click) | Cells in the rect get `var(--color-palisade-sel)` fill. | Instant. |
| Row hover | Header/resize handles fade in via `group-hover` opacity. | 150ms opacity (Tailwind default), killed nowhere needed. |
| Sort click | Caret ▴/▾ appears; column re-sorts; view scrolls to top. | No animation on 10k re-sort (would stutter) — snap. |
| Filter typing | View recomputes on each keystroke (debounce optional, §12). | Snap. |
| Column resize | Live width follows pointer via `pointermove`. | Snap, `cursor: col-resize`. |
| Column reorder | Native HTML5 drag; `.palisade-dropline` marks the drop target. | Native drag ghost. |
| Invalid edit | `.palisade-invalid` red inset ring + 0.18s `palisade-nudge` shake; error tooltip under the editor. | Shake disabled under reduced-motion. |
| Copy | Toast-free; `aria-live` announces "Copied N cells". | None. |
| CSV export | Blob download; button has hover tint only. | None. |

Reduced-motion: only `palisade-nudge` animates; it is switched off in `theme.css`'s `@media (prefers-reduced-motion: reduce)`. Everything else is state-snap, so there is nothing else to disable. No rAF animation loop is started (the shared `ticker.ts` is *not* used here — the grid has no continuous animation; scroll coalescing uses a one-frame `requestAnimationFrame`, not a persistent loop).

---

## 9. States (real markup)

**Loading** — handled by `App.tsx`'s Suspense fallback (`bg-palisade-bg`, `text-palisade-muted` spinner "loading demo…"). No skeleton needed; the dataset is synchronous once the chunk loads.

**Empty after filter** — rendered by `index.tsx` when `view.length === 0`:

```tsx
<div className="grid h-full place-items-center">
  <div className="text-center">
    <p className="text-sm text-palisade-ink-2">No shipments match your filters.</p>
    <button className="mt-2 text-sm font-medium text-palisade-accent hover:underline">Clear filters</button>
  </div>
</div>
```

**Editing** — the active editable cell renders `<CellEditor>` (input/select) with a teal inset ring; on invalid commit it swaps to a red ring + `role="alert"` tooltip:

```tsx
<span role="alert" className="… bg-palisade-bad text-palisade-bg …">ETA cannot precede ship date</span>
```

**Error (paste/clipboard)** — no hard error surface; failures degrade gracefully and announce via `aria-live` ("Pasted 12, skipped 3 invalid/locked"). Clipboard read denial is caught and silently ignored (the native `onPaste` path still works).

---

## 10. Edge cases & handling

| Case | Handling |
|---|---|
| **10k-row scroll perf** | Only `~ceil(viewportH/36)+16` rows are ever in the DOM (~40–50 rows × 12 cells ≈ 600 nodes). Row height fixed; window is arithmetic. Rows positioned with `transform: translateY` (compositor, no layout). |
| **Rapid scroll / fling** | `onScroll` is rAF-coalesced: one `setState` per frame max. Overscan (8) hides the 1-frame gap during fast flings. |
| **Huge paste** (e.g. 5,000×12 TSV) | `tsvToEdits` clamps to grid bounds (`vr >= view.length` / `vc >= cols.length` break). One `applyEdits` command = one undo step. Read-only/invalid cells skipped + counted; announced. |
| **Invalid edit** | `parseValue` rejects; editor keeps focus, shows red ring + tooltip, does not move. Cross-field (`eta ≥ shipDate`) checked against the merged row. |
| **Empty filter result** | Empty state (§9); `active.r` clamped to 0; keyboard nav no-ops (`rows === 0` guard in `handleGridKey`). |
| **Column width within session** | `state.widths` holds per-column px; survives sort/filter/scroll; **resets on reload** (locked: session-only). |
| **Very long text** (customer names) | Cells use `truncate` (`overflow: hidden; text-overflow: ellipsis`); full value visible on edit and in the DOM title where useful. Fixed row height preserved. |
| **Active cell scrolled out of DOM** | `ensureVisible` scrolls it back before edit/nav; overscan keeps neighbours mounted. `aria-activedescendant` only references an id that exists because we always scroll the active cell into the window. |
| **Sort/filter changes active row identity** | `active.r` is a *view index*; on sort/filter it's reset to `r: 0` (reducer) so it never points off the end; `clampCell` guards all moves. |
| **Pin + reorder interaction** | Pinned cols always render first (`orderedCols`); reorder only moves within the ordering array; unpinning returns a col to its natural order slot. |
| **Horizontal + vertical scroll together** | Header (`sticky top`) and pinned column (`sticky left`) are independent sticky axes on the same scroller; the corner (pinned header cell) is doubly sticky with the highest z-index. |

---

## 11. Accessibility

### 11.1 Keyboard map

| Key | Action |
|---|---|
| ↑ ↓ ← → | Move active cell one cell |
| Shift + ↑↓←→ | Extend range selection |
| Tab / Shift+Tab | Move right / left, wrapping to next / previous row |
| Enter | If editable: begin edit (Enter in editor commits + moves down); else move down |
| Esc | Cancel edit / clear range selection |
| F2 | Begin edit on the active cell |
| Any printable char | Begin edit seeded with that char |
| Delete / Backspace | Clear a non-required text cell (begins edit with empty seed) |
| Home / End | First / last column in row |
| Ctrl/Cmd + Home / End | First cell / last cell of the grid |
| PageUp / PageDown | Move up / down one viewport of rows |
| Ctrl/Cmd + A | Select all |
| Ctrl/Cmd + C | Copy selection (or active cell) as TSV |
| Ctrl/Cmd + V | Paste TSV into the range from the active cell |
| Ctrl/Cmd + Z / Shift+Z / Y | Undo / Redo / Redo |

### 11.2 ARIA for the virtualized grid

- Container: `role="grid"`, `aria-label="Cascadia Freight Systems shipment manifest"`, `aria-rowcount={view.length + 1}` (real filtered total + header, **not** DOM count), `aria-colcount`, `aria-multiselectable="true"`, `aria-activedescendant={pal-cell-<r>-<c>}`, `tabIndex={0}`.
- **Roving tabindex, not per-cell tabindex:** the grid div is the single tab stop. For 10k rows, per-cell `tabIndex` would (a) be impossible — cells are virtualized and mostly not in the DOM — and (b) create tens of thousands of tab stops, destroying keyboard usability. Instead one focus owner + `aria-activedescendant` names the active cell; the browser/AT reads that cell without moving DOM focus.
- Header: `role="rowgroup"` → `role="row"` → `role="columnheader"` with `aria-colindex` and `aria-sort` (`ascending`/`descending`/`none`).
- Body: `role="rowgroup"`; each rendered row `role="row"` with `aria-rowindex={viewIndex + 2}` (**real** index in the filtered/sorted set, 1-based, +1 for the header row — not the DOM position). Each `role="gridcell"` has `aria-colindex` and `aria-selected`.
- `aria-activedescendant` correctness under virtualization: the active cell is always scrolled into the render window before it becomes active (`ensureVisible`), so the referenced id always exists in the DOM.

### 11.3 Live region wording

`<div aria-live="polite" class="sr-only">` announces, e.g.:
- `Sorted by Freight Value descending`
- `Pinned Status` / `Unpinned Status`
- `Selected all 10000 rows`
- `Copied 24 cells` · `Pasted 12, skipped 3 invalid/locked`
- `Undo 1 cell` · `Nothing to redo`
- `Grid reset`

A **jump-to-row** control (Toolbar) lets AT/keyboard users leap to any row number; a **screen-reader summary** ("`N / 10,000 rows`", plus "`M edited`") sits in the toolbar so the filtered result count is always spoken.

---

## 12. Performance budget & how met

| Budget | Target | How met |
|---|---|---|
| Scroll frame | ≤ 16.6ms (60fps) | rAF-coalesced scroll → one `setState`/frame; window recompute is O(1) arithmetic; rows moved by compositor `translateY` (no layout/paint of the whole list). |
| DOM node count | < 1,000 cell nodes | `~40 visible + 16 overscan` rows × 12 cols ≈ 650 gridcells regardless of dataset size. |
| Initial data build | < 30ms | `buildRows` is a single 10k loop of cheap ops; runs once at module load; assert only in DEV. |
| Filter/sort recompute | < 10ms typical | `deriveView` is a linear filter + native sort over 10k indices (numbers), memoized on `(edits, sort, filters, search)`. If a reviewer types fast in a filter, optionally debounce `setFilter` by 120ms — **not required** at this size. |
| Memory | Modest | One immutable `ROWS` array (10k objects); edits are a sparse overlay `Map` (only touched rows); undo capped at 100 commands. |
| Bundle | +0 deps | No table/virtual/grid library; all code is hand-rolled TS/TSX. |

Layout-thrash avoidance is explicit: **no per-row measurement** (height is the constant `ROW_H`), **transform not `top`** for row positioning, **`box-shadow` not `border`** for the active ring (borders would change row box height), and a **single passive-style rAF** for scroll (no synchronous `scrollTop` reads in a tight loop).

---

## 13. Build order (shippable phases + exit criteria)

1. **Scaffold + theme.** Add `@theme` tokens (§4.2), create `theme.css`, `schema.ts`. Wire `App.tsx` + `Range.tsx` + thumb. Stub `index.tsx` renders the chrome + claim. **Exit:** `#/demos/palisade` loads dark chrome, no console errors, `npm run build` clean.
2. **Dataset.** `generate.ts` + `generate.assert.ts`. **Exit:** DEV console logs `[Palisade] 10000 rows OK`; no assert throw.
3. **Static grid (no virtualization).** `model.ts` (state + `deriveView`), `cells.tsx`, `HeaderRow.tsx`, render **first 100 rows** only. **Exit:** header + 100 rows render with correct types, badges, alignment, pinned first column sticky-left.
4. **Virtualization.** `useVirtual.ts`, `Grid.tsx` full windowing + spacer + scroll coalescing. **Exit:** scroll to row 9,999 is smooth; DOM has < 1,000 cells at all times (check DevTools).
5. **Active cell + keyboard.** `useGridKeys.ts`, roving active cell, `ensureVisible`, `aria-activedescendant`. **Exit:** arrows/Tab/Home/End/PageUp/PageDown/Ctrl+Home move and auto-scroll; visible teal ring.
6. **Editing.** `CellEditor`, `setCell`, validation, invalid flash. **Exit:** F2/type/Enter edits commit; invalid rejected with tooltip; reload restores originals.
7. **Selection + clipboard.** Range select, `clipboard.ts`, copy/paste TSV. **Exit:** Shift+arrows selects; Ctrl+C/Ctrl+V round-trips through a spreadsheet; huge paste clamps.
8. **Sort / filter / structural.** Header sort caret, filter row, resize, reorder, pin. **Exit:** each works and `deriveView` reflects it; CSV export honours all three.
9. **Undo/redo + toolbar + a11y polish.** `Toolbar.tsx`, undo stack, jump-to-row, `aria-live` wording. **Exit:** undo/redo restore edits; live region announces; keyboard map complete.
10. **Smoke + docs strip.** `smoke-palisade.mjs`, package.json script, "how it's built" footer copy. **Exit:** `npm run smoke` passes; §15 satisfied.

---

## 14. Smoke test — `portfolio/scripts/smoke-palisade.mjs`

```js
#!/usr/bin/env node
/**
 * Palisade data-grid smoke — same shape as smoke-aeroscale.mjs. Verifies
 * virtualization (scroll to the last row renders it), keyboard nav, edit +
 * commit, copy, sort, filter, CSV export wiring, and zero page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/palisade`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)

const grid = p.locator('div[role="grid"]')
check('grid mounts with 10,001 aria-rowcount', (await grid.getAttribute('aria-rowcount')) === '10001')
check('claim on screen', ((await p.locator('text=hand-rolled virtualization').count())) >= 1)

// DOM node budget: far fewer than 10k rows are rendered.
const domRows = await p.locator('div[role="row"]').count()
check('virtualized (few rows in DOM)', domRows < 200, `${domRows} rows in DOM`)

// Scroll to the bottom — the last shipment must render (virtualization works).
await grid.evaluate((el) => { el.scrollTop = el.scrollHeight })
await p.waitForTimeout(300)
check('scrolled to last row renders', (await p.locator('div[role="row"][aria-rowindex="10001"]').count()) === 1)

// Back to top, focus grid, keyboard nav moves the active descendant.
await grid.evaluate((el) => { el.scrollTop = 0 })
await grid.focus()
await p.keyboard.press('ArrowDown')
await p.keyboard.press('ArrowRight')
check('active descendant tracks keys', (await grid.getAttribute('aria-activedescendant')) === 'pal-cell-1-1')

// Edit the customer cell (col 1) via F2, type, Enter.
await p.keyboard.press('F2')
await p.waitForTimeout(80)
await p.keyboard.type('SMOKE TEST CO')
await p.keyboard.press('Enter')
await p.waitForTimeout(120)
check('edit committed', (await p.locator('div[role="grid"]').textContent() ?? '').includes('SMOKE TEST CO'))
check('edit counter shows', (await p.locator('text=edited').count()) >= 1)

// Copy the active cell (no throw) and confirm announcement.
await p.keyboard.press('Control+c')
await p.waitForTimeout(80)
check('copy announces', ((await p.locator('[aria-live="polite"]').textContent()) ?? '').toLowerCase().includes('copied'))

// Sort by the Status column header.
await p.locator('button[title="Sort by Status"]').click()
await p.waitForTimeout(150)
check('sort sets aria-sort', ['ascending', 'descending'].includes(
  await p.locator('div[role="columnheader"]:has-text("Status")').first().getAttribute('aria-sort') ?? ''))

// Filter Status to Delivered via the filter-row select.
await p.locator('select[aria-label="Filter Status"]').selectOption('Delivered')
await p.waitForTimeout(200)
check('filter reduces the row count', ((await p.locator('text=/\\/ 10,000 rows/').count())) >= 1)

// Export button is wired (triggers a download).
const dl = p.waitForEvent('download', { timeout: 3000 }).catch(() => null)
await p.locator('button:has-text("Export CSV")').click()
check('CSV export downloads', (await dl) !== null)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
```

Update `portfolio/package.json` smoke script:

```json
    "smoke": "node scripts/smoke-meridian.mjs && node scripts/smoke-aeroscale.mjs && node scripts/smoke-palisade.mjs"
```

---

## 15. Definition of done

- `#/demos/palisade` renders the dark Palisade chrome + on-screen claim; portfolio Range card 04 + thumbnail links to it.
- 10,000 seeded rows; DEV assert passes; identical on reload/other devices.
- Virtualization: smooth scroll to row 9,999; < 1,000 cell nodes in the DOM at all times; sticky header **and** pinned first column both hold during 2-axis scroll.
- Excel-grade keyboard: full map in §11.1 works; single roving active cell; visible teal ring; auto-scroll on nav.
- Edit → validate → commit; invalid rejected with message; session-only (reload restores).
- Range select + copy/paste TSV round-trips with a spreadsheet; huge paste clamps.
- Sort (click cycles asc/desc/none), filter row (text + enum), column resize/reorder/pin all work; CSV export reflects current filter+sort+column order (+ session edits).
- Undo/redo restores/reapplies edits, capped at 100.
- A11y: `role=grid`/row/gridcell, correct `aria-rowcount/colcount/rowindex/colindex` (real indices), `aria-selected`, `aria-activedescendant`, `aria-sort`; `aria-live` announcements; jump-to-row.
- `npm run build` clean (TS strict); `npm run smoke` passes all Palisade checks; zero console/page errors.
- Zero new dependencies.

---

## 16. Later / out of scope (deliberate)

- **Structural undo** (undoing sort/filter/resize/reorder/pin). Only cell edits + paste are undoable — keeps the command model small and correct. Documented, not a bug.
- **Multi-column sort** (Shift+click to add a secondary sort). Single-column only for v1; the `sort` state is a single object by design.
- **Persistence** of edits, column layout, or filters (locked: session-only, no backend/localStorage).
- **Row add/delete**, grouping, aggregation/footer totals, frozen bottom rows.
- **Variable row height / wrapped text** (fixed `ROW_H` is what makes the virtualization arithmetic exact — a v2 concern only).
- **Touch drag-to-select / long-press editing** (desktop keyboard + mouse is the target surface; pointer resize already works on touch).
- **CSV import.** Paste-TSV covers the demo's editing story.
