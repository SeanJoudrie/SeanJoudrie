import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Mascot, type Pose } from './Mascot'

type Variant = 'primary' | 'secondary' | 'ghost'

const STYLES: Record<Variant, string> = {
  primary: 'bg-accent text-[#1d2126] hover:brightness-105 active:brightness-95 border-2 border-ink',
  secondary: 'bg-card text-ink border-2 border-ink hover:bg-paper-2',
  ghost: 'text-ink-2 hover:text-ink underline underline-offset-4',
}

/** Every button is at least 48px tall (docs/UX_AUDIT.md §10). */
export const buttonClass = (variant: Variant = 'primary', extra = '') =>
  `inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full px-5 text-center py-2 text-base font-semibold no-underline transition disabled:cursor-not-allowed disabled:opacity-50 ${STYLES[variant]} ${extra}`

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={buttonClass(variant, className)} />
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-card p-5 sm:p-6 ${className}`}>{children}</section>
}

export function Chip({
  selected,
  onClick,
  children,
  tone = 'accent',
  ...rest
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'accent' | 'alarm'
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const on = tone === 'alarm' ? 'border-alarm bg-alarm-soft text-ink' : 'border-ink bg-accent-soft text-ink'
  return (
    <button
      {...rest}
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 py-2 text-base font-medium transition disabled:opacity-50 ${
        selected ? on : 'border-line bg-card text-ink hover:border-ink-2'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * The question at the top of each screen: one heading that asks it, and at
 * most one short line under it. Nested use (inside a card or sheet) is an h2
 * without Gus.
 */
export function StepHeader({ pose, title, say, nested = false }: { pose: Pose; title: string; say?: string; nested?: boolean }) {
  if (nested)
    return (
      <header className="mb-4">
        <h2 className="font-display m-0 text-xl font-bold leading-tight text-ink">{title}</h2>
        {say && <p className="m-0 mt-2 text-base text-ink-2">{say}</p>}
      </header>
    )
  return (
    <header className="mb-6 flex items-start gap-3 sm:gap-4">
      <Mascot pose={pose} size={56} className="shrink-0" />
      <div className="min-w-0 pt-1">
        <h1 tabIndex={-1} className="font-display m-0 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {say && <p className="m-0 mt-2 text-base text-ink-2">{say}</p>}
      </div>
    </header>
  )
}

/** A text field that matches the buttons: 48px tall, 18px text (no iOS zoom). */
export const inputClass =
  'min-h-12 w-full min-w-0 flex-1 basis-56 rounded-full border-2 border-line bg-card px-4 text-base text-ink placeholder:text-muted focus:border-ink'
