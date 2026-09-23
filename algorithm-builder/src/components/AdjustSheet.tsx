import { useEffect, useRef } from 'react'
import { COPY } from '../copy'
import type { Mix } from '../lib/types'
import { MixStep } from './MixStep'
import { Button } from './ui'

/**
 * "Change it": the feed editor in a native <dialog>, so focus is trapped,
 * Escape closes it, and screen readers announce it. Full screen on phones,
 * a side panel on desktop.
 */
export function AdjustSheet({ open, mix, onChange, onClose }: { open: boolean; mix: Mix; onChange: (m: Mix) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const c = COPY.adjust
  return (
    <dialog
      ref={ref}
      aria-labelledby="adjust-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-[560px] border-0 bg-paper p-0 text-ink sm:border-l sm:border-line"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <h2 id="adjust-title" className="font-display m-0 text-xl font-bold">
            {c.title}
          </h2>
          <Button onClick={onClose}>{c.done}</Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <p className="m-0 mb-4 text-base text-ink-2">{c.lead}</p>
          {open && <MixStep mix={mix} onChange={onChange} />}
        </div>
      </div>
    </dialog>
  )
}
