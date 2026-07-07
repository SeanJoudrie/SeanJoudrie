import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { StudioEnvironment } from '../../lib/meridianScene'

/**
 * Riff's stage — a real, complete electric guitar ("Electric guitar" by
 * maxkorkiat / Maximusx0077, CC BY via Sketchfab; OBJ converted to GLB, its
 * own materials untouched) beside a solid amp, lit like Meridian. Shown as
 * downloaded; the body finish can recolour and the neck area is clickable.
 */

const GUITAR = `${import.meta.env.BASE_URL}riff/ibanez.glb`
const AMP = `${import.meta.env.BASE_URL}riff/amp.glb`
useGLTF.preload(GUITAR)
useGLTF.preload(AMP)

const DEBUG_HITZONES = false
const GUITAR_POS: [number, number, number] = [-1.0, -0.1, 0.4]
const GUITAR_YAW = -0.35
const GUITAR_HEIGHT = 3.0

/** Bounding box over an object's meshes → scale to a target height + centre. */
function fit(object: THREE.Object3D, targetHeight: number) {
  object.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  return { scale: targetHeight / size.y, center, size }
}

/** Rotation that stands any model upright: longest axis → Y, thinnest → Z. */
function autoOrient(object: THREE.Object3D): THREE.Matrix4 {
  const s = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3())
  const ax = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
  const sz = [s.x, s.y, s.z]
  const [thin, , long] = [0, 1, 2].sort((a, b) => sz[a] - sz[b])
  const mid = [0, 1, 2].find((i) => i !== thin && i !== long)!
  const [t, m, l] = [ax[thin], ax[mid], ax[long]]
  const M = new THREE.Matrix4().set(m.x, m.y, m.z, 0, l.x, l.y, l.z, 0, t.x, t.y, t.z, 0, 0, 0, 0, 1)
  if (M.determinant() < 0) { M.elements[0] *= -1; M.elements[4] *= -1; M.elements[8] *= -1 }
  return M
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
  const { group, f, bodyMat, zones, strumZone } = useMemo(() => {
    const root = scene.clone(true)
    // Largest mesh = the body, so the finish can recolour it later.
    let bodyMat: THREE.MeshStandardMaterial | null = null
    let bodyVol = 0
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat) mat.side = THREE.DoubleSide
      mesh.geometry.computeBoundingBox()
      const s = mesh.geometry.boundingBox!.getSize(new THREE.Vector3())
      const vol = s.x * s.y * s.z
      if (vol > bodyVol && mat) { bodyVol = vol; bodyMat = mat }
    })
    const group = new THREE.Group()
    group.add(root)
    group.setRotationFromMatrix(autoOrient(root))
    const f = fit(group, GUITAR_HEIGHT)
    const c = f.center, half = f.size.clone().multiplyScalar(0.5)
    const frontZ = c.z + half.z + 0.02
    const zones = [...Array(6)].map((_, i) => ({
      x: c.x + (i / 5 - 0.5) * 2 * half.x * 0.16,
      y: c.y + half.y * 0.18,
      z: frontZ,
      h: half.y * 0.62,
      w: half.x * 0.055,
    }))
    const strumZone = { x: c.x, y: c.y - half.y * 0.42, z: frontZ, w: half.x * 1.1, h: half.y * 0.5, d: half.z }
    return { group, f, bodyMat: bodyMat as THREE.MeshStandardMaterial | null, zones, strumZone }
  }, [scene])

  // Body finish. 'original' leaves the model exactly as downloaded.
  useEffect(() => {
    if (!bodyMat) return
    if (bodyColor === 'original') {
      if (bodyMat.userData.origColor) bodyMat.color.copy(bodyMat.userData.origColor)
    } else {
      if (!bodyMat.userData.origColor) bodyMat.userData.origColor = bodyMat.color.clone()
      bodyMat.color.set(bodyColor)
    }
    bodyMat.needsUpdate = true
  }, [bodyColor, bodyMat])

  return (
    <group position={GUITAR_POS} rotation={[0, GUITAR_YAW, 0]}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={group} />
        <mesh onPointerDown={(e) => { e.stopPropagation(); onStrum() }} visible={DEBUG_HITZONES} position={[strumZone.x, strumZone.y, strumZone.z]}>
          <boxGeometry args={[strumZone.w, strumZone.h, strumZone.d]} />
          <meshBasicMaterial color="#3bff6b" />
        </mesh>
        {zones.map((z, i) => (
          <mesh key={i} position={[z.x, z.y, z.z]} visible={DEBUG_HITZONES} onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}>
            <boxGeometry args={[z.w, z.h, 0.06]} />
            <meshBasicMaterial color="#ff3b3b" />
          </mesh>
        ))}
      </group>
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
    new THREE.Vector3(-1.1, -1.45, 0.5), new THREE.Vector3(-0.2, -1.75, 0.6),
    new THREE.Vector3(1.0, -1.4, 0.7), new THREE.Vector3(1.7, -0.5, 0.7),
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
      <Guitar bodyColor={bodyColor} onPluck={onPluck} onStrum={onStrum} />
      <Amp tone={tone} onClick={onAmpClick} />
      <Cable plugged={plugged} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.4} scale={12} blur={3} far={3} resolution={1024} frames={1} />
      <CameraControls makeDefault minDistance={3} maxDistance={11} />
    </Canvas>
  )
}
