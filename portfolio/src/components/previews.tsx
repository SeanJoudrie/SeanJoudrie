import { lazy, useEffect, useMemo, useRef, useState } from 'react'

// Thin adapters that render each demo's REAL 3D scene as a card preview:
// no selection, no UI, just the model auto-spinning (every scene already
// rotates on its own). Each fetches whatever manifest its scene needs, then
// hands the scene preview-safe props. Lazy so the three.js chunk loads only
// when a card scrolls near. `onFail` bubbles a lost GL context up to the
// DemoPreview wrapper, which remounts the scene.
//
// `active` is the card's visibility. Scenes stay mounted for the life of the
// page, so all seven are alive at once — and seven render loops running at once
// measured the whole page down to 2 fps. Off screen, a scene keeps its geometry
// and its context but stops drawing.

const BASE = import.meta.env.BASE_URL
const noop = () => {}

type PreviewProps = {
  onFail: () => void
  /** False while the card is off screen — the scene idles instead of drawing. */
  active: boolean
}

// ── Cortex (brain) ──────────────────────────────────────────────────────────
const CortexScene = lazy(() => import('../pages/Cortex/Scene'))
export function CortexPreview({ onFail, active }: PreviewProps) {
  const [regions, setRegions] = useState<{ id: number; group: string }[] | null>(null)
  useEffect(() => {
    fetch(`${BASE}cortex/regions.json`).then((r) => r.json()).then((m) => setRegions(m.regions)).catch(onFail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const deepFlags = useMemo(() => {
    const f = new Uint8Array(64)
    regions?.forEach((r) => (f[r.id] = r.group === 'deep' ? 1 : 0))
    return f
  }, [regions])
  if (!regions) return null
  return <CortexScene active={active} selected={-1} deepFlags={deepFlags} onReady={noop} onFail={onFail} />
}

// ── Skull ─────────────────────────────────────────────────────────────────
const SkullScene = lazy(() => import('../pages/Skull/Scene'))
export function SkullPreview({ onFail, active }: PreviewProps) {
  const [m, setM] = useState<{ mandibleId: number; hinge: [number, number, number] } | null>(null)
  const jawRef = useRef({ open: 0, auto: true })
  useEffect(() => {
    fetch(`${BASE}skull/skull-regions.json`).then((r) => r.json()).then(setM).catch(onFail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!m) return null
  return (
    <SkullScene active={active} selected={-1} mandibleId={m.mandibleId} hinge={m.hinge} jawRef={jawRef} onReady={noop} onFail={onFail} />
  )
}

// ── Terra (earth) ───────────────────────────────────────────────────────────
const TerraScene = lazy(() => import('../pages/Terra/Scene'))
export function TerraPreview({ onFail, active }: PreviewProps) {
  return <TerraScene active={active} onReady={noop} onFail={onFail} />
}

// ── Pulse (heart) ─────────────────────────────────────────────────────────
const PulseScene = lazy(() => import('../pages/Pulse/Scene'))
export function PulsePreview({ onFail, active }: PreviewProps) {
  const [regions, setRegions] = useState<unknown[] | null>(null)
  const bpmRef = useRef({ bpm: 75 })
  useEffect(() => {
    fetch(`${BASE}pulse/pulse-regions.json`).then((r) => r.json()).then((m) => setRegions(m.regions)).catch(onFail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!regions) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PulseScene active={active} regions={regions as any} selected={-1} bpmRef={bpmRef} onReady={noop} onFail={onFail} />
}

// ── Riff (guitar) ───────────────────────────────────────────────────────────
const RiffScene = lazy(() => import('../pages/Riff/Scene'))
export function RiffPreview({ onFail, active }: PreviewProps) {
  return (
    <RiffScene
      active={active}
      bodyColor="original"
      accentColor="original"
      tone="clean"
      plugStage="unplugged"
      capo={0}
      reduce={false}
      spin
      onPluck={noop}
      onStrum={noop}
      onAmpClick={noop}
      onJackClick={noop}
      onCapoDrag={noop}
      onReady={noop}
      onFail={onFail}
    />
  )
}

// ── Spine ─────────────────────────────────────────────────────────────────
const SpineScene = lazy(() => import('../pages/Spine/Scene'))
export function SpinePreview({ onFail, active }: PreviewProps) {
  const [m, setM] = useState<{ cordId: number } | null>(null)
  const pulseRef = useRef({ pos: 0, auto: true })
  const bendRef = useRef({ val: 0 })
  useEffect(() => {
    fetch(`${BASE}spine/spine-regions.json`).then((r) => r.json()).then(setM).catch(onFail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!m) return null
  return (
    <SpineScene active={active} selected={-1} cordId={m.cordId} pulseRef={pulseRef} bendRef={bendRef} onReady={noop} onFail={onFail} />
  )
}
