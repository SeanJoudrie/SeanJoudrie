import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'

/**
 * The stage. Zero downloaded assets: the "studio" is authored Lightformers
 * baked into a small generated environment map — key above, cool fill left,
 * warm brass rim right — under ACES tone mapping. frameloop="demand" means
 * the scene renders only when something changes (camera, config, the 1Hz
 * quartz tick later); idle GPU cost is ~zero.
 *
 * Phase-2 placeholder subject: a brushed-metal test sphere — the fidelity
 * go/no-go runs against this rig before any watch geometry lands.
 */
export default function Scene() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2.1, 1.1, 2.5], fov: 35 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
    >
      <Environment resolution={256}>
        {/* Key — a broad softbox overhead. */}
        <Lightformer intensity={3.5} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[7, 5, 1]} />
        {/* Fill — cool, camera-left. */}
        <Lightformer intensity={1.2} position={[-4, 1.2, 2]} rotation-y={Math.PI / 2} scale={[5, 2.5, 1]} color="#e8ecf5" />
        {/* Rim — warm brass, behind camera-right, for the metal's edge sweep. */}
        <Lightformer intensity={0.9} position={[4, 0.8, -2.5]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} color="#c9a55a" />
      </Environment>

      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.55, 96, 96]} />
        <meshPhysicalMaterial color="#cfd2d6" metalness={1} roughness={0.3} clearcoat={0.5} clearcoatRoughness={0.35} />
      </mesh>

      {/* Static scene → the shadow renders once, not per frame. */}
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={6} blur={2.4} far={2.2} resolution={512} frames={1} />

      <CameraControls
        makeDefault
        minDistance={1.5}
        maxDistance={5.5}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 + 0.12}
      />
    </Canvas>
  )
}
