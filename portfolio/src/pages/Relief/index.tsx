import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { navigate } from '../../lib/router'
import { Fallback } from './Fallback'
import { loadManifest, defaultExaggeration, waterAt, EXAG_MIN, EXAG_MAX } from './meta'
import type { ReliefSite } from './meta'
import { floodStats, waterRange } from './water'
import type { FloodStats } from './water'
import { sunPosition, utcFromLocalSolar, siteCentre, DATE_PRESETS, SOLAR_YEAR } from './solar'
import { lineOfSight } from './profile'
import type { ProfileResult } from './profile'
import type { Observer } from './Scene'
import type { Heightfield } from './heightfield'
import type { ViewshedStats } from './viewshed'
import { MAX_OBSERVERS } from './viewshed'
import './theme.css'

const Scene = lazy(() => import('./Scene'))

/** Observer height range, metres. Logarithmic — the interesting changes are
 *  all in the first 50 m, and a linear slider wastes 90% of its travel. */
const H_MIN = 2
const H_MAX = 500
const toHeight = (t: number) => H_MIN * Math.pow(H_MAX / H_MIN, t)
const fromHeight = (h: number) => Math.log(h / H_MIN) / Math.log(H_MAX / H_MIN)

const HEIGHT_STOPS = [
  { h: 2, label: 'eye level' },
  { h: 25, label: 'watchtower' },
  { h: 120, label: 'small UAS' },
  { h: 400, label: '400 m' },
]

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** A render error in the 3D tree lands on the static fallback, not a crash. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

/** Wordmark — contour lines with a sight line crossing them. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M2 14 Q6 9 10 11 T18 8" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <path d="M2 17 Q6 12.5 10 14.5 T18 11.5" fill="none" stroke="var(--color-relief-rock)" strokeWidth="1.2" />
      <line x1="3" y1="4" x2="17" y2="16" stroke="var(--color-relief-visible)" strokeWidth="1.2" strokeDasharray="2 2" />
      <circle cx="3" cy="4" r="1.8" fill="var(--color-relief-visible)" />
    </svg>
  )
}

/** Method and attribution, shared by the mobile disclosure and the desktop block. */
function Notes({ site }: { site: ReliefSite | null }) {
  return (
    <>
      {site && (
        <p>
          <span className="text-relief-ink-2">{site.name}.</span> {site.note}
        </p>
      )}
      <p>
        <span className="text-relief-ink-2">Method.</span> A viewshed marks every cell whose
        vertical angle from the observer exceeds the maximum angle of all ground between them —
        computed here as a GPU reference-angle pass, corrected for Earth curvature (d²/2R) and
        atmospheric refraction. This is a bare-earth surface model: vegetation, structures and
        haze are not accounted for. Vertical exaggeration applies to the rendering only — all
        visibility is computed from true elevations.
      </p>
      <p>
        <span className="text-relief-ink-2">Line of sight.</span> The section plots apparent
        ground — true elevation plus the earth bulge, d₁·d₂ ÷ 2R with the radius inflated by
        refraction — because that is what the ray meets. The dashed line beneath it is the true
        profile, so the gap between the two is the curvature correction itself. Checked against the
        same closed form as the viewshed: over a flat plane a 25 m eye is blocked at 19,143 m
        against an analytic 19,135 m.
      </p>
      <p>
        <span className="text-relief-ink-2">Sun.</span> Position is computed from the site’s own
        latitude and longitude at the chosen moment, using the standard low-precision solar
        equations — so the shadows are the ones that would actually fall there, and an impossible
        sun cannot be dialled up. Times are local mean solar time, which is UTC offset by exactly
        longitude ÷ 15 hours: noon means the sun is on your meridian, not whatever a clock says.
      </p>
      <p>
        <span className="text-relief-ink-2">Water.</span> A level plane at the chosen elevation, so
        the coastline is the terrain’s own. A bare fill: no drainage and no connectivity test, so
        an enclosed hollow floods as soon as the line passes it. The DEM carries no bathymetry —
        existing lakes are ground at their surface, which is why flooding Crater Lake to its own
        waterline reports almost no depth. Water does not block line of sight, so the viewshed is
        unchanged by it.
      </p>
      <p>
        Elevation data: Copernicus GLO-30 DEM, © European Space Agency / Copernicus Programme,
        accessed via the AWS open-data mirror. Terrain rendering and the viewshed algorithm are
        original.
      </p>
    </>
  )
}

