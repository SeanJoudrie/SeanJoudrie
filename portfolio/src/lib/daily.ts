import type { ReactNode } from 'react'
import { createElement as h } from 'react'

/**
 * The daily-round engine — the same idea Globalio's Daily Challenge runs on:
 * a tiny PRNG seeded from the date alone, so every visitor on Earth gets the
 * same puzzle today with zero backend. Shared by the hero FlagGame and the
 * Lab's Seed Scrubber.
 */

export type Flag = { name: string; draw: () => ReactNode }

export const FLAG_W = 60
export const FLAG_H = 40

const rect = (props: Record<string, unknown>) => h('rect', props)

/** Vertical thirds */
const v3 = (a: string, b: string, c: string) => () =>
  h('g', {}, rect({ width: 20, height: FLAG_H, fill: a }), rect({ x: 20, width: 20, height: FLAG_H, fill: b }), rect({ x: 40, width: 20, height: FLAG_H, fill: c }))
/** Horizontal thirds */
const h3 = (a: string, b: string, c: string) => () =>
  h('g', {}, rect({ width: FLAG_W, height: 13.33, fill: a }), rect({ y: 13.33, width: FLAG_W, height: 13.34, fill: b }), rect({ y: 26.67, width: FLAG_W, height: 13.33, fill: c }))
/** Horizontal halves */
const h2 = (a: string, b: string) => () =>
  h('g', {}, rect({ width: FLAG_W, height: FLAG_H / 2, fill: a }), rect({ y: FLAG_H / 2, width: FLAG_W, height: FLAG_H / 2, fill: b }))
/** Nordic cross */
const nordic = (bg: string, cross: string, inner?: string) => () =>
  h(
    'g',
    {},
    rect({ width: FLAG_W, height: FLAG_H, fill: bg }),
    rect({ x: 16, width: inner ? 10 : 8, height: FLAG_H, fill: cross }),
    rect({ y: 16, width: FLAG_W, height: inner ? 10 : 8, fill: cross }),
    ...(inner
      ? [rect({ x: 19, width: 4, height: FLAG_H, fill: inner }), rect({ y: 19, width: FLAG_W, height: 4, fill: inner })]
      : []),
  )

export const FLAGS: Flag[] = [
  { name: 'France', draw: v3('#0055A4', '#fff', '#EF4135') },
  { name: 'Italy', draw: v3('#009246', '#fff', '#CE2B37') },
  { name: 'Ireland', draw: v3('#169B62', '#fff', '#FF883E') },
  { name: 'Nigeria', draw: v3('#008751', '#fff', '#008751') },
  { name: 'Germany', draw: h3('#000', '#DD0000', '#FFCE00') },
  { name: 'Netherlands', draw: h3('#AE1C28', '#fff', '#21468B') },
  { name: 'Austria', draw: h3('#ED2939', '#fff', '#ED2939') },
  { name: 'Poland', draw: h2('#fff', '#DC143C') },
  { name: 'Ukraine', draw: h2('#0057B7', '#FFD700') },
  {
    name: 'Japan',
    draw: () =>
      h('g', {}, rect({ width: FLAG_W, height: FLAG_H, fill: '#fff' }), h('circle', { cx: 30, cy: 20, r: 11, fill: '#BC002D' })),
  },
  { name: 'Sweden', draw: nordic('#006AA7', '#FECC02') },
  { name: 'Denmark', draw: nordic('#C8102E', '#fff') },
  { name: 'Finland', draw: nordic('#fff', '#002F6C') },
  { name: 'Norway', draw: nordic('#BA0C2F', '#fff', '#00205B') },
  { name: 'Iceland', draw: nordic('#02529C', '#fff', '#DC1E35') },
]

/** mulberry32 — 32-bit seeded PRNG, deterministic across every device. */
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const EPOCH_UTC = Date.UTC(2026, 0, 1)
export const SEED_BASE = 20260101

/** Days since the game epoch for a given date (UTC-truncated). */
export function dayNumberFor(date: Date) {
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH_UTC) / 86400000)
}

export type Round = { answer: Flag; options: Flag[]; dayNumber: number; seed: number }

/**
 * Fair rotation: each N-day cycle is a fresh deterministic shuffle of the
 * whole deck, so every flag appears exactly once per cycle — no repeats.
 * The seam between cycles is guarded so the first flag of a cycle can never
 * equal the last flag of the previous one.
 */
function rawPerm(cycle: number): number[] {
  const rand = mulberry32(SEED_BASE + cycle * 7919)
  const idx = FLAGS.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

function permFor(cycle: number): number[] {
  const p = rawPerm(cycle)
  // The seam guard only ever swaps positions 0/1, so the previous cycle's
  // *displayed* last entry is always its raw last entry.
  const prevLast = rawPerm(cycle - 1)[FLAGS.length - 1]
  if (p[0] === prevLast) [p[0], p[1]] = [p[1], p[0]]
  return p
}

/** The whole trick: date → seed → identical round for everyone. */
export function roundForDay(dayNumber: number): Round {
  const seed = dayNumber + SEED_BASE
  const N = FLAGS.length
  const cycle = Math.floor(dayNumber / N)
  const pos = ((dayNumber % N) + N) % N
  const answer = FLAGS[permFor(cycle)[pos]]

  // Distractors + option order come from the day seed.
  const rand = mulberry32(seed)
  const others = FLAGS.filter((f) => f !== answer)
    .map((f) => ({ f, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 3)
    .map((x) => x.f)
  const options = [answer, ...others]
    .map((f) => ({ f, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.f)
  return { answer, options, dayNumber, seed }
}

export function todaysRound(): Round {
  return roundForDay(dayNumberFor(new Date()))
}
