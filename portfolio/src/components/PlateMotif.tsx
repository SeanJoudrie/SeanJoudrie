/**
 * Designed placeholder art for project plates that don't have a real capture
 * yet. Each motif is drawn from the project's own mechanics — not a generic
 * "coming soon" box. Swapped out automatically once `screenshot` is set.
 */
export function PlateMotif({ name }: { name: string }) {
  const motif =
    name === 'Flexyn' ? <FlexynMotif /> : name === 'REX' ? <RexMotif /> : <RapSheetMotif />

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-paper-2">
      {motif}
      <span className="coord absolute bottom-2.5 right-3">specimen — capture pending</span>
    </div>
  )
}

/** Flexyn — a progression loop: ascending bars and an XP ring. */
function FlexynMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <g stroke="var(--color-line)" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="24" y1={y + 8} x2="296" y2={y + 8} strokeDasharray="2 5" />
        ))}
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={36 + i * 34}
          y={168 - (i + 1) * 22}
          width="20"
          height={(i + 1) * 22}
          rx="3"
          fill={i === 4 ? 'var(--color-accent)' : 'var(--color-paper-3)'}
          stroke="var(--color-ink)"
          strokeOpacity="0.25"
        />
      ))}
      <g transform="translate(248, 76)">
        <circle r="38" fill="none" stroke="var(--color-paper-3)" strokeWidth="9" />
        <circle
          r="38"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="167 239"
          transform="rotate(-90)"
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize="15"
          fontWeight="700"
          fill="var(--color-ink)"
        >
          70%
        </text>
      </g>
    </svg>
  )
}

/** REX — a swipe deck: fanned poster cards, one leaving with a heart. */
function RexMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <g transform="translate(96, 36) rotate(-8 60 80)">
        <rect width="120" height="150" rx="8" fill="var(--color-paper-3)" stroke="var(--color-ink)" strokeOpacity="0.2" />
      </g>
      <g transform="translate(112, 30) rotate(-2 60 80)">
        <rect width="120" height="150" rx="8" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <rect x="14" y="16" width="92" height="86" rx="4" fill="var(--color-paper-3)" />
        <rect x="14" y="112" width="64" height="8" rx="4" fill="var(--color-paper-3)" />
        <rect x="14" y="126" width="42" height="8" rx="4" fill="var(--color-paper-3)" />
      </g>
      <g transform="translate(150, 22) rotate(9 60 80)">
        <rect width="120" height="150" rx="8" fill="var(--color-paper)" stroke="var(--color-accent)" strokeOpacity="0.6" />
        <rect x="14" y="16" width="92" height="86" rx="4" fill="var(--color-paper-2)" stroke="var(--color-line)" />
        <path
          d="M60 74 c-8-12 -26-8 -26 5 c0 10 14 18 26 26 c12-8 26-16 26-26 c0-13 -18-17 -26-5z"
          transform="translate(0,-16) scale(0.62) translate(36,30)"
          fill="var(--color-accent)"
        />
        <rect x="14" y="112" width="72" height="8" rx="4" fill="var(--color-paper-3)" />
        <rect x="14" y="126" width="48" height="8" rx="4" fill="var(--color-paper-3)" />
      </g>
      <text x="42" y="108" fontFamily="var(--font-mono)" fontSize="22" fill="var(--color-faint)">✕</text>
      <text x="272" y="108" fontFamily="var(--font-mono)" fontSize="20" fill="var(--color-accent)">♥</text>
    </svg>
  )
}

/** Rap Sheet — the WANTED-poster recap. */
function RapSheetMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <g transform="translate(96, 18) rotate(2 64 82)">
        <rect width="128" height="164" rx="4" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.35" />
        <text
          x="64"
          y="30"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="20"
          letterSpacing="4"
          fill="var(--color-ink)"
        >
          WANTED
        </text>
        <rect x="24" y="44" width="80" height="62" rx="3" fill="var(--color-paper-3)" stroke="var(--color-line)" />
        <circle cx="64" cy="68" r="12" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <path d="M46 106 q18 -18 36 0" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <g fill="var(--color-paper-3)">
          <rect x="24" y="118" width="80" height="6" rx="3" />
          <rect x="24" y="130" width="58" height="6" rx="3" />
          <rect x="24" y="142" width="70" height="6" rx="3" />
        </g>
      </g>
      <g transform="translate(196, 128) rotate(-12)">
        <rect width="86" height="30" rx="3" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
        <text
          x="43"
          y="20"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontWeight="700"
          fontSize="13"
          letterSpacing="2"
          fill="var(--color-accent)"
        >
          3 PRIORS
        </text>
      </g>
    </svg>
  )
}