/** The elevation model is ~3 MB; a bare spinner reads as broken on a phone. */
function Loading({ progress }: { progress: number }) {
  return (
    <div className="w-52 text-center">
      <span className="relief-label">
        {progress > 0 && progress < 1 ? `loading elevation — ${Math.round(progress * 100)}%` : 'loading terrain…'}
      </span>
      <span className="mt-2 block h-px w-full bg-relief-line">
        <span
          className="block h-px bg-relief-visible transition-[width] duration-150"
          style={{ width: `${Math.max(progress, 0.02) * 100}%` }}
        />
      </span>
    </div>
  )
}

/** Which preset date a site's authored moment falls on. */
const presetIndex = (s: ReliefSite) =>
  Math.max(0, DATE_PRESETS.findIndex((d) => d.month === s.sun.month && d.day === s.sun.day))

/** Local solar hours as a clock face. */
const clock = (h: number) => {
  const t = ((h % 24) + 24) % 24
  const hh = Math.floor(t)
  const mm = Math.round((t - hh) * 60)
  return `${String(mm === 60 ? hh + 1 : hh).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`
}

/**
 * The terrain section, with the sight line across it.
 *
 * Deliberately plots APPARENT ground — true elevation plus the earth bulge —
 * rather than the raw profile, because that is what the ray actually meets. It
 * also makes the curvature correction the one thing on this page you can see
 * rather than read about: the ground arches up between the two ends, and over
 * twenty-odd kilometres that arch is tens of metres, enough to block a shot that
 * a flat-earth profile would call clear.
 */
