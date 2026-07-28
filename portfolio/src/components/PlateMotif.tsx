/**
 * Designed placeholder art for project plates that don't have a real capture
 * yet. Each motif is drawn from the project's own mechanics — not a generic
 * "coming soon" box. Swapped out automatically once `screenshot` is set.
 */
export function PlateMotif({ name }: { name: string }) {
  const motif =
    name === 'Flexyn' ? <FlexynMotif /> :
    name === 'REX' ? <RexMotif /> :
    name === 'Curio' ? <CurioMotif /> :
    name === 'AAR' ? <AarMotif /> :
    name === 'Birdwatch' ? <BirdwatchMotif /> :
    <RapSheetMotif />

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

/** Curio — the daily card: today's small challenge, a "how it felt" wax stamp,
    and a shelf of collected marks (the cabinet). */
function CurioMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      {/* today's card */}
      <g transform="translate(58, 26) rotate(-3 82 66)">
        <rect width="164" height="132" rx="8" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.28" />
        <text x="18" y="28" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="2" fill="var(--color-faint)">TODAY</text>
        {/* a small skill glyph — a hand + spark */}
        <g transform="translate(70, 42)" stroke="var(--color-ink)" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 30 v-16 a4 4 0 0 1 8 0 v-4 a4 4 0 0 1 8 0 v4 a4 4 0 0 1 8 0 v6 c0 10 -6 16 -14 16 c-8 0 -12 -2 -18 -6z" />
        </g>
        <path d="M110 34 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" fill="var(--color-accent)" opacity="0.85" />
        <g fill="var(--color-paper-3)">
          <rect x="18" y="98" width="120" height="7" rx="3.5" />
          <rect x="18" y="112" width="86" height="7" rx="3.5" />
        </g>
      </g>
      {/* the "how it felt" wax stamp, pressed onto the card */}
      <g transform="translate(210, 118) rotate(-10)">
        <circle r="26" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeDasharray="3 3" />
        <circle r="18" fill="var(--color-accent)" opacity="0.14" />
        <text textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontWeight="700" fontSize="10" letterSpacing="1" fill="var(--color-accent)">DONE</text>
      </g>
      {/* the cabinet — a shelf of collected stamps (kept clear of the caption) */}
      <g transform="translate(24, 150)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={i * 20} cy="0" r="6.5"
            fill={i < 4 ? 'var(--color-paper-3)' : 'none'}
            stroke="var(--color-ink)" strokeOpacity={i < 4 ? '0.25' : '0.15'} strokeWidth="1.5"
            strokeDasharray={i < 4 ? undefined : '2 2'} />
        ))}
      </g>
    </svg>
  )
}

/** AAR — a service record translated into a civilian résumé: a dog tag,
    an arrow, and a clean bulleted sheet. */
function AarMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      {/* dog tag */}
      <g transform="translate(40, 60) rotate(-10 30 40)">
        <rect width="60" height="86" rx="12" fill="var(--color-paper-3)" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <circle cx="30" cy="12" r="4" fill="none" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <g fill="var(--color-ink)" opacity="0.32">
          <rect x="12" y="30" width="36" height="5" rx="2.5" />
          <rect x="12" y="42" width="30" height="5" rx="2.5" />
          <rect x="12" y="54" width="34" height="5" rx="2.5" />
        </g>
      </g>
      {/* arrow */}
      <g stroke="var(--color-accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M126 100 h40 m-12 -10 l12 10 l-12 10" />
      </g>
      {/* civilian résumé sheet */}
      <g transform="translate(184, 40)">
        <rect width="96" height="124" rx="6" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.28" />
        <rect x="14" y="16" width="50" height="8" rx="4" fill="var(--color-accent)" opacity="0.85" />
        <rect x="14" y="30" width="34" height="5" rx="2.5" fill="var(--color-paper-3)" />
        {[52, 66, 80, 94].map((y) => (
          <g key={y}>
            <circle cx="17" cy={y + 2} r="2.5" fill="var(--color-accent)" />
            <rect x="26" y={y} width={y % 3 ? 54 : 44} height="5" rx="2.5" fill="var(--color-paper-3)" />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** Birdwatch — a season deck: a bird card fanned over a month strip. */
function BirdwatchMotif() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      {/* back cards of the deck */}
      <g transform="translate(96, 34) rotate(-7 62 70)">
        <rect width="118" height="140" rx="10" fill="var(--color-paper-3)" stroke="var(--color-ink)" strokeOpacity="0.18" />
      </g>
      {/* front bird card */}
      <g transform="translate(112, 28) rotate(3 62 70)">
        <rect width="118" height="140" rx="10" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity="0.3" />
        <rect x="14" y="14" width="90" height="70" rx="6" fill="var(--color-paper-2)" stroke="var(--color-line)" />
        {/* a simple bird glyph */}
        <g transform="translate(30, 34)" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 26 q10 -22 30 -20 q-6 8 2 12 q10 4 22 -4 q-8 18 -28 18 q-16 0 -26 -6z" fill="var(--color-accent)" fillOpacity="0.18" />
          <circle cx="30" cy="10" r="1.6" fill="var(--color-ink)" stroke="none" />
        </g>
        <rect x="14" y="94" width="66" height="7" rx="3.5" fill="var(--color-paper-3)" />
        <rect x="14" y="107" width="44" height="7" rx="3.5" fill="var(--color-paper-3)" />
      </g>
      {/* month strip (the calendar), one month highlighted */}
      <g transform="translate(40, 168)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={i * 30} y="0" width="22" height="10" rx="2"
            fill={i === 4 ? 'var(--color-accent)' : 'var(--color-paper-3)'}
            stroke="var(--color-ink)" strokeOpacity="0.18" />
        ))}
      </g>
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
