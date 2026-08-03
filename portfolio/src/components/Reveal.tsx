import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}

/**
 * Scroll-reveal container.
 *
 * The opacity/transform scrub itself is pure CSS — a `view()` timeline driven
 * by the compositor (see .reveal in index.css). Nothing in JS writes visibility
 * any more, so there is no observer state that can go stale and leave a block
 * stranded mid-fade, and there is one fewer IntersectionObserver per element.
 *
 * useReveal stays for the one-shot `.reveal-on` class, which a couple of
 * sub-effects hang off (the dimension lines that draw across, the fanning
 * screenshot stacks). Those are one-way and cheap.
 */
export function Reveal({ children, className = '', delay = 0, as = 'div' }: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const Tag = as as 'div'

  // Stagger a grid so its cards cascade instead of snapping in as one block.
  const style = delay ? ({ transitionDelay: `${delay}ms` } as CSSProperties) : undefined

  return (
    <Tag ref={ref} className={`reveal ${shown ? 'reveal-on' : ''} ${className}`} style={style}>
      {children}
    </Tag>
  )
}
