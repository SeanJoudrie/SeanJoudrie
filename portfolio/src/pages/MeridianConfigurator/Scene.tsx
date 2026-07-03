import { useEffect, useRef } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls, ContactShadows } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { addTask } from '../../lib/ticker'
import { LOW_TIER, StudioEnvironment, Watch } from '../../lib/meridianScene'
import type { Selection } from './config'

export type ControlsRef = RefObject<ComponentRef<typeof CameraControls> | null>

/** Camera presets — the panel drives these through the controls ref. */
export const PRESETS = {
  hero: { pos: [1.5, 0.5, 2.3], tgt: [0, 0, 0] },
  dial: { pos: [0.15, 0.35, 2.6], tgt: [0, 0.05, 0] },
  crown: { pos: [2.3, 0.25, 0.95], tgt: [0.05, 0, 0] },
  strap: { pos: [1.15, -0.7, 2.4], tgt: [0, -0.32, 0] },
} as const
export type PresetId = keyof typeof PRESETS

export function flyTo(controls: ControlsRef, id: PresetId) {
  const p = PRESETS[id]
  void controls.current?.setLookAt(p.pos[0], p.pos[1], p.pos[2], p.tgt[0], p.tgt[1], p.tgt[2], true)
}

/*
 * The stage. Zero downloaded assets: the "studio" is authored Lightformers
 * baked into a small generated environment map (see lib/meridianScene.tsx,
 * where the environment and assembled watch now live, shared with the
 * Range-card preview) — under ACES tone mapping. frameloop="demand": the
 * scene renders only when something changes (camera, config, the 1Hz quartz
 * tick later); idle GPU cost is ~zero.
 */

/** The arrival: the watch starts 30° off-hero and settles as the page
    fades in. Skipped under reduced motion and on the low GPU tier — the
    flourish is a bonus, never a gate. */
function Intro({ controls, ready }: { controls: ControlsRef; ready: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  const played = useRef(false)
  useEffect(() => {
    if (!ready || played.current) return
    played.current = true
    if (LOW_TIER || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const c = controls.current
    if (!c) return
    const az = c.azimuthAngle
    void c.rotateAzimuthTo(az + 0.52, false)
    void c.rotateAzimuthTo(az, true)
    invalidate()
  }, [ready, controls, invalidate])
  return null
}

/** Idle autorotate: starts after 6s of stillness, pauses the moment a hand
    arrives, and retires entirely after 60s of cumulative spin — the demand
    frameloop goes back to its ~1Hz quartz idle. Reduced motion: never. */
function AutoRotate({ controls }: { controls: ControlsRef }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancel: (() => void) | null = null
    let spun = 0
    let idleTimer = 0
    const start = () => {
      if (spun >= 60_000) return
      let last = performance.now()
      cancel = addTask((now) => {
        const c = controls.current
        if (!c) return true
        const dt = now - last
        last = now
        spun += dt
        c.azimuthAngle += dt * 0.00012
        invalidate()
        return spun >= 60_000
      })
    }
    const arm = () => {
      idleTimer = window.setTimeout(start, 6_000)
    }
    const onStart = () => {
      cancel?.()
      cancel = null
      window.clearTimeout(idleTimer)
    }
    const onEnd = () => {
      window.clearTimeout(idleTimer)
      arm()
    }
    const c = controls.current
    c?.addEventListener('controlstart', onStart)
    c?.addEventListener('controlend', onEnd)
    arm()
    return () => {
      cancel?.()
      window.clearTimeout(idleTimer)
      c?.removeEventListener('controlstart', onStart)
      c?.removeEventListener('controlend', onEnd)
    }
  }, [controls, invalidate])
  return null
}

export default function Scene({
  selection,
  controlsRef,
  onContextLost,
  onReady,
  ready,
}: {
  selection: Selection
  controlsRef: ControlsRef
  onContextLost: () => void
  onReady: () => void
  ready: boolean
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [1.4, 0.55, 2.2], fov: 35 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        // An unrecovered GPU context is a black rectangle — hand the stage
        // to the static fallback instead.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost()
        })
        // First painted frame → fade the stage in; never a black flash.
        requestAnimationFrame(() => onReady())
      }}
    >
      <StudioEnvironment />

      {/* The watch, product-shot orientation: dial toward the camera with a
          slight backward lean, floating over its shadow. */}
      <Watch selection={selection} />

      {/* Near-static scene → a handful of warm-up frames, then it holds. */}
      <ContactShadows position={[0, -0.55, 0]} opacity={0.45} scale={5} blur={3.2} far={1.4} resolution={1024} frames={4} />

      <CameraControls
        ref={controlsRef}
        makeDefault
        minDistance={0.9}
        maxDistance={4.5}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 + 0.25}
      />
      <AutoRotate controls={controlsRef} />
      <Intro controls={controlsRef} ready={ready} />
    </Canvas>
  )
}
