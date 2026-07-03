# Ledger Lens — Definitive Build Specification (Range Commission 03)

> **Audience:** the builder LLM. Every decision here is final. Do **zero** independent
> design thinking. Where a file is given as a fenced block headed by its path, create that
> file with exactly that content. Match the existing repo conventions already proven by
> AeroScale (`portfolio/src/pages/AeroScaleDashboard`) and Meridian
> (`portfolio/src/pages/MeridianConfigurator`). Do not invent new patterns.

---

## 0 · Identity

| Field | Value |
|---|---|
| **Name** | Ledger Lens |
| **Slug** | `ledger-lens` |
| **Route** | `#/demos/ledger-lens` |
| **Range commission** | `03` |
| **Skill tag** | `AI-native product` |
| **One-line on-screen claim** | **Vision + structured output · your key never touches the browser** |
| **Directory** | `portfolio/src/pages/LedgerLens/` |
| **Backend** | `supabase/functions/extract/` (Deno Edge Function, holds Anthropic key) |
| **Claude model** | `claude-haiku-4-5` (vision + structured outputs, streaming) |

**What it is:** a visitor drops a receipt/invoice photo (or picks one of three procedurally
rendered example receipts, or pastes messy text/CSV), Ledger Lens streams a "reading →
structuring" extraction from Claude Haiku 4.5 with vision + a strict JSON schema, and lands
the result in an **editable** table (fix a misread merchant or amount inline) that
recomputes its own subtotal/total from the line items and flags any field the model was
unsure about. Export to CSV + JSON. The Anthropic key lives server-side in a Supabase Edge
Function (rate-limited, CORS-allowlisted) — the exact REX key-proxy pattern.

---

## 1 · Locked decisions (do not revisit)

1. **Primary path = receipt/invoice PHOTO → structured line items** via Claude Haiku 4.5 with
   **vision + structured output (`output_config.format`, `json_schema`)**. **Secondary path**:
   visitor pastes messy text/CSV → same schema, same table.
2. **Response STREAMS** with a visible **"reading → structuring"** transition (skeleton rows
   fill as tokens arrive).
3. **Results land in an EDITABLE table** — inline-edit any cell, add/delete rows — and
   **export to CSV + JSON**.
4. **Backend = Supabase Edge Function proxy** holding the Anthropic key (rate-limited, CORS
   allowlist). Reused REX pattern so the site's backend story is consistent.
5. **Preloaded example inputs + upload** — visitors won't have a receipt handy. Examples are
   **procedurally rendered to a `<canvas>`** (coffee shop, hardware store, SaaS invoice) — no
   downloaded assets; the same canvas image is what gets sent to the vision call.
6. **Conversational "chat with your extracted data" layer is PARKED** — noted in §17, not built.
7. **Totals are DERIVED, never trusted.** The table recomputes `amount = qty × unitPrice`,
   `subtotal = Σ amounts`, `total = subtotal + tax` and flags any mismatch against what the
   model returned.
8. **Model id is `claude-haiku-4-5`.** Anthropic version header `2023-06-01`. No beta headers.
   No `thinking` param (Haiku 4.5), no `output_config.effort` (errors on Haiku 4.5).

---

## 2 · Positioning & hiring signal + the gap it closes

AeroScale proves **motion & data-viz**. Meridian proves **3D/WebGL**. Neither touches the one
question every 2026 team now asks a product engineer: **can you ship a real LLM feature
end-to-end — vision, structured/tool output, streaming UX, an editable human-in-the-loop
correction surface, and a secure server-side key proxy — without it feeling like a wrapper
demo?** Ledger Lens is that proof:

- **AI-native product sense.** It doesn't dump raw model text; it constrains the model to a
  strict schema, *streams* the fill, surfaces *per-field confidence*, and makes the human the
  final authority (editable table + derived totals). This is what "productionizing an LLM"
  actually looks like.
- **Trust & security literacy.** The key never ships to the browser — same Edge Function
  proxy the REX case study already claims, with rate limiting + CORS allowlist. Reviewers who
  know the space look for exactly this.
- **Zero-asset craft (the signature move).** The example receipts are themselves generated to
  a canvas and fed to the vision call — deterministic, no downloaded images, and a neat story:
  *"the receipts you're reading are also generated."* Consistent with the whole portfolio's
  procedural-everything ethos (AeroScale's hand-rolled SVG, Meridian's procedural geometry).

**Gap closed:** the portfolio had visual/graphics range but no evidence of *AI product*
engineering. This is the single demo that says "I can build the AI feature your PM is asking
for, correctly."

---

## 3 · Full file tree

```
portfolio/
  src/
    pages/
      LedgerLens/
        index.tsx            # page shell (standalone chrome, body-class on mount)
        theme.css            # scoped dark "ledger" system (color-scheme, selection, focus, label)
        schema.ts            # TS types, the JSON schema, LOW_CONFIDENCE, recompute/validate helpers
        schema.assert.ts     # dev-only invariants for the example receipt specs
        receipts.ts          # procedural canvas receipt renderer + the 3 EXAMPLES
        partialJson.ts       # tolerant partial-JSON parser (streaming skeleton fill)
        useExtraction.ts     # streaming extraction hook (fetch → SSE → phase machine)
        format.ts            # money/number/date formatting
        export.ts            # toCSV / toJSON / download()
        Dropzone.tsx         # upload (image) + paste (text/CSV) input surface
        ExamplePicker.tsx    # renders the 3 example receipts to canvas; select → send
        SkeletonRows.tsx     # reading/structuring skeleton
        ConfidenceMeter.tsx  # document-level confidence indicator
        ResultsTable.tsx     # editable table: keyboard editing, add/delete row, live recompute, flags
  scripts/
    smoke-ledger-lens.mjs    # playwright-core smoke (API stubbed via route interception)
supabase/
  functions/
    extract/
      index.ts               # Deno Edge Function: CORS allowlist, rate-limit, Anthropic proxy, SSE passthrough
      deno.json              # import map / lint config (optional but included)
  migrations/
    0001_ledger_rate_limit.sql   # rate-limit table + consume_rate_limit RPC
```

**Wiring (three edits to existing files, spelled out in §5):**
`portfolio/src/App.tsx` (one lazy import + one `DEMO_PAGES` entry),
`portfolio/src/components/Range.tsx` (one `COMMISSIONS` entry + one `THUMBS` entry + the `LedgerThumb` SVG),
`portfolio/src/index.css` (the `--color-ledger-*` tokens inside `@theme`).

---

## 4 · Theme tokens (exact hex + computed WCAG ratios)

### 4.1 Palette — "ledger": warm cream ink on near-black charcoal, one green "verified/total" accent

Distinct from AeroScale (cool slate/blue) and Meridian (warm brass). The surface is a receipt
photographed in low light: near-black warm charcoal, cream ink, a single mint-green accent for
"verified / total", plus two semantic status colors (amber for low-confidence flags, red for
errors).

| Token | Hex | Role |
|---|---|---|
| `--color-ledger-bg` | `#0d0c0a` | page background (warm near-black) |
| `--color-ledger-card` | `#17150f` | card / receipt-in-shadow surface |
| `--color-ledger-card-2` | `#201d15` | raised surface (input cells, hover) |
| `--color-ledger-line` | `rgb(255 255 255 / 0.08)` | hairline borders |
| `--color-ledger-ink` | `#f4efe2` | primary text (cream) |
| `--color-ledger-ink-2` | `#cabfa6` | secondary text |
| `--color-ledger-muted` | `#9a8f78` | labels, captions, `.ledger-label` |
| `--color-ledger-mint` | `#58c98a` | **brand accent** — verified, total, focus, CTA |
| `--color-ledger-flag` | `#e0a53a` | low-confidence flag / mismatch warning (amber) |
| `--color-ledger-bad` | `#e06a5a` | error / rate-limit state (red) |

### 4.2 Computed WCAG contrast ratios (sRGB, WCAG 2.1)

