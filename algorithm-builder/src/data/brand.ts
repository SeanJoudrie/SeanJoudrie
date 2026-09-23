/**
 * Brand constants. The name is still undecided (see docs/REVIEW.md §8); change
 * it here and nowhere else.
 */
export const BRAND = {
  name: 'Algorithm Builder',
  mascot: 'Gus',
  tagline: 'Fix a feed that’s stuck on one topic.',
  repo: 'https://github.com/SeanJoudrie/SeanJoudrie/tree/main/algorithm-builder',
  /** Buy Me a Coffee / Ko-fi page. Set VITE_TIP_URL; the tip line hides when empty. */
  tipUrl: (import.meta.env.VITE_TIP_URL as string | undefined) ?? '',
}
