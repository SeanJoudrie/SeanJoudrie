import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping, BackSide, BufferAttribute, Color, SphereGeometry } from 'three'
import { Bezel, CaseBody } from './watch/Case'
import { Dial } from './watch/Dial'
import { Crystal, Hands } from './watch/Hands'

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
export default function Scene() {
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
      <group rotation={[Math.PI / 2 - 0.28, 0, 0]}>
        <CaseBody />
        <Bezel />
        <Dial />
        <Hands />
        <Crystal />
      </group>

      {/* Near-static scene → a handful of warm-up frames, then it holds. */}
      <ContactShadows position={[0, -0.55, 0]} opacity={0.45} scale={5} blur={3.2} far={1.4} resolution={1024} frames={4} />

      <CameraControls
        makeDefault
        minDistance={0.9}
        maxDistance={4.5}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 + 0.25}
      />
    </Canvas>
  )
}
