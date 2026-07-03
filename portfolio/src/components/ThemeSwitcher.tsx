import { useEffect, useRef, useState } from 'react'
import { THEMES, CUSTOM_THEME_ID, CUSTOM_KEYS, CUSTOM_VARS, type CustomTokens } from '../data/themes'
import { useTheme } from '../hooks/useTheme'

/** Read the live value of a token so Custom starts from what's on screen. */
function currentTokens(): CustomTokens {
  const cs = getComputedStyle(document.documentElement)
  const read = (v: string, fallback: string) => {
    const raw = cs.getPropertyValue(v).trim()
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback
  }
  return {
    paper: read(CUSTOM_VARS.paper, '#f4eee1'),
    ink: read(CUSTOM_VARS.ink, '#211b12'),
    accent: read(CUSTOM_VARS.accent, '#bd3a1c'),
  }
}

/**
 * The gear beside Résumé — Sean's own testing control for the shell's
 * palette. Presets stamp `data-theme`; Custom exposes the three load-bearing
 * tokens as live color pickers so a direction can be judged on the real page.
 */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const { themeId, custom, setPreset, setCustom } = useTheme()
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Theme settings"
        aria-expanded={open}
        className="springy inline-flex items-center rounded-lg border border-line p-2 text-ink-2 hover:border-accent hover:text-accent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="theme-pop absolute right-0 top-full z-[60] mt-2 w-64 rounded-xl border border-line bg-paper p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)]">
          <p className="annotation">Theme</p>
          <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label="Theme preset">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={themeId === t.id}
                onClick={() => setPreset(t.id)}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                  themeId === t.id
                    ? 'border-accent text-ink'
                    : 'border-line text-ink-2 hover:border-accent/50 hover:text-ink'
                }`}
              >
                <span className="flex shrink-0 -space-x-1" aria-hidden="true">
                  <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: t.tokens.paper }} />
                  <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: t.tokens.ink }} />
                  <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: t.tokens.accent }} />
                </span>
                {t.name}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-line pt-3">
            <button
              type="button"
              aria-pressed={themeId === CUSTOM_THEME_ID}
              onClick={() => setCustom(custom ?? currentTokens())}
              className={`w-full rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                themeId === CUSTOM_THEME_ID
                  ? 'border-accent text-ink'
                  : 'border-line text-ink-2 hover:border-accent/50 hover:text-ink'
              }`}
            >
              Custom…
            </button>
            {themeId === CUSTOM_THEME_ID && custom && (
              <div className="mt-2 grid gap-1.5">
                {CUSTOM_KEYS.map((k) => (
                  <label key={k} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1 text-sm capitalize text-ink-2">
                    {k}
                    <input
                      type="color"
                      value={custom[k]}
                      onChange={(e) => setCustom({ ...custom, [k]: e.target.value })}
                      aria-label={`Custom ${k} color`}
                      className="h-7 w-12 cursor-pointer rounded border border-line bg-transparent"
                    />
                  </label>
                ))}
                <p className="coord px-2.5">live preview — changes apply as you pick</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
