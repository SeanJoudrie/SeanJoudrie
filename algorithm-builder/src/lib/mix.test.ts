import { describe, expect, it } from 'vitest'
import { apportion, evenly, normalize, rebalance, removeAt, sum } from './mix'

const items = (...w: number[]) => w.map((weight) => ({ weight }))

describe('apportion', () => {
  it('always sums to the total', () => {
    expect(apportion(100, [1, 1, 1])).toEqual([34, 33, 33])
    expect(apportion(10, [0.5, 0.25, 0.25])).toEqual([5, 3, 2])
    expect(apportion(7, [0, 0])).toEqual([4, 3])
  })
  it('handles empty input', () => {
    expect(apportion(100, [])).toEqual([])
  })
})

describe('rebalance', () => {
  it('keeps the total at 100 by shrinking the others proportionally', () => {
    const out = rebalance(items(50, 30, 20), 0, 70)
    expect(out.map((i) => i.weight)).toEqual([70, 18, 12])
    expect(sum(out)).toBe(100)
  })

  it('never moves locked items', () => {
    const out = rebalance([{ weight: 40 }, { weight: 40, locked: true }, { weight: 20 }], 0, 55)
    expect(out.map((i) => i.weight)).toEqual([55, 40, 5])
  })

  it('clamps so locked items still fit', () => {
    const out = rebalance([{ weight: 40 }, { weight: 40, locked: true }, { weight: 20 }], 0, 90)
    expect(out.map((i) => i.weight)).toEqual([60, 40, 0])
  })

  it('refuses to move when every other item is locked', () => {
    const out = rebalance([{ weight: 60 }, { weight: 40, locked: true }], 0, 80)
    expect(out.map((i) => i.weight)).toEqual([60, 40])
  })

  it('grows zero-weight items evenly when shrinking', () => {
    const out = rebalance(items(100, 0, 0), 0, 50)
    expect(out.map((i) => i.weight)).toEqual([50, 25, 25])
  })

  it('stays whole-numbered under random edits', () => {
    let state = evenly(items(0, 0, 0, 0, 0))
    for (let n = 0; n < 500; n++) {
      const i = n % state.length
      state = rebalance(state, i, (n * 37) % 101)
      expect(sum(state)).toBe(100)
      for (const it of state) expect(Number.isInteger(it.weight) && it.weight >= 0).toBe(true)
    }
  })
})

describe('removeAt', () => {
  it('gives the removed share to unlocked items and keeps locks', () => {
    const out = removeAt([{ weight: 20 }, { weight: 30, locked: true }, { weight: 50 }], 0)
    expect(out.map((i) => i.weight)).toEqual([30, 70])
  })
  it('falls back to rescaling when everything left is locked', () => {
    const out = removeAt([{ weight: 20 }, { weight: 30, locked: true }], 0)
    expect(out.map((i) => i.weight)).toEqual([100])
  })
})

describe('normalize', () => {
  it('rescales to 100', () => {
    expect(normalize(items(50, 50, 50)).map((i) => i.weight)).toEqual([34, 33, 33])
  })
})
