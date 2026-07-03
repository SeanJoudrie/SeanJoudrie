import { COLUMN_BY_ID, rawValue, type ColId } from './schema'
import { cellValue, type State } from './model'

/** RFC-4180 field quoting. */
const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/**
 * Export the CURRENT view — current filter, current sort, current column
 * order (pinned first) — as CSV, and trigger a download. Session edits are
 * reflected. Nothing hits a server.
 */
export function exportCSV(view: number[], cols: ColId[], edits: State['edits']): void {
  const header = cols.map((id) => q(COLUMN_BY_ID[id].header)).join(',')
  const body = view.map((rowIdx) =>
    cols.map((id) => q(rawValue(COLUMN_BY_ID[id].type, cellValue(edits, rowIdx, id)))).join(','),
  )
  const csv = [header, ...body].join('\r\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cascadia-manifest-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
