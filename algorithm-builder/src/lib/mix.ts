/**
 * Mix math. Every set of sibling weights is a whole-number split of 100, and
 * every edit keeps it that way (F-08 auto-balance).
 */

interface Weighted {
  weight: number
  locked?: boolean
}

/**
 * Split `total` into whole numbers proportional to `shares` (largest-remainder
 * method), so the parts always add up to exactly `total`. Zero shares split
 * evenly.
 */
export function apportion(total: number, shares: number[]): number[] {
  if (shares.length === 0) return []
  const sum = shares.reduce((a, b) => a + b, 0)
  const basis = sum > 0 ? shares : shares.map(() => 1)
  const basisSum = sum > 0 ? sum : shares.length
  const exact = basis.map((s) => (s / basisSum) * total)
  const floors = exact.map(Math.floor)
  let left = total - floors.reduce((a, b) => a + b, 0)
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (left <= 0) break
    floors[i] += 1
    left -= 1
  }
  return floors
}

/**
 * Set item `index` to `value` and let the other unlocked items absorb the
 * difference in proportion to their current size. Locked items never move;
 * if nothing can absorb the change, the value is clamped.
 */
export function rebalance<T extends Weighted>(items: T[], index: number, value: number): T[] {
  const lockedSum = items.reduce((a, it, i) => (i !== index && it.locked ? a + it.weight : a), 0)
  const free = items.map((it, i) => i !== index && !it.locked)
  const hasFree = free.some(Boolean)
  const max = hasFree ? 100 - lockedSum : items[index].weight
  const next = Math.max(0, Math.min(Math.round(value), max))
  const rest = 100 - lockedSum - next
  const freeIdx = items.map((_, i) => i).filter((i) => free[i])
  const parts = apportion(rest, freeIdx.map((i) => items[i].weight))
  return items.map((it, i) => {
    if (i === index) return { ...it, weight: next }
    const k = freeIdx.indexOf(i)
    return k === -1 ? it : { ...it, weight: parts[k] }
  })
}

/** Evenly split 100 across the items, keeping order. */
export function evenly<T extends Weighted>(items: T[]): T[] {
  const parts = apportion(100, items.map(() => 1))
  return items.map((it, i) => ({ ...it, weight: parts[i] }))
}

/** Re-normalize after an item is added or removed. */
export function normalize<T extends Weighted>(items: T[]): T[] {
  const parts = apportion(100, items.map((it) => it.weight))
  return items.map((it, i) => ({ ...it, weight: parts[i] }))
}

export function sum(items: Weighted[]): number {
  return items.reduce((a, it) => a + it.weight, 0)
}
