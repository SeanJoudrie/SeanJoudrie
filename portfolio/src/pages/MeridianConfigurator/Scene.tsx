import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { CaseBody } from './watch/Case'

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
      <Environment resolution={256}>
        {/* Base tone — fills the env's dark zones so brushed metal always
            has something to reflect (the Phase-2 sphere read near-black
            without it). */}
        <color attach="background" args={['#26221c']} />
        {/* Key — a broad softbox overhead. */}
        <Lightformer intensity={3.2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[8, 6, 1]} />
        {/* Fill — cool, camera-left. */}
        <Lightformer intensity={1.1} position={[-4, 1.2, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} color="#e8ecf5" />
        {/* Rim — warm brass, behind camera-right, for the metal's edge sweep. */}
        <Lightformer intensity={0.9} position={[4, 0.8, -2.5]} rotation-y={-Math.PI / 2} scale={[4, 2.5, 1]} color="#c9a55a" />
        {/* Bounce — dim, from below, so casebacks and bevels don't go dead. */}
        <Lightformer intensity={0.35} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[6, 6, 1]} color="#8a7f6b" />
      </Environment>

      {/* The watch, product-shot orientation: dial toward the camera with a
          slight backward lean, floating over its shadow. */}
      <group rotation={[Math.PI / 2 - 0.28, 0, 0]}>
        <CaseBody />
      </group>

      {/* Static scene → the shadow renders once, not per frame. */}
      <ContactShadows position={[0, -0.55, 0]} opacity={0.5} scale={5} blur={2.4} far={1.4} resolution={512} frames={1} />

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
