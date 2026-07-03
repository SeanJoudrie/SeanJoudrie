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
