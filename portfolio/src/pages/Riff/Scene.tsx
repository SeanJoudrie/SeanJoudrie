import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, ContactShadows, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { StudioEnvironment } from '../../lib/meridianScene'

/**
 * Riff's stage — a real, complete electric guitar ("Electric guitar" by
 * maxkorkiat / Maximusx0077, CC BY via Sketchfab; OBJ converted to GLB, its
 * own materials untouched) beside a solid amp, lit like Meridian.
 *
 * Interactions: the finish recolours the body set and the accent colour the
 * pickup bobbins + knobs; six invisible hit-strings sit exactly over the
 * model's real strings so each click plays that string; a trigger-style capo
 * drags along the neck and raises the pitch; and the cable is plugged by hand
 * — activate it, click a glowing jack, and a real metal 1/4" plug follows the
 * cursor on the end of the cable until you seat it in the amp's input socket.
 */

export type PlugStage = 'unplugged' | 'armed' | 'drag-guitar' | 'drag-amp' | 'plugged'

const GUITAR = `${import.meta.env.BASE_URL}riff/ibanez.glb`
const AMP = `${import.meta.env.BASE_URL}riff/amp.glb`
useGLTF.preload(GUITAR)
useGLTF.preload(AMP)

const DEBUG_HITZONES = false
const GUITAR_POS: [number, number, number] = [-0.35, -0.05, 0.4]
const GUITAR_YAW = -0.5 // face the same way as the amp
const GUITAR_HEIGHT = 2.9

// The six real strings on this model (Circle.007–013), in native model coords,
// ordered low-E → high-e by X. Invisible hit-strings sit exactly over these so
// clicking a string plays that string's open note. { x, y (centre), z, len (Y) }.
const STRINGS = [
  { x: -0.119, y: 6.872, z: 0.067, len: 4.224 },
  { x: -0.070, y: 6.935, z: 0.059, len: 4.354 },
  { x: -0.023, y: 6.993, z: 0.049, len: 4.479 },
  { x: 0.027, y: 7.058, z: 0.040, len: 4.612 },
  { x: 0.073, y: 7.114, z: 0.031, len: 4.722 },
  { x: 0.120, y: 7.173, z: 0.022, len: 4.853 },
]
const STRING_FRONT = 0.12 // push the hit-strings a hair in front of the body

// Neck geometry in native model coords (from the fret strip Metal3):
// nut at the top of the fretboard, bridge saddle plate lower on the body.
const NUT_Y = 8.49
const SCALE_L = 3.58 // nut → bridge
const MAX_CAPO = 7
/** Y of the capo bar for fret n (just behind the fret wire). */
const capoY = (fret: number) => NUT_Y - (1 - Math.pow(2, -(fret - 0.45) / 12)) * SCALE_L
/** Inverse: fret from a y position on the neck (clamped 1..MAX_CAPO). */
const fretFromY = (y: number) => {
  const t = 1 - (NUT_Y - y) / SCALE_L
  const f = -12 * Math.log2(Math.max(0.2, Math.min(1, t))) + 0.45
  return Math.max(1, Math.min(MAX_CAPO, Math.round(f)))
}

// The model's output jack plate (Plane.016, Metal3) sits on the lower treble
// side of the body — that's where the cable plugs into the guitar.
const GUITAR_JACK: [number, number, number] = [0.464, 5.248, 0.1]
// The amp's input socket: top-right of the control panel, on the front face
// (the amp group's frame). The model has no jack there, so we mount one.
const AMP_JACK: [number, number, number] = [0.78, 0.84, 0.76]

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

/** Pulsing light-blue jack marker. Sized in its parent's units via `r`. */
function JackGlow({ r, active, onClick }: { r: number; active: boolean; onClick: () => void }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mat.current || !mesh.current) return
    const p = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4)
    mat.current.opacity = active ? 0.28 + 0.45 * p : 0
    const s = 1 + 0.3 * p
    mesh.current.scale.setScalar(s)
  })
  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[r, 20, 20]} />
        <meshBasicMaterial ref={mat} color="#57c8ff" transparent depthWrite={false} />
      </mesh>
      {/* generous invisible hit target */}
      <mesh visible={false} onPointerDown={(e) => { if (!active) return; e.stopPropagation(); onClick() }}>
        <sphereGeometry args={[r * 2.4, 12, 12]} />
      </mesh>
    </group>
  )
}

