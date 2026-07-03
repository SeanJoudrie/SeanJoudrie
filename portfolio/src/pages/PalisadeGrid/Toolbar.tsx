import { useState } from 'react'
import type { Action, State } from './model'

type Props = {
  state: State
  dispatch: (a: Action) => void
  viewCount: number
  onExport: () => void
  onJump: (viewRow: number) => void
}

export function Toolbar({ state, dispatch, viewCount, onExport, onJump }: Props) {
  const [jump, setJump] = useState('')
  const editCount = state.edits.size
  const filtered = viewCount !== 10000

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-palisade-line bg-palisade-card px-3 py-2">
      <input
        type="search"
        value={state.search}
        onChange={(e) => dispatch({ t: 'search', value: e.target.value })}
        placeholder="Search all columns…"
        aria-label="Search all columns"
        className="h-8 w-56 rounded-md border border-palisade-line bg-palisade-bg px-2.5 text-sm text-palisade-ink placeholder:text-palisade-muted outline-none focus-visible:border-palisade-accent"
      />

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => dispatch({ t: 'undo' })} disabled={!state.undo.length}
          className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2 disabled:opacity-40"
          title="Undo (Ctrl+Z)">↶ Undo</button>
        <button type="button" onClick={() => dispatch({ t: 'redo' })} disabled={!state.redo.length}
          className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2 disabled:opacity-40"
          title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); const n = parseInt(jump, 10); if (n >= 1 && n <= viewCount) onJump(n - 1) }}
        className="flex items-center gap-1"
      >
        <label htmlFor="pal-jump" className="palisade-label">Row</label>
        <input id="pal-jump" value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric" placeholder="#" aria-label="Jump to row number"
          className="h-8 w-20 rounded-md border border-palisade-line bg-palisade-bg px-2 text-sm text-palisade-ink outline-none focus-visible:border-palisade-accent" />
        <button type="submit" className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2">Go</button>
      </form>

      <button type="button" onClick={onExport}
        className="h-8 rounded-md border border-palisade-accent/50 bg-palisade-accent/10 px-2.5 text-sm font-medium text-palisade-accent hover:bg-palisade-accent/20">
        Export CSV
      </button>

      <button type="button" onClick={() => dispatch({ t: 'reset' })}
        className="h-8 rounded-md border border-palisade-line px-2.5 text-sm text-palisade-ink-2 hover:bg-palisade-card-2">
        Reset
      </button>

      <div className="ml-auto flex items-center gap-3 font-mono text-xs text-palisade-muted">
        {editCount > 0 && <span className="text-palisade-accent">{editCount} edited</span>}
        <span aria-live="off">
          {filtered ? <><span className="text-palisade-ink-2">{viewCount.toLocaleString()}</span> / 10,000 rows</> : <>10,000 rows</>}
        </span>
      </div>
    </div>
  )
}
