import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent border-accent hover:opacity-90',
  secondary: 'bg-card text-ink border-line hover:border-ink-2',
  quiet: 'bg-transparent text-ink-2 border-transparent hover:text-ink',
}

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-ui border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}

export function CopyButton({ text, label = 'Copy', variant = 'secondary', onCopied }: { text: string; label?: string; variant?: Variant; onCopied?: () => void }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
      onCopied?.()
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 1800)
  }
  return (
    <Button variant={variant} onClick={copy} disabled={!text.trim()} aria-live="polite">
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Copy blocked: select and copy' : label}
    </Button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-ui border border-line bg-card p-4 sm:p-6 ${className}`}>{children}</div>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold">{label}</span>
      {hint && <span className="mt-1 block text-sm text-ink-2">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

export const inputClass = 'w-full rounded-ui border border-line bg-paper px-3 py-2 text-base placeholder:text-ink-2/70 focus:border-accent focus:outline-none'

export function TextArea({ rows = 4, mono = false, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return <textarea rows={rows} className={`${inputClass} resize-y ${mono ? 'font-mono text-sm' : ''}`} {...rest} />
}

export function Pre({ children }: { children: string }) {
  return <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-ui border border-line bg-paper p-4 font-mono text-sm leading-relaxed">{children}</pre>
}
