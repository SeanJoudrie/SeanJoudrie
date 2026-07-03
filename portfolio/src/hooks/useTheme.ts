import { useLayoutEffect, useState } from 'react'
import { CUSTOM_THEME_ID, CUSTOM_VARS, CUSTOM_KEYS, type CustomTokens } from '../data/themes'

const KEY = 'sj-theme'

type Stored = { id: string; custom?: CustomTokens }

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { id: 'atlas' }
    const parsed = JSON.parse(raw) as Stored
    if (typeof parsed?.id === 'string') return parsed
  } catch {
    /* storage unavailable / corrupt — fall through to the default */
  }
  return { id: 'atlas' }
}

/**
 * Applies + persists the active theme. Presets work by stamping
 * `data-theme` on <html> (the `:root[data-theme]` blocks in index.css
 * re-declare the tokens); custom additionally pushes its three edited
 * values as inline custom-property overrides, which win over any block.
 */
export function useTheme() {
  const [stored, setStored] = useState<Stored>(readStored)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = stored.id
    for (const k of CUSTOM_KEYS) {
      if (stored.id === CUSTOM_THEME_ID && stored.custom) {
        root.style.setProperty(CUSTOM_VARS[k], stored.custom[k])
      } else {
        root.style.removeProperty(CUSTOM_VARS[k])
      }
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(stored))
    } catch {
      /* private mode etc. — theme still applies for the session */
    }
  }, [stored])

  return {
    themeId: stored.id,
    custom: stored.custom,
    setPreset: (id: string) => setStored({ id }),
    setCustom: (custom: CustomTokens) => setStored({ id: CUSTOM_THEME_ID, custom }),
  }
}
