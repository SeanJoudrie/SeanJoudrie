/**
 * Theme presets for the shell. Each preset re-declares the full Atlas token
 * set; the matching CSS lives in index.css as `:root[data-theme='…']` blocks
 * (this file powers the switcher UI — swatches, names, custom seeds).
 * House rule: no preset may be pure white or pure black, and ink-on-paper
 * must stay comfortably readable (≥ 4.5:1).
 */

export type ThemeTokens = {
  paper: string
  paperTwo: string
  paperThree: string
  ink: string
  ink2: string
  faint: string
  line: string
  accent: string
  accentDeep: string
  gold: string
}

export type ThemePreset = { id: string; name: string; tokens: ThemeTokens }

export const THEMES: ThemePreset[] = [
  {
    id: 'atlas',
    name: 'Atlas (default)',
    tokens: {
      paper: '#f4eee1',
      paperTwo: '#ece4d1',
      paperThree: '#e3d9c2',
      ink: '#211b12',
      ink2: '#5c5340',
      faint: '#857b63',
      line: '#d7ccb4',
      accent: '#bd3a1c',
      accentDeep: '#932c14',
      gold: '#9c7420',
    },
  },
  {
    id: 'fatigues',
    name: 'Fatigues',
    tokens: {
      // Dark navy-charcoal with a brass accent — Army + college colors.
      paper: '#151b26',
      paperTwo: '#1b2331',
      paperThree: '#232d3f',
      ink: '#ece7da',
      ink2: '#b8b19e',
      faint: '#8b8674',
      line: '#2e3950',
      accent: '#d9a441',
      accentDeep: '#b98527',
      gold: '#c9a55a',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    tokens: {
      // Cool graphite with a cyan accent — deliberately unlike any one demo.
      paper: '#23272e',
      paperTwo: '#2a2f38',
      paperThree: '#333945',
      ink: '#e9ecf0',
      ink2: '#b6bdc7',
      faint: '#8b939f',
      line: '#3b424e',
      accent: '#45b8cb',
      accentDeep: '#2e97a9',
      gold: '#c9a55a',
    },
  },
]

export const CUSTOM_THEME_ID = 'custom'

/** The subset the custom editor exposes — enough to judge a direction. */
export const CUSTOM_KEYS = ['paper', 'ink', 'accent'] as const
export type CustomKey = (typeof CUSTOM_KEYS)[number]
export type CustomTokens = Record<CustomKey, string>

export const CUSTOM_VARS: Record<CustomKey, string> = {
  paper: '--color-paper',
  ink: '--color-ink',
  accent: '--color-accent',
}
