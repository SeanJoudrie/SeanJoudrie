import { COLUMN_BY_ID, parseValue, rawValue, type ColId, type Row } from './schema'
import { cellValue, mergedRow, type State } from './model'
import { ROWS } from './generate'

/**
 * Build a TSV string for the selection rectangle. Reads through the edit
 * overlay so copied values match what's on screen.
 */
export function selectionToTSV(
  view: number[], cols: ColId[], edits: State['edits'],
  rect: { r0: number; r1: number; c0: number; c1: number },
): string {
  const lines: string[] = []
  for (let r = rect.r0; r <= rect.r1; r++) {
    const rowIdx = view[r]
    const cells: string[] = []
    for (let c = rect.c0; c <= rect.c1; c++) {
      const col = COLUMN_BY_ID[cols[c]]
      cells.push(rawValue(col.type, cellValue(edits, rowIdx, col.id)))
    }
    lines.push(cells.join('\t'))
  }
  return lines.join('\n')
}

export type PasteResult = {
  cells: { rowId: string; colId: ColId; next: unknown }[]
  rejected: number
}

/**
 * Parse pasted TSV into edit cells, starting at (startR,startC) and clamped
 * to the grid bounds. Read-only and invalid cells are skipped and counted.
 */
export function tsvToEdits(
  tsv: string, view: number[], cols: ColId[], edits: State['edits'],
  startR: number, startC: number,
): PasteResult {
  const matrix = tsv.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'))
  const out: { rowId: string; colId: ColId; next: unknown }[] = []
  let rejected = 0

  for (let dr = 0; dr < matrix.length; dr++) {
    const vr = startR + dr
    if (vr >= view.length) break
    const rowIdx = view[vr]
    const rowId = ROWS[rowIdx].id
    // merged row + any earlier edits in this same paste, for cross-field checks
    const working: Row = { ...mergedRow(edits, rowIdx) }
    for (const e of out) if (e.rowId === rowId) (working as Record<string, unknown>)[e.colId] = e.next

    for (let dc = 0; dc < matrix[dr].length; dc++) {
      const vc = startC + dc
      if (vc >= cols.length) break
      const col = COLUMN_BY_ID[cols[vc]]
      if (!col.editable) { rejected++; continue }
      const res = parseValue(col, matrix[dr][dc], working)
      if (!res.ok) { rejected++; continue }
      ;(working as Record<string, unknown>)[col.id] = res.value
      out.push({ rowId, colId: col.id, next: res.value })
    }
  }
  return { cells: out, rejected }
}
