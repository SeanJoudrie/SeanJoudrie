// portfolio/src/components/CommandPalette.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBodyLock } from '../hooks/useBodyLock'
import { highlightSegments } from '../lib/fuzzy'
import {
  commands,
  scoreCommand,
  type Command,
  type CommandContext,
  type CommandGroup,
  type ScoredCommand,
} from '../data/commands'
import {
  registerPaletteOpener,
  isTypingTarget,
} from '../hooks/useCommandPalette'

const GROUP_ORDER: CommandGroup[] = ['Pages', 'Demos', 'Actions']

type Grouped = { group: CommandGroup; items: ScoredCommand[] }

/** Build the grouped + flat result model for a query. Flat order === visual
 *  order, so the roving activeIndex maps straight onto rendered rows. */
function computeResults(query: string): { groups: Grouped[]; flat: ScoredCommand[] } {
  const scored: ScoredCommand[] = []
  for (const cmd of commands) {
    const s = scoreCommand(query, cmd)
    if (s) scored.push(s)
  }
  const groups: Grouped[] = []
  const flat: ScoredCommand[] = []
  for (const group of GROUP_ORDER) {
    const items = scored
      .filter((s) => s.cmd.group === group)
      // Empty query → keep registry order (score 0). Otherwise best first.
      .sort((a, b) => (b.score - a.score) || 0)
    if (items.length === 0) continue
    groups.push({ group, items })
    flat.push(...items)
  }
  return { groups, flat }
}

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')

  const triggerRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useBodyLock(open)

  const { groups, flat } = useMemo(() => computeResults(query), [query])

  // --- open -----------------------------------------------------------------
  const doOpen = useCallback(() => {
    triggerRef.current = (document.activeElement as HTMLElement) ?? null
    setQuery('')
    setActiveIndex(0)
    setToast(null)
    setClosing(false)
    setOpen(true)
  }, [])

  // Expose open() to the Nav pill / mobile button.
  useEffect(() => {
    registerPaletteOpener(doOpen)
    return () => registerPaletteOpener(null)
  }, [doOpen])

  // --- close ----------------------------------------------------------------
  const finishClose = useCallback(() => {
    setOpen(false)
    setClosing(false)
    const t = triggerRef.current
    if (t && document.contains(t) && typeof t.focus === 'function') {
      t.focus()
    } else {
      document.getElementById('cmdk-pill')?.focus()
    }
  }, [])

  const doClose = useCallback(() => {
    if (reducedMotion()) {
      finishClose()
      return
    }
    setClosing(true) // onAnimationEnd → finishClose
  }, [finishClose])

  const onPanelAnimationEnd = (e: React.AnimationEvent) => {
    if (closing && e.target === e.currentTarget) finishClose()
  }

  // --- global hotkeys (always mounted; guard "/" against form fields) -------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')
      if (cmdK) {
        e.preventDefault()
        // Mid-exit counts as closed: ⌘K during the exit animation reopens
        // (doOpen resets `closing`), never double-closes and eats the press.
        if (open && !closing) doClose()
        else doOpen()
        return
      }
      if (
        e.key === '/' &&
        (!open || closing) &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault()
        doOpen()
        return
      }
      // Esc clears the survey-grid easter egg when the palette is closed
      // (or already on its way out — an open palette eats Esc in its input).
      if (
        e.key === 'Escape' &&
        (!open || closing) &&
        document.documentElement.classList.contains('survey-grid')
      ) {
        document.documentElement.classList.remove('survey-grid')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closing, doOpen, doClose])

  // --- focus the input on open ----------------------------------------------
  useEffect(() => {
    if (open && !closing) {
      // rAF so the element exists and the browser doesn't fight the animation.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, closing])

  // --- reset selection + announce count on query change ---------------------
  useEffect(() => {
    setActiveIndex(0)
    if (open) {
      setAnnounce(
        flat.length === 0
          ? `No commands match ${query}`
          : `${flat.length} ${flat.length === 1 ? 'command' : 'commands'}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open])

  // --- keep the active row in view ------------------------------------------
  useEffect(() => {
    if (!open) return
    const el = document.getElementById(`cmdk-opt-${activeIndex}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  // --- toast lifecycle ------------------------------------------------------
  const showToast = useCallback((message: string) => {
    setToast(message)
    setAnnounce(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // --- run a command --------------------------------------------------------
  const runCommand = useCallback(
    (cmd: Command) => {
      const ctx: CommandContext = { close: doClose, toast: showToast }
      cmd.perform(ctx)
    },
    [doClose, showToast],
  )

  // --- input keyboard nav ---------------------------------------------------
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const len = flat.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (len) setActiveIndex((i) => (i + 1) % len)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (len) setActiveIndex((i) => (i - 1 + len) % len)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        if (len) setActiveIndex(len - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (len && flat[activeIndex]) runCommand(flat[activeIndex].cmd)
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        doClose()
        break
      case 'Tab':
        // Focus trap: the input is the only focusable element, so keep it here.
        e.preventDefault()
        break
    }
  }

  if (!open) return null

  const activeId = flat.length ? `cmdk-opt-${activeIndex}` : undefined

  return (
    <div
      className={`fixed inset-0 z-[80] bg-ink/30 backdrop-blur-[2px] ${
        closing ? 'palette-overlay-out' : 'palette-overlay'
      }`}
      // Click-outside: only when the backdrop itself is the click target.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) doClose()
      }}
      role="presentation"
    >
      <div
        className={`fixed left-1/2 top-[12vh] z-[90] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-paper shadow-[0_30px_80px_-32px_rgba(33,27,18,0.5)] ${
          closing ? 'palette-panel-out' : 'palette-panel'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onAnimationEnd={onPanelAnimationEnd}
      >
        {/* Input / combobox */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span aria-hidden="true" className="coord text-faint">‹›</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-listbox"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Command palette search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <ul
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-label="Commands"
          className="max-h-[52vh] overflow-y-auto py-1"
        >
          {flat.length === 0 && (
            <li role="presentation" className="fade-in px-4 py-10 text-center">
              <span className="coord text-faint">
                no commands match “{query}”
              </span>
            </li>
          )}

          {groups.map((g) => (
            <li key={g.group} role="presentation">
              <div
                id={`cmdk-group-${g.group}`}
                role="presentation"
                className="annotation px-4 pb-1 pt-3"
              >
                {g.group}
              </div>
              <ul role="group" aria-labelledby={`cmdk-group-${g.group}`}>
                {g.items.map((s) => {
                  const idx = flat.indexOf(s)
                  const active = idx === activeIndex
                  const segs = highlightSegments(s.cmd.title, s.positions)
                  return (
                    <li
                      key={s.cmd.id}
                      id={`cmdk-opt-${idx}`}
                      role="option"
                      aria-selected={active}
                      className={`palette-row mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
                        active ? 'bg-accent text-paper' : 'text-ink-2'
                      }`}
                      style={{ '--stagger': `${Math.min(idx, 8) * 18}ms` } as React.CSSProperties}
                      onMouseMove={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault() // keep focus in the input
                        runCommand(s.cmd)
                      }}
                    >
                      <span className="truncate text-sm font-medium">
                        {segs.map((seg, i) =>
                          seg.hit ? (
                            <mark
                              key={i}
                              className={`bg-transparent ${
                                active
                                  ? 'text-paper underline decoration-paper/60 underline-offset-2'
                                  : 'text-accent font-semibold'
                              }`}
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          ),
                        )}
                      </span>
                      {s.cmd.hint && (
                        <span
                          className={`coord shrink-0 ${
                            active ? 'text-paper/70' : 'text-faint'
                          }`}
                        >
                          {s.cmd.hint}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>

        {/* Footer hint row */}
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="coord text-faint">
            ↑↓ navigate · ↵ open · esc close
          </span>
          <span className="coord text-accent" aria-hidden="true">
            {toast ?? ''}
          </span>
        </div>
      </div>

      {/* Screen-reader live region: result counts + toasts. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>
  )
}
