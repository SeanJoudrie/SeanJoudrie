import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Reveal } from './Reveal'
import { navigate } from '../lib/router'

const MeridianLive = lazy(() => import('./MeridianLive'))

/**
 * Range — stand-alone commissioned builds, one hireable skill each. Where
 * the Lab extracts pieces from shipped products, these are built to answer
 * the questions hiring teams actually ask. More land as the shelf grows.
 */
const COMMISSIONS = [
  {
    n: '01',
    skill: 'Motion & data-viz',
    title: 'AeroScale UI — animated financial dashboard',
    caption:
      'A dark-mode SaaS revenue dashboard, hand-rolled: self-drawing SVG charts, morphing timeframe filters, live number tickers on a single rAF loop, keyboard-navigable tooltips — zero chart libraries. Fictional company, deterministic data, real engineering.',
    href: '#/demos/aeroscale',
  },
  {
    n: '02',
    skill: '3D & WebGL',
    title: 'Meridian — 3D watch configurator',
    caption:
      'A wristwatch in the browser: orbit it, swap case metals, dials, bezels and straps live, watch the price tick. React Three Fiber with zero downloaded models — every part is procedural geometry, the dial keeps your real local time, and an idle scene renders once a second.',
    href: '#/demos/meridian',
  },
  {
    n: '03',
    skill: 'AI-native product',
    title: 'Ledger Lens — AI receipt & invoice extractor',
    caption:
      'Drop a receipt photo (or pick one of three procedurally rendered examples) and watch Claude read it: a streaming "reading → structuring" pass fills an editable table with line items, per-field confidence, and derived totals it recomputes rather than trusts. Vision + a strict JSON schema, the Anthropic key held server-side in a rate-limited Supabase Edge Function — your key never touches the browser.',
    href: '#/demos/ledger-lens',
  },
  {
    n: '04',
    skill: 'Enterprise UI & performance at scale',
    title: 'Palisade — enterprise data grid',
    caption:
      'Ten thousand freight-manifest rows in the browser, hand-rolled: windowed virtualization (no grid library), Excel-grade keyboard nav with a single roving active cell, range copy/paste as TSV, click-to-sort, a filter row, column resize / reorder / pin, undo-redo, and CSV export that honours the current view. Session-only edits, one seeded dataset, zero table dependencies.',
    href: '#/demos/palisade',
  },
  {
    n: '05',
    skill: 'Link analysis & spatial-temporal fusion',
    title: 'Skein — OSINT link-analysis case board',
    caption:
      'One fictional smuggling case, three fused views: a hand-rolled force-directed link chart (no graph library), a timeline scrubber, and a schematic map (no map tiles). Drag the time brush and watch the network surface — nodes dim, edges fade, the map recolours; click an entity or a port and everything present there in that window lights up across all three. Deterministic synthetic data, real physics, the Palantir-style triple-linked view built from scratch.',
    href: '#/demos/skein',
  },
  {
    n: '06',
    skill: 'GPU particles & shaders',
    title: 'Terra — a particle Earth',
    caption:
      'A living globe: 60,000 GPU points sampled onto a procedural sphere — no globe model, no globe library, no particle library. Land and sea split by reading a NASA mask once on a 2D canvas; a hand-written vertex shader breathes noise along the normals, floats land a hair proud of the ocean, and parts the surface around your cursor. Drag to orbit. After cortiz2894’s open-source hologram-particles — rebuilt from scratch to understand it.',
    href: '#/demos/terra',
  },
  {
    n: '07',
    skill: 'GPU particles & data pipeline',
    title: 'Cortex — a particle brain',
    caption:
      '80,000 points baked from the BodyParts3D anatomical atlas — every structure its own mesh, area-weighted sampled and tagged with a region id, shipped as one 548 KB binary (not 100 MB of models). Pick the hippocampus, amygdala, thalamus… and the cortex ghosts to a blue haze while that structure glows red from inside the folds, rotating. Same particle engine as Terra, after cortiz2894’s hologram-particles.',
    href: '#/demos/cortex',
  },
  {
    n: '08',
    skill: 'GPU particles & rigged interaction',
    title: 'Skull — a particle skull with a working jaw',
    caption:
      '61,000 points baked from the BodyParts3D atlas — every bone its own mesh, tagged and shipped as one 417 KB binary. Pick a bone (frontal, sphenoid, mandible…) and it lights up; the jaw swings on its real temporomandibular hinge, computed from the condyle points at bake time and applied in the vertex shader so 60,000 other points never move on the CPU. Same particle engine as Terra and Cortex, after cortiz2894’s hologram-particles.',
    href: '#/demos/skull',
  },
]

