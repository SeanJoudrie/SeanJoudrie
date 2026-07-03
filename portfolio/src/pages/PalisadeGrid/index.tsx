import { useEffect, useMemo, useReducer, useState } from 'react'
import { navigate } from '../../lib/router'
import { Toolbar } from './Toolbar'
import { Grid } from './Grid'
import { deriveView, initialState, orderedCols, reducer } from './model'
import { exportCSV } from './csv'
import './theme.css'

/** Wordmark spark — a tiny stack of grid rows. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect width="20" height="20" rx="5" fill="var(--color-palisade-accent)" opacity="0.16" />
      <rect x="4" y="5" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-accent)" />
      <rect x="4" y="9" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-ink-2)" />
      <rect x="4" y="13" width="12" height="2.5" rx="1.25" fill="var(--color-palisade-ink-2)" />
    </svg>
  )
}

export default function PalisadeGrid() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [jumpSignal, setJumpSignal] = useState<number | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const view = useMemo(() => deriveView(state), [state.edits, state.sort, state.filters, state.search])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cols = useMemo(() => orderedCols(state), [state.cols, state.pinned])

  useEffect(() => {
    document.body.classList.add('palisade-page')
    const prev = document.title
    document.title = 'Palisade — Cascadia Freight manifest'
    return () => { document.body.classList.remove('palisade-page'); document.title = prev }
  }, [])

  return (
    <div className="palisade-root flex h-svh flex-col bg-palisade-bg text-palisade-ink">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-palisade-line bg-palisade-bg/85 px-5 backdrop-blur sm:px-6">
        <button onClick={() => navigate('#work')}
          className="font-mono text-xs tracking-wide text-palisade-muted transition-colors hover:text-palisade-ink">
          ← Portfolio
        </button>
        <span aria-hidden="true" className="h-4 w-px bg-palisade-line" />
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-semibold tracking-tight">Palisade</span>
          <span className="rounded-full border border-palisade-accent/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-palisade-accent">Demo</span>
        </div>
        <p className="palisade-label ml-auto hidden sm:block">10,000 rows · hand-rolled virtualization · zero grid libraries</p>
      </header>

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 px-5 pt-4 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Shipment manifest</h1>
          <p className="text-xs text-palisade-ink-2">Cascadia Freight Systems · one seeded dataset · edits are session-only</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-5 pb-4 pt-3 sm:px-6">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-palisade-line">
          <Toolbar
            state={state}
            dispatch={dispatch}
            viewCount={view.length}
            onExport={() => exportCSV(view, cols, state.edits)}
            onJump={(r) => setJumpSignal(r)}
          />
          <div className="relative min-h-0 flex-1">
            {view.length === 0 ? (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <p className="text-sm text-palisade-ink-2">No shipments match your filters.</p>
                  <button onClick={() => dispatch({ t: 'reset' })}
                    className="mt-2 text-sm font-medium text-palisade-accent hover:underline">Clear filters</button>
                </div>
              </div>
            ) : (
              <Grid
                state={state}
                dispatch={dispatch}
                view={view}
                scrollToRowSignal={jumpSignal}
                onScrollHandled={() => setJumpSignal(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Screen-reader status line — the active cell + result summary. */}
      <div aria-live="polite" className="sr-only">{state.announce}</div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-palisade-line px-5 py-2.5 sm:px-6">
        <p className="font-mono text-[0.7rem] text-palisade-muted">
          Windowed virtualization · roving active cell · TSV copy/paste · undo-redo — no grid library, no backend.
        </p>
        <button onClick={() => navigate('#work')}
          className="font-mono text-xs text-palisade-muted transition-colors hover:text-palisade-ink">Back to the portfolio →</button>
      </footer>
    </div>
  )
}
