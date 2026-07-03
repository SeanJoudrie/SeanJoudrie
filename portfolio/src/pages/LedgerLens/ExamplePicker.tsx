import { useEffect, useRef } from 'react'
import { EXAMPLES, renderReceipt, type ReceiptSpec } from './receipts'
import type { ExtractInput } from './useExtraction'

function ExampleCard({ spec, onPick, disabled }: { spec: ReceiptSpec; onPick: (i: ExtractInput) => void; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) renderReceipt(canvasRef.current, spec, 240)
  }, [spec])

  return (
    <button
      onClick={() => {
        const c = canvasRef.current
        if (c) onPick({ mode: 'image', dataUrl: c.toDataURL('image/jpeg', 0.9) })
      }}
      disabled={disabled}
      aria-label={`Extract the ${spec.label} example receipt`}
      className="plate-lift group flex flex-col items-center overflow-hidden rounded-xl border border-ledger-line bg-ledger-card p-4 disabled:opacity-60"
    >
      <span className="mb-3 self-start">
        <span className="ledger-label">{spec.label}</span>
      </span>
      <canvas ref={canvasRef} className="rounded-md shadow-[0_16px_30px_-18px_rgba(0,0,0,0.8)]" />
      <span className="mt-3 text-xs font-semibold text-ledger-mint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Read this receipt →
      </span>
    </button>
  )
}

export function ExamplePicker({ onPick, disabled }: { onPick: (i: ExtractInput) => void; disabled: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="ledger-label">Or read a generated example</h2>
        <span className="ledger-label">Rendered to canvas · no downloaded assets</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {EXAMPLES.map((s) => (
          <ExampleCard key={s.id} spec={s} onPick={onPick} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
