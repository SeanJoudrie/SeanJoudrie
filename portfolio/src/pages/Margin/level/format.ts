/**
 * A level, encoded small enough to live in a URL.
 *
 * The chain is: integers → delta → zig-zag → varint → base64url. Segments are
 * delta-coded against the *previous segment's endpoint*, so a stroke drawn as
 * a chain of joined segments costs two zero bytes per join, which is most of
 * what a hand-drawn track is. A 200-segment level lands around 500 bytes.
 *
 * This exists at phase 2 rather than phase 8 because the determinism gate
 * round-trips through it: a level that changes under encode→decode is a level
 * whose share link does not reproduce, and that is exactly the failure the
 * whole design is arranged to prevent.
 *
 * Base64 is hand-rolled rather than taken from `btoa`/`Buffer` so this module
 * is identical in the browser, in Node, and in the CI gate.
 */
import type { Level } from '../sim/types.ts'

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const B64_INV = (() => {
  const t = new Int16Array(128).fill(-1)
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i
  return t
})()

const FORMAT_VERSION = 1

function zigzag(n: number): number {
  return (n << 1) ^ (n >> 31)
}
function unzigzag(n: number): number {
  return (n >>> 1) ^ -(n & 1)
}

function writeVarint(out: number[], value: number): void {
  let v = zigzag(value) >>> 0
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  out.push(v)
}

function toBase64(bytes: number[]): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : -1
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : -1
    s += B64[b0 >> 2]
    if (b1 < 0) {
      s += B64[(b0 & 3) << 4]
      break
    }
    s += B64[((b0 & 3) << 4) | (b1 >> 4)]
    if (b2 < 0) {
      s += B64[(b1 & 15) << 2]
      break
    }
    s += B64[((b1 & 15) << 2) | (b2 >> 6)]
    s += B64[b2 & 63]
  }
  return s
}

function fromBase64(s: string): number[] {
  const bytes: number[] = []
  let acc = 0
  let bits = 0
  for (let i = 0; i < s.length; i++) {
    const v = B64_INV[s.charCodeAt(i) & 0x7f]
    if (v < 0) continue
    acc = (acc << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 0xff)
    }
  }
  return bytes
}

export function encodeLevel(level: Level): string {
  const ints: number[] = []
  ints.push(FORMAT_VERSION)
  ints.push(level.r[0], level.r[1], level.r[2], level.r[3])
  ints.push(level.s[0], level.s[1])

  // Lines: brush, then the start delta-coded from the previous endpoint and
  // the end delta-coded from this start.
  ints.push(level.l.length)
  let px = 0
  let py = 0
  for (const [brush, x1, y1, x2, y2] of level.l) {
    ints.push(brush, x1 - px, y1 - py, x2 - x1, y2 - y1)
    px = x2
    py = y2
  }

  const runs = (rows: number[][], width: number) => {
    ints.push(rows.length)
    const prev = new Array<number>(width).fill(0)
    for (const row of rows) {
      for (let i = 0; i < width; i++) {
        ints.push(row[i] - prev[i])
        prev[i] = row[i]
      }
    }
  }
  runs(level.p as unknown as number[][], 8)
  runs(level.g as unknown as number[][], 3)
  runs(level.w as unknown as number[][], 6)

  const bytes: number[] = []
  for (const n of ints) writeVarint(bytes, n)
  return toBase64(bytes)
}

export function decodeLevel(text: string): Level | null {
  const bytes = fromBase64(text)
  let p = 0
  const readVarint = (): number => {
    let shift = 0
    let result = 0
    for (;;) {
      if (p >= bytes.length) throw new RangeError('truncated level')
      const b = bytes[p++]
      result |= (b & 0x7f) << shift
      if ((b & 0x80) === 0) break
      shift += 7
      if (shift > 35) throw new RangeError('varint too long')
    }
    return unzigzag(result >>> 0)
  }

  try {
    const version = readVarint()
    if (version !== FORMAT_VERSION) return null

    const r: Level['r'] = [readVarint(), readVarint(), readVarint(), readVarint()]
    const s: Level['s'] = [readVarint(), readVarint()]

    const nLines = readVarint()
    if (nLines < 0 || nLines > 200000) return null
    const l: Level['l'] = []
    let px = 0
    let py = 0
    for (let i = 0; i < nLines; i++) {
      const brush = readVarint()
      const x1 = px + readVarint()
      const y1 = py + readVarint()
      const x2 = x1 + readVarint()
      const y2 = y1 + readVarint()
      l.push([brush, x1, y1, x2, y2])
      px = x2
      py = y2
    }

    const runs = (width: number): number[][] => {
      const n = readVarint()
      if (n < 0 || n > 100000) throw new RangeError('bad count')
      const rows: number[][] = []
      const prev = new Array<number>(width).fill(0)
      for (let i = 0; i < n; i++) {
        const row = new Array<number>(width)
        for (let k = 0; k < width; k++) {
          row[k] = prev[k] + readVarint()
          prev[k] = row[k]
        }
        rows.push(row)
      }
      return rows
    }

    const pp = runs(8) as Level['p']
    const g = runs(3) as Level['g']
    const w = runs(6) as Level['w']

    return { v: 1, r, s, l, p: pp, g, w }
  } catch {
    return null
  }
}

/** `#/demos/margin?l=<string>` — sharing needs no backend of any kind. */
export function levelToHash(level: Level): string {
  return `#/demos/margin?l=${encodeLevel(level)}`
}

export function levelFromHash(hash: string): Level | null {
  const m = hash.match(/[?&]l=([A-Za-z0-9\-_]+)/)
  return m ? decodeLevel(m[1]) : null
}
