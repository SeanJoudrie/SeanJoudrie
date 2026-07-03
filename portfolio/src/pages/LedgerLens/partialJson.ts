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