function Section({ result, blockedColor }: { result: ProfileResult; blockedColor: string }) {
  const W = 560
  const H = 120
  const PAD = 2
  const { samples, distanceM, blocked, firstBlockM } = result

  let lo = Infinity
  let hi = -Infinity
  for (const s of samples) {
    lo = Math.min(lo, s.ground, s.apparent, s.sight)
    hi = Math.max(hi, s.apparent, s.sight)
  }
  // A little headroom so the sight line never rides the very top edge.
  const span = Math.max(hi - lo, 1) * 1.12
  const x = (d: number) => (distanceM > 0 ? (d / distanceM) * (W - PAD * 2) + PAD : PAD)
  const y = (m: number) => H - PAD - ((m - lo) / span) * (H - PAD * 2)

  const groundPath =
    `M ${x(0)} ${y(samples[0].apparent)} ` +
    samples.map((s) => `L ${x(s.d)} ${y(s.apparent)}`).join(' ') +
    ` L ${x(distanceM)} ${H} L ${x(0)} ${H} Z`
  const truePath =
    `M ${x(0)} ${y(samples[0].ground)} ` + samples.map((s) => `L ${x(s.d)} ${y(s.ground)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Terrain section along the sight line">
      <path d={groundPath} fill="var(--color-relief-rock)" fillOpacity="0.30" />
      {/* True elevation under the bulged surface: the gap between the two IS
          the curvature correction. */}
      <path d={truePath} fill="none" stroke="var(--color-relief-line-strong)" strokeWidth="1" strokeDasharray="2 3" />
      <line
        x1={x(0)}
        y1={y(result.eyeM)}
        x2={x(distanceM)}
        y2={y(result.targetM)}
        stroke={blocked ? blockedColor : 'var(--color-relief-visible)'}
        strokeWidth="1.4"
      />
      {blocked && firstBlockM !== null && (
        <line x1={x(firstBlockM)} y1={PAD} x2={x(firstBlockM)} y2={H} stroke={blockedColor} strokeWidth="1" strokeDasharray="2 2" />
      )}
      <circle cx={x(0)} cy={y(result.eyeM)} r="3" fill="var(--color-relief-visible)" />
      <circle cx={x(distanceM)} cy={y(result.targetM)} r="3" fill={blocked ? blockedColor : 'var(--color-relief-visible)'} />
    </svg>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="relief-label">{label}</span>
      <span className="relief-num text-relief-ink">
        {value}
        {unit && <span className="ml-1 text-relief-muted">{unit}</span>}
      </span>
    </div>
  )
}

export default function Relief() {
  const [glOk] = useState(webglAvailable)
  const [lost, setLost] = useState(false)
  const [sites, setSites] = useState<ReliefSite[] | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [metaFailed, setMetaFailed] = useState(false)

  const [observers, setObservers] = useState<Observer[]>([])
  const [active, setActive] = useState(0)
  const [height, setHeight] = useState(25)
  const [refraction, setRefraction] = useState(true)
  const [stats, setStats] = useState<ViewshedStats | null>(null)
  const [progress, setProgress] = useState(0)
  const [exaggeration, setExaggeration] = useState<number | null>(null)
  /** Phones only — from sm up the panel is a side card and always open. */
  const [panelOpen, setPanelOpen] = useState(false)
  /** Flood surface elevation in metres, or null for dry. */
  const [water, setWater] = useState<number | null>(null)
  const [flood, setFlood] = useState<FloodStats | null>(null)
  /** When the scene is lit. Index into DATE_PRESETS, and local solar hours. */
  const [dateIdx, setDateIdx] = useState(0)
  const [hour, setHour] = useState(12)
  /** Line-of-sight target, and whether a terrain click aims it. */
  const [target, setTarget] = useState<{ u: number; v: number; ground: number } | null>(null)
  const [targetMode, setTargetMode] = useState(false)

  const site = useMemo(
    () => sites?.find((s) => s.id === siteId) ?? null,
    [sites, siteId],
  )

  /**
   * Where the sun is, computed rather than chosen — from the centre of the
   * site's own bounding box at the selected local solar time.
   */
  const sunAngles = useMemo(() => {
    if (!site) return { azimuth: 180, elevation: 45 }
    const { lat, lon } = siteCentre(site.meta.bbox)
    const d = DATE_PRESETS[dateIdx]
    const p = sunPosition(lat, lon, utcFromLocalSolar(SOLAR_YEAR, d.month, d.day, hour, lon))
    return { azimuth: p.azimuth, elevation: p.elevation }
  }, [site, dateIdx, hour])

  const handleFail = useCallback(() => setLost(true), [])

  const radius = useMemo(
    () => (site ? Math.hypot(site.meta.widthM, site.meta.heightM) : 60000),
    [site],
  )

  useEffect(() => {
    document.title = site
      ? `Relief — a viewshed over the ${site.name} · Sean Joudrie`
      : 'Relief — a real-time viewshed · Sean Joudrie'
  }, [site])

  useEffect(() => {
    document.body.classList.add('relief-page')
    return () => document.body.classList.remove('relief-page')
  }, [])

  useEffect(() => {
    let cancelled = false
    loadManifest()
      .then((s) => {
        if (cancelled) return
        setSites(s)
        setSiteId(s[0].id)
        setExaggeration(defaultExaggeration(s[0].meta))
        setWater(waterAt(s[0].water.default, s[0].meta))
        setDateIdx(presetIndex(s[0]))
        setHour(s[0].sun.hour)
      })
      .catch(() => !cancelled && setMetaFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Switch sites.
   *
   * The observers have to go: their ground elevations belong to the terrain that
   * is being replaced, and leaving them in place would have the viewshed
   * computed against the new raster from positions measured on the old one. The
   * scene re-seeds from the new site's own searched position as soon as its
   * elevation model has decoded.
   */
  const selectSite = useCallback(
    (next: ReliefSite) => {
      if (next.id === siteId) return
      setSiteId(next.id)
      setObservers([])
      setActive(0)
      setStats(null)
      setProgress(0)
      setExaggeration(defaultExaggeration(next.meta))
      // A level in metres means something different on every site — 1,883 m is
      // the lake here and thin air over Badwater. Reset to the site's own.
      setWater(waterAt(next.water.default, next.meta))
      setFlood(null)
      setDateIdx(presetIndex(next))
      setHour(next.sun.hour)
      setTarget(null)
    },
    [siteId],
  )

  /** Step to the next or previous site. The phone bar's arrows — the nearest
   *  thing to swiping between them without a gesture handler fighting the
   *  camera for the same drag. */
  const stepSite = useCallback(
    (d: number) => {
      if (!sites || !siteId) return
      const i = sites.findIndex((s) => s.id === siteId)
      selectSite(sites[(i + d + sites.length) % sites.length])
    },
    [sites, siteId, selectSite],
  )

  /** Seed the observer so the page shows a real result before anything is
   *  touched. The position is per-site and measured — see relief-sites.mjs. */
  const fieldRef = useRef<Heightfield | null>(null)
  /** Bumped when a new elevation model lands, so effects that read the ref —
   *  which does not itself trigger a render — know to recompute. */
  const [fieldEpoch, setFieldEpoch] = useState(0)
  const seed = site?.seed
  const handleReady = useCallback(
    (field: Heightfield) => {
      if (!seed) return
      fieldRef.current = field
      setFieldEpoch((n) => n + 1)
      setObservers([{ u: seed.u, v: seed.v, ground: field.elevAt(seed.u, seed.v), height }])
    },
    // `height` is read, not tracked: re-seeding because the slider moved would
    // throw away wherever the observer had been placed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  )

  const moveActive = useCallback(
    (u: number, v: number, ground: number) =>
      setObservers((os) => os.map((o, i) => (i === active ? { ...o, u, v, ground } : o))),
    [active],
  )

  /**
   * Place a new observer a short way off the last one, on real ground.
   * Computed from current state rather than inside a setState updater — calling
   * setActive from within one is a side effect during the update phase, and the
   * add silently did nothing.
   */
  const addObserver = useCallback(() => {
    const field = fieldRef.current
    if (!field || observers.length === 0 || observers.length >= MAX_OBSERVERS) return
    const from = observers[observers.length - 1]
    // Fan successive observers around the previous one, clamped inside the raster.
    const angle = (observers.length * 2 * Math.PI) / MAX_OBSERVERS + 0.6
    const cu = Math.min(Math.max(from.u + Math.cos(angle) * 0.16, 0.04), 0.96)
    const cv = Math.min(Math.max(from.v + Math.sin(angle) * 0.16, 0.04), 0.96)

    // Settle onto the highest ground within a short walk of that point. Dropped
    // blind, the fan tends to land in the gorge — an observer on the canyon
    // floor sees almost nothing, so adding one barely moved the coverage.
    let best = { u: cu, v: cv, e: -Infinity }
    for (let dv = -4; dv <= 4; dv++) {
      for (let du = -4; du <= 4; du++) {
        const u = Math.min(Math.max(cu + du * 0.008, 0.02), 0.98)
        const v = Math.min(Math.max(cv + dv * 0.008, 0.02), 0.98)
        const e = field.elevAt(u, v)
        if (e > best.e) best = { u, v, e }
      }
    }
    setObservers([...observers, { u: best.u, v: best.v, ground: best.e, height: from.height }])
    setActive(observers.length)
  }, [observers])

  const removeObserver = useCallback((i: number) => {
    setObservers((os) => (os.length <= 1 ? os : os.filter((_, k) => k !== i)))
    setActive((a) => (a >= i && a > 0 ? a - 1 : a))
  }, [])

  /** Arrow-key nudge of the active observer, re-sampling the ground it lands on. */
  const move = useCallback(
    (du: number, dv: number) =>
      setObservers((os) =>
        os.map((o, i) => {
          if (i !== active) return o
          const u = Math.min(Math.max(o.u + du, 0), 1)
          const v = Math.min(Math.max(o.v + dv, 0), 1)
          return { ...o, u, v, ground: fieldRef.current?.elevAt(u, v) ?? o.ground }
        }),
      ),
    [active],
  )

  // Keyboard: arrows nudge the observer, +/- adjust height.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT') return
      const s = e.shiftKey ? 0.02 : 0.005
      if (e.key === 'ArrowLeft') move(-s, 0)
      else if (e.key === 'ArrowRight') move(s, 0)
      else if (e.key === 'ArrowUp') move(0, s)
      else if (e.key === 'ArrowDown') move(0, -s)
      else if (e.key === '+' || e.key === '=') setHeight((h) => Math.min(h * 1.3, H_MAX))
      else if (e.key === '-' || e.key === '_') setHeight((h) => Math.max(h / 1.3, H_MIN))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  // Height lives in its own state so the slider stays responsive; fold it into
  // the observer whenever it changes.
  // Height is shared by every observer — they model the same kind of sensor.
  useEffect(() => {
    setObservers((os) => (os.length && os[0].height !== height ? os.map((o) => ({ ...o, height })) : os))
  }, [height])

  /**
   * Same sensor, different world.
   *
   * The point of four sites is not four pictures. Hold the sensor fixed and the
   * numbers say something the pictures cannot: a 25 m mast sees a fifth of the
   * Grand Canyon and three quarters of Badwater Basin, because flat ground hides
   * nothing. Recorded only for a single observer at the seed height, so the
   * comparison is between terrains rather than between setups.
   */
  const [measured, setMeasured] = useState<Record<string, { name: string; pct: number; height: number }>>({})
  useEffect(() => {
    if (!site || !stats || observers.length !== 1) return
    setMeasured((m) => ({
      ...m,
      [site.id]: { name: site.name, pct: stats.visibleFraction * 100, height: observers[0].height },
    }))
  }, [site, stats, observers])

  const comparison = useMemo(() => {
    const at = observers[0]?.height
    if (at === undefined) return []
    return Object.entries(measured)
      .filter(([, m]) => Math.abs(m.height - at) < 0.05)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => b.pct - a.pct)
  }, [measured, observers])

  /**
   * Flooded area. Counted on the CPU heightfield rather than read back from the
   * GPU: a million comparisons is well under a millisecond, exact for the
   * raster, and keeps the number independent of what the renderer is doing.
   */
  useEffect(() => {
    const field = fieldRef.current
    if (!field || !site || water === null) return setFlood(null)
    setFlood(floodStats(field, site.meta, water))
  }, [water, site, fieldEpoch])

  /**
   * The section. Recomputed whenever either end or the corrections move — a
   * couple of hundred bilinear samples, far too cheap to be worth memoising
   * around.
   */
  const profile = useMemo(() => {
    const field = fieldRef.current
    const obs = observers[active]
    if (!field || !site || !target || !obs) return null
    return lineOfSight(field, site.meta, obs, target, obs.height, refraction)
    // fieldEpoch: the ref does not itself trigger a render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, target, observers, active, refraction, fieldEpoch])

  const onPickTarget = useCallback(
    (u: number, v: number, ground: number) => setTarget({ u, v, ground }),
    [],
  )

  const broken = !glOk || lost || metaFailed

  return (
    <div className="relief-root flex min-h-svh flex-col bg-relief-bg text-relief-ink">
      <header className="z-10 flex items-center justify-between gap-4 border-b border-relief-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Mark />
          <span className="font-semibold tracking-tight">Relief</span>
          <span className="relief-label hidden sm:inline">
            {site ? `${site.name} · ${site.subtitle}` : 'viewshed'}
          </span>
        </div>
        <button
          onClick={() => navigate('#/')}
          className="rounded-lg border border-relief-line px-3 py-1.5 text-sm font-medium text-relief-ink-2 transition-colors hover:border-relief-line-strong hover:text-relief-ink"
        >
          ← Portfolio
        </button>
      </header>

      <main className="relative flex flex-1 flex-col">
        {broken ? (
          <Fallback />
        ) : (
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="grid flex-1 place-items-center">
                  <Loading progress={progress} />
                </div>
              }
            >
              {site && sites ? (
                <>
                  <div className="absolute inset-0">
                    <Scene
                      site={site}
                      observers={observers}
                      active={active}
                      moveActive={moveActive}
                      radius={radius}
                      refraction={refraction}
                      onStats={setStats}
                      onReady={handleReady}
                      onFail={handleFail}
                      onProgress={setProgress}
                      exaggeration={exaggeration ?? 1}
                      waterLevel={water}
                      sunAngles={sunAngles}
                      target={target}
                      targetMode={targetMode}
                      onPickTarget={onPickTarget}
                      sightBlocked={profile?.blocked ?? false}
                    />
                  </div>

                  {/* Control panel — a side card from sm up, where it costs
                      nothing. On a phone the same card measured 415 px of an
                      812 px screen: the controls took 51% of the viewport and
                      the terrain they describe got 28%, with the observer
                      marker itself underneath them. So on a phone it collapses
                      to a bar, and opening it is a deliberate act. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 sm:inset-auto sm:left-4 sm:top-4 sm:w-72 sm:p-0">
                    <div className="pointer-events-auto overflow-hidden rounded-xl border border-relief-line bg-relief-card/92 backdrop-blur">
                      {/* Summary bar, phones only. Carries the two things worth
                          a permanent 44 px — which site, and what it sees —
                          plus the fastest way between sites. */}
                      <div className="flex items-center gap-0.5 px-1.5 py-1.5 sm:hidden">
                        <button
                          onClick={() => stepSite(-1)}
                          aria-label="Previous site"
                          className="shrink-0 rounded-md px-2.5 py-2 text-relief-muted hover:text-relief-ink"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setPanelOpen((o) => !o)}
                          /* The accessible name deliberately differs from the
                             site chip's, so "the Death Valley button" stays
                             unambiguous to a test even while this one is
                             display:none on a laptop. */
                          aria-label={`${site.name} — ${panelOpen ? 'hide' : 'show'} controls`}
                          aria-expanded={panelOpen}
                          className="min-w-0 flex-1 truncate px-1 py-2 text-center text-sm font-medium text-relief-ink"
                        >
                          {site.name}
                        </button>
                        <button
                          onClick={() => stepSite(1)}
                          aria-label="Next site"
                          className="shrink-0 rounded-md px-2.5 py-2 text-relief-muted hover:text-relief-ink"
                        >
                          ›
                        </button>
                        <span className="relief-num shrink-0 px-1 text-sm text-relief-visible">
                          {stats ? `${(stats.visibleFraction * 100).toFixed(1)}%` : '—'}
                        </span>
                        <button
                          onClick={() => setPanelOpen((o) => !o)}
                          aria-label={panelOpen ? 'Hide controls' : 'Show controls'}
                          aria-expanded={panelOpen}
                          className="shrink-0 rounded-md border border-relief-line px-2 py-1.5 text-[0.7rem] font-medium text-relief-muted"
                        >
                          {panelOpen ? 'Close' : 'Controls'}
                        </button>
                      </div>

                      {/* Scrolls rather than growing: expanded, this is taller
                          than a phone, and a panel that pushes its own bottom
                          off the screen loses the statistics. */}
                      <div
                        className={`${
                          panelOpen
                            ? 'block max-h-[62svh] overflow-y-auto border-t border-relief-line'
                            : 'hidden'
                        } p-3 sm:block sm:max-h-[calc(100svh-9.5rem)] sm:overflow-y-auto sm:border-t-0 sm:p-4`}
                      >
                      {/* Site picker. One elevation model per site, swapped in
                          place — the sensor, its height and the overlay colour
                          stay exactly as they are, which is what makes the
                          readings below comparable across terrains. */}
                      <div className="flex flex-wrap gap-1.5">
                        {sites.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => selectSite(s)}
                            aria-pressed={s.id === site.id}
                            title={s.subtitle}
                            className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                              s.id === site.id
                                ? 'border-relief-line-strong bg-relief-line/40 text-relief-ink'
                                : 'border-relief-line text-relief-muted hover:border-relief-line-strong hover:text-relief-ink'
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-relief-line pt-3">
                        <span className="relief-label">
                          {observers.length > 1 ? `${observers.length} observers` : 'Observer'}
                        </span>
                        <button
                          onClick={() => {
                            setHeight(25)
                            setRefraction(true)
                            setObservers((os) => os.slice(0, 1))
                            setActive(0)
                            setExaggeration(defaultExaggeration(site.meta))
                          }}
                          className="text-xs font-medium text-relief-muted underline decoration-relief-line underline-offset-4 hover:text-relief-ink"
                        >
                          Reset
                        </button>
                      </div>

                      {/* Selecting a chip decides which observer the terrain
                          click moves; with more than one, the shading becomes a
                          coverage depth rather than plain visible/hidden. */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {observers.map((o, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center overflow-hidden rounded-md border text-xs ${
                              i === active
                                ? 'border-relief-visible/60 text-relief-visible'
                                : 'border-relief-line text-relief-muted'
                            }`}
                          >
                            <button
                              onClick={() => setActive(i)}
                              className="px-2 py-1 font-medium hover:text-relief-ink"
                              aria-pressed={i === active}
                              aria-label={`Select observer ${i + 1}`}
                            >
                              {i + 1}
                              <span className="relief-num ml-1.5 text-relief-muted">
                                {Math.round(o.ground).toLocaleString()} m
                              </span>
                            </button>
                            {observers.length > 1 && (
                              <button
                                onClick={() => removeObserver(i)}
                                className="border-l border-relief-line px-1.5 py-1 text-relief-muted hover:text-relief-ink"
                                aria-label={`Remove observer ${i + 1}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {observers.length < MAX_OBSERVERS && (
                          <button
                            onClick={addObserver}
                            className="rounded-md border border-dashed border-relief-line px-2 py-1 text-xs font-medium text-relief-muted hover:border-relief-line-strong hover:text-relief-ink"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      <label className="mt-3 block sm:mt-4">
                        <span className="flex items-baseline justify-between">
                          <span className="text-sm text-relief-ink-2">Height above ground</span>
                          <span className="relief-num text-sm text-relief-visible">
                            {height < 10 ? height.toFixed(1) : Math.round(height)} m
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.001}
                          value={fromHeight(height)}
                          onChange={(e) => setHeight(toHeight(Number(e.target.value)))}
                          className="mt-2 w-full accent-[var(--color-relief-visible)]"
                          aria-label="Observer height above ground, metres"
                        />
                        <span className="mt-1 flex justify-between text-[0.62rem] text-relief-muted">
                          {HEIGHT_STOPS.map((s) => (
                            <button
                              key={s.h}
                              onClick={() => setHeight(s.h)}
                              className="hover:text-relief-ink"
                              title={`${s.h} m`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </span>
                      </label>

                      <label className="mt-3 block sm:mt-4">
                        <span className="flex items-baseline justify-between">
                          <span className="text-sm text-relief-ink-2">Vertical exaggeration</span>
                          <span className="relief-num text-sm text-relief-visible">
                            {(exaggeration ?? 1).toFixed(1)}×
                          </span>
                        </span>
                        <input
                          type="range"
                          min={EXAG_MIN}
                          max={EXAG_MAX}
                          step={0.1}
                          value={exaggeration ?? 1}
                          onChange={(e) => setExaggeration(Number(e.target.value))}
                          className="mt-2 w-full accent-[var(--color-relief-visible)]"
                          aria-label="Vertical exaggeration"
                        />
                        <span className="mt-1 hidden text-[0.62rem] text-relief-muted sm:block">
                          Display only — visibility is computed from true elevations.
                        </span>
                      </label>

                      {/* Line of sight. A mode rather than a modifier key,
                          because shift-click does not exist on a phone and this
                          has to work with a thumb. */}
                      <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
                        <span className="text-sm text-relief-ink-2">
                          Line of sight
                          {profile && (
                            <span
                              className={`ml-1.5 ${profile.blocked ? 'text-relief-blocked' : 'text-relief-visible'}`}
                            >
                              {profile.blocked ? 'blocked' : 'clear'}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            setTargetMode((t) => !t)
                            if (targetMode) setTarget(null)
                          }}
                          aria-pressed={targetMode}
                          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                            targetMode
                              ? 'border-relief-visible/60 text-relief-visible'
                              : 'border-relief-line text-relief-muted hover:border-relief-line-strong hover:text-relief-ink'
                          }`}
                        >
                          {targetMode ? 'aiming' : 'aim'}
                        </button>
                      </div>
                      {targetMode && !target && (
                        <p className="mt-1.5 text-[0.68rem] leading-relaxed text-relief-muted">
                          Click the terrain to aim from the observer.
                        </p>
                      )}
                      {profile && (
                        <div className="mt-2">
                          <Section result={profile} blockedColor="var(--color-relief-blocked)" />
                          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                            <Stat label="Range" value={(profile.distanceM / 1000).toFixed(2)} unit="km" />
                            <Stat
                              label={profile.blocked ? 'Short by' : 'Clearance'}
                              value={
                                Math.abs(profile.minClearanceM) < 10
                                  ? Math.abs(profile.minClearanceM).toFixed(1)
                                  : Math.abs(Math.round(profile.minClearanceM)).toLocaleString()
                              }
                              unit="m"
                            />
                          </div>
                        </div>
                      )}

                      {/* Sun. A date and a time, not an angle — the azimuth and
                          elevation below are computed from this site's own
                          latitude and longitude, so the shadows are the ones
                          that would actually be there. */}
                      <label className="mt-3 block sm:mt-4">
                        <span className="flex items-baseline justify-between">
                          <span className="text-sm text-relief-ink-2">Sun</span>
                          <span className="relief-num text-sm text-relief-visible">
                            {clock(hour)}
                            <span className="ml-1.5 text-relief-muted">
                              {sunAngles.elevation < 0
                                ? 'below horizon'
                                : `${Math.round(sunAngles.azimuth)}° / ${Math.round(sunAngles.elevation)}°`}
                            </span>
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={0.05}
                          value={hour}
                          onChange={(e) => setHour(Number(e.target.value))}
                          className="mt-2 w-full accent-[var(--color-relief-visible)]"
                          aria-label="Time of day, local solar hours"
                        />
                        <span className="mt-1 flex justify-between text-[0.62rem] text-relief-muted">
                          {DATE_PRESETS.map((d, i) => (
                            <button
                              key={d.label}
                              onClick={() => setDateIdx(i)}
                              className={i === dateIdx ? 'text-relief-ink' : 'hover:text-relief-ink'}
                              aria-pressed={i === dateIdx}
                            >
                              {d.label}
                            </button>
                          ))}
                        </span>
                      </label>

                      {/* Water level. The slider's far left is dry — one
                          control rather than a toggle plus a slider, because
                          "off" is just the lowest level there is. */}
                      <label className="mt-3 block sm:mt-4">
                        <span className="flex items-baseline justify-between">
                          <span className="text-sm text-relief-ink-2">Water level</span>
                          <span className="relief-num text-sm text-relief-visible">
                            {water === null
                              ? 'dry'
                              : `${Math.round(water).toLocaleString()} m`}
                          </span>
                        </span>
                        <input
                          type="range"
                          min={waterRange(site.meta).min}
                          max={waterRange(site.meta).max}
                          step={1}
                          value={water ?? waterRange(site.meta).min}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            // Below the lowest ground there is nothing to flood,
                            // so that end of the travel reads as dry rather than
                            // drawing a surface nobody can see.
                            setWater(v <= site.meta.minElev ? null : v)
                          }}
                          className="mt-2 w-full accent-[var(--color-relief-visible)]"
                          aria-label="Water level, metres"
                        />
                        <span className="mt-1 flex items-center justify-between gap-2 text-[0.62rem] text-relief-muted">
                          <button onClick={() => setWater(null)} className="hover:text-relief-ink">
                            dry
                          </button>
                          {site.water.presets.map((p) => (
                            <button
                              key={p.label}
                              onClick={() => setWater(waterAt(p.at, site.meta))}
                              className="hover:text-relief-ink"
                              title={`${Math.round(waterAt(p.at, site.meta) ?? 0).toLocaleString()} m`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </span>
                      </label>

                      <label className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
                        <span className="text-sm text-relief-ink-2">
                          Refraction correction
                          <span className="ml-1 text-relief-muted">(k = 0.13)</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={refraction}
                          onChange={(e) => setRefraction(e.target.checked)}
                          className="h-4 w-4 accent-[var(--color-relief-visible)]"
                        />
                      </label>

                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-relief-line pt-3 sm:mt-4 sm:block sm:space-y-1.5">
                        {observers[active] && (
                          <Stat
                            label="Elev."
                            value={Math.round(observers[active].ground).toLocaleString()}
                            unit="m"
                          />
                        )}
                        {stats && (
                          <>
                            <Stat
                              label={observers.length > 1 ? 'Covered' : 'Visible'}
                              value={stats.visibleKm2.toFixed(1)}
                              unit="km²"
                            />
                            <Stat
                              label="Of frame"
                              value={(stats.visibleFraction * 100).toFixed(1)}
                              unit="%"
                            />
                            <Stat label="Furthest" value={stats.furthestKm.toFixed(1)} unit="km" />
                            {observers.length > 1 && (
                              <Stat
                                label="Seen by all"
                                value={(stats.overlapFraction * 100).toFixed(1)}
                                unit="%"
                              />
                            )}
                          </>
                        )}
                        {flood && (
                          <>
                            <Stat label="Flooded" value={flood.floodedKm2.toFixed(1)} unit="km²" />
                            <Stat label="Max depth" value={Math.round(flood.maxDepthM).toLocaleString()} unit="m" />
                          </>
                        )}
                      </div>

                      {/* An observer standing on ground that is now underwater
                          is still reporting a viewshed, and should say so rather
                          than quietly pretending. The visibility figures are
                          unaffected by design — water is a surface, not an
                          occluder — so this is about the observer, not the
                          computation. */}
                      {flood && observers[active] && observers[active].ground < flood.level && (
                        <p className="mt-2 text-[0.68rem] leading-relaxed text-relief-visible">
                          Observer is {Math.round(flood.level - observers[active].ground).toLocaleString()} m
                          below the waterline.
                        </p>
                      )}

                      {/* Appears only once a second site has been measured at
                          the same height — until then there is nothing to
                          compare and a one-row table would just be the number
                          above it, repeated. */}
                      {comparison.length > 1 && (
                        <div className="mt-3 border-t border-relief-line pt-3 sm:mt-4">
                          <span className="relief-label">
                            Same sensor, different world
                            <span className="ml-1 text-relief-muted">
                              · at {Math.round(observers[0].height)} m
                            </span>
                          </span>
                          <div className="mt-1.5 space-y-1">
                            {comparison.map((c) => (
                              <div
                                key={c.id}
                                className={`flex items-baseline justify-between gap-3 text-xs ${
                                  c.id === site.id ? 'text-relief-ink' : 'text-relief-muted'
                                }`}
                              >
                                <span className="truncate">{c.name}</span>
                                <span className="relief-num shrink-0">{c.pct.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="mt-3 hidden text-[0.68rem] leading-relaxed text-relief-muted sm:block">
                        Click the terrain to move the observer, or drag the marker. Drag
                        elsewhere to orbit, scroll to zoom. Arrow keys nudge; +/− change height.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid flex-1 place-items-center">
                  <Loading progress={progress} />
                </div>
              )}
            </Suspense>
          </SceneBoundary>
        )}
      </main>

      {/* On a phone this note runs to roughly 400 px and squeezed the scene it
          describes down to a sliver, so it collapses behind a disclosure there
          and stays open from sm up. */}
      <footer className="z-10 border-t border-relief-line px-4 py-2.5 text-xs leading-relaxed text-relief-muted sm:px-6 sm:py-3">
        <details className="sm:hidden">
          <summary className="cursor-pointer font-medium text-relief-ink-2">Method &amp; sources</summary>
          <div className="mt-2 space-y-1.5">
            <Notes site={site} />
          </div>
        </details>
        {/* Columns from sm up. Four paragraphs stacked cost about 150 px of
            terrain on a laptop, and the method is worth keeping visible rather
            than hiding behind a disclosure. */}
        <div className="hidden sm:block sm:columns-2 sm:gap-6 [&>p]:mb-1.5 [&>p]:break-inside-avoid">
          <Notes site={site} />
        </div>
      </footer>
    </div>
  )
}
