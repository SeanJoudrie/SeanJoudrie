import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, ContactShadows, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { StudioEnvironment } from '../../lib/meridianScene'
import { STRINGS } from './audio'

/**
 * Riff's stage — a solid guitar and amp rendered like Meridian (real meshes,
 * studio lighting), not particles. The guitar's body material recolours live;
 * six invisible hit-zones over the strings play the open notes; a cable
 * connects to the amp when plugged.
 *
 * Models (CC BY, via Poly Pizza): guitar by Zsky, amp by Poly by Google.
 */

useGLTF.preload(`${import.meta.env.BASE_URL}riff/guitar.glb`)
useGLTF.preload(`${import.meta.env.BASE_URL}riff/amp.glb`)

// String hit-zones sit on the guitar's front face. The model's length runs
// along Y (neck up), width along Z, and the face normal along +X — so the
// six strings are parallel bars along Y, spread across Z, nudged to +X.
const DEBUG_HITZONES = false
const NUT_Y = 0.95
const BRIDGE_Y = -0.35
const STRING_SPREAD = 0.15 // half-width of the six click lanes (Z)
const STRING_X = 0.12 // out to the front face

function fit(object: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  const s = targetHeight / Math.max(size.x, size.y, size.z)
  return { scale: s, center }
}

function Guitar({
  bodyColor,
  vibrating,
  onPluck,
  onStrum,
}: {
  bodyColor: string
  vibrating: React.MutableRefObject<{ i: number; t: number }[]>
  onPluck: (i: number) => void
  onStrum: () => void
}) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}riff/guitar.glb`)
  const group = useRef<THREE.Group>(null)

  // Clone so recolouring doesn't mutate the shared cache, then pick the body
  // material: a guitar body is a broad flat slab, so its bounding box has the
  // largest single face of any part (bigger than the thin neck or the small
  // hardware). That beats name-matching across arbitrary models.
  const { root, bodyMats, fit: f } = useMemo(() => {
    const root = scene.clone(true)
    const face = new Map<THREE.MeshStandardMaterial, number>()
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const mat = (m.material as THREE.MeshStandardMaterial).clone()
      m.material = mat
      m.castShadow = true
      const g = m.geometry as THREE.BufferGeometry
      g.computeBoundingBox()
      const s = new THREE.Vector3()
      g.boundingBox!.getSize(s)
      const maxFace = Math.max(s.x * s.y, s.y * s.z, s.x * s.z)
      face.set(mat, Math.max(face.get(mat) ?? 0, maxFace))
    })
    const bodyMats = [[...face.entries()].sort((a, b) => b[1] - a[1])[0][0]]
    return { root, bodyMats, fit: fit(root, 2.4) }
  }, [scene])

  useEffect(() => {
    const c = new THREE.Color(bodyColor)
    bodyMats.forEach((m) => {
      m.color.copy(c)
      m.metalness = 0.35
      m.roughness = 0.32
    })
  }, [bodyColor, bodyMats])

  useFrame((state) => {
    // vibrate strings that were recently plucked (visual only)
    if (!group.current) return
    const now = state.clock.elapsedTime
    vibrating.current = vibrating.current.filter((v) => now - v.t < 0.6)
  })

  return (
    <group ref={group} position={[-1.5, -0.1, 0.3]} rotation={[0, Math.PI / 2, 0.32]}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>

      {/* Six string hit-zones (bars along Y, spread across Z). Pointer down = pluck. */}
      {STRINGS.map((s, i) => {
        const z = STRING_SPREAD * (i / (STRINGS.length - 1) - 0.5) * 2
        return (
          <mesh
            key={s.name}
            position={[STRING_X, (NUT_Y + BRIDGE_Y) / 2, z]}
            onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}
            visible={DEBUG_HITZONES}
          >
            <boxGeometry args={[0.07, NUT_Y - BRIDGE_Y, 0.045]} />
            <meshBasicMaterial color="#ff3b3b" />
          </mesh>
        )
      })}

      {/* Strum zone across the lower body. */}
      <mesh position={[STRING_X, BRIDGE_Y - 0.35, 0]} onPointerDown={(e) => { e.stopPropagation(); onStrum() }} visible={DEBUG_HITZONES}>
        <boxGeometry args={[0.06, 0.5, STRING_SPREAD * 2.4]} />
        <meshBasicMaterial color="#3b82ff" />
      </mesh>
    </group>
  )
}

function Amp({ tone, onClick }: { tone: string; onClick: () => void }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}riff/amp.glb`)
  const { root, f } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => { (o as THREE.Mesh).castShadow = true })
    return { root, f: fit(root, 2.0) }
  }, [scene])
  return (
    <group position={[1.5, 0, 0]} rotation={[0, -0.5, 0]} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      {/* a small emissive dot glows the amp's current tone */}
      <mesh position={[0.55, 0.75, 0.75]}>
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
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.15, -0.35, 0.35),
      new THREE.Vector3(-0.3, -1.15, 0.5),
      new THREE.Vector3(0.7, -1.05, 0.6),
      new THREE.Vector3(1.35, -0.2, 0.6),
    ])
  }, [])
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.03, 8, false), [curve])
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
  const vibrating = useRef<{ i: number; t: number }[]>([])
  const [failed] = useState(false)
  if (failed) return null

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.9, 6.2], fov: 38 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
        requestAnimationFrame(() => onReady())
      }}
    >
      <StudioEnvironment />
      <Guitar bodyColor={bodyColor} vibrating={vibrating} onPluck={onPluck} onStrum={onStrum} />
      <Amp tone={tone} onClick={onAmpClick} />
      <Cable plugged={plugged} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={12} blur={3} far={3} resolution={1024} frames={1} />
      <CameraControls makeDefault minDistance={3} maxDistance={11} />
    </Canvas>
  )
}
