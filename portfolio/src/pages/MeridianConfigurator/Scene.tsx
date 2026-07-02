import { useEffect, useMemo } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping, BackSide, BufferAttribute, Color, SphereGeometry } from 'three'
import { addTask } from '../../lib/ticker'
import type { Selection } from './config'
import { bezelOf, caseOf, strapOf } from './config'
import { useDampedMetal } from './materials'
import { Bezel, CaseBody } from './watch/Case'
import { Dial } from './watch/Dial'
import { Crystal, Hands } from './watch/Hands'
import { Strap } from './watch/Strap'

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

/** A vertex-gradient dome inside the env scene: continuous ambient falloff
    (floor → horizon → ceiling) instead of one flat tone, so broad metal
    reflections never band or go dead. */
function GradientDome() {
  const geometry = useMemo(() => {
    const g = new SphereGeometry(18, 48, 32)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const top = new Color('#4a4034')
    const mid = new Color('#2a251f')
    const bottom = new Color('#131110')
    const c = new Color()
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) / 18 + 1) / 2
      if (t > 0.5) c.copy(mid).lerp(top, (t - 0.5) * 2)
      else c.copy(bottom).lerp(mid, t * 2)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new BufferAttribute(colors, 3))
    return g
  }, [])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={BackSide} />
    </mesh>
  )
}

/**
 * The stage. Zero downloaded assets: the "studio" is authored Lightformers
 * baked into a small generated environment map — a warm base tone so metal
 * never reflects pure void, key softbox above, cool fill left, warm brass
 * rim right, dim bounce below — under ACES tone mapping.
 * frameloop="demand": the scene renders only when something changes (camera,
 * config, the 1Hz quartz tick later); idle GPU cost is ~zero.
 */
function Watch({ selection }: { selection: Selection }) {
  const caseMat = useDampedMetal(caseOf(selection).metal)
  const bezelMat = useDampedMetal(bezelOf(selection).metal)
  return (
    <group rotation={[Math.PI / 2 - 0.28, 0, 0]}>
      <CaseBody material={caseMat} />
      <Bezel material={bezelMat} />
      <Dial dialId={selection.dial} />
      <Hands />
      <Crystal />
      <Strap option={strapOf(selection)} caseMaterial={caseMat} />
    </group>
  )
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

export default function Scene({ selection, controlsRef }: { selection: Selection; controlsRef: ControlsRef }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [1.4, 0.55, 2.2], fov: 35 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
    >
      <Environment resolution={512}>
        {/* Continuous ambient — see GradientDome. */}
        <GradientDome />
        {/* Key — a big round softbox overhead; round catchlights are what
            watch photography lives on. */}
        <Lightformer form="circle" intensity={3.4} position={[0, 4, 0.5]} rotation-x={Math.PI / 2} scale={6} />
        {/* Fill — cool, camera-left. */}
        <Lightformer form="circle" intensity={1.1} position={[-4, 1.2, 2]} rotation-y={Math.PI / 2} scale={4} color="#e8ecf5" />
        {/* Rim — warm brass, behind camera-right, for the metal's edge sweep. */}
        <Lightformer form="circle" intensity={0.9} position={[4, 0.8, -2.5]} rotation-y={-Math.PI / 2} scale={3.5} color="#c9a55a" />
        {/* Bounce — dim, from below, so casebacks and bevels don't go dead. */}
        <Lightformer form="circle" intensity={0.35} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={6} color="#8a7f6b" />
        {/* Camera-side fill — polished, camera-facing surfaces (bezel dome,
            crystal) need something frontal to mirror or they read black. */}
        <Lightformer form="circle" intensity={0.55} position={[0, 0.5, 5]} scale={5} color="#f2efe8" />
      </Environment>

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
    </Canvas>
  )
}
