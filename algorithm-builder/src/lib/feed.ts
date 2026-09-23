import type { Feed } from '../data/library'

/*
 * Recent uploads from good channels live in their own file (about 90 kB),
 * loaded once. It starts downloading while people answer the questions, so
 * the results page doesn't wait for it.
 */
let load: Promise<Feed | null> | null = null

export const loadFeed = () => (load ??= import('../data/feed.json').then((m) => m.default as Feed).catch(() => null))
