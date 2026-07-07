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
 * Interactions: the finish recolours the painted set (body + pickup bobbins +
 * knobs); six invisible hit-strings sit exactly over the model's real strings
 * so each click plays that string; a capo drags along the neck and raises the
 * pitch; and the cable is plugged by hand — activate it, then click the
 * glowing jack on the guitar and the one on the amp panel, the loose end
 * following your cursor in between.
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
// The amp's input jack is on its control panel (in the amp group's frame).
const AMP_JACK: [number, number, number] = [-0.62, 0.92, 0.78]

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

function Guitar({
  bodyColor,
  capo,
  plugStage,
  onPluck,
  onStrum,
  onJackClick,
  onCapoDrag,
  jackAnchor,
}: {
  bodyColor: string
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
  const { group, f, paintMats } = useMemo(() => {
    const root = scene.clone(true)
    // The finish recolours the painted set: 'Material.007' (body / neck /
    // headstock) and 'Material.009' (the matching pickup bobbins + knobs).
    const paintMats: THREE.MeshStandardMaterial[] = []
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat) mat.side = THREE.DoubleSide
      if (mat && /Material\.(007|009)/i.test(mat.name) && !paintMats.includes(mat)) paintMats.push(mat)
    })
    const group = new THREE.Group()
    group.add(root)
    group.setRotationFromMatrix(autoOrient(root))
    const f = fit(group, GUITAR_HEIGHT)
    return { group, f, paintMats }
  }, [scene])

  // Body finish recolours the painted set together (body + pickup bobbins +
  // knobs); pickguard, fretboard and strings keep their own colours.
  // 'original' = exactly as downloaded.
  useEffect(() => {
    for (const mat of paintMats) {
      if (bodyColor === 'original') {
        if (mat.userData.origColor) mat.color.copy(mat.userData.origColor)
      } else {
        if (!mat.userData.origColor) mat.userData.origColor = mat.color.clone()
        mat.color.set(bodyColor)
      }
      mat.needsUpdate = true
    }
  }, [bodyColor, paintMats])

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
        {/* capo: a dark bar across the neck, draggable along it */}
        {capo > 0 && (
          <mesh
            position={[-0.006, capoY(capo), 0.075]}
            onPointerDown={(e) => { e.stopPropagation(); draggingCapo.current = true }}
          >
            <boxGeometry args={[0.5, 0.11, 0.14]} />
            <meshStandardMaterial color="#b9bec7" roughness={0.3} metalness={0.85} />
          </mesh>
        )}
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
    <group position={[1.7, -0.15, 0]} rotation={[0, -0.5, 0]} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      <mesh position={[0.55, 0.9, 0.75]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial emissive={tone === 'drive' ? '#ff5a2a' : tone === 'reverb' ? '#4aa3ff' : '#59d98a'} emissiveIntensity={2.2} color="#111" />
      </mesh>
      {/* the amp's input jack on the control panel */}
      <group position={AMP_JACK}>
        <object3D ref={(o) => { jackAnchor.current = o }} />
        <JackGlow r={0.09} active={jackActive} onClick={(/* jack */) => onJackClick()} />
      </group>
    </group>
  )
}

/**
 * The instrument cable. While dragging, one end is anchored at the clicked
 * jack and the loose end hangs from the cursor; once plugged it sags between
 * the two jacks.
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
  const { camera, pointer } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.55), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!mesh.current) return
    const dragging = plugStage === 'drag-guitar' || plugStage === 'drag-amp'
    const show = dragging || plugStage === 'plugged'
    mesh.current.visible = show
    if (!show) return
    if (plugStage === 'plugged') {
      guitarJack.current?.getWorldPosition(a)
      ampJack.current?.getWorldPosition(b)
    } else {
      const from = plugStage === 'drag-guitar' ? guitarJack : ampJack
      from.current?.getWorldPosition(a)
      ray.setFromCamera(pointer, camera)
      if (!ray.ray.intersectPlane(plane, hit)) return
      b.copy(hit)
    }
    // sag: midpoints dip toward the floor, more when the ends are close
    const mid1 = a.clone().lerp(b, 0.35)
    const mid2 = a.clone().lerp(b, 0.7)
    const slack = Math.max(0.25, 1.1 - a.distanceTo(b) * 0.18)
    mid1.y -= slack
    mid2.y -= slack * 0.8
    const curve = new THREE.CatmullRomCurve3([a.clone(), mid1, mid2, b.clone()])
    const geo = new THREE.TubeGeometry(curve, 36, 0.035, 8, false)
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
  bodyColor, tone, plugStage, capo, onPluck, onStrum, onAmpClick, onJackClick, onCapoDrag, onReady, onFail,
}: {
  bodyColor: string; tone: string; plugStage: PlugStage; capo: number
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
      <CameraControls makeDefault minDistance={3} maxDistance={11} />
    </Canvas>
  )
}
