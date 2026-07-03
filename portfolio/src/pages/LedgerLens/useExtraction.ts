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
