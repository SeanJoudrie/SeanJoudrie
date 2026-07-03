import type { ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'
import { useScrollProgress } from '../hooks/useScrollProgress'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}

/**
 * Scroll-reveal container. Two mechanisms share the element: useReveal's
 * one-shot `.reveal-on` (keeps the stagger-delay contract) and
 * useScrollProgress's `--reveal` custom property, which the CSS consumes to
 * scrub opacity/transform with scroll position — reversible on the way back
 * up, and inherited by `.parallax-*` children for layered drift.
 * Reduced-motion safe on both paths.
 */
export function Reveal({ children, className = '', delay = 0, as = 'div' }: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const progressRef = useScrollProgress<HTMLDivElement>()
  const Tag = as as 'div'
  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    progressRef.current = el
  }
  return (
    <Tag
      ref={setRef}
      className={`reveal ${shown ? 'reveal-on' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
