/**
 * Brand constants. The name is still undecided (see docs/REVIEW.md §8); change
 * it here and nowhere else.
 */
export const BRAND = {
  name: 'Algorithm Builder',
  mascot: 'Gus',
  tagline: 'Your feed’s stuck on repeat. Let’s fix it.',
  /** Buy Me a Coffee / Ko-fi page. Set VITE_TIP_URL; the tip line hides when empty. */
  tipUrl: (import.meta.env.VITE_TIP_URL as string | undefined) ?? '',
}
