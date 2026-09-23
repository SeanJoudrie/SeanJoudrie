/**
 * Gus, the mechanic (F-35). Flat, geometric, thick outlines, so he stays
 * legible at 32px and scales to a hero. Three working poses plus a wave.
 */
export type Pose = 'wave' | 'diagnose' | 'celebrate' | 'confused'

export function Mascot({ pose = 'wave', size = 120, className = '' }: { pose?: Pose; size?: number; className?: string }) {
  const stroke = 'var(--ink)'
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Gus the mechanic, ${pose === 'wave' ? 'waving' : pose === 'diagnose' ? 'checking a clipboard' : pose === 'celebrate' ? 'celebrating' : 'scratching his head'}`}
    >
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* body */}
        <ellipse cx="80" cy="96" rx="46" ry="44" fill="#f3d9b1" stroke={stroke} strokeWidth="5" />
        {/* overalls bib */}
        <path d="M52 118 Q80 132 108 118 L106 136 Q80 146 54 136 Z" fill="#3d6fb8" stroke={stroke} strokeWidth="4" />
        {/* hard hat */}
        <path d="M38 76 a42 40 0 0 1 84 0 z" fill="#f26b1d" stroke={stroke} strokeWidth="5" />
        <rect x="28" y="72" width="104" height="12" rx="6" fill="#f26b1d" stroke={stroke} strokeWidth="5" />
        <path d="M80 38 v34" stroke={stroke} strokeWidth="4" />
        {/* eyes */}
        {pose === 'celebrate' ? (
          <>
            <path d="M58 100 q7 -8 14 0" fill="none" stroke={stroke} strokeWidth="5" />
            <path d="M88 100 q7 -8 14 0" fill="none" stroke={stroke} strokeWidth="5" />
          </>
        ) : pose === 'diagnose' ? (
          <>
            <path d="M58 99 h14" stroke={stroke} strokeWidth="5" />
            <circle className="anim-blink" cx="95" cy="99" r="5.5" fill={stroke} />
          </>
        ) : (
          <>
            <circle className="anim-blink" cx="65" cy="99" r="5.5" fill={stroke} />
            <circle className="anim-blink" cx="95" cy="99" r="5.5" fill={stroke} />
          </>
        )}
        {/* mouth */}
        {pose === 'confused' ? (
          <path d="M70 116 q5 -4 10 0 q5 4 10 0" fill="none" stroke={stroke} strokeWidth="4" />
        ) : pose === 'celebrate' ? (
          <path d="M66 112 q14 14 28 0 z" fill="#8a2d12" stroke={stroke} strokeWidth="4" />
        ) : (
          <path d="M70 113 q10 8 20 0" fill="none" stroke={stroke} strokeWidth="4" />
        )}
        {/* props */}
        {pose === 'wave' && <path d="M126 86 q16 -10 14 -30" fill="none" stroke={stroke} strokeWidth="9" />}
        {pose === 'wave' && <circle cx="140" cy="52" r="8" fill="#f3d9b1" stroke={stroke} strokeWidth="4" />}
        {pose === 'diagnose' && (
          <g transform="rotate(-8 132 110)">
            <rect x="116" y="88" width="32" height="42" rx="4" fill="#fff" stroke={stroke} strokeWidth="4" />
            <rect x="124" y="84" width="16" height="8" rx="2" fill="#8f8c85" stroke={stroke} strokeWidth="3" />
            <path d="M122 102 h20 M122 110 h14 M122 118 h18" stroke="#8f8c85" strokeWidth="3" />
          </g>
        )}
        {pose === 'celebrate' && (
          <g transform="rotate(20 136 50)">
            <path d="M136 90 V40" stroke={stroke} strokeWidth="8" />
            <path d="M126 36 a10 10 0 1 1 20 0 l-5 6 h-10 z" fill="#b9bec5" stroke={stroke} strokeWidth="4" />
          </g>
        )}
        {pose === 'confused' && (
          <text x="128" y="54" fontSize="34" fontWeight="800" fill="var(--accent-ink)" fontFamily="var(--font-display)">
            ?
          </text>
        )}
      </g>
    </svg>
  )
}
