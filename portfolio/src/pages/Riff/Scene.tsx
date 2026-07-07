import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { StudioEnvironment } from '../../lib/meridianScene'

/**
 * Riff's stage — a real Fender Stratocaster (Peak_Creation, CC BY via
 * Sketchfab; FBX converted to GLB, textures re-bound and web-optimized) beside
 * a solid amp, lit like Meridian. The body finish recolours live, the six
 * strings are clickable hit-zones, and a cable joins to the amp when plugged.
 */

const GUITAR = `${import.meta.env.BASE_URL}riff/guitar.glb`
const AMP = `${import.meta.env.BASE_URL}riff/amp.glb`
useGLTF.preload(GUITAR)
useGLTF.preload(AMP)

// Six string hit-zones over the fretboard, tuned to the fitted model by eye.
const DEBUG_HITZONES = false
const STRING_SPREAD = 0.13
const NECK_TOP = 1.02
const NECK_BOT = 0.05
const STRING_X = 0.16
const STRING_Z = 0.42

// The model ships on a wooden stand (material 'wood_holder') with a coiled
// cable + disc base (material 'wires2') and a cable end ('end_holder').
// Hiding by MATERIAL is robust — it never touches the neck/hardware.
const HIDE_MAT = /wood_holder|wires2|end_holder/i
// Two-stage orientation: FACE turns the model to the camera; SPIN (an outer
// group, so it's a clean screen-plane rotation) stands it upright.
const FACE_ROT: [number, number, number] = [0, Math.PI / 2, 0]
const SPIN_Z = -1.12

function effectivelyVisible(o: THREE.Object3D): boolean {
  let n: THREE.Object3D | null = o
  while (n) { if (!n.visible) return false; n = n.parent }
  return true
}

/** Bounding box over only the visible meshes (so a hidden stand doesn't count). */
function fit(object: THREE.Object3D, targetHeight: number) {
  object.updateWorldMatrix(true, true)
  const box = new THREE.Box3()
  object.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry && effectivelyVisible(m)) {
      m.geometry.computeBoundingBox()
      box.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld))
    }
  })
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  return { scale: targetHeight / Math.max(size.x, size.y, size.z), center, size }
}

function Guitar({
  bodyColor,
  onPluck,
  onStrum,
}: {
  bodyColor: string
  onPluck: (i: number) => void
  onStrum: () => void
}) {
  const { scene } = useGLTF(GUITAR)
  const { root, f, bodyMat } = useMemo(() => {
    const root = scene.clone(true)
    let bodyMat: THREE.MeshStandardMaterial | null = null
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat && HIDE_MAT.test(mat.name)) { m.visible = false; return }
      m.castShadow = true
      if (mat && /guitar_main/i.test(mat.name)) {
        const clone = mat.clone()
        m.material = clone
        bodyMat = clone
      }
    })
    // Re-fit on only the visible instrument.
    return { root, f: fit(root, 2.7), bodyMat: bodyMat as THREE.MeshStandardMaterial | null }
  }, [scene])

  // Recolour the body finish. 'original' keeps the textured red; a hex paints
  // a clean flat finish (drop the map so the colour reads true).
  useEffect(() => {
    if (!bodyMat) return
    if (bodyColor === 'original') {
      bodyMat.map = bodyMat.userData.origMap ?? bodyMat.map
      bodyMat.color.set('#ffffff')
    } else {
      if (!bodyMat.userData.origMap) bodyMat.userData.origMap = bodyMat.map
      bodyMat.map = null
      bodyMat.color.set(bodyColor)
    }
    bodyMat.needsUpdate = true
  }, [bodyColor, bodyMat])

  return (
    <group>
      <group rotation={[0, 0, SPIN_Z]}>
        <group rotation={FACE_ROT}>
          <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
            <primitive object={root} />
          </group>
        </group>
      </group>
      {/* strum + six string hit-zones (invisible in prod) */}
      <mesh onPointerDown={(e) => { e.stopPropagation(); onStrum() }} visible={false} position={[0, -0.9, STRING_Z]}>
        <boxGeometry args={[1.2, 0.5, 0.4]} />
      </mesh>
      {[...Array(6)].map((_, i) => {
        const x = STRING_X + STRING_SPREAD * (i / 5 - 0.5) * 2
        return (
          <mesh
            key={i}
            position={[x, (NECK_TOP + NECK_BOT) / 2, STRING_Z]}
            visible={DEBUG_HITZONES}
            onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}
          >
            <boxGeometry args={[0.06, NECK_TOP - NECK_BOT, 0.05]} />
            <meshBasicMaterial color="#ff3b3b" />
          </mesh>
        )
      })}
    </group>
  )
}

function Amp({ tone, onClick }: { tone: string; onClick: () => void }) {
  const { scene } = useGLTF(AMP)
  const { root, f } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => { (o as THREE.Mesh).castShadow = true })
    return { root, f: fit(root, 2.4) }
  }, [scene])
  return (
    <group position={[2.0, -0.15, 0]} rotation={[0, -0.5, 0]} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      <mesh position={[0.55, 0.9, 0.75]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial emissive={tone === 'drive' ? '#ff5a2a' : tone === 'reverb' ? '#4aa3ff' : '#59d98a'} emissiveIntensity={2.2} color="#111" />
      </mesh>
    </group>
  )
}

function Cable({ plugged }: { plugged: boolean }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, -1.15, 0.3), new THREE.Vector3(-0.6, -1.55, 0.5),
    new THREE.Vector3(0.8, -1.35, 0.6), new THREE.Vector3(1.6, -0.5, 0.6),
  ]), 40, 0.035, 8, false), [])
  if (!plugged) return null
  return <mesh geometry={geo}><meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} /></mesh>
}

export default function Scene({
  bodyColor, tone, plugged, onPluck, onStrum, onAmpClick, onReady, onFail,
}: {
  bodyColor: string; tone: string; plugged: boolean
  onPluck: (i: number) => void; onStrum: () => void; onAmpClick: () => void
  onReady: () => void; onFail: () => void
}) {
  const [failed] = useState(false)
  if (failed) return null
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [-0.6, 0.15, 4.8], fov: 40 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
        requestAnimationFrame(() => onReady())
      }}
    >
      <StudioEnvironment />
      <group position={[-1.4, -0.15, 0.2]}>
        <Guitar bodyColor={bodyColor} onPluck={onPluck} onStrum={onStrum} />
      </group>
      <Amp tone={tone} onClick={onAmpClick} />
      <Cable plugged={plugged} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.4} scale={12} blur={3} far={3} resolution={1024} frames={1} />
      <CameraControls makeDefault minDistance={3} maxDistance={11} />
    </Canvas>
  )
}
