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
