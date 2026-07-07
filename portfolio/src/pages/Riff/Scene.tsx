import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { StudioEnvironment } from '../../lib/meridianScene'
import { StratGuitar } from './guitarModel'

/**
 * Riff's stage — a hand-modelled Stratocaster (see guitarModel) beside a solid
 * amp, lit like Meridian. The guitar's body material recolours live; its six
 * strings are clickable; a cable joins it to the amp when plugged.
 *
 * Amp model: CC BY, via Poly Pizza (Poly by Google). The guitar is procedural.
 */

useGLTF.preload(`${import.meta.env.BASE_URL}riff/amp.glb`)

function fit(object: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  return { scale: targetHeight / Math.max(size.x, size.y, size.z), center }
}

function Amp({ tone, onClick }: { tone: string; onClick: () => void }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}riff/amp.glb`)
  const { root, f } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => { (o as THREE.Mesh).castShadow = true })
    return { root, f: fit(root, 2.4) }
  }, [scene])
  return (
    <group position={[1.9, -0.15, 0]} rotation={[0, -0.5, 0]} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      <mesh position={[0.55, 0.9, 0.75]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          emissive={tone === 'drive' ? '#ff5a2a' : tone === 'reverb' ? '#4aa3ff' : '#59d98a'}
          emissiveIntensity={2.2}
          color="#111"
        />
      </mesh>
    </group>
  )
}

function Cable({ plugged }: { plugged: boolean }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.55, -1.15, 0.3),
      new THREE.Vector3(-0.7, -1.55, 0.5),
      new THREE.Vector3(0.7, -1.35, 0.6),
      new THREE.Vector3(1.5, -0.5, 0.6),
    ])
    return new THREE.TubeGeometry(curve, 40, 0.035, 8, false)
  }, [])
  if (!plugged) return null
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} />
    </mesh>
  )
}

export default function Scene({
  bodyColor,
  tone,
  plugged,
  onPluck,
  onStrum,
  onAmpClick,
  onReady,
  onFail,
}: {
  bodyColor: string
  tone: string
  plugged: boolean
  onPluck: (i: number) => void
  onStrum: () => void
  onAmpClick: () => void
  onReady: () => void
  onFail: () => void
}) {
  const [failed] = useState(false)
  if (failed) return null

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [-0.6, 0.15, 4.6], fov: 40 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
        requestAnimationFrame(() => onReady())
      }}
    >
      <StudioEnvironment />
      {/* Centre the guitar (its content spans ~Y -0.66..2.37 at group scale) and
          lean it like a product shot. */}
      <group position={[-1.7, -0.85, 0.2]} rotation={[0, 0, 0.12]}>
        <StratGuitar bodyColor={bodyColor} onPluck={onPluck} onStrum={onStrum} />
      </group>
      <Amp tone={tone} onClick={onAmpClick} />
      <Cable plugged={plugged} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.4} scale={12} blur={3} far={3} resolution={1024} frames={1} />
      <CameraControls makeDefault minDistance={3} maxDistance={11} />
    </Canvas>
  )
}
