import { useCallback, useRef, useState } from 'react'
import type { ExtractInput } from './useExtraction'

const MAX_IMAGE_BYTES = 4_500_000 // ~4.5MB raw file; base64 stays under the 5MB function cap
const MAX_TEXT_CHARS = 12_000

export function Dropzone({ onSubmit, disabled }: { onSubmit: (i: ExtractInput) => void; disabled: boolean }) {
  const [mode, setMode] = useState<'image' | 'text'>('image')
  const [drag, setDrag] = useState(false)
  const [text, setText] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const takeFile = useCallback(
    (file: File) => {
      setNote(null)
      if (!file.type.startsWith('image/')) {
        setNote('That file is not an image. Use a photo of a receipt, or paste text below.')
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setNote('That image is over 4.5 MB. Try a smaller photo.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => onSubmit({ mode: 'image', dataUrl: String(reader.result) })
      reader.onerror = () => setNote('Could not read that file.')
      reader.readAsDataURL(file)
    },
    [onSubmit],
  )

  const submitText = () => {
    const t = text.trim()
    if (!t) return setNote('Paste some receipt text or CSV first.')
    if (t.length > MAX_TEXT_CHARS) return setNote(`That paste is too long (${t.length} chars). Trim to under ${MAX_TEXT_CHARS}.`)
    setNote(null)
    onSubmit({ mode: 'text', text: t })
  }

  return (
    <div className="rounded-xl border border-ledger-line bg-ledger-card p-5">
      <div className="mb-4 flex gap-1" role="tablist" aria-label="Input mode">
        {(['image', 'text'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m ? 'bg-ledger-card-2 text-ledger-ink' : 'text-ledger-muted hover:text-ledger-ink'
            }`}
          >
            {m === 'image' ? 'Upload photo' : 'Paste text / CSV'}
          </button>
        ))}
      </div>

      {mode === 'image' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files?.[0]
            if (f) takeFile(f)
          }}
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files)[0]
            if (f) takeFile(f)
          }}
          className={`grid place-items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            drag ? 'border-ledger-mint bg-ledger-card-2' : 'border-ledger-line'
          }`}
        >
          <p className="text-sm text-ledger-ink-2">
            Drop a receipt photo, paste an image, or{' '}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="font-semibold text-ledger-mint underline underline-offset-2 disabled:opacity-50"
            >
              choose a file
            </button>
            .
          </p>
          <p className="ledger-label mt-2">JPEG / PNG · up to 4.5 MB · nothing is stored</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) takeFile(f)
              e.target.value = ''
            }}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="ll-paste" className="ledger-label">
            Messy receipt text or CSV
          </label>
          <textarea
            id="ll-paste"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={'THE DAILY GRIND\nCappuccino L  2  4.75  9.50\nCroissant  1  3.95  3.95\nTOTAL 13.45'}
            className="ledger-num mt-2 w-full resize-y rounded-lg border border-ledger-line bg-ledger-card-2 p-3 text-sm text-ledger-ink placeholder:text-ledger-muted"
          />
          <button
            onClick={submitText}
            disabled={disabled}
            className="springy mt-3 rounded-lg bg-ledger-mint px-4 py-2 font-semibold text-ledger-bg disabled:opacity-50"
          >
            Extract from text →
          </button>
        </div>
      )}

      {note && (
        <p className="fade-in mt-3 text-sm" style={{ color: 'var(--color-ledger-flag)' }} role="status">
          {note}
        </p>
      )}
    </div>
  )
}