Every text-role token vs **both** `bg` (#0d0c0a, L=0.00370) and `card` (#17150f, L=0.00753).
All ≥ 4.5:1. Ratios below are computed, not eyeballed.

| Text token | Luminance | vs `bg` | vs `card` | Pass ≥4.5 |
|---|---|---|---|---|
| `ink` `#f4efe2` | 0.8646 | **17.0 : 1** | **15.9 : 1** | ✓ |
| `ink-2` `#cabfa6` | 0.5256 | **10.7 : 1** | **10.0 : 1** | ✓ |
| `muted` `#9a8f78` | 0.2788 | **6.12 : 1** | **5.72 : 1** | ✓ |
| `mint` `#58c98a` | 0.4568 | **9.44 : 1** | **8.81 : 1** | ✓ |
| `flag` `#e0a53a` | 0.4306 | **8.95 : 1** | **8.36 : 1** | ✓ |
| `bad` `#e06a5a` | 0.2690 | **5.94 : 1** | **5.55 : 1** | ✓ |

Surfaces are non-text (contrast floor N/A): `card` sits a subtle 1.07× above `bg`; `card-2`
(#201d15, L≈0.0113) reads as a raised cell. `line` at white/0.08 is a hairline, decorative.

### 4.3 `@theme` additions — append inside the existing `@theme { … }` block in `portfolio/src/index.css`

Insert immediately after the Meridian block (after the `--color-meridian-brass-2` line, before
the closing `}` of `@theme`):

```css
  /* ---- Ledger Lens demo — scoped "ledger" dark system (pages/LedgerLens).
     Warm cream ink on near-black charcoal, one mint "verified/total" accent
     plus amber (low-confidence) and red (error) status colors. All text roles
     WCAG-checked ≥4.5:1 against bg AND card; see docs/roster/1-ledger-lens.md §4. ---- */
  --color-ledger-bg: #0d0c0a;
  --color-ledger-card: #17150f;
  --color-ledger-card-2: #201d15;
  --color-ledger-line: rgb(255 255 255 / 0.08);
  --color-ledger-ink: #f4efe2;
  --color-ledger-ink-2: #cabfa6;
  --color-ledger-muted: #9a8f78;
  --color-ledger-mint: #58c98a;
  --color-ledger-flag: #e0a53a;
  --color-ledger-bad: #e06a5a;
```

### 4.4 `portfolio/src/pages/LedgerLens/theme.css`

```css
/* Ledger Lens — demo-scoped dark chrome. Color tokens live in index.css
   @theme (ledger-*); this sheet carries what utilities can't: color-scheme,
   selection, focus, the body wash, the small-caps label, and the streaming
   skeleton shimmer. Every animation has a reduced-motion out. */
.ledger-root {
  color-scheme: dark;
  font-family: var(--font-sans);
}
.ledger-root ::selection {
  background: var(--color-ledger-mint);
  color: var(--color-ledger-bg);
}
.ledger-root :focus-visible {
  outline: 2px solid var(--color-ledger-mint);
  outline-offset: 2px;
  border-radius: 3px;
}

/* The demo owns the whole viewport — swapping the body color too means
   overscroll rubber-banding never flashes the portfolio's paper. */
body.ledger-page {
  background-color: var(--color-ledger-bg);
}

/* Small-caps mono label — the ledger twin of the portfolio's .annotation. */
.ledger-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ledger-muted);
}

/* Tabular numerals for every money column — receipts must align on the decimal. */
.ledger-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

/* Streaming skeleton shimmer — a light sweep across a dim block. */
.ledger-skel {
  position: relative;
  overflow: hidden;
  background: var(--color-ledger-card-2);
  border-radius: 4px;
}
.ledger-skel::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 0.06),
    transparent
  );
  animation: ledger-shimmer 1.2s var(--ease-out) infinite;
}
@keyframes ledger-shimmer {
  to { transform: translateX(100%); }
}

/* A cell the model was unsure about — dashed amber underline until confirmed. */
.ledger-flagged {
  text-decoration: underline dashed var(--color-ledger-flag);
  text-underline-offset: 3px;
}

/* Row enters when a line item resolves from the stream. */
.ledger-row-in {
  animation: fade-in-up var(--t-enter) var(--ease-out) both;
}

/* The "reading → structuring" status dot pulses only while working. */
.ledger-pulse {
  animation: ledger-pulse 1.1s ease-in-out infinite;
}
@keyframes ledger-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ledger-skel::after { animation: none; }
  .ledger-row-in { animation: none; }
  .ledger-pulse { animation: none; opacity: 1; }
}
```

---

## 5 · Router + App + Range integration

### 5.1 Router — no change required

`portfolio/src/lib/router.ts` already parses `#/demos/<slug>(?query)?` into `demoSlug`.
`ledger-lens` matches the existing `[a-z0-9-]+` pattern. Do **not** edit the router.

### 5.2 App — two additions to `portfolio/src/App.tsx`

**(a)** Add the lazy import, next to the other demo imports (after the Meridian line 17):

```tsx
const LedgerLens = lazy(() => import('./pages/LedgerLens'))
```

**(b)** Add the `DEMO_PAGES` entry (inside the existing `DEMO_PAGES` object, after the
`meridian` entry):

```tsx
  'ledger-lens': {
    Page: LedgerLens,
    label: 'Ledger Lens receipt extractor demo',
    shell: 'bg-ledger-bg',
    spinner: 'text-ledger-muted',
  },
```

Nothing else in `App.tsx` changes — the standalone Suspense render, spinner, and body handling
are already generic.

### 5.3 Range — additions to `portfolio/src/components/Range.tsx`

**(a)** Add the commission object to the `COMMISSIONS` array (after the Meridian `'02'` object):

```tsx
  {
    n: '03',
    skill: 'AI-native product',
    title: 'Ledger Lens — AI receipt & invoice extractor',
    caption:
      'Drop a receipt photo (or pick one of three procedurally rendered examples) and watch Claude read it: a streaming "reading → structuring" pass fills an editable table with line items, per-field confidence, and derived totals it recomputes rather than trusts. Vision + a strict JSON schema, the Anthropic key held server-side in a rate-limited Supabase Edge Function — your key never touches the browser.',
    href: '#/demos/ledger-lens',
  },
```

**(b)** Register the thumbnail in the `THUMBS` map (replace the existing line 65):

```tsx
const THUMBS: Record<string, () => ReactNode> = { '01': AeroThumb, '02': MeridianThumb, '03': LedgerThumb }
```

**(c)** Add the hand-drawn miniature component (place it beside `MeridianThumb`/`AeroThumb`).
This is a complete, paste-ready SVG — a warm-dark receipt with a mint "verified" check, torn
bottom edge, and skeleton line rows, echoing the demo's palette:

```tsx
/** A miniature of a receipt being read — warm dark, cream slip, a mint check. */
function LedgerThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0d0c0a" />
      {/* the receipt slip, faintly tilted, with a torn/zigzag bottom */}
      <g transform="rotate(-3 140 80)">
        <path
          d="M 96 26 H 184 V 118
             l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5
             l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5 Z"
          fill="#f4efe2"
        />
        {/* merchant header bar */}
        <rect x="112" y="34" width="56" height="7" rx="2" fill="#211b12" />
        <rect x="120" y="45" width="40" height="4" rx="2" fill="#9a8f78" />
        {/* dashed rule */}
        <line x1="104" y1="56" x2="176" y2="56" stroke="#c9bfa6" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* line-item rows: description + amount */}
        {[62, 72, 82, 92].map((y, i) => (
          <g key={y}>
            <rect x="104" y={y} width={40 - i * 4} height="4" rx="2" fill="#5c5340" />
            <rect x={168 - 16} y={y} width="16" height="4" rx="2" fill="#211b12" />
          </g>
        ))}
        {/* dashed rule + total row (mint = verified/total) */}
        <line x1="104" y1="102" x2="176" y2="102" stroke="#c9bfa6" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="104" y="108" width="24" height="5" rx="2" fill="#211b12" />
        <rect x="150" y="108" width="26" height="5" rx="2" fill="#2f7a4f" />
      </g>
      {/* the "lens" — a mint verified check ringing the total */}
      <circle cx="196" cy="118" r="15" fill="#0d0c0a" stroke="#58c98a" strokeWidth="2.5" />
      <polyline
        points="189,118 194,123 204,112"
        fill="none"
        stroke="#58c98a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

The `Range` component's `{COMMISSIONS.length} commission{…}` counter, card layout, gold skill
tag, Fraunces title, accent button, and `plate-lift` thumbnail all already render `'03'`
automatically once the entry + thumb exist. No other Range edits.

---

## 6 · Data model, the JSON schema, and the canvas receipt-generator

### 6.1 `portfolio/src/pages/LedgerLens/schema.ts`

The extraction contract. **Document header fields (`merchant`, `date`, `currency`) and totals
carry per-field confidence** (`{ value, confidence }`). **Line items carry a row confidence
plus an `uncertain` array** naming which of the row's own fields the model was unsure about —
this is the compact form of "confidence per field" that a cheap model can reliably produce for
up to ~20 rows (see §17 note on the schema decision). Category is an enum. `confidence` is
`0..1`.

```ts
// Ledger Lens — extraction contract, the JSON schema sent to Claude, and the
// derive/validate helpers. Totals are DERIVED here, never trusted from the model.

export const CATEGORIES = [
  'food_drink',
  'supplies',
  'hardware',
  'software',
  'services',
  'tax',
  'fee',
  'shipping',
  'other',
] as const
export type Category = (typeof CATEGORIES)[number]

/** Fields of a line item that can be individually flagged as low-confidence. */
export const LINE_FIELDS = ['description', 'qty', 'unitPrice', 'amount', 'category'] as const
export type LineField = (typeof LINE_FIELDS)[number]

/** A confident scalar — value plus the model's 0..1 confidence in it. */
export interface Confident<T> {
  value: T
  confidence: number
}

export interface RawLineItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
  category: Category
  confidence: number
  /** Which of this row's own fields the model is unsure about. */
  uncertain: LineField[]
}

/** Exactly what the model returns (shape guaranteed by output_config.format). */
export interface RawExtraction {
  merchant: Confident<string>
  date: Confident<string> // ISO-8601 date, or best-effort string
  currency: Confident<string> // ISO-4217, e.g. "USD"
  lineItems: RawLineItem[]
  subtotal: Confident<number>
  tax: Confident<number>
  total: Confident<number>
}

/** Confidence below this flags a field for the visitor to confirm. */
export const LOW_CONFIDENCE = 0.75

/** Money values within this absolute tolerance are considered equal. */
export const MONEY_EPS = 0.01

/* ---- The JSON schema handed to Claude via output_config.format ----
   NOTE: structured outputs does NOT support minimum/maximum/minLength — range
   checks happen client-side. additionalProperties:false + required on every
   object is required by structured outputs. */
export const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    merchant: {
      type: 'object',
      additionalProperties: false,
      properties: {
        value: { type: 'string', description: 'Merchant / vendor name as printed.' },
        confidence: { type: 'number', description: '0..1 confidence.' },
      },
      required: ['value', 'confidence'],
    },
    date: {
      type: 'object',
      additionalProperties: false,
      properties: {
        value: { type: 'string', description: 'Transaction date, ISO-8601 (YYYY-MM-DD) if possible.' },
        confidence: { type: 'number' },
      },
      required: ['value', 'confidence'],
    },
    currency: {
      type: 'object',
      additionalProperties: false,
      properties: {
        value: { type: 'string', description: 'ISO-4217 currency code, e.g. USD, EUR, GBP.' },
        confidence: { type: 'number' },
      },
      required: ['value', 'confidence'],
    },
    lineItems: {
      type: 'array',
      description: 'One entry per purchased line item. Do not include subtotal/tax/total rows here.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          qty: { type: 'number', description: 'Quantity; use 1 if not printed.' },
          unitPrice: { type: 'number', description: 'Price per unit in the receipt currency.' },
          amount: { type: 'number', description: 'Line total as printed (qty × unitPrice).' },
          category: { type: 'string', enum: CATEGORIES as unknown as string[] },
          confidence: { type: 'number', description: '0..1 overall confidence for this row.' },
          uncertain: {
            type: 'array',
            description: 'Names of this row’s fields you are unsure about.',
            items: { type: 'string', enum: LINE_FIELDS as unknown as string[] },
          },
        },
        required: ['description', 'qty', 'unitPrice', 'amount', 'category', 'confidence', 'uncertain'],
      },
    },
    subtotal: {
      type: 'object',
      additionalProperties: false,
      properties: { value: { type: 'number' }, confidence: { type: 'number' } },
      required: ['value', 'confidence'],
    },
    tax: {
      type: 'object',
      additionalProperties: false,
      properties: { value: { type: 'number' }, confidence: { type: 'number' } },
      required: ['value', 'confidence'],
    },
    total: {
      type: 'object',
      additionalProperties: false,
      properties: { value: { type: 'number' }, confidence: { type: 'number' } },
      required: ['value', 'confidence'],
    },
  },
  required: ['merchant', 'date', 'currency', 'lineItems', 'subtotal', 'tax', 'total'],
} as const

/* ---- Editable table model (what the UI holds after finalize) ---- */

export interface EditLine {
  id: string
  description: string
  qty: number
  unitPrice: number
  /** Amount the model returned (kept so we can flag math mismatches). */
  modelAmount: number
  category: Category
  confidence: number
  uncertain: LineField[]
  /** Fields the visitor has explicitly confirmed (clears the flag). */
  confirmed: LineField[]
}

export interface EditModel {
  merchant: string
  date: string
  currency: string
  lines: EditLine[]
  modelSubtotal: number
  tax: number
  modelTotal: number
  /** Header/total confidences, kept for badges. */
  conf: { merchant: number; date: number; currency: number; subtotal: number; tax: number; total: number }
}

let _uid = 0
const uid = () => `ln_${(_uid++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`

/** Coerce anything to a finite number (model may return strings). */
export function num(x: unknown): number {
  const n = typeof x === 'string' ? parseFloat(x.replace(/[^0-9.\-]/g, '')) : Number(x)
  return Number.isFinite(n) ? n : 0
}

/** Round to cents to kill float drift before comparisons/exports. */
export const cents = (n: number) => Math.round(n * 100) / 100

/** Derived amount for a row — we compute, never trust the model's arithmetic. */
export const lineAmount = (l: Pick<EditLine, 'qty' | 'unitPrice'>) => cents(l.qty * l.unitPrice)

/** Derived subtotal = Σ derived line amounts. */
export const derivedSubtotal = (lines: EditLine[]) => cents(lines.reduce((s, l) => s + lineAmount(l), 0))

/** Derived total = derived subtotal + tax. */
export const derivedTotal = (lines: EditLine[], tax: number) => cents(derivedSubtotal(lines) + tax)

/** True when the model's amount for a row disagrees with qty × unitPrice. */
export const rowMismatch = (l: EditLine) => Math.abs(lineAmount(l) - cents(l.modelAmount)) > MONEY_EPS

/** Is a field flagged? Low model confidence OR (for totals) a derived mismatch, unless confirmed. */
export function fieldFlagged(l: EditLine, f: LineField): boolean {
  if (l.confirmed.includes(f)) return false
  if (l.uncertain.includes(f)) return true
  if (f === 'amount' && rowMismatch(l)) return true
  return false
}

/** Build the editable model from a validated RawExtraction. */
export function toEditModel(raw: RawExtraction): EditModel {
  return {
    merchant: raw.merchant.value,
    date: raw.date.value,
    currency: (raw.currency.value || 'USD').toUpperCase().slice(0, 3),
    tax: cents(num(raw.tax.value)),
    modelSubtotal: cents(num(raw.subtotal.value)),
    modelTotal: cents(num(raw.total.value)),
    conf: {
      merchant: raw.merchant.confidence,
      date: raw.date.confidence,
      currency: raw.currency.confidence,
      subtotal: raw.subtotal.confidence,
      tax: raw.tax.confidence,
      total: raw.total.confidence,
    },
    lines: raw.lineItems.map((li) => ({
      id: uid(),
      description: li.description,
      qty: num(li.qty) || 1,
      unitPrice: cents(num(li.unitPrice)),
      modelAmount: cents(num(li.amount)),
      category: (CATEGORIES as readonly string[]).includes(li.category) ? li.category : 'other',
      confidence: li.confidence,
      uncertain: Array.isArray(li.uncertain) ? li.uncertain.filter((u) => (LINE_FIELDS as readonly string[]).includes(u)) : [],
      confirmed: [],
    })),
  }
}