/** A trigger-style capo: rubber-lined clamp bar, curved lower jaw, spring grip. */
function Capo({ fret, onGrab }: { fret: number; onGrab: () => void }) {
  const y = capoY(fret)
  return (
    <group position={[-0.006, y, 0]} onPointerDown={(e) => { e.stopPropagation(); onGrab() }}>
      {/* top clamp bar over the strings (slightly domed ends) */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.42, 6, 12]} />
        <meshStandardMaterial color="#c8ccd4" roughness={0.28} metalness={0.9} />
      </mesh>
      {/* rubber pad pressing the strings */}
      <mesh position={[0, -0.005, 0.075]}>
        <boxGeometry args={[0.44, 0.045, 0.05]} />
        <meshStandardMaterial color="#17171a" roughness={0.9} metalness={0} />
      </mesh>
      {/* hinge post on the treble side */}
      <mesh position={[0.26, -0.03, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.2, 12]} />
        <meshStandardMaterial color="#9aa0aa" roughness={0.35} metalness={0.85} />
      </mesh>
      {/* curved lower jaw wrapping behind the neck */}
      <mesh position={[0.05, -0.075, -0.045]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.045, 0.4, 6, 12]} />
        <meshStandardMaterial color="#c8ccd4" roughness={0.28} metalness={0.9} />
      </mesh>
      {/* rubber sleeve on the jaw */}
      <mesh position={[-0.08, -0.09, -0.07]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.18, 6, 12]} />
        <meshStandardMaterial color="#17171a" roughness={0.9} metalness={0} />
      </mesh>
      {/* spring grip handles angling off the bass side */}
      <mesh position={[-0.3, -0.06, 0.05]} rotation={[0, 0, 0.55]}>
        <capsuleGeometry args={[0.035, 0.22, 6, 10]} />
        <meshStandardMaterial color="#c8ccd4" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[-0.32, -0.1, -0.02]} rotation={[0.3, 0, -0.4]}>
        <capsuleGeometry args={[0.035, 0.2, 6, 10]} />
        <meshStandardMaterial color="#9aa0aa" roughness={0.35} metalness={0.85} />
      </mesh>
    </group>
  )
}

function Guitar({
  bodyColor,
  accentColor,
  capo,
  plugStage,
  onPluck,
  onStrum,
  onJackClick,
  onCapoDrag,
  jackAnchor,
}: {
  bodyColor: string
  accentColor: string
  capo: number
  plugStage: PlugStage
  onPluck: (i: number) => void
  onStrum: () => void
  onJackClick: () => void
  onCapoDrag: (fret: number) => void
  jackAnchor: React.MutableRefObject<THREE.Object3D | null>
}) {
  const { scene } = useGLTF(GUITAR)
  const inner = useRef<THREE.Group>(null)
  const draggingCapo = useRef(false)
  const { group, f, bodyMats, accentMats } = useMemo(() => {
    const root = scene.clone(true)
    // 'Material.007' paints the body/neck/headstock; 'Material.009' the
    // pickup bobbins + knobs (the accent set).
    const bodyMats: THREE.MeshStandardMaterial[] = []
    const accentMats: THREE.MeshStandardMaterial[] = []
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat) mat.side = THREE.DoubleSide
      if (mat && /Material\.007/i.test(mat.name) && !bodyMats.includes(mat)) bodyMats.push(mat)
      if (mat && /Material\.009/i.test(mat.name) && !accentMats.includes(mat)) accentMats.push(mat)
    })
    const group = new THREE.Group()
    group.add(root)
    group.setRotationFromMatrix(autoOrient(root))
    const f = fit(group, GUITAR_HEIGHT)
    return { group, f, bodyMats, accentMats }
  }, [scene])

  const recolor = (mats: THREE.MeshStandardMaterial[], color: string) => {
    for (const mat of mats) {
      if (color === 'original') {
        if (mat.userData.origColor) mat.color.copy(mat.userData.origColor)
      } else {
        if (!mat.userData.origColor) mat.userData.origColor = mat.color.clone()
        mat.color.set(color)
      }
      mat.needsUpdate = true
    }
  }
  useEffect(() => recolor(bodyMats, bodyColor), [bodyColor, bodyMats]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => recolor(accentMats, accentColor), [accentColor, accentMats]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const up = () => { draggingCapo.current = false }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  const jackActive = plugStage === 'armed' || plugStage === 'drag-amp'
  return (
    <group position={GUITAR_POS} rotation={[0, GUITAR_YAW, 0]}>
      <group ref={inner} scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={group} />
        {/* strum the body (lower half) */}
        <mesh onPointerDown={(e) => { e.stopPropagation(); onStrum() }} visible={DEBUG_HITZONES} position={[0, 5.0, STRING_FRONT]}>
          <boxGeometry args={[1.0, 1.2, 0.14]} />
          <meshBasicMaterial color="#3bff6b" transparent opacity={0.3} />
        </mesh>
        {/* six invisible hit-strings laid exactly over the model's real strings */}
        {STRINGS.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, s.z + STRING_FRONT]} visible={DEBUG_HITZONES} onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}>
            <boxGeometry args={[0.018, s.len, 0.04]} />
            <meshBasicMaterial color="#ff2b2b" transparent opacity={0.7} />
          </mesh>
        ))}
        {/* trigger capo, draggable along the neck */}
        {capo > 0 && <Capo fret={capo} onGrab={() => { draggingCapo.current = true }} />}
        {/* invisible rail over the fretboard that tracks the capo drag */}
        {capo > 0 && (
          <mesh
            visible={false}
            position={[-0.006, (NUT_Y + capoY(MAX_CAPO)) / 2, 0.08]}
            onPointerMove={(e) => {
              if (!draggingCapo.current || !inner.current) return
              e.stopPropagation()
              const local = inner.current.worldToLocal(e.point.clone())
              onCapoDrag(fretFromY(local.y))
            }}
          >
            <boxGeometry args={[1.2, NUT_Y - capoY(MAX_CAPO) + 0.6, 0.02]} />
          </mesh>
        )}
        {/* the guitar's output jack + glow (native jack-plate position) */}
        <group position={GUITAR_JACK}>
          <object3D ref={(o) => { jackAnchor.current = o }} />
          <JackGlow r={0.16} active={jackActive} onClick={onJackClick} />
        </group>
      </group>
    </group>
  )
}

