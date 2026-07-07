/**
 * The graceful floor: no WebGL or a lost GPU context lands here — a flat
 * guitar-and-amp glyph, never a black rectangle.
 */
export function Fallback() {
  return (
    <div className="grid h-full min-h-[26rem] place-items-center p-6">
      <div className="text-center">
        <svg viewBox="0 0 200 120" className="mx-auto h-40 w-64" aria-hidden="true">
          {/* guitar: body + neck */}
          <ellipse cx="52" cy="80" rx="30" ry="26" fill="var(--color-riff-hot)" opacity="0.9" />
          <ellipse cx="46" cy="74" rx="14" ry="12" fill="var(--color-riff-bg)" opacity="0.5" />
          <rect x="60" y="30" width="10" height="52" rx="3" fill="#5a4632" transform="rotate(28 65 56)" />
          <rect x="78" y="20" width="14" height="12" rx="2" fill="#3a2d1f" transform="rotate(28 85 26)" />
          {/* cable */}
          <path d="M78 92 Q 120 118 150 92" fill="none" stroke="var(--color-riff-muted)" strokeWidth="2.5" />
          {/* amp */}
          <rect x="140" y="52" width="52" height="46" rx="4" fill="#211d1a" stroke="var(--color-riff-line-strong)" />
          <rect x="146" y="58" width="40" height="26" rx="2" fill="#0f0d0c" />
          <circle cx="150" cy="92" r="2.4" fill="var(--color-riff-hot)" />
        </svg>
        <p className="mt-4 text-sm text-riff-ink-2">The playable guitar isn't available on this device.</p>
        <p className="mt-1 font-mono text-xs text-riff-muted">It needs WebGL for the 3D stage.</p>
      </div>
    </div>
  )
}