/** A fresh empty row for the "add row" affordance. */
export function blankLine(): EditLine {
  return {
    id: uid(),
    description: '',
    qty: 1,
    unitPrice: 0,
    modelAmount: 0,
    category: 'other',
    confidence: 1,
    uncertain: [],
    confirmed: ['description', 'qty', 'unitPrice', 'amount', 'category'],
  }
}

/** Validate a parsed object is shaped like a RawExtraction (final gate before finalize). */
export function isRawExtraction(x: unknown): x is RawExtraction {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const conf = (v: unknown) => !!v && typeof v === 'object' && 'value' in (v as object) && 'confidence' in (v as object)
  return (
    conf(o.merchant) &&
    conf(o.date) &&
    conf(o.currency) &&
    conf(o.subtotal) &&
    conf(o.tax) &&
    conf(o.total) &&
    Array.isArray(o.lineItems)
  )
}
```

### 6.2 `portfolio/src/pages/LedgerLens/schema.assert.ts`

Dev-only invariant asserts on the example receipt specs (mirrors AeroScale's
`data.assert.ts`). Imported dynamically from `receipts.ts` under `import.meta.env?.DEV`.

```ts
import type { ReceiptSpec } from './receipts'
import { cents } from './schema'

/** The example specs' printed math must be internally consistent — otherwise the
 *  "recompute and flag mismatches" story would fire on our own examples. Dev only. */
export function assertReceipts(specs: ReceiptSpec[]): void {
  const errs: string[] = []
  const fail = (m: string) => errs.push(`  · ${m}`)

  const ids = new Set<string>()
  for (const s of specs) {
    if (ids.has(s.id)) fail(`duplicate example id ${s.id}`)
    ids.add(s.id)
    if (!s.items.length) fail(`${s.id}: no line items`)

    let sub = 0
    for (const it of s.items) {
      const amt = cents(it.qty * it.unitPrice)
      if (Math.abs(amt - cents(it.amount)) > 0.01) fail(`${s.id}: "${it.description}" amount ${it.amount} ≠ qty×unit ${amt}`)
      sub += amt
    }
    sub = cents(sub)
    if (Math.abs(sub - cents(s.subtotal)) > 0.01) fail(`${s.id}: subtotal ${s.subtotal} ≠ Σ items ${sub}`)
    if (Math.abs(cents(s.subtotal + s.tax) - cents(s.total)) > 0.01) fail(`${s.id}: total ${s.total} ≠ subtotal+tax`)
  }

  if (errs.length) throw new Error(`Ledger Lens example specs failed:\n${errs.join('\n')}`)
}
```

### 6.3 `portfolio/src/pages/LedgerLens/receipts.ts`

Procedural canvas receipt renderer + the three examples. Deterministic (mulberry32) so the
rendered pixels are identical across devices — the same canvas is displayed **and** sent to the
vision call. No downloaded assets.

```ts
import { mulberry32 } from '../../lib/rand'
import type { Category } from './schema'
import { cents } from './schema'

export interface ReceiptItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
  category: Category
}

export interface ReceiptSpec {
  id: string
  kind: 'coffee' | 'hardware' | 'saas'
  label: string // picker caption
  merchant: string
  address: string[]
  date: string // printed on the receipt
  currency: string
  currencySymbol: string
  seed: number
  items: ReceiptItem[]
  subtotal: number
  tax: number
  total: number
  footer: string
}

/** Build a spec, computing subtotal/tax/total from the items so they always agree. */
function spec(base: Omit<ReceiptSpec, 'subtotal' | 'tax' | 'total'> & { taxRate: number }): ReceiptSpec {
  const subtotal = cents(base.items.reduce((s, i) => s + i.amount, 0))
  const tax = cents(subtotal * base.taxRate)
  const { taxRate: _drop, ...rest } = base
  return { ...rest, subtotal, tax, total: cents(subtotal + tax) }
}

export const EXAMPLES: ReceiptSpec[] = [
  spec({
    id: 'coffee',
    kind: 'coffee',
    label: 'Coffee shop',
    merchant: 'THE DAILY GRIND',
    address: ['142 Maple Street', 'Portland, OR 97204', '(503) 555-0148'],
    date: '2026-06-12',
    currency: 'USD',
    currencySymbol: '$',
    seed: 71,
    taxRate: 0.0,
    items: [
      { description: 'Cappuccino (L)', qty: 2, unitPrice: 4.75, amount: 9.5, category: 'food_drink' },
      { description: 'Oat milk add', qty: 2, unitPrice: 0.75, amount: 1.5, category: 'food_drink' },
      { description: 'Almond croissant', qty: 1, unitPrice: 3.95, amount: 3.95, category: 'food_drink' },
      { description: 'Drip coffee', qty: 1, unitPrice: 2.5, amount: 2.5, category: 'food_drink' },
    ],
    footer: 'THANK YOU — SEE YOU TOMORROW',
  }),
  spec({
    id: 'hardware',
    kind: 'hardware',
    label: 'Hardware store',
    merchant: 'FORT & BOLT HARDWARE',
    address: ['88 Industrial Way', 'Oakland, CA 94607', 'Reg 04  Cashier: JAY'],
    date: '2026-05-29',
    currency: 'USD',
    currencySymbol: '$',
    seed: 204,
    taxRate: 0.0925,
    items: [
      { description: '2x4 Pine Stud 8ft', qty: 6, unitPrice: 4.28, amount: 25.68, category: 'hardware' },
      { description: 'Wood screws #8 1lb', qty: 2, unitPrice: 7.49, amount: 14.98, category: 'hardware' },
      { description: 'Wall anchors 20pk', qty: 1, unitPrice: 5.99, amount: 5.99, category: 'hardware' },
      { description: 'Painter tape 1.5in', qty: 3, unitPrice: 6.25, amount: 18.75, category: 'supplies' },
      { description: 'Shop rag 12pk', qty: 1, unitPrice: 9.99, amount: 9.99, category: 'supplies' },
    ],
    footer: 'RETURNS WITHIN 30 DAYS W/ RECEIPT',
  }),
  spec({
    id: 'saas',
    kind: 'saas',
    label: 'SaaS invoice',
    merchant: 'NIMBUS CLOUD, INC.',
    address: ['Invoice #NC-20268841', 'Billing: acct@nimbus.dev', 'Net 30'],
    date: '2026-06-01',
    currency: 'USD',
    currencySymbol: '$',
    seed: 913,
    taxRate: 0.0,
    items: [
      { description: 'Team plan (5 seats)', qty: 5, unitPrice: 18.0, amount: 90.0, category: 'software' },
      { description: 'Extra storage 500GB', qty: 1, unitPrice: 25.0, amount: 25.0, category: 'software' },
      { description: 'Priority support', qty: 1, unitPrice: 49.0, amount: 49.0, category: 'services' },
      { description: 'Overage: API calls', qty: 12, unitPrice: 2.5, amount: 30.0, category: 'fee' },
    ],
    footer: 'AUTO-CHARGED TO CARD ON FILE',
  }),
]

/**
 * Render a receipt spec onto a canvas element at the given CSS width. The look is
 * a thermal slip photographed on a dark surface: cream paper, mono ink, dashed
 * rules, a faint per-seed jitter so it reads as "real". Deterministic.
 * Returns the pixel height used (CSS px) so callers can size wrappers.
 */
export function renderReceipt(canvas: HTMLCanvasElement, s: ReceiptSpec, cssWidth = 300): number {
  const rnd = mulberry32(s.seed)
  const pad = 18
  const rowH = 26
  const headH = 96
  const totH = 92
  const bodyH = s.items.length * rowH
  const cssHeight = headH + bodyH + totH
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)

  canvas.width = Math.round(cssWidth * dpr)
  canvas.height = Math.round(cssHeight * dpr)
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return cssHeight
  ctx.scale(dpr, dpr)

  // Paper.
  ctx.fillStyle = '#f6f1e6'
  ctx.fillRect(0, 0, cssWidth, cssHeight)
  // Faint grain from the seed so it isn't a flat field.
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(70,60,40,${0.015 + rnd() * 0.02})`
    ctx.fillRect(rnd() * cssWidth, rnd() * cssHeight, 1, 1)
  }

  const ink = '#20180c'
  const faint = '#7a6f57'
  const cx = cssWidth / 2
  const right = cssWidth - pad
  const mono = (px: number, w = 400) => `${w} ${px}px ui-monospace, "SF Mono", Menlo, monospace`

  // Merchant header.
  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  ctx.font = mono(15, 700)
  ctx.fillText(s.merchant, cx, 30)
  ctx.font = mono(9.5, 400)
  ctx.fillStyle = faint
  s.address.forEach((line, i) => ctx.fillText(line, cx, 46 + i * 12))
  ctx.fillStyle = ink
  ctx.font = mono(10, 400)
  ctx.fillText(`${s.date}   ${new Date().getHours().toString().padStart(2, '0')}:${(Math.floor(rnd() * 60)).toString().padStart(2, '0')}`, cx, 84)

  const dashRule = (y: number) => {
    ctx.strokeStyle = faint
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(right, y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  dashRule(headH - 8)

  // Line items.
  ctx.font = mono(11, 400)
  ctx.fillStyle = ink
  s.items.forEach((it, i) => {
    const y = headH + 10 + i * rowH
    ctx.textAlign = 'left'
    ctx.fillText(it.description, pad, y)
    ctx.textAlign = 'right'
    ctx.fillText(`${s.currencySymbol}${it.amount.toFixed(2)}`, right, y)
    ctx.textAlign = 'left'
    ctx.fillStyle = faint
    ctx.font = mono(9, 400)
    ctx.fillText(`${it.qty} @ ${s.currencySymbol}${it.unitPrice.toFixed(2)}`, pad, y + 11)
    ctx.fillStyle = ink
    ctx.font = mono(11, 400)
  })

  // Totals block.
  let ty = headH + bodyH + 16
  dashRule(ty - 8)
  const money = (label: string, val: number, bold = false) => {
    ctx.font = mono(bold ? 13 : 11, bold ? 700 : 400)
    ctx.fillStyle = ink
    ctx.textAlign = 'left'
    ctx.fillText(label, pad, ty)
    ctx.textAlign = 'right'
    ctx.fillText(`${s.currencySymbol}${val.toFixed(2)}`, right, ty)
    ty += bold ? 24 : 18
  }
  money('Subtotal', s.subtotal)
  if (s.tax > 0) money('Tax', s.tax)
  money('TOTAL', s.total, true)

  ctx.textAlign = 'center'
  ctx.fillStyle = faint
  ctx.font = mono(9, 400)
  ctx.fillText(s.footer, cx, ty + 4)

  return cssHeight
}

/** JPEG data URL of the rendered receipt — the exact bytes sent to the vision call. */
export function receiptDataUrl(s: ReceiptSpec, cssWidth = 300): string {
  const c = document.createElement('canvas')
  renderReceipt(c, s, cssWidth)
  return c.toDataURL('image/jpeg', 0.9)
}

// Dev-only invariant check on the specs (never bundled in prod).
if (import.meta.env?.DEV) {
  import('./schema.assert').then(({ assertReceipts }) => assertReceipts(EXAMPLES)).catch(() => {})
}
```

---

## 7 · Components in dependency order (complete paste-ready code)

Dependency order: `format.ts` → `partialJson.ts` → `export.ts` → `useExtraction.ts` →
`SkeletonRows.tsx` → `ConfidenceMeter.tsx` → `Dropzone.tsx` → `ExamplePicker.tsx` →
`ResultsTable.tsx` → `index.tsx`.

### 7.1 `portfolio/src/pages/LedgerLens/format.ts`

```ts
/** Money in the receipt's currency; falls back to a bare number if the code is odd. */
export function fmtMoney(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase().slice(0, 3),
    }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

export const fmtPct = (x: number) => `${Math.round(x * 100)}%`

/** A human date if parseable, else the raw string the model returned. */
export function fmtDate(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s || '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
```

### 7.2 `portfolio/src/pages/LedgerLens/partialJson.ts`

Tolerant partial-JSON parser. Best-effort: used only to fill skeleton rows *during* streaming;
the final `JSON.parse` on `message_stop` is authoritative. Single pass records the last
"safe" cut point (a completed value at object/array depth ≥ 1), then closes open brackets.

