import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Bloom — a voxel rose. The source model (Rose by Erbay ÇELIK, CC BY, via
 * Poly Pizza) is surface-voxelized at bake time into nine grid resolutions,
 * from 105 chunky cubes to 77,000 fine ones. The detail slider steps through
 * those baked levels; every cube is one instance of a single lit box mesh,
 * so even the finest level is one draw call.
 *
 * Unlike the Terra/Cortex/Skull particles, these are solid bodies: real
 * cubes with shaded faces under a key light — no additive glow anywhere.
 */

export type Level = {
  r: number
  cubeSize: number
  count: number
  centers: Float32Array // xyz per cube
  colorIds: Uint8Array // 0 petal, 1 foliage
}

const PETAL = new THREE.Color('#c9362e')
const FOLIAGE = new THREE.Color('#3f7d33')

export function parseRose(buf: ArrayBuffer): Level[] {
  const dv = new DataView(buf)
  const numLevels = dv.getUint8(0)
  let o = 1
  const levels: Level[] = []
  const Q = 1.2 / 32767
  for (let l = 0; l < numLevels; l++) {
    const r = dv.getUint16(o, true)
    const cubeSize = dv.getFloat32(o + 2, true)
    const count = dv.getUint32(o + 6, true)
    o += 10
    const centers = new Float32Array(count * 3)
    const colorIds = new Uint8Array(count)
    for (let i = 0; i < count; i++) {
      centers[i * 3] = dv.getInt16(o, true) * Q
      centers[i * 3 + 1] = dv.getInt16(o + 2, true) * Q
      centers[i * 3 + 2] = dv.getInt16(o + 4, true) * Q
      colorIds[i] = dv.getUint8(o + 6)
      o += 7
    }
    levels.push({ r, cubeSize, count, centers, colorIds })
  }
  return levels
}

function Rose({ levels, level }: { levels: Level[]; level: number }) {
  const spin = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const capacity = useMemo(() => Math.max(...levels.map((l) => l.count)), [levels])

  // Rebuild instance matrices + colors when the detail level changes. Even
  // the 77k level composes in a couple of milliseconds. Layout effect, not
  // effect: InstancedMesh is born with count = capacity and garbage
  // matrices, and the first R3F frame must never see that.
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const L = levels[level]
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let i = 0; i < L.count; i++) {
      m.makeScale(L.cubeSize, L.cubeSize, L.cubeSize)
      m.setPosition(L.centers[i * 3], L.centers[i * 3 + 1], L.centers[i * 3 + 2])
      mesh.setMatrixAt(i, m)
      // Slight deterministic value jitter so flat runs of cubes read as
      // individual bodies rather than one extruded slab.
      const j = 0.92 + (((i * 2654435761) >>> 24) / 255) * 0.16
      c.copy(L.colorIds[i] === 0 ? PETAL : FOLIAGE).multiplyScalar(j)
      mesh.setColorAt(i, c)
    }
    mesh.count = L.count
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [levels, level])

  useFrame((_, delta) => {
    if (spin.current && !reduced) spin.current.rotation.y += delta * 0.25
  })

  return (
    <group ref={spin}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, capacity]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.05} />
      </instancedMesh>
    </group>
  )
}

export default function Scene({
  levels,
  level,
  onFail,
}: {
  levels: Level[]
  level: number
  onFail: () => void
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.6, 0.35, 2.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      {/* Solid-body lighting: warm key, cool sky fill, low bounce. */}
      <hemisphereLight args={['#cdd5e4', '#171310', 0.9]} />
      <directionalLight position={[2.5, 3.2, 2]} intensity={1.6} color="#ffe8d2" />
      <directionalLight position={[-2.2, 0.6, -1.6]} intensity={0.35} color="#9fb4dd" />
      <Rose levels={levels} level={level} />
      <CameraControls minDistance={1.4} maxDistance={5} />
    </Canvas>
  )
}
