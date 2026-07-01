import type { ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}

/** Wraps children in a scroll-reveal container (reduced-motion safe). */
export function Reveal({ children, className = '', delay = 0, as = 'div' }: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const Tag = as as 'div'
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'reveal-on' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