```ts
/**
 * Parse the largest valid prefix of a partial JSON string. Returns null if nothing
 * parseable yet. Not exact — preview only; finalize re-parses the complete buffer.
 */
export function tryParsePartial(src: string): unknown | null {
  const start = src.indexOf('{')
  if (start < 0) return null
  const s = src.slice(start)

  const stack: string[] = [] // expected closers, e.g. '}' ']'
  let inStr = false
  let esc = false
  let safeCut = -1 // index+1 after a completed value at depth >= 1

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') {
        inStr = false
        if (stack.length) safeCut = i + 1 // string value/key just closed
      }
      continue
    }
    if (ch === '"') {
      inStr = true
      continue
    }
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') {
      stack.pop()
      if (stack.length) safeCut = i + 1 // nested container just closed
    } else if (/[0-9truefalsn]/i.test(ch)) {
      // number / true / false / null char; treat the char after as a potential boundary
      if (stack.length && (i + 1 >= s.length || /[,}\]\s]/.test(s[i + 1]))) safeCut = i + 1
    }
  }

  // Try the whole buffer closed first (fast path for a complete object).
  const attempts: string[] = []
  attempts.push(closeAt(s, s.length, inStr, stack))
  if (safeCut > 0 && safeCut < s.length) attempts.push(closeAt(s, safeCut, false, depthAt(s, safeCut)))

  for (const cand of attempts) {
    try {
      return JSON.parse(cand)
    } catch {
      /* keep trying */
    }
  }
  return null
}

/** Bracket stack implied by the first `n` chars of `s` (used for the safe-cut attempt). */
function depthAt(s: string, n: number): string[] {
  const stack: string[] = []
  let inStr = false
  let esc = false
  for (let i = 0; i < n; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }
  return stack
}

/** Build a closeable candidate from s[0..n): close a dangling string, strip a trailing
 *  comma/colon, then append the needed closers. */
function closeAt(s: string, n: number, inStr: boolean, stack: string[]): string {
  let out = s.slice(0, n)
  if (inStr) out += '"'
  out = out.replace(/[,\s]+$/, '')
  out = out.replace(/:\s*$/, ':null')
  // If the last non-space is a dangling key (`"foo"` with no colon/value), drop it.
  out = out.replace(/,?\s*"[^"]*"\s*$/, (m) => (/:/.test(m) ? m : ''))
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i]
  return out
}
```

### 7.3 `portfolio/src/pages/LedgerLens/export.ts`

```ts
import type { EditModel } from './schema'
import { lineAmount, derivedSubtotal, derivedTotal } from './schema'

/** RFC-4180-ish CSV cell quoting. */
function q(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Export uses DERIVED amounts/subtotal/total — the numbers the visitor actually sees. */
export function toCSV(m: EditModel): string {
  const rows: string[] = []
  rows.push(['merchant', 'date', 'currency'].join(','))
  rows.push([q(m.merchant), q(m.date), q(m.currency)].join(','))
  rows.push('')
  rows.push(['description', 'qty', 'unitPrice', 'amount', 'category'].join(','))
  for (const l of m.lines) {
    rows.push([q(l.description), l.qty, l.unitPrice.toFixed(2), lineAmount(l).toFixed(2), q(l.category)].join(','))
  }
  rows.push('')
  rows.push(['subtotal', derivedSubtotal(m.lines).toFixed(2)].join(','))
  rows.push(['tax', m.tax.toFixed(2)].join(','))
  rows.push(['total', derivedTotal(m.lines, m.tax).toFixed(2)].join(','))
  return rows.join('\n')
}

export function toJSON(m: EditModel): string {
  return JSON.stringify(
    {
      merchant: m.merchant,
      date: m.date,
      currency: m.currency,
      lineItems: m.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        amount: lineAmount(l),
        category: l.category,
      })),
      subtotal: derivedSubtotal(m.lines),
      tax: m.tax,
      total: derivedTotal(m.lines, m.tax),
    },
    null,
    2,
  )
}

export function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
```

### 7.4 `portfolio/src/pages/LedgerLens/useExtraction.ts`

The streaming extraction hook: POSTs to the Edge Function, reads the SSE stream, drives the
`reading → structuring → done` phase machine, exposes a live `partial` for skeleton fill, and
finalizes with validate + build-edit-model. Handles 429 (rate-limited), network drops, abort,
and Anthropic error events.

```ts
import { useCallback, useRef, useState } from 'react'
import { isRawExtraction, toEditModel, type EditModel, type RawExtraction } from './schema'
import { tryParsePartial } from './partialJson'

/** Set at build time via Vite env; falls back to same-origin /functions path in dev proxy. */
const ENDPOINT =
  (import.meta.env?.VITE_LEDGER_FN_URL as string | undefined) ??
  'https://YOUR-PROJECT-REF.functions.supabase.co/extract'

export type Phase = 'idle' | 'reading' | 'structuring' | 'done' | 'error'

export type ExtractInput = { mode: 'image'; dataUrl: string } | { mode: 'text'; text: string }

export interface ExtractionState {
  phase: Phase
  partial: unknown | null // best-effort parse of the in-flight JSON (skeleton fill)
  approxRows: number // rows seen so far in the stream (skeleton count)
  result: EditModel | null
  error: string | null
  rateLimited: boolean
}

const INITIAL: ExtractionState = {
  phase: 'idle',
  partial: null,
  approxRows: 0,
  result: null,
  error: null,
  rateLimited: false,
}

export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(INITIAL)
  }, [])

  const start = useCallback(async (input: ExtractInput) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setState({ ...INITIAL, phase: 'reading' })

    // Strip the data-URL prefix for image mode; the function expects raw base64 + media type.
    const body =
      input.mode === 'image'
        ? {
            mode: 'image',
            mediaType: input.dataUrl.slice(5, input.dataUrl.indexOf(';')) || 'image/jpeg',
            data: input.dataUrl.slice(input.dataUrl.indexOf(',') + 1),
          }
        : { mode: 'text', text: input.text }

    let res: Response
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
    } catch {
      setState((s) => ({ ...s, phase: 'error', error: 'Network error — could not reach the extractor.' }))
      return
    }

    if (res.status === 429) {
      setState((s) => ({ ...s, phase: 'error', rateLimited: true, error: 'Rate limit reached — try again in a minute.' }))
      return
    }
    if (!res.ok || !res.body) {
      const msg = await safeText(res)
      setState((s) => ({ ...s, phase: 'error', error: msg || `Extractor error (${res.status}).` }))
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = '' // raw SSE buffer
    let json = '' // accumulated model JSON text
    let sawText = false

    const pump = async (): Promise<void> => {
      for (;;) {
        let chunk: ReadableStreamReadResult<Uint8Array>
        try {
          chunk = await reader.read()
        } catch {
          setState((s) => ({ ...s, phase: 'error', error: 'Connection dropped mid-stream.' }))
          return
        }
        if (chunk.done) break
        buf += decoder.decode(chunk.value, { stream: true })

        // SSE frames are separated by a blank line.
        let sep: number
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, sep)
          buf = buf.slice(sep + 2)
          const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
          if (!dataLine) continue
          const payload = dataLine.slice(5).trim()
          if (!payload || payload === '[DONE]') continue

          let ev: AnthropicEvent
          try {
            ev = JSON.parse(payload)
          } catch {
            continue
          }

          if (ev.type === 'error') {
            setState((s) => ({ ...s, phase: 'error', error: ev.error?.message || 'The model returned an error.' }))
            return
          }
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
            json += ev.delta.text
            if (!sawText) sawText = true
            const partial = tryParsePartial(json)
            const rows = countRows(partial)
            setState((s) => ({ ...s, phase: 'structuring', partial, approxRows: Math.max(s.approxRows, rows) }))
          }
          if (ev.type === 'message_stop') {
            finalize(json, setState)
            return
          }
        }
      }
      // Stream ended without an explicit message_stop — finalize what we have.
      finalize(json, setState)
    }

    void pump()
  }, [])

  return { state, start, reset }
}

function finalize(json: string, setState: React.Dispatch<React.SetStateAction<ExtractionState>>) {
  let parsed: unknown
  try {
    parsed = JSON.parse(json.trim())
  } catch {
    // Last resort: try the tolerant parser on the full buffer.
    parsed = tryParsePartial(json)
  }
  if (!isRawExtraction(parsed)) {
    setState((s) => ({ ...s, phase: 'error', error: 'Could not read a receipt from that input. Try a clearer image or an example.' }))
    return
  }
  setState((s) => ({ ...s, phase: 'done', partial: parsed, result: toEditModel(parsed as RawExtraction) }))
}

function countRows(partial: unknown): number {
  const li = (partial as { lineItems?: unknown })?.lineItems
  return Array.isArray(li) ? li.length : 0
}

async function safeText(res: Response): Promise<string> {
  try {
    const j = await res.json()
    return (j as { error?: string })?.error ?? ''
  } catch {
    return ''
  }
}

interface AnthropicEvent {
  type: string
  delta?: { type?: string; text?: string }
  error?: { message?: string }
}
```

### 7.5 `portfolio/src/pages/LedgerLens/SkeletonRows.tsx`

```tsx
/** Streaming skeleton — dim shimmering rows shown while the model reads/structures.
 *  `count` grows as line items resolve from the stream. */
export function SkeletonRows({ count }: { count: number }) {
  const n = Math.max(3, Math.min(count || 0, 12))
  return (
    <div className="mt-4 space-y-2" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="grid grid-cols-[1fr_4rem_5rem_5rem] items-center gap-3">
          <div className="ledger-skel h-4" style={{ width: `${60 + ((i * 37) % 35)}%` }} />
          <div className="ledger-skel h-4" />
          <div className="ledger-skel h-4" />
          <div className="ledger-skel h-4" />
        </div>
      ))}
    </div>
  )
}
```

### 7.6 `portfolio/src/pages/LedgerLens/ConfidenceMeter.tsx`

```tsx
import { fmtPct } from './format'

/** Document-level confidence indicator. Green when high, amber when the visitor
 *  should double-check. Purely visual + an aria-label for the value. */
export function ConfidenceMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value))
  const low = v < 0.75
  const color = low ? 'var(--color-ledger-flag)' : 'var(--color-ledger-mint)'
  return (
    <div className="flex items-center gap-2" aria-label={`Overall extraction confidence ${fmtPct(v)}`}>
      <span className="ledger-label">Confidence</span>
      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-ledger-card-2">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${v * 100}%`, background: color }} />
      </span>
      <span className="ledger-num text-xs" style={{ color }}>
        {fmtPct(v)}
      </span>
    </div>
  )
}
```

### 7.7 `portfolio/src/pages/LedgerLens/Dropzone.tsx`

Upload (image) + paste (text/CSV). Handles drag-drop, file picker, paste-image, and a textarea
for messy text/CSV. Guards oversize inputs client-side (a friendly message before the request).

```tsx
import { useCallback, useRef, useState } from 'react'
import type { ExtractInput } from './useExtraction'

const MAX_IMAGE_BYTES = 4_500_000 // ~4.5MB raw file; base64 stays under the 5MB function cap
const MAX_TEXT_CHARS = 12_000

