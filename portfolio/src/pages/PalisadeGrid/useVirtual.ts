import { useMemo } from 'react'

export const ROW_H = 36       // px — fixed row height (never measured)
export const HEADER_H = 40    // sticky header
export const FILTER_H = 36    // sticky filter row
export const STICKY = HEADER_H + FILTER_H
export const OVERSCAN = 8     // rows rendered beyond each edge

export type Window = { start: number; end: number; padTop: number; totalHeight: number }

/**
 * Compute the visible row window from the container's scrollTop + height.
 * Rows live below the sticky header+filter (STICKY px), so we subtract that
 * offset. No per-row DOM measurement — every row is exactly ROW_H, so the
 * window is pure arithmetic and layout never thrashes.
 */
export function computeWindow(scrollTop: number, viewportH: number, total: number): Window {
  const scrolled = Math.max(0, scrollTop - STICKY)
  const start = Math.max(0, Math.floor(scrolled / ROW_H) - OVERSCAN)
  const visible = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2
  const end = Math.min(total, start + visible)
  return { start, end, padTop: start * ROW_H, totalHeight: total * ROW_H }
}

export function useVirtual(scrollTop: number, viewportH: number, total: number): Window {
  return useMemo(() => computeWindow(scrollTop, viewportH, total), [scrollTop, viewportH, total])
}

/** Desired scrollTop so view-row `r` is fully visible below the sticky head. */
export function scrollToRow(r: number, scrollTop: number, viewportH: number): number {
  const top = STICKY + r * ROW_H
  const bottom = top + ROW_H
  if (top < scrollTop + STICKY) return top - STICKY
  if (bottom > scrollTop + viewportH) return bottom - viewportH
  return scrollTop
}

/** Rows that fit in the viewport (for PageUp/PageDown). */
export function pageRows(viewportH: number): number {
  return Math.max(1, Math.floor((viewportH - STICKY) / ROW_H) - 1)
}