function Amp({
  tone,
  plugStage,
  onClick,
  onJackClick,
  jackAnchor,
}: {
  tone: string
  plugStage: PlugStage
  onClick: () => void
  onJackClick: () => void
  jackAnchor: React.MutableRefObject<THREE.Object3D | null>
}) {
  const { scene } = useGLTF(AMP)
  const { root, f } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => { (o as THREE.Mesh).castShadow = true })
    return { root, f: fit(root, 2.4) }
  }, [scene])
  const jackActive = plugStage === 'armed' || plugStage === 'drag-guitar'
  return (
    <group position={[1.5, -0.15, 0]} rotation={[0, -0.42, 0]} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      <mesh position={[0.32, 0.94, 0.75]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial emissive={tone === 'drive' ? '#ff5a2a' : tone === 'reverb' ? '#4aa3ff' : '#59d98a'} emissiveIntensity={2.2} color="#111" />
      </mesh>
      {/* the amp's INPUT socket — a mounted 1/4" jack, top-right of the panel */}
      <group position={AMP_JACK}>
        <object3D ref={(o) => { jackAnchor.current = o }} />
        {/* hex mounting plate + threaded collar + dark hole */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.02, 6]} />
          <meshStandardMaterial color="#c9ccd2" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.045, 16]} />
          <meshStandardMaterial color="#aeb3bc" roughness={0.35} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.9} metalness={0.1} />
        </mesh>
        <JackGlow r={0.1} active={jackActive} onClick={onJackClick} />
      </group>
    </group>
  )
}

/** A metal 1/4" instrument plug: chrome shaft + tip, black sleeve. +Z = outward. */
function makePlug(): THREE.Group {
  const g = new THREE.Group()
  const chrome = new THREE.MeshStandardMaterial({ color: '#d6dae1', roughness: 0.2, metalness: 1 })
  const sleeve = new THREE.MeshStandardMaterial({ color: '#131316', roughness: 0.55, metalness: 0.3 })
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12), chrome)
  shaft.rotation.x = Math.PI / 2
  shaft.position.z = -0.03
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), chrome)
  tip.position.z = -0.095
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 14), sleeve)
  barrel.rotation.x = Math.PI / 2
  barrel.position.z = 0.11
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.09, 12), sleeve)
  relief.rotation.x = Math.PI / 2
  relief.position.z = 0.23
  g.add(shaft, tip, barrel, relief)
  return g
}

/**
 * The instrument cable. Each end carries a real metal plug; while dragging,
 * the loose plug hangs at the cursor, and plugging in seats it in the socket.
 */