export function Dropzone({ onSubmit, disabled }: { onSubmit: (i: ExtractInput) => void; disabled: boolean }) {
  const [mode, setMode] = useState<'image' | 'text'>('image')
  const [drag, setDrag] = useState(false)
  const [text, setText] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const takeFile = useCallback(
    (file: File) => {
      setNote(null)
      if (!file.type.startsWith('image/')) {
        setNote('That file is not an image. Use a photo of a receipt, or paste text below.')
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setNote('That image is over 4.5 MB. Try a smaller photo.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => onSubmit({ mode: 'image', dataUrl: String(reader.result) })
      reader.onerror = () => setNote('Could not read that file.')
      reader.readAsDataURL(file)
    },
    [onSubmit],
  )

  const submitText = () => {
    const t = text.trim()
    if (!t) return setNote('Paste some receipt text or CSV first.')
    if (t.length > MAX_TEXT_CHARS) return setNote(`That paste is too long (${t.length} chars). Trim to under ${MAX_TEXT_CHARS}.`)
    setNote(null)
    onSubmit({ mode: 'text', text: t })
  }

  return (
    <div className="rounded-xl border border-ledger-line bg-ledger-card p-5">
      <div className="mb-4 flex gap-1" role="tablist" aria-label="Input mode">
        {(['image', 'text'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m ? 'bg-ledger-card-2 text-ledger-ink' : 'text-ledger-muted hover:text-ledger-ink'
            }`}
          >
            {m === 'image' ? 'Upload photo' : 'Paste text / CSV'}
          </button>
        ))}
      </div>

      {mode === 'image' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files?.[0]
            if (f) takeFile(f)
          }}
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files)[0]
            if (f) takeFile(f)
          }}
          className={`grid place-items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            drag ? 'border-ledger-mint bg-ledger-card-2' : 'border-ledger-line'
          }`}
        >
          <p className="text-sm text-ledger-ink-2">
            Drop a receipt photo, paste an image, or{' '}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="font-semibold text-ledger-mint underline underline-offset-2 disabled:opacity-50"
            >
              choose a file
            </button>
            .
          </p>
          <p className="ledger-label mt-2">JPEG / PNG · up to 4.5 MB · nothing is stored</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) takeFile(f)
              e.target.value = ''
            }}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="ll-paste" className="ledger-label">
            Messy receipt text or CSV
          </label>
          <textarea
            id="ll-paste"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={'THE DAILY GRIND\nCappuccino L  2  4.75  9.50\nCroissant  1  3.95  3.95\nTOTAL 13.45'}
            className="ledger-num mt-2 w-full resize-y rounded-lg border border-ledger-line bg-ledger-card-2 p-3 text-sm text-ledger-ink placeholder:text-ledger-muted"
          />
          <button
            onClick={submitText}
            disabled={disabled}
            className="springy mt-3 rounded-lg bg-ledger-mint px-4 py-2 font-semibold text-ledger-bg disabled:opacity-50"
          >
            Extract from text →
          </button>
        </div>
      )}

      {note && (
        <p className="fade-in mt-3 text-sm" style={{ color: 'var(--color-ledger-flag)' }} role="status">
          {note}
        </p>
      )}
    </div>
  )
}
```

### 7.8 `portfolio/src/pages/LedgerLens/ExamplePicker.tsx`

Renders the three example receipts to canvases (visible) and, on select, hands the **same
canvas' JPEG** to the extractor — the "these receipts are themselves generated" story made
literal.

```tsx
import { useEffect, useRef } from 'react'
import { EXAMPLES, renderReceipt, type ReceiptSpec } from './receipts'
import type { ExtractInput } from './useExtraction'

function ExampleCard({ spec, onPick, disabled }: { spec: ReceiptSpec; onPick: (i: ExtractInput) => void; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) renderReceipt(canvasRef.current, spec, 240)
  }, [spec])

  return (
    <button
      onClick={() => {
        const c = canvasRef.current
        if (c) onPick({ mode: 'image', dataUrl: c.toDataURL('image/jpeg', 0.9) })
      }}
      disabled={disabled}
      aria-label={`Extract the ${spec.label} example receipt`}
      className="plate-lift group flex flex-col items-center overflow-hidden rounded-xl border border-ledger-line bg-ledger-card p-4 disabled:opacity-60"
    >
      <span className="mb-3 self-start">
        <span className="ledger-label">{spec.label}</span>
      </span>
      <canvas ref={canvasRef} className="rounded-md shadow-[0_16px_30px_-18px_rgba(0,0,0,0.8)]" />
      <span className="mt-3 text-xs font-semibold text-ledger-mint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Read this receipt →
      </span>
    </button>
  )
}

export function ExamplePicker({ onPick, disabled }: { onPick: (i: ExtractInput) => void; disabled: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="ledger-label">Or read a generated example</h2>
        <span className="ledger-label">Rendered to canvas · no downloaded assets</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {EXAMPLES.map((s) => (
          <ExampleCard key={s.id} spec={s} onPick={onPick} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
```

### 7.9 `portfolio/src/pages/LedgerLens/ResultsTable.tsx`

The editable table: keyboard-navigable inline editing, add/delete row, **live-recomputed**
subtotal/total, per-field low-confidence + math-mismatch flags with a "confirm" affordance, an
`aria-live` announcer, and CSV/JSON export. This is the load-bearing correction surface.

```tsx
import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  CATEGORIES,
  type Category,
  type EditLine,
  type EditModel,
  type LineField,
  blankLine,
  cents,
  derivedSubtotal,
  derivedTotal,
  fieldFlagged,
  lineAmount,
  rowMismatch,
} from './schema'
import { fmtMoney } from './format'
import { download, toCSV, toJSON } from './export'

export function ResultsTable({ initial }: { initial: EditModel }) {
  const [model, setModel] = useState<EditModel>(initial)
  const [announce, setAnnounce] = useState('')

  const cur = model.currency
  const sub = derivedSubtotal(model.lines)
  const tot = derivedTotal(model.lines, model.tax)
  const subMismatch = Math.abs(sub - model.modelSubtotal) > 0.01
  const totMismatch = Math.abs(tot - model.modelTotal) > 0.01

  const patchLine = (id: string, patch: Partial<EditLine>) =>
    setModel((m) => ({ ...m, lines: m.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))

  // Editing a field also confirms it (clears its flag).
  const editField = (l: EditLine, f: LineField, patch: Partial<EditLine>) =>
    patchLine(l.id, { ...patch, confirmed: Array.from(new Set([...l.confirmed, f])) })

  const addRow = () => {
    setModel((m) => ({ ...m, lines: [...m.lines, blankLine()] }))
    setAnnounce('Row added.')
  }
  const delRow = (id: string) => {
    setModel((m) => ({ ...m, lines: m.lines.filter((l) => l.id !== id) }))
    setAnnounce('Row deleted. Totals recalculated.')
  }

  const flagStyle: CSSProperties = { color: 'var(--color-ledger-flag)' }

  return (
    <section aria-label="Extracted line items" className="rounded-xl border border-ledger-line bg-ledger-card p-5">
      {/* Header fields */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <HeaderField label="Merchant" flagged={model.conf.merchant < 0.75} value={model.merchant} onChange={(v) => setModel((m) => ({ ...m, merchant: v }))} />
        <HeaderField label="Date" flagged={model.conf.date < 0.75} value={model.date} onChange={(v) => setModel((m) => ({ ...m, date: v }))} />
        <HeaderField label="Currency" flagged={model.conf.currency < 0.75} value={model.currency} onChange={(v) => setModel((m) => ({ ...m, currency: v.toUpperCase().slice(0, 3) }))} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="ledger-label border-b border-ledger-line text-left">
              <th className="py-2 pr-3 font-inherit">Description</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Unit</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 pl-2 text-right"><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {model.lines.map((l) => {
              const amt = lineAmount(l)
              const mismatch = rowMismatch(l)
              return (
                <tr key={l.id} className="ledger-row-in border-b border-ledger-line/60">
                  <td className="py-1 pr-3">
                    <Cell
                      value={l.description}
                      flagged={fieldFlagged(l, 'description')}
                      ariaLabel="Item description"
                      onCommit={(v) => editField(l, 'description', { description: v })}
                    />
                  </td>
                  <td className="py-1 px-2 text-right">
                    <NumCell value={l.qty} flagged={fieldFlagged(l, 'qty')} ariaLabel="Quantity" onCommit={(v) => editField(l, 'qty', { qty: v })} />
                  </td>
                  <td className="py-1 px-2 text-right">
                    <NumCell value={l.unitPrice} flagged={fieldFlagged(l, 'unitPrice')} ariaLabel="Unit price" onCommit={(v) => editField(l, 'unitPrice', { unitPrice: cents(v) })} />
                  </td>
                  <td className="ledger-num py-1 px-2 text-right" title={mismatch ? `Model said ${fmtMoney(l.modelAmount, cur)} — recomputed from qty × unit` : undefined}>
                    <span style={mismatch && !l.confirmed.includes('amount') ? flagStyle : undefined}>{fmtMoney(amt, cur)}</span>
                    {mismatch && !l.confirmed.includes('amount') && (
                      <button
                        onClick={() => editField(l, 'amount', {})}
                        className="ml-1 align-middle text-[0.65rem]"
                        style={flagStyle}
                        aria-label={`Amount differs from the receipt; confirm the recomputed ${fmtMoney(amt, cur)}`}
                        title="Confirm recomputed amount"
                      >
                        ⚠
                      </button>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <select
                      value={l.category}
                      aria-label="Category"
                      onChange={(e) => editField(l, 'category', { category: e.target.value as Category })}
                      className={`rounded border border-ledger-line bg-ledger-card-2 px-1.5 py-1 text-xs text-ledger-ink ${fieldFlagged(l, 'category') ? 'ledger-flagged' : ''}`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.replace('_', ' / ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pl-2 text-right">
                    <button
                      onClick={() => delRow(l.id)}
                      aria-label={`Delete row: ${l.description || 'untitled item'}`}
                      className="rounded px-1.5 py-1 text-ledger-muted transition-colors hover:text-ledger-bad"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="springy mt-3 rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
        + Add row
      </button>

      {/* Totals — derived, with mismatch flags */}
      <dl className="ledger-num mt-5 ml-auto max-w-xs space-y-1 text-sm">
        <TotalRow label="Subtotal" value={fmtMoney(sub, cur)} mismatch={subMismatch} hint={subMismatch ? `receipt said ${fmtMoney(model.modelSubtotal, cur)}` : undefined} />
        <TotalRow
          label="Tax"
          value={
            <input
              value={model.tax}
              type="number"
              step="0.01"
              aria-label="Tax amount"
              onChange={(e) => setModel((m) => ({ ...m, tax: cents(Number(e.target.value) || 0) }))}
              className="ledger-num w-24 rounded border border-ledger-line bg-ledger-card-2 px-2 py-0.5 text-right text-ledger-ink"
            />
          }
        />
        <TotalRow label="Total" value={fmtMoney(tot, cur)} strong mismatch={totMismatch} hint={totMismatch ? `receipt said ${fmtMoney(model.modelTotal, cur)}` : undefined} />
      </dl>

      {/* Export */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-ledger-line pt-4">
        <button
          onClick={() => download(`ledger-lens-${model.date || 'receipt'}.csv`, toCSV(model), 'text/csv')}
          className="springy rounded-lg bg-ledger-mint px-4 py-2 font-semibold text-ledger-bg"
        >
          Export CSV
        </button>
        <button
          onClick={() => download(`ledger-lens-${model.date || 'receipt'}.json`, toJSON(model), 'application/json')}
          className="springy rounded-lg border border-ledger-line px-4 py-2 font-semibold text-ledger-ink hover:border-ledger-mint"
        >
          Export JSON
        </button>
      </div>

      <p className="ledger-label mt-4">
        Totals are recomputed from the line items — the model's arithmetic is never trusted. A ⚠ marks a value the model wasn't sure of, or a printed amount that disagrees with qty × unit.
      </p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </section>
  )
}

function HeaderField({ label, value, flagged, onChange }: { label: string; value: string; flagged: boolean; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="ledger-label">{label}</span>
      <input
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-lg border border-ledger-line bg-ledger-card-2 px-2.5 py-1.5 text-sm text-ledger-ink ${flagged ? 'ledger-flagged' : ''}`}
      />
    </label>
  )
}

/** Editable text cell — Enter/blur commits, Escape reverts. */
function Cell({ value, flagged, ariaLabel, onCommit }: { value: string; flagged: boolean; ariaLabel: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(value)
  return (
    <input
      value={v}
      aria-label={ariaLabel}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setV(value)
      }}
      className={`w-full rounded bg-transparent px-1.5 py-1 text-ledger-ink hover:bg-ledger-card-2 focus:bg-ledger-card-2 ${flagged ? 'ledger-flagged' : ''}`}
    />
  )
}

/** Editable numeric cell. */
function NumCell({ value, flagged, ariaLabel, onCommit }: { value: number; flagged: boolean; ariaLabel: string; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value))
  return (
    <input
      value={v}
      type="number"
      step="0.01"
      inputMode="decimal"
      aria-label={ariaLabel}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Number(v)
        if (Number.isFinite(n) && n !== value) onCommit(n)
        else setV(String(value))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') setV(String(value))
      }}
      className={`ledger-num w-16 rounded bg-transparent px-1 py-1 text-right text-ledger-ink hover:bg-ledger-card-2 focus:bg-ledger-card-2 ${flagged ? 'ledger-flagged' : ''}`}
    />
  )
}

