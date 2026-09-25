import { useCallback, useEffect, useState } from 'react'
import { seeds } from '../data/seeds'
import { load, save } from './storage'

export type Rating = 'great' | 'ok' | 'bad'

export interface Entry {
  id: string
  title: string
  body: string
  tags: string[]
  rating?: Rating
  notes?: string
  source?: string
  /** Lab test this prompt was tried in, if any. */
  lab?: string
  created: string
  uses: number
  /** Ships with the app (from src/data/seeds.ts). Can be rated but not deleted. */
  seeded?: boolean
}

type SeedPatch = Pick<Entry, 'rating' | 'notes' | 'uses'>

const MINE = 'pp.library.v1'
const PATCHES = 'pp.library.seedPatches.v1'

export const ratingOrder: Record<Rating | 'none', number> = { great: 0, ok: 1, none: 2, bad: 3 }
export const ratingLabel: Record<Rating, string> = { great: 'Worked great', ok: 'Worked OK', bad: 'Didn’t work' }

const newId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function useLibrary() {
  const [mine, setMine] = useState<Entry[]>(() => load(MINE, []))
  const [patches, setPatches] = useState<Record<string, SeedPatch>>(() => load(PATCHES, {}))

  useEffect(() => save(MINE, mine), [mine])
  useEffect(() => save(PATCHES, patches), [patches])

  const entries: Entry[] = [...seeds.map((s) => ({ ...s, ...patches[s.id], seeded: true })), ...mine]

  const add = useCallback((e: Omit<Entry, 'id' | 'created' | 'uses'>) => {
    const entry: Entry = { ...e, id: newId(), created: new Date().toISOString(), uses: 0 }
    setMine((m) => [entry, ...m])
    return entry.id
  }, [])

  const update = useCallback((id: string, patch: Partial<Entry>) => {
    if (seeds.some((s) => s.id === id)) {
      // Seeds keep their text; only the rating, notes and use count are yours.
      const allowed = Object.fromEntries(Object.entries(patch).filter(([k]) => k === 'rating' || k === 'notes' || k === 'uses'))
      setPatches((p) => ({ ...p, [id]: { ...p[id], ...allowed } }))
    } else {
      setMine((m) => m.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    }
  }, [])

  const remove = useCallback((id: string) => setMine((m) => m.filter((e) => e.id !== id)), [])

  /** Merges an exported file: same id replaces, new ids are added. Returns how many came in. */
  const importJson = useCallback((text: string) => {
    const data = JSON.parse(text) as { entries?: Entry[] }
    const incoming = (data.entries ?? []).filter((e) => e && typeof e.body === 'string' && typeof e.title === 'string')
    const seedIds = new Set(seeds.map((s) => s.id))
    setMine((m) => {
      const byId = new Map(m.map((e) => [e.id, e]))
      for (const e of incoming) if (!seedIds.has(e.id)) byId.set(e.id, { ...e, seeded: undefined, tags: e.tags ?? [], uses: e.uses ?? 0 })
      return [...byId.values()]
    })
    for (const e of incoming) if (seedIds.has(e.id)) update(e.id, { rating: e.rating, notes: e.notes, uses: e.uses ?? 0 })
    return incoming.length
  }, [update])

  const exportJson = useCallback(() => JSON.stringify({ app: 'perfect-prompt', version: 1, exported: new Date().toISOString(), entries }, null, 2), [entries])

  return { entries, add, update, remove, importJson, exportJson }
}