/** A miniature of the watch — warm dark, brass ring, ten past ten. */
function MeridianThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0e0d0b" />
      {/* strap hints */}
      <path d="M 122 0 L 158 0 L 154 34 L 126 34 Z" fill="#9a6b42" />
      <path d="M 126 126 L 154 126 L 158 160 L 122 160 Z" fill="#9a6b42" />
      {/* case + bezel */}
      <circle cx="140" cy="80" r="52" fill="#171511" stroke="#c9cdd3" strokeWidth="5" />
      <circle cx="140" cy="80" r="43" fill="#1c2a45" stroke="#c9a55a" strokeWidth="1.5" />
      {/* indices */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <line
            key={i}
            x1={140 + Math.sin(a) * 36}
            y1={80 - Math.cos(a) * 36}
            x2={140 + Math.sin(a) * 30}
            y2={80 - Math.cos(a) * 30}
            stroke="#c9a55a"
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
          />
        )
      })}
      {/* hands at ten past ten */}
      <line x1="140" y1="80" x2="122" y2="62" stroke="#e8e6df" strokeWidth="4" strokeLinecap="round" />
      <line x1="140" y1="80" x2="158" y2="54" stroke="#e8e6df" strokeWidth="3" strokeLinecap="round" />
      <circle cx="140" cy="80" r="3.5" fill="#c9a55a" />
      {/* crown */}
      <rect x="194" y="74" width="9" height="12" rx="3" fill="#c9cdd3" />
    </svg>
  )
}

/** A miniature of a receipt being read — warm dark, cream slip, a mint check. */
function LedgerThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0d0c0a" />
      {/* the receipt slip, faintly tilted, with a torn/zigzag bottom */}
      <g transform="rotate(-3 140 80)">
        <path
          d="M 96 26 H 184 V 118
             l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5
             l -6 5 l -6 -5 l -6 5 l -6 -5 l -6 5 l -6 -5 Z"
          fill="#f4efe2"
        />
        {/* merchant header bar */}
        <rect x="112" y="34" width="56" height="7" rx="2" fill="#211b12" />
        <rect x="120" y="45" width="40" height="4" rx="2" fill="#9a8f78" />
        {/* dashed rule */}
        <line x1="104" y1="56" x2="176" y2="56" stroke="#c9bfa6" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* line-item rows: description + amount */}
        {[62, 72, 82, 92].map((y, i) => (
          <g key={y}>
            <rect x="104" y={y} width={40 - i * 4} height="4" rx="2" fill="#5c5340" />
            <rect x={168 - 16} y={y} width="16" height="4" rx="2" fill="#211b12" />
          </g>
        ))}
        {/* dashed rule + total row (mint = verified/total) */}
        <line x1="104" y1="102" x2="176" y2="102" stroke="#c9bfa6" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="104" y="108" width="24" height="5" rx="2" fill="#211b12" />
        <rect x="150" y="108" width="26" height="5" rx="2" fill="#2f7a4f" />
      </g>
      {/* the "lens" — a mint verified check ringing the total */}
      <circle cx="196" cy="118" r="15" fill="#0d0c0a" stroke="#58c98a" strokeWidth="2.5" />
      <polyline
        points="189,118 194,123 204,112"
        fill="none"
        stroke="#58c98a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A miniature of the data grid — pinned column, a sort caret, a status
    badge, and the teal active-cell ring peeking through the paper. */
