// portfolio/src/hooks/useCommandPalette.ts
//
// A tiny module singleton lets the Nav pill (and anything else) open the
// palette without prop-drilling. The CommandPalette component registers its
// own `open()` here on mount and unregisters on unmount. Everything else —
// keyboard triggers, focus, state — lives inside the component.

let opener: (() => void) | null = null

/** Called by CommandPalette on mount to expose its open() to the app. */
export function registerPaletteOpener(fn: (() => void) | null): void {
  opener = fn
}

/** Open the palette from anywhere (Nav pill, mobile search button). No-op if
 *  the component isn't mounted (e.g. on a standalone demo route). */
export function openCommandPalette(): void {
  opener?.()
}

/** True when `target` is a text-entry surface, so the "/" trigger must NOT
 *  fire. Covers <input>, <textarea>, <select>, and contenteditable. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}