function TotalRow({ label, value, strong, mismatch, hint }: { label: string; value: React.ReactNode; strong?: boolean; mismatch?: boolean; hint?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? 'border-t border-ledger-line pt-1 text-base' : ''}`}>
      <dt className={strong ? 'font-semibold text-ledger-ink' : 'text-ledger-ink-2'}>{label}</dt>
      <dd className="flex items-center gap-2" style={mismatch ? { color: 'var(--color-ledger-flag)' } : undefined}>
        {mismatch && hint && <span className="text-[0.65rem]" title={hint}>⚠ {hint}</span>}
        <span className={strong ? 'font-semibold' : ''} style={strong && !mismatch ? { color: 'var(--color-ledger-mint)' } : undefined}>
          {value}
        </span>
      </dd>
    </div>
  )
}
```

### 7.10 `portfolio/src/pages/LedgerLens/index.tsx`

Page shell: standalone chrome (no site Nav/Footer), body class on mount, `hero-in` cascade, the
"reading → structuring" status line, and the four states (empty → streaming → done → error)
wired to `useExtraction`.

```tsx
import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { navigate } from '../../lib/router'
import { Dropzone } from './Dropzone'
import { ExamplePicker } from './ExamplePicker'
import { ResultsTable } from './ResultsTable'
import { SkeletonRows } from './SkeletonRows'
import { ConfidenceMeter } from './ConfidenceMeter'
import { useExtraction, type ExtractInput } from './useExtraction'
import './theme.css'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** Wordmark spark — a mint check inside a receipt corner. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="3" fill="var(--color-ledger-mint)" opacity="0.16" />
      <polyline points="6,10 9,13 15,6" fill="none" stroke="var(--color-ledger-mint)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function LedgerLens() {
  const { state, start, reset } = useExtraction()
  const working = state.phase === 'reading' || state.phase === 'structuring'

  useEffect(() => {
    document.body.classList.add('ledger-page')
    const prev = document.title
    document.title = 'Ledger Lens — receipt & invoice extractor'
    return () => {
      document.body.classList.remove('ledger-page')
      document.title = prev
    }
  }, [])

  const onPick = (i: ExtractInput) => start(i)

  const docConfidence = state.result
    ? avg([
        state.result.conf.merchant,
        state.result.conf.date,
        state.result.conf.total,
        ...state.result.lines.map((l) => l.confidence),
      ])
    : 0

  return (
    <div className="ledger-root min-h-svh bg-ledger-bg text-ledger-ink">
      <header className="sticky top-0 z-10 border-b border-ledger-line bg-ledger-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <button onClick={() => navigate('#work')} className="hero-in font-mono text-xs tracking-wide text-ledger-muted transition-colors hover:text-ledger-ink" style={d(0)}>
            ← Portfolio
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-ledger-line" />
          <div className="hero-in flex items-center gap-2.5" style={d(40)}>
            <Mark />
            <span className="font-semibold tracking-tight">Ledger Lens</span>
            <span className="rounded-full border border-ledger-mint/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ledger-mint">Demo</span>
          </div>
          <span className="hero-in ml-auto hidden font-mono text-xs text-ledger-muted sm:block" style={d(80)}>
            Claude Haiku 4.5 · vision
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="hero-in flex flex-wrap items-end justify-between gap-3" style={d(100)}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Read a receipt</h1>
            <p className="mt-1 text-sm text-ledger-ink-2">Photo, or paste messy text — extracted to structured, editable line items.</p>
          </div>
          <p className="ledger-label">Vision + structured output · your key never touches the browser</p>
        </div>

        {/* Input surface (hidden once a result lands, replaced by "start over"). */}
        {state.phase !== 'done' && (
          <div className="mt-6 space-y-6">
            <div className="hero-in" style={d(140)}>
              <Dropzone onSubmit={onPick} disabled={working} />
            </div>
            <div className="hero-in" style={d(200)}>
              <ExamplePicker onPick={onPick} disabled={working} />
            </div>
          </div>
        )}

        {/* Streaming status + skeleton */}
        {working && (
          <div className="fade-in mt-6 rounded-xl border border-ledger-line bg-ledger-card p-5" aria-busy="true">
            <div className="flex items-center gap-3">
              <span className="ledger-pulse h-2 w-2 rounded-full" style={{ background: 'var(--color-ledger-mint)' }} aria-hidden="true" />
              <span className="ledger-label" role="status" aria-live="polite">
                {state.phase === 'reading' ? 'Reading the receipt…' : 'Structuring line items…'}
              </span>
            </div>
            <SkeletonRows count={state.approxRows} />
          </div>
        )}

        {/* Result */}
        {state.phase === 'done' && state.result && (
          <div className="fade-in mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ConfidenceMeter value={docConfidence} />
              <button onClick={reset} className="springy rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
                ↺ Read another
              </button>
            </div>
            <ResultsTable initial={state.result} />
          </div>
        )}

        {/* Error / rate-limit */}
        {state.phase === 'error' && (
          <div className="fade-in mt-6 rounded-xl border p-5" style={{ borderColor: 'var(--color-ledger-bad)' }} role="alert">
            <p className="text-sm" style={{ color: 'var(--color-ledger-bad)' }}>
              {state.error}
            </p>
            <button onClick={reset} className="springy mt-3 rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">
              Try again
            </button>
          </div>
        )}

        {/* How-it-works strip */}
        <section aria-label="How this demo is built" className="hero-in mt-10 grid gap-5 rounded-xl border border-ledger-line bg-ledger-card p-5 sm:grid-cols-3" style={d(280)}>
          <Blurb title="Vision + strict schema" body="Claude Haiku 4.5 reads the image and is constrained to a JSON schema — merchant, dates, line items, per-field confidence. Structured output, not free text." />
          <Blurb title="Derived, not trusted" body="The table recomputes amount = qty × unit and subtotal/total from the items, then flags any value that disagrees with the receipt. The human is the final authority." />
          <Blurb title="Key stays server-side" body="Every request goes through a rate-limited Supabase Edge Function that holds the Anthropic key. The browser never sees it — the exact REX key-proxy pattern." />
        </section>

        <footer className="hero-in mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ledger-line pt-5" style={d(340)}>
          <p className="font-mono text-xs text-ledger-muted">Generated example receipts, streamed extraction — built for Sean Joudrie's portfolio.</p>
          <button onClick={() => navigate('#work')} className="font-mono text-xs text-ledger-muted transition-colors hover:text-ledger-ink">
            Back to the portfolio →
          </button>
        </footer>
      </div>
    </div>
  )
}

function Blurb({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="ledger-label">{title}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ledger-ink-2">{body}</p>
    </div>
  )
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
```

---

## 8 · Backend — Supabase Edge Function + SQL/config + CORS/rate-limit + client fetch

The Edge Function holds `ANTHROPIC_API_KEY`, enforces a CORS allowlist and a per-IP rate limit,
calls Claude Haiku 4.5 with vision + structured output + streaming, and **passes the Anthropic
SSE stream straight through** to the browser. Raw `fetch` (not the SDK) is used deliberately:
Deno edge runtime, and a bytes-through SSE proxy is cleanest as a passthrough of
`upstream.body`.

### 8.1 `supabase/functions/extract/index.ts`

```ts
// Ledger Lens extractor — Supabase Edge Function (Deno).
// Holds the Anthropic key server-side, enforces CORS allowlist + per-IP rate
// limiting, then streams Claude Haiku 4.5 (vision + structured output) straight
// through to the browser as SSE. The key never reaches the client.
//
// Deploy:  supabase functions deploy extract --no-verify-jwt
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//          supabase secrets set ALLOWED_ORIGINS="https://SeanJoudrie.github.io,http://localhost:5173,http://localhost:4173"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 2048
const RL_MAX = 8 // requests per window
const RL_WINDOW = 60 // seconds
const MAX_IMAGE_B64 = 6_800_000 // ~5MB decoded
const MAX_TEXT_CHARS = 12_000

const SYSTEM = [
  'You extract structured data from a single receipt or invoice.',
  'Return ONLY the fields defined by the provided JSON schema — no commentary.',
  'Rules:',
  '- lineItems are purchased items only. Never put subtotal, tax, tip, or total in lineItems.',
  '- If quantity is not printed, use qty = 1 and set amount = the printed line price.',
  '- amount is the printed line total. Do not invent totals; copy what is printed.',
  '- date: prefer ISO-8601 (YYYY-MM-DD). currency: ISO-4217 (e.g. USD).',
  '- confidence is your own 0..1 certainty for each field. Be honest: lower it for blurry,',
  '  cropped, cut-off, or ambiguous values, and list those fields in each row’s "uncertain".',
  '- If the image is not a receipt/invoice, return empty lineItems and low confidence.',
].join('\n')

// Keep the schema in one place (mirrors portfolio/src/pages/LedgerLens/schema.ts).
const CATEGORIES = ['food_drink', 'supplies', 'hardware', 'software', 'services', 'tax', 'fee', 'shipping', 'other']
const LINE_FIELDS = ['description', 'qty', 'unitPrice', 'amount', 'category']
const conf = (desc: string) => ({
  type: 'object',
  additionalProperties: false,
  properties: { value: { type: desc === 'num' ? 'number' : 'string' }, confidence: { type: 'number' } },
  required: ['value', 'confidence'],
})
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    merchant: conf('str'),
    date: conf('str'),
    currency: conf('str'),
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          qty: { type: 'number' },
          unitPrice: { type: 'number' },
          amount: { type: 'number' },
          category: { type: 'string', enum: CATEGORIES },
          confidence: { type: 'number' },
          uncertain: { type: 'array', items: { type: 'string', enum: LINE_FIELDS } },
        },
        required: ['description', 'qty', 'unitPrice', 'amount', 'category', 'confidence', 'uncertain'],
      },
    },
    subtotal: conf('num'),
    tax: conf('num'),
    total: conf('num'),
  },
  required: ['merchant', 'date', 'currency', 'lineItems', 'subtotal', 'tax', 'total'],
}

function corsHeaders(origin: string | null): Record<string, string> {
  const ok = origin && (ALLOWED.length === 0 || ALLOWED.includes(origin))
  return {
    'access-control-allow-origin': ok ? origin! : 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  })
}

// Per-IP rate limit via a Postgres RPC (see migration 0001). Fails OPEN if the
// limiter is unreachable — availability over strictness for a portfolio demo.
async function allowed(ipHash: string): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return true
  try {
    const sb = createClient(url, key)
    const { data, error } = await sb.rpc('consume_rate_limit', { p_bucket: ipHash, p_max: RL_MAX, p_window: RL_WINDOW })
    if (error) return true
    return data === true
  } catch {
    return true
  }
}

async function hashIp(req: Request): Promise<string> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '|ledger-lens'))
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin)
  if (ALLOWED.length && (!origin || !ALLOWED.includes(origin))) return json({ error: 'Origin not allowed.' }, 403, origin)
  if (!ANTHROPIC_KEY) return json({ error: 'Server is not configured.' }, 500, origin)

  if (!(await allowed(await hashIp(req)))) return json({ error: 'Rate limit reached — try again in a minute.' }, 429, origin)

  let payload: { mode?: string; mediaType?: string; data?: string; text?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400, origin)
  }

  let content: unknown[]
  if (payload.mode === 'image') {
    if (!payload.data) return json({ error: 'Missing image data.' }, 400, origin)
    if (payload.data.length > MAX_IMAGE_B64) return json({ error: 'Image too large.' }, 413, origin)
    const media = /^image\/(png|jpeg|jpg|webp|gif)$/.test(payload.mediaType ?? '') ? payload.mediaType : 'image/jpeg'
    content = [
      { type: 'image', source: { type: 'base64', media_type: media, data: payload.data } },
      { type: 'text', text: 'Extract this receipt into the schema.' },
    ]
  } else if (payload.mode === 'text') {
    const text = (payload.text ?? '').slice(0, MAX_TEXT_CHARS)
    if (!text.trim()) return json({ error: 'Empty text.' }, 400, origin)
    content = [{ type: 'text', text: `Extract this receipt text into the schema:\n\n${text}` }]
  } else {
    return json({ error: 'mode must be "image" or "text".' }, 400, origin)
  }

  let upstream: Response
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: SYSTEM,
        messages: [{ role: 'user', content }],
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      }),
    })
  } catch {
    return json({ error: 'Upstream request failed.' }, 502, origin)
  }

  if (!upstream.ok || !upstream.body) {
    let msg = `Model error (${upstream.status}).`
    try {
      const e = await upstream.json()
      msg = e?.error?.message ?? msg
    } catch { /* ignore */ }
    // Surface Anthropic's own 429 as a 429.
    return json({ error: msg }, upstream.status === 429 ? 429 : 502, origin)
  }

  // Pass the SSE stream straight through.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      ...corsHeaders(origin),
    },
  })
})
```

### 8.2 `supabase/functions/extract/deno.json` (optional, keeps lint/imports tidy)

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  },
  "lint": { "rules": { "tags": ["recommended"] } }
}
```

### 8.3 `supabase/migrations/0001_ledger_rate_limit.sql`

Fixed-window per-bucket rate limiter. `consume_rate_limit` returns `true` if the request is
under the limit (and records it), `false` otherwise.

```sql
-- Ledger Lens rate limiting: one row per (bucket, window-start), count incremented per hit.
create table if not exists public.rl_hits (
  bucket      text        not null,
  window_start timestamptz not null,
  hits        integer     not null default 0,
  primary key (bucket, window_start)
);