function PalisadeThumb() {
  const rowY = [58, 76, 94, 112, 130]
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0a1214" />
      {/* toolbar hint */}
      <rect x="14" y="14" width="90" height="10" rx="5" fill="#16262b" />
      <rect x="228" y="13" width="38" height="12" rx="6" fill="#0f1a1d" stroke="#2dd4bf" strokeWidth="1" />
      {/* header row */}
      <rect x="14" y="34" width="252" height="16" rx="3" fill="#16262b" />
      <rect x="20" y="40" width="30" height="4" rx="2" fill="#7d908f" />
      <rect x="84" y="40" width="34" height="4" rx="2" fill="#7d908f" />
      {/* sort caret on a column */}
      <path d="M 150 39 l 4 5 l 4 -5 Z" fill="#2dd4bf" />
      <rect x="164" y="40" width="26" height="4" rx="2" fill="#7d908f" />
      {/* pinned first column band */}
      <rect x="14" y="50" width="60" height="88" fill="#0f1a1d" />
      <line x1="74" y1="34" x2="74" y2="138" stroke="rgb(255,255,255)" strokeOpacity="0.12" strokeWidth="1" />
      {/* body rows */}
      {rowY.map((y, i) => (
        <g key={y}>
          <rect x="20" y={y - 4} width="44" height="4" rx="2" fill="#b3c2c1" />
          <rect x="84" y={y - 4} width="40" height="4" rx="2" fill="#b3c2c1" />
          {/* status badge */}
          <rect x="150" y={y - 6} width="46" height="9" rx="4.5"
            fill={i === 1 ? 'rgba(52,211,153,0.15)' : i === 3 ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)'} />
          <circle cx="156" cy={y - 1.5} r="2" fill={i === 1 ? '#34d399' : i === 3 ? '#f87171' : '#60a5fa'} />
          {/* right-aligned tabular number */}
          <rect x="228" y={y - 4} width="34" height="4" rx="2" fill="#eef4f3" />
        </g>
      ))}
      {/* active-cell ring */}
      <rect x="82" y="86" width="44" height="16" rx="2" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
    </svg>
  )
}

/** A miniature of the case board — typed nodes wired by a red thread, a
    timeline strip beneath, a port pin off to the side. */
function SkeinThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0c0b12" />
      {/* edges (resting) */}
      <g stroke="#c5bcd6" strokeOpacity="0.28" strokeWidth="1.5">
        <line x1="96" y1="52" x2="150" y2="40" />
        <line x1="150" y1="40" x2="204" y2="66" />
        <line x1="96" y1="52" x2="120" y2="104" />
        <line x1="120" y1="104" x2="188" y2="112" />
      </g>
      {/* the highlighted "thread" — a selected relationship */}
      <line x1="150" y1="40" x2="120" y2="104" stroke="#e8635f" strokeWidth="2.5" />
      {/* nodes, one per type color */}
      {[
        { x: 96, y: 52, c: '#6aa9f0', r: 11 },  /* person */
        { x: 150, y: 40, c: '#b48cf0', r: 13 }, /* org (hub) */
        { x: 204, y: 66, c: '#e07db4', r: 9 },  /* account */
        { x: 120, y: 104, c: '#5cc6d6', r: 10 },/* vessel */
        { x: 188, y: 112, c: '#57c8a0', r: 9 }, /* location */
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} fillOpacity="0.2" stroke={n.c} strokeWidth="2" />
        </g>
      ))}
      {/* selection ring on the hub */}
      <circle cx="150" cy="40" r="17" fill="none" stroke="#e8635f" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* timeline strip */}
      <rect x="14" y="136" width="252" height="12" rx="3" fill="#1e1b2b" />
      {[22, 40, 58, 92, 120, 150, 176, 210, 236].map((x, i) => (
        <rect key={i} x={x} y={140 - (i % 3) * 2} width="4" height={4 + (i % 3) * 2} rx="1" fill="#928aa6" />
      ))}
      {/* the brush window */}
      <rect x="86" y="134" width="86" height="16" rx="3" fill="none" stroke="#e8635f" strokeWidth="1.5" />
      <rect x="86" y="134" width="86" height="16" fill="#e8635f" fillOpacity="0.14" />
    </svg>
  )
}

