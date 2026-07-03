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