-- Never expose this table to the client; only the service role (Edge Function) touches it.
alter table public.rl_hits enable row level security;

-- Returns true if the request is allowed (and records it), false if over the limit.
create or replace function public.consume_rate_limit(p_bucket text, p_max int, p_window int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w   timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
  cur int;
begin
  insert into public.rl_hits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start)
  do update set hits = public.rl_hits.hits + 1
  returning hits into cur;

  -- Opportunistic cleanup of old windows.
  delete from public.rl_hits where window_start < now() - interval '10 minutes';

  return cur <= p_max;
end;
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;
```

### 8.4 Config / env (state this to the deployer)

- **Function secrets** (set via `supabase secrets set`): `ANTHROPIC_API_KEY`,
  `ALLOWED_ORIGINS` (comma-separated: the GitHub Pages origin `https://SeanJoudrie.github.io`
  plus `http://localhost:5173` and `http://localhost:4173` for dev). `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the platform.
- **Deploy without JWT verification** (public demo endpoint): `supabase functions deploy extract
  --no-verify-jwt`. Protection is the CORS allowlist + rate limit, not auth.
- **Front-end env:** set `VITE_LEDGER_FN_URL` to
  `https://<PROJECT_REF>.functions.supabase.co/extract` at build time (GitHub Actions env or a
  committed `.env` with only this non-secret URL). The hook falls back to a placeholder that
  the deployer must replace.

### 8.5 Client streaming fetch

Already implemented in §7.4 (`useExtraction.ts`): `fetch(ENDPOINT, { method:'POST', body:
JSON.stringify({mode,…}) })`, then `res.body.getReader()` + `TextDecoder`, framing SSE on
`\n\n`, reading `data:` lines, and reacting to `content_block_delta` (`text_delta`) /
`message_stop` / `error`. No Anthropic SDK in the browser — the key is never present client-side.

---

## 9 · Interactions & micro-interactions (with reduced-motion variants)

| Interaction | Full-motion | `prefers-reduced-motion: reduce` |
|---|---|---|
| Header / hero cascade | `.hero-in` per-item `--d` stagger (0/40/80/100/140/200/280/340 ms) | animation none, opacity 1 (index.css already handles) |
| Example receipt cards | `.plate-lift` hover rise + shadow; "Read this receipt →" fades in on hover/focus | transform/box-shadow suppressed (index.css `.plate-lift` reduced rule) |
| "Reading → structuring" status | mint `.ledger-pulse` dot pulses; label swaps text | dot static opacity 1, label still swaps (text change is not motion) |
| Streaming skeleton | `.ledger-skel` shimmer sweep; row count grows as items resolve | `::after` shimmer animation none; rows still render statically |
| Line row appears | `.ledger-row-in` (`fade-in-up`) | animation none |
| Result panel / errors / notes | `.fade-in` (`fade-in-up`) | animation none |
| Editable cell hover/focus | bg shifts to `card-2` (color transition only) | unchanged (color transition, not transform) |
| Buttons | `.springy` translate/scale | transform suppressed, colors keep transitioning (index.css `.springy` reduced rule) |
| Low-confidence flag | dashed amber underline (`.ledger-flagged`), ⚠ affordance | static (no motion involved) |
| Focus outline | 2px mint outline, offset 2 (theme.css `:focus-visible`) | unchanged |

No component starts its own `requestAnimationFrame` loop. The demo has no number tickers, so
`ticker.ts` is not needed here — but if a future phase adds an animated total, it **must** use
`addTask`/`useCountUp` from `portfolio/src/lib/ticker.ts` (never a second rAF loop). Note this
constraint in code comments.

---

## 10 · States (with real markup)

All five are implemented in §7.10 `index.tsx`; the markup below is the canonical shape.

**Empty (idle):** Dropzone + ExamplePicker visible, how-it-works strip below.

```tsx
{state.phase !== 'done' && (
  <div className="mt-6 space-y-6">
    <Dropzone onSubmit={onPick} disabled={working} />
    <ExamplePicker onPick={onPick} disabled={working} />
  </div>
)}
```

**Reading (image uploaded / example picked, before first token):** status = "Reading the
receipt…", pulsing mint dot, 3-row skeleton.

```tsx
<div className="fade-in mt-6 rounded-xl border border-ledger-line bg-ledger-card p-5" aria-busy="true">
  <div className="flex items-center gap-3">
    <span className="ledger-pulse h-2 w-2 rounded-full" style={{ background: 'var(--color-ledger-mint)' }} aria-hidden="true" />
    <span className="ledger-label" role="status" aria-live="polite">Reading the receipt…</span>
  </div>
  <SkeletonRows count={0} />
</div>
```

**Streaming (structuring):** same panel, label = "Structuring line items…", skeleton row count
tracks `state.approxRows` as items resolve from the partial JSON.

**Done:** confidence meter + "Read another", then `<ResultsTable initial={state.result} />`.

**Error / rate-limited / no-result:** the `phase === 'error'` branch. `state.rateLimited`
distinguishes the copy; `no-result` (model returned non-receipt / unparseable) is finalized in
`useExtraction` as an error with the message *"Could not read a receipt from that input. Try a
clearer image or an example."* Real markup:

```tsx
{state.phase === 'error' && (
  <div className="fade-in mt-6 rounded-xl border p-5" style={{ borderColor: 'var(--color-ledger-bad)' }} role="alert">
    <p className="text-sm" style={{ color: 'var(--color-ledger-bad)' }}>{state.error}</p>
    <button onClick={reset} className="springy mt-3 rounded-lg border border-ledger-line px-3 py-1.5 text-sm text-ledger-ink-2 hover:text-ledger-ink">Try again</button>
  </div>
)}
```

---

## 11 · Edge cases & failure modes (each with handling)

| Case | Detection | Handling |
|---|---|---|
| **Blurry / low-quality image** | Model returns low `confidence` and populates `uncertain[]` | Fields render with `.ledger-flagged` dashed underline + ⚠; visitor edits (which confirms) or overrides. Document confidence meter goes amber. |
| **Non-receipt image** | System prompt instructs empty `lineItems` + low confidence; `finalize` sees a valid-shaped object but `isRawExtraction` passes → then UI shows 0 rows | `finalize` also treats an empty `lineItems` + no total as no-result only if parse fails; for a valid-but-empty response, ResultsTable renders with zero rows and the visitor can add rows manually. If parsing fails entirely → error copy "Could not read a receipt…". |
| **Huge paste (text mode)** | Client: `> MAX_TEXT_CHARS` in Dropzone → inline note, no request. Server: `.slice(0, MAX_TEXT_CHARS)` hard cap | Both layers guard; friendly message client-side, silent truncation server-side. |
| **Oversize image** | Client: `> 4.5MB` file → Dropzone note. Server: base64 `> MAX_IMAGE_B64` → 413 | Client message before upload; server returns 413 → hook surfaces "Extractor error". |
| **API error (Anthropic 4xx/5xx)** | `upstream.ok` false; function reads `error.message` | Function returns the message with 502 (or 429 if upstream 429). Hook shows it in the error panel. |
| **Anthropic mid-stream `error` event** | SSE frame `type:"error"` | Hook sets phase `error` with `ev.error.message`, stops reading. |
| **Malformed / truncated model JSON** | `JSON.parse` throws in `finalize` | Falls back to `tryParsePartial`; if still not a `RawExtraction` → no-result error copy. |
| **Network drop mid-stream** | `reader.read()` throws | Hook: "Connection dropped mid-stream." + Try again. |
| **Rate limit (client)** | Function returns 429 | Hook sets `rateLimited` + "Rate limit reached — try again in a minute." |
| **Rate-limiter unreachable** | RPC error / no service role | `allowed()` fails **open** (returns true) — a portfolio demo must not go dark because Postgres blipped. |
| **CORS / wrong origin** | `origin` not in `ALLOWED_ORIGINS` | 403 "Origin not allowed." (also blocks casual key-proxy abuse from other sites). |
| **Model math wrong** (printed amount ≠ qty×unit, or subtotal/total off) | `rowMismatch`, `subMismatch`, `totMismatch` in ResultsTable | ⚠ amber flag + tooltip showing what the receipt said; the **derived** value is what's shown and exported. |
| **Currency code odd/missing** | `fmtMoney` try/catch; `toEditModel` uppercases + slices to 3 | Falls back to a bare number; visitor can fix the currency field. |
| **Abuse (rapid re-submits)** | AbortController cancels the prior in-flight request on each new `start` | Plus the per-IP window limit; only one stream per visitor at a time. |
| **Reduced motion** | `prefers-reduced-motion` media query | Every animation has an out (§4.4, §9). |

---

## 12 · Accessibility

**Keyboard map**

| Key | Context | Action |
|---|---|---|
| `Tab` / `Shift+Tab` | anywhere | Move between: Portfolio link, mode tabs, dropzone "choose a file", example cards, every editable cell, category selects, delete buttons, add-row, tax input, export buttons. |
| `Enter` | in a text/num cell | Commit edit (blurs). |
| `Escape` | in a text/num cell | Revert to the pre-edit value. |
| `Space` / `Enter` | on a button/card | Activate (native button semantics). |
| Arrow keys | in a `<select>` category | Native option navigation. |

**ARIA / roles**

- Mode toggle: `role="tablist"` with `role="tab"` + `aria-selected`.
- Streaming status: `role="status"` + `aria-live="polite"` (announces "Reading…" → "Structuring…"); container `aria-busy="true"`.
- Table: real `<table>`/`<thead>`/`<tbody>`; every cell input has an `aria-label` (e.g. "Unit price", "Quantity"); delete buttons `aria-label="Delete row: <desc>"`.
- Add/delete announcements: a visually-hidden `aria-live="polite"` node says "Row added." / "Row deleted. Totals recalculated."
- Flags: the ⚠ button carries an `aria-label` explaining the mismatch and what confirming does; the dashed underline is decorative (color+underline, not the only signal — the ⚠ and label carry meaning).
- Confidence meter: wrapper `aria-label="Overall extraction confidence 82%"`.
- Error panel: `role="alert"`.
- Example cards: `aria-label="Extract the Coffee shop example receipt"`; canvases are decorative within the labelled button.
- File input: `sr-only`, triggered by a labelled button.

**Focus**

- Visible focus everywhere: theme.css `:focus-visible` → 2px mint outline, offset 2, radius 3.
- On `reset` ("Read another"), focus returns to the top of the input surface (optional enhancement: `ref` the Dropzone container and `.focus()` a tabindex=-1 wrapper — note but not required for v1).

**Live-region wording (exact strings)**

- Reading: `Reading the receipt…`
- Structuring: `Structuring line items…`
- Row added: `Row added.`
- Row deleted: `Row deleted. Totals recalculated.`
- No result: `Could not read a receipt from that input. Try a clearer image or an example.`

---

## 13 · Performance budget