/** A miniature of the globe — deep space, dotted sphere, a green land-run. */
function TerraThumb() {
  // Deterministic particle bands: (band radius, dot count, land indices).
  const bands: Array<[number, number, number[]]> = [
    [16, 20, [4, 5, 6, 14]],
    [34, 28, [8, 9, 10, 11, 22, 23]],
    [48, 32, [2, 3, 16, 17, 18, 27]],
  ]
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#060a12" />
      <circle cx="140" cy="80" r="58" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="1 5" />
      {bands.map(([ry, n, land], b) =>
        Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2
          const cx = 140 + Math.cos(a) * 58 * Math.cos((ry / 58) * 0.85)
          const cy = 80 + Math.sin(a) * ry
          const isLand = land.includes(i)
          return (
            <circle
              key={`${b}-${i}`}
              cx={cx.toFixed(1)}
              cy={cy.toFixed(1)}
              r={isLand ? 2.1 : 1.5}
              fill={isLand ? '#7fd7a1' : '#3a6fc4'}
              opacity={isLand ? 0.95 : 0.6}
            />
          )
        }),
      )}
      {/* the cursor, mid-disturbance */}
      <circle cx="185" cy="52" r="9" fill="none" stroke="#c9f3dc" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.8" />
    </svg>
  )
}

/** A miniature of the brain — dotted grey lobes, one deep red cluster. */
function CortexThumb() {
  const dots: Array<[number, number, boolean]> = []
  // deterministic blob of points; a red cluster low-center = a deep structure
  for (let i = 0; i < 150; i++) {
    const a = (i * 2.399963) % (Math.PI * 2)
    const r = 1 - ((i * 0.61803) % 1) * 0.4
    const x = 140 + Math.cos(a) * 74 * r
    const y = 80 + Math.sin(a) * 46 * r
    const deep = Math.hypot(x - 150, y - 92) < 20
    dots.push([x, y, deep])
  }
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#080a0f" />
      {dots.map(([x, y, deep], i) => (
        <circle
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={deep ? 2.2 : 1.4}
          fill={deep ? '#ff4d43' : '#5b8fd6'}
          opacity={deep ? 0.95 : 0.4}
        />
      ))}
    </svg>
  )
}

/** A miniature of the skull — dotted ivory cranium, ember eye, jaw strip. */
function SkullThumb() {
  const dots: Array<[number, number]> = []
  for (let i = 0; i < 130; i++) {
    const a = (i * 2.399963) % (Math.PI * 2)
    const r = 1 - ((i * 0.61803) % 1) * 0.38
    dots.push([140 + Math.cos(a) * 60 * r, 72 + Math.sin(a) * 52 * r])
  }
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0a0908" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.4} fill="#d8ccb4" opacity={0.45} />
      ))}
      <circle cx="120" cy="76" r="11" fill="#0a0908" />
      <circle cx="160" cy="76" r="11" fill="#0a0908" />
      <circle cx="120" cy="76" r="4" fill="#ff6a3d" opacity="0.9" />
      {/* jaw strip, dropped a touch (open) */}
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={`j${i}`} cx={108 + i * 2.9} cy={128 + (i % 2) * 2} r={1.5} fill="#ff6a3d" opacity={0.7} />
      ))}
    </svg>
  )
}

const THUMBS: Record<string, () => ReactNode> = { '01': AeroThumb, '02': MeridianThumb, '03': LedgerThumb, '04': PalisadeThumb, '05': SkeinThumb, '06': TerraThumb, '07': CortexThumb, '08': SkullThumb }

/**
 * The Meridian card's live slot. The heavy three.js chunk loads only when
 * the card nears the viewport; until then (and on devices without WebGL, or
 * after a lost GL context) the static thumbnail stands in. The canvas also
 * reports its own visibility so the idle spin never runs off screen.
 */
function MeridianLiveThumb() {
  const wrap = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [inView, setInView] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (failed) return
    let ok = false
    try {
      const c = document.createElement('canvas')
      ok = !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    } catch {
      ok = false
    }
    if (!ok) {
      setFailed(true)
      return
    }
    const el = wrap.current
    if (!el) return
    const loadIo = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          loadIo.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    const viewIo = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 })
    loadIo.observe(el)
    viewIo.observe(el)
    return () => {
      loadIo.disconnect()
      viewIo.disconnect()
    }
  }, [failed])

  return (
    <div ref={wrap} className="h-full w-full">
      {near && !failed ? (
        <Suspense fallback={<MeridianThumb />}>
          <MeridianLive
            active={inView}
            onActivate={() => navigate('#/demos/meridian')}
            onFail={() => setFailed(true)}
          />
        </Suspense>
      ) : (
        <MeridianThumb />
      )}
    </div>
  )
}