function InstrumentCable({
  plugStage,
  guitarJack,
  ampJack,
}: {
  plugStage: PlugStage
  guitarJack: React.MutableRefObject<THREE.Object3D | null>
  ampJack: React.MutableRefObject<THREE.Object3D | null>
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const plugA = useMemo(makePlug, []) // guitar-side plug
  const plugB = useMemo(makePlug, []) // amp-side / loose plug
  const { camera, pointer, scene } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.55), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const qa = useMemo(() => new THREE.Quaternion(), [])
  const qb = useMemo(() => new THREE.Quaternion(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    scene.add(plugA, plugB)
    return () => { scene.remove(plugA, plugB) }
  }, [scene, plugA, plugB])

  useFrame(() => {
    if (!mesh.current) return
    const dragging = plugStage === 'drag-guitar' || plugStage === 'drag-amp'
    const show = dragging || plugStage === 'plugged'
    mesh.current.visible = show
    plugA.visible = show
    plugB.visible = show
    if (!show) return

    // seated end(s)
    const gAnchor = guitarJack.current
    const aAnchor = ampJack.current
    if (!gAnchor || !aAnchor) return
    const anchored = plugStage === 'drag-amp' ? aAnchor : gAnchor
    const anchoredPlug = plugStage === 'drag-amp' ? plugB : plugA
    const loosePlug = plugStage === 'drag-amp' ? plugA : plugB
    anchored.getWorldPosition(a)
    anchored.getWorldQuaternion(qa)
    anchoredPlug.position.copy(a)
    anchoredPlug.quaternion.copy(qa)
    // cable leaves from the plug's sleeve back (outward +Z of the socket)
    const outA = tmp.set(0, 0, 1).applyQuaternion(qa).normalize()
    const cableStart = a.clone().addScaledVector(outA, 0.27)

    let cableEnd: THREE.Vector3
    if (plugStage === 'plugged') {
      aAnchor.getWorldPosition(b)
      aAnchor.getWorldQuaternion(qb)
      plugB.position.copy(b)
      plugB.quaternion.copy(qb)
      const outB = new THREE.Vector3(0, 0, 1).applyQuaternion(qb).normalize()
      cableEnd = b.clone().addScaledVector(outB, 0.27)
    } else {
      ray.setFromCamera(pointer, camera)
      if (!ray.ray.intersectPlane(plane, hit)) return
      // the hand holds the plug: tip points up toward the socket-to-be,
      // cable trails from the sleeve below
      loosePlug.position.copy(hit)
      loosePlug.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0.25).normalize())
      cableEnd = hit.clone().add(new THREE.Vector3(0, -0.25, 0.06))
    }

    // sag: midpoints dip toward the floor, more when the ends are close
    const mid1 = cableStart.clone().lerp(cableEnd, 0.35)
    const mid2 = cableStart.clone().lerp(cableEnd, 0.7)
    const slack = Math.max(0.25, 1.1 - cableStart.distanceTo(cableEnd) * 0.18)
    mid1.y -= slack
    mid2.y -= slack * 0.8
    const curve = new THREE.CatmullRomCurve3([cableStart, mid1, mid2, cableEnd])
    const geo = new THREE.TubeGeometry(curve, 36, 0.032, 8, false)
    mesh.current.geometry.dispose()
    mesh.current.geometry = geo
  })

  return (
    <mesh ref={mesh} visible={false}>
      <bufferGeometry />
      <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} />
    </mesh>
  )
}

export default function Scene({
  bodyColor, accentColor, tone, plugStage, capo, onPluck, onStrum, onAmpClick, onJackClick, onCapoDrag, onReady, onFail,
}: {
  bodyColor: string; accentColor: string; tone: string; plugStage: PlugStage; capo: number
  onPluck: (i: number) => void; onStrum: () => void; onAmpClick: () => void
  onJackClick: (which: 'guitar' | 'amp') => void
  onCapoDrag: (fret: number) => void
  onReady: () => void; onFail: () => void
}) {
  const [failed] = useState(false)
  const guitarJack = useRef<THREE.Object3D | null>(null)
  const ampJack = useRef<THREE.Object3D | null>(null)
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
      <Guitar
        bodyColor={bodyColor}
        accentColor={accentColor}
        capo={capo}
        plugStage={plugStage}
        onPluck={onPluck}
        onStrum={onStrum}
        onJackClick={() => onJackClick('guitar')}
        onCapoDrag={onCapoDrag}
        jackAnchor={guitarJack}
      />
      <Amp tone={tone} plugStage={plugStage} onClick={onAmpClick} onJackClick={() => onJackClick('amp')} jackAnchor={ampJack} />
      <InstrumentCable plugStage={plugStage} guitarJack={guitarJack} ampJack={ampJack} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.4} scale={12} blur={3} far={3} resolution={1024} frames={1} />
      <CameraControls makeDefault minDistance={0.7} maxDistance={11} />
    </Canvas>
  )
}