- **JS added (gzipped):** target < 18 KB for the whole `LedgerLens` chunk (no chart/3D libs; only `@supabase/supabase-js` is server-side, never bundled to the browser). It's lazy-loaded via the existing `App.tsx` Suspense split, so it costs the home page nothing.
- **No runtime dependencies shipped to the client.** Canvas receipts, SSE parsing, partial-JSON, CSV/JSON export are all hand-rolled.
- **Canvas render:** each example draws once on mount at `min(2, dpr)` scale; three small canvases (~240×340 CSS px). Redraw only on spec change (there is none). Selecting an example calls `toDataURL` once.
- **Image payload:** JPEG q0.9; example receipts ≈ 15–30 KB base64. Uploads capped at 4.5 MB client-side. Keeps the request small and the vision call cheap.
- **Streaming:** one `fetch` + one reader loop; `setState` at most once per SSE frame (a handful for a receipt). Partial-JSON parse is O(n) over a < 3 KB buffer per frame — negligible.
- **No 60 Hz React renders:** the only animations are CSS (shimmer, pulse, fade); React state changes are event- or frame-boundary-driven, never per-animation-frame.
- **Model cost/latency:** Haiku 4.5 ($1/$5 per MTok) on a single small image + ~2 KB schema output → cents-scale per extraction and sub-second-to-first-token typical, which is why the fast/cheap tier is the right call for a public demo that strangers will hammer.
- **Reduced motion:** disables shimmer/pulse/fade — zero animation cost.

---

## 14 · Build order (numbered shippable phases, each with an exit criterion)

1. **Tokens + theme.** Add `--color-ledger-*` to `index.css @theme`; create `theme.css`.
   *Exit:* `body.ledger-page` paints `#0d0c0a`; a scratch `.ledger-label` renders muted mono.
2. **Route + shell.** Add the `App.tsx` lazy import + `DEMO_PAGES` entry; create a minimal
   `index.tsx` (header + title + empty body).
   *Exit:* visiting `#/demos/ledger-lens` shows the standalone dark shell, no site nav/footer,
   "← Portfolio" returns home.
3. **Schema + helpers.** `schema.ts`, `format.ts`, `schema.assert.ts`.
   *Exit:* `tsc` clean; dev build runs the assert without throwing.
4. **Procedural receipts.** `receipts.ts` + `ExamplePicker.tsx`.
   *Exit:* three legible receipts render to canvas; dev assert passes; picking logs a data URL.
5. **Range shelf.** `Range.tsx` entry + `LedgerThumb`.
   *Exit:* home page shows Commission 03 with the receipt thumbnail; counter reads "3 commissions".
6. **Backend.** `supabase/functions/extract/index.ts`, `0001_ledger_rate_limit.sql`, secrets,
   deploy.
   *Exit:* `curl` the deployed function with a base64 example image returns a streaming SSE body;
   wrong origin → 403; 9th request in a minute → 429.
7. **Streaming hook + skeleton.** `partialJson.ts`, `useExtraction.ts`, `SkeletonRows.tsx`,
   `ConfidenceMeter.tsx`; wire into `index.tsx`.
   *Exit:* picking an example shows "Reading…" → "Structuring…" → skeleton rows filling → a
   parsed result object in state.
8. **Editable table + export.** `ResultsTable.tsx`, `export.ts`.
   *Exit:* result lands in the table; editing qty/unit live-updates amount/subtotal/total; a
   deliberately mismatched value shows ⚠; CSV and JSON download with derived numbers.
9. **Dropzone (upload + paste).** `Dropzone.tsx`.
   *Exit:* drag-drop, file pick, paste-image, and text/CSV paste all reach the same result path;
   oversize inputs show inline notes.
10. **A11y + reduced-motion pass.** Verify keyboard map, live regions, focus, `role`s;
    toggle reduced motion.
    *Exit:* full keyboard operation with visible focus; announcements fire; no animation under
    reduced motion.
11. **Smoke test + polish.** `scripts/smoke-ledger-lens.mjs`; add to `npm run smoke`.
    *Exit:* `npm run smoke` passes with the API stubbed; zero page errors.

---

## 15 · Smoke-test checklist — `portfolio/scripts/smoke-ledger-lens.mjs`

Mirrors `smoke-aeroscale.mjs` style (playwright-core, `PW_CHROMIUM`, ✓/✗, exit-code). **The
Anthropic call is stubbed via Playwright route interception** — the smoke must never hit the
real API. It intercepts the Edge Function URL and replays a canned SSE stream, then asserts the
UI reaches a correct, editable, exportable state.

```js
#!/usr/bin/env node
/**
 * Ledger Lens smoke — runs behind the same regression gate as the other demos.
 * The extractor endpoint is STUBBED with a canned Anthropic SSE stream so the
 * test is deterministic and never calls the real API. Usage matches
 * smoke-aeroscale.mjs.
 */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const URL = `${BASE}/#/demos/ledger-lens`

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${note ? ` — ${note}` : ''}`)
}

// A canned structured-output object; note the intentional total mismatch (says 20).
const OBJ = {
  merchant: { value: 'THE DAILY GRIND', confidence: 0.97 },
  date: { value: '2026-06-12', confidence: 0.9 },
  currency: { value: 'USD', confidence: 0.99 },
  lineItems: [
    { description: 'Cappuccino (L)', qty: 2, unitPrice: 4.75, amount: 9.5, category: 'food_drink', confidence: 0.95, uncertain: [] },
    { description: 'Almond croissant', qty: 1, unitPrice: 3.95, amount: 3.95, category: 'food_drink', confidence: 0.6, uncertain: ['description'] },
  ],
  subtotal: { value: 13.45, confidence: 0.9 },
  tax: { value: 0, confidence: 0.9 },
  total: { value: 20.0, confidence: 0.5 }, // wrong on purpose → must be flagged
}

// Build a minimal Anthropic SSE stream that emits the JSON as text deltas.
function sse() {
  const text = JSON.stringify(OBJ)
  const frames = []
  frames.push(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start' })}\n\n`)
  frames.push(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0 })}\n\n`)
  for (let i = 0; i < text.length; i += 40) {
    const chunk = text.slice(i, i + 40)
    frames.push(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: chunk } })}\n\n`)
  }
  frames.push(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
  return frames.join('')
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const pageErrors = []
const p = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
p.on('pageerror', (e) => pageErrors.push(String(e)))

// Stub the extractor: any request whose URL ends in /extract returns the canned SSE.
await p.route('**/extract', (route) =>
  route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse() }),
)

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)

check('empty state shows examples', (await p.locator('canvas').count()) >= 3)
check('claim line present', ((await p.locator('body').textContent()) ?? '').includes('your key never touches the browser'))

// Pick the first example → triggers the stubbed stream.
await p.locator('button[aria-label*="example receipt"]').first().click()
await p.waitForTimeout(600)

check('result table rendered', (await p.locator('section[aria-label="Extracted line items"]').count()) === 1)
check('merchant extracted', ((await p.locator('input[aria-label="Merchant"]').inputValue()) ?? '').includes('DAILY GRIND'))
check('two line items', (await p.locator('input[aria-label="Item description"]').count()) === 2)
check('low-confidence field flagged', (await p.locator('.ledger-flagged').count()) >= 1)

// Derived total must be $13.45 (not the model's wrong $20), and be flagged as a mismatch.
const totalsText = (await p.locator('dl').last().textContent()) ?? ''
check('total derived to $13.45', totalsText.includes('$13.45'))
check('total mismatch flagged', totalsText.includes('receipt said') && totalsText.includes('$20'))

// Edit a quantity → total recomputes live.
const qty = p.locator('input[aria-label="Quantity"]').first()
await qty.fill('3')
await qty.press('Enter')
await p.waitForTimeout(200)
check('editing qty recomputes total', ((await p.locator('dl').last().textContent()) ?? '').includes('$18.20'))

// Add + delete a row.
await p.click('button:has-text("Add row")')
await p.waitForTimeout(100)
check('add row works', (await p.locator('input[aria-label="Item description"]').count()) === 3)

// Export CSV downloads.
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Export CSV")')])
check('CSV export downloads', (await dl.suggestedFilename()).endsWith('.csv'))

// Paste-text path also reaches a result.
await p.click('button:has-text("Read another")')
await p.click('button[role="tab"]:has-text("Paste text")')
await p.fill('#ll-paste', 'THE DAILY GRIND\nCappuccino 2 4.75 9.50')
await p.click('button:has-text("Extract from text")')
await p.waitForTimeout(500)
check('text mode reaches a result', (await p.locator('section[aria-label="Extracted line items"]').count()) === 1)

check('zero page errors', pageErrors.length === 0, pageErrors.join(' | '))
await browser.close()
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed')
process.exit(failed ? 1 : 0)
```

Add to `package.json` `smoke` script alongside the others (run all three demos' smokes).

---

## 16 · Definition of done

- [ ] `#/demos/ledger-lens` renders standalone dark chrome (no site nav/footer); `body.ledger-page` prevents overscroll paper-flash; title set/restored on unmount.
- [ ] `@theme` has all ten `--color-ledger-*` tokens; every text role ≥ 4.5:1 vs bg **and** card (ratios in §4.2).
- [ ] Home page Range shelf shows **Commission 03 · AI-native product** with the hand-drawn receipt thumbnail; counter reads "3 commissions".
- [ ] Three example receipts render procedurally to canvas; the **same** canvas image is sent to the vision call; dev-mode assert passes.
- [ ] Photo upload (drag/drop/pick/paste) and text/CSV paste both extract via the Edge Function.
- [ ] Response **streams** with a visible "Reading → Structuring" transition and skeleton rows that fill as items resolve.
- [ ] Result lands in an **editable** table: inline text/number editing (Enter commits, Escape reverts), add/delete row, category select.
- [ ] Totals are **derived** (`amount = qty × unitPrice`, `subtotal = Σ`, `total = subtotal + tax`); model-vs-derived mismatches and low-confidence fields are flagged (amber ⚠ / dashed underline) with a confirm affordance.
- [ ] Export to **CSV and JSON** downloads the derived numbers.
- [ ] Anthropic key is **never** in the browser bundle or any client request; the Edge Function holds it, with CORS allowlist + per-IP rate limit; 403 on bad origin, 429 over limit.
- [ ] Model is `claude-haiku-4-5`, `output_config.format` json_schema, `stream:true`, no `thinking`, no `effort`, version `2023-06-01`.
- [ ] Full keyboard operation, visible mint focus, `aria-live` announcements, correct roles; every animation has a reduced-motion out.
- [ ] On-screen claim line reads **"Vision + structured output · your key never touches the browser"**.
- [ ] `npm run smoke` (with the extractor stubbed) passes; zero page errors; `tsc` clean.
- [ ] No second rAF loop introduced; no chart/3D/client LLM libraries shipped.

---

## 17 · Later / out-of-scope (do NOT build now)

- **Conversational "chat with your extracted data" layer** (PARKED, phase 2). Would add a chat
  panel that takes the finalized `EditModel` as context and answers questions ("what did I spend
  on food?", "re-categorize the croissant"). Keep the schema and `EditModel` stable so this can
  attach later without a rewrite. Not built now.
- **Multi-receipt batch / history.** One receipt at a time; no persistence (nothing stored, by
  design — reinforces the privacy claim).
- **PDF invoices.** Vision path is image-only for v1. (A later phase could send a `document`
  block for PDFs — the schema already fits.)
- **Server-side receipt storage / accounts.** None; the demo is stateless.
- **Auth on the endpoint.** Deliberately public (CORS + rate limit only) so the demo works for
  any visitor.

### Schema decision to be aware of (not pre-locked, decided here)

"Confidence per field" is implemented as **per-field `{value,confidence}` on the six document
header/total fields**, and **per-row `confidence` + an `uncertain: LineField[]` array** on line
items (rather than `{value,confidence}` on every cell). Rationale: full per-cell confidence
objects on every line item roughly triple the output tokens and materially raise malformed-JSON
risk on Haiku 4.5 for receipts with many rows. The `uncertain[]` form gives true field-level
flagging (the UI flags exactly the named fields) at a fraction of the token cost and far higher
reliability. If Sean wants literal per-cell confidence later, upgrade `RawLineItem` fields to
`Confident<T>` and adjust `toEditModel` — the UI's `fieldFlagged` already keys off field names,
so the table needs no structural change.