/** A miniature of the dashboard — the dark demo peeking through the paper. */
function AeroThumb() {
  return (
    <svg viewBox="0 0 280 160" className="h-full w-full" aria-hidden="true">
      <rect width="280" height="160" rx="10" fill="#0b0f17" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={14 + i * 86} y="14" width="80" height="28" rx="5" fill="#131a26" />
          <rect x={20 + i * 86} y="20" width="26" height="5" rx="2.5" fill="#26303e" />
          <rect x={20 + i * 86} y="29" width="42" height="7" rx="3" fill="#3b475c" />
        </g>
      ))}
      <rect x="14" y="50" width="252" height="96" rx="5" fill="#131a26" />
      {[74, 98, 122].map((y) => (
        <line key={y} x1="24" x2="256" y1={y} y2={y} stroke="#26303e" strokeWidth="1" />
      ))}
      <polyline
        points="24,126 60,118 96,108 132,96 168,86 204,74 240,64 256,60"
        fill="none"
        stroke="#e8eefc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="24,138 96,138 132,128 168,114 204,102 256,92"
        fill="none"
        stroke="#3987e5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="24,132 60,128 96,130 132,131 168,133 256,134"
        fill="none"
        stroke="#86b6ef"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="256" cy="60" r="3.5" fill="#e8eefc" stroke="#131a26" strokeWidth="1.5" />
    </svg>
  )
}

export function Range() {
  return (
    <section id="range" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="annotation whitespace-nowrap">Range</span>
            <span className="dim-line dim-draw flex-1" />
            <span className="coord whitespace-nowrap">
              {COMMISSIONS.length} commission{COMMISSIONS.length === 1 ? '' : 's'}
            </span>
          </div>
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Your stack, <em className="text-accent">proven</em> — one demo at a time.
          </h2>
          <p className="mt-3 max-w-xl text-ink-2">
            The Lab extracts pieces from my products; these are stand-alone builds, each answering a question a
            hiring team actually asks.
          </p>
          <p className="annotation mt-2">
            <span className="coord text-accent">⌘K</span> — this site runs on a
            command palette. Press it.
          </p>
        </Reveal>

        <div className="mt-10 space-y-6">
          {COMMISSIONS.map((c, i) => (
            <Reveal key={c.n} delay={i * 60}>
              <article className="grid items-center gap-6 rounded-xl border border-line bg-paper-2/60 p-5 sm:grid-cols-[1fr_16rem] sm:p-8">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="coord">Commission {c.n}</span>
                    <span className="annotation text-gold">{c.skill}</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{c.title}</h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">{c.caption}</p>
                  <div className="mt-5">
                    <button
                      onClick={() => navigate(c.href)}
                      className="springy rounded-lg bg-accent px-5 py-2.5 font-semibold text-paper hover:bg-accent-deep"
                    >
                      Open the live demo →
                    </button>
                  </div>
                </div>
                {c.n === '02' ? (
                  <div className="parallax-1 flex flex-col gap-2">
                    <div
                      className="plate-lift h-40 overflow-hidden rounded-xl border border-line"
                      style={{ background: '#0e0d0b' }}
                    >
                      <MeridianLiveThumb />
                    </div>
                    <button
                      onClick={() => navigate(c.href)}
                      className="coord text-left text-accent transition-colors hover:text-accent-deep"
                    >
                      Click to customize — swap the case, dial, and strap →
                    </button>
                  </div>
                ) : (
                  <div className="parallax-1">
                    <button
                      onClick={() => navigate(c.href)}
                      aria-label={`Open ${c.title}`}
                      className="plate-lift block h-40 w-full overflow-hidden rounded-xl border border-line"
                    >
                      {THUMBS[c.n]()}
                    </button>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
