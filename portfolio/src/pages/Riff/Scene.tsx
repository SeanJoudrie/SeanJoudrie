import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
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
 * model's real strings so each click plays that string (and the string flashes
 * + shivers); a trigger capo drags along the neck and raises the pitch; and the
 * cable is plugged by hand — click a glowing jack, and a real metal 1/4" plug
 * follows the cursor until it seats in the amp's INPUT socket.
 */

export type PlugStage = 'unplugged' | 'armed' | 'drag-guitar' | 'drag-amp' | 'plugged'
export type SceneApi = { resetView: () => void }

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

// Neck geometry in native model coords (from the fret strip Metal3).
const NUT_Y = 8.49
const SCALE_L = 3.58 // nut → bridge
const MAX_CAPO = 7
const capoY = (fret: number) => NUT_Y - (1 - Math.pow(2, -(fret - 0.45) / 12)) * SCALE_L
const fretFromY = (y: number) => {
  const t = 1 - (NUT_Y - y) / SCALE_L
  const f = -12 * Math.log2(Math.max(0.2, Math.min(1, t))) + 0.45
  return Math.max(1, Math.min(MAX_CAPO, Math.round(f)))
}

// Jacks: the guitar's output plate (native) and the amp's real INPUT hex.
const GUITAR_JACK: [number, number, number] = [0.464, 5.248, 0.1]
const AMP_JACK_NATIVE = new THREE.Vector3(159, 132, 96)

// Shared per-string "was plucked at" timestamps (performance.now ms) so the
// visual shiver can be triggered from clicks, strum, or the keyboard.
const pluckFx = { t: [0, 0, 0, 0, 0, 0] }
export function flashString(i: number) { if (i >= 0 && i < 6) pluckFx.t[i] = performance.now() }

const setCursor = (v: string) => { document.body.style.cursor = v }
const HOVER = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setCursor('pointer') },
  onPointerOut: () => setCursor(''),
}

function fit(object: THREE.Object3D, targetHeight: number) {
  object.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3(); const center = new THREE.Vector3()
  box.getSize(size); box.getCenter(center)
  return { scale: targetHeight / size.y, center, size }
}

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

/** Pulsing light-blue jack marker. */
function JackGlow({ r, active, reduce, onClick }: { r: number; active: boolean; reduce: boolean; onClick: () => void }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mat.current || !mesh.current) return
    const p = reduce ? 0.7 : 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4)
    mat.current.opacity = active ? 0.28 + 0.45 * p : 0
    mesh.current.scale.setScalar(reduce ? 1.15 : 1 + 0.3 * p)
  })
  return (
    <group>
      <mesh ref={mesh} renderOrder={999}>
        <sphereGeometry args={[r, 20, 20]} />
        <meshBasicMaterial ref={mat} color="#57c8ff" transparent depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[0, 0, r * 1.6]} visible={false} {...HOVER} onPointerDown={(e) => { if (!active) return; e.stopPropagation(); onClick() }}>
        <sphereGeometry args={[r * 2.6, 12, 12]} />
      </mesh>
    </group>
  )
}

function makeCapo(): THREE.Group {
  const g = new THREE.Group()
  const chrome = new THREE.MeshStandardMaterial({ color: '#cfd3da', roughness: 0.18, metalness: 1 })
  const rubber = new THREE.MeshStandardMaterial({ color: '#131315', roughness: 0.92, metalness: 0 })
  const HW = 0.2
  const tube = (pts: number[][], r: number, mat: THREE.Material, seg = 24) =>
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, 12, false), mat)
  g.add(tube([[-HW - 0.02, 0.02, 0.04], [-HW * 0.4, 0.05, 0.055], [HW * 0.4, 0.05, 0.055], [HW, 0.04, 0.045], [HW + 0.08, 0.11, 0.0], [HW + 0.05, 0.2, -0.05]], 0.05, chrome))
  const pad = new THREE.Mesh(new THREE.BoxGeometry(2 * HW + 0.02, 0.055, 0.045), rubber)
  pad.position.set(-0.01, 0.0, 0.05); g.add(pad)
  g.add(tube([[HW + 0.05, 0.16, -0.05], [HW + 0.02, 0.02, -0.09], [HW * 0.3, -0.04, -0.11], [-HW * 0.5, -0.02, -0.1], [-HW, 0.02, -0.06]], 0.042, chrome))
  const jawPad = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.05, 0.04), rubber)
  jawPad.position.set(-0.02, -0.01, -0.1); g.add(jawPad)
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 20), chrome)
  pivot.rotation.z = Math.PI / 2; pivot.position.set(HW + 0.06, 0.08, -0.02); g.add(pivot)
  const sp: number[][] = []
  for (let i = 0; i <= 44; i++) { const t = i / 44, an = t * Math.PI * 2 * 5; sp.push([HW + 0.02 + t * 0.09, 0.08 + 0.032 * Math.cos(an), -0.02 + 0.032 * Math.sin(an)]) }
  g.add(tube(sp, 0.007, chrome, 70))
  g.add(tube([[HW + 0.06, 0.02, 0.0], [HW + 0.12, -0.16, 0.09], [HW + 0.08, -0.36, 0.12], [HW - 0.02, -0.54, 0.06]], 0.05, chrome, 28))
  return g
}

function Capo({ fret, onGrab }: { fret: number; onGrab: () => void }) {
  const capo = useMemo(makeCapo, [])
  return (
    <group position={[0, capoY(fret), 0.03]} {...HOVER} onPointerDown={(e) => { e.stopPropagation(); onGrab() }}>
      <primitive object={capo} />
    </group>
  )
}

function Guitar({
  bodyColor, accentColor, capo, plugStage, reduce, onPluck, onStrum, onJackClick, onCapoDrag, jackAnchor,
}: {
  bodyColor: string; accentColor: string; capo: number; plugStage: PlugStage; reduce: boolean
  onPluck: (i: number) => void; onStrum: () => void; onJackClick: () => void
  onCapoDrag: (fret: number) => void
  jackAnchor: React.MutableRefObject<THREE.Object3D | null>
}) {
  const { scene } = useGLTF(GUITAR)
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const fxRefs = useRef<(THREE.Mesh | null)[]>([])
  const draggingCapo = useRef(false)
  const { group, f, bodyMats, accentMats } = useMemo(() => {
    const root = scene.clone(true)
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
    group.add(root); group.setRotationFromMatrix(autoOrient(root))
    return { group, f: fit(group, GUITAR_HEIGHT), bodyMats, accentMats }
  }, [scene])

  const recolor = (mats: THREE.MeshStandardMaterial[], color: string) => {
    for (const mat of mats) {
      if (color === 'original') { if (mat.userData.origColor) mat.color.copy(mat.userData.origColor) }
      else { if (!mat.userData.origColor) mat.userData.origColor = mat.color.clone(); mat.color.set(color) }
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

  useFrame(({ clock }) => {
    // gentle idle sway invites interaction; frozen once plugged / reduced-motion
    if (outer.current) {
      const idle = plugStage === 'unplugged' && !reduce
      outer.current.rotation.y = GUITAR_YAW + (idle ? Math.sin(clock.elapsedTime * 0.5) * 0.05 : 0)
    }
    // string shiver + flash on pluck
    const now = performance.now()
    for (let i = 0; i < 6; i++) {
      const m = fxRefs.current[i]; if (!m) continue
      const dt = (now - pluckFx.t[i]) / 1000
      const mat = m.material as THREE.MeshBasicMaterial
      if (dt >= 0 && dt < 0.45) {
        const k = 1 - dt / 0.45
        mat.opacity = 0.9 * k
        m.position.x = STRINGS[i].x + (reduce ? 0 : Math.sin(dt * 90) * 0.012 * k)
        m.scale.x = 1 + k * 1.4
      } else if (mat.opacity !== 0) { mat.opacity = 0; m.position.x = STRINGS[i].x; m.scale.x = 1 }
    }
  })

  const jackActive = plugStage === 'armed' || plugStage === 'drag-amp'
  return (
    <group ref={outer} position={GUITAR_POS} rotation={[0, GUITAR_YAW, 0]}>
      <group ref={inner} scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={group} />
        {/* strum the body */}
        <mesh {...HOVER} onPointerDown={(e) => { e.stopPropagation(); onStrum() }} visible={DEBUG_HITZONES} position={[0, 5.0, STRING_FRONT]}>
          <boxGeometry args={[1.0, 1.2, 0.14]} />
          <meshBasicMaterial color="#3bff6b" transparent opacity={0.3} />
        </mesh>
        {/* invisible hit-strings + a bright flash overlay that shivers on pluck */}
        {STRINGS.map((s, i) => (
          <group key={i}>
            <mesh position={[s.x, s.y, s.z + STRING_FRONT]} visible={DEBUG_HITZONES} {...HOVER} onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}>
              <boxGeometry args={[0.03, s.len, 0.05]} />
              <meshBasicMaterial color="#ff2b2b" transparent opacity={0.7} />
            </mesh>
            <mesh ref={(m) => { fxRefs.current[i] = m }} position={[s.x, s.y, s.z + STRING_FRONT + 0.01]} renderOrder={998}>
              <boxGeometry args={[0.02, s.len, 0.02]} />
              <meshBasicMaterial color="#eaf4ff" transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        ))}
        {capo > 0 && <Capo fret={capo} onGrab={() => { draggingCapo.current = true }} />}
        {capo > 0 && (
          <mesh visible={false} position={[-0.006, (NUT_Y + capoY(MAX_CAPO)) / 2, 0.08]}
            onPointerMove={(e) => {
              if (!draggingCapo.current || !inner.current) return
              e.stopPropagation()
              onCapoDrag(fretFromY(inner.current.worldToLocal(e.point.clone()).y))
            }}>
            <boxGeometry args={[1.2, NUT_Y - capoY(MAX_CAPO) + 0.6, 0.02]} />
          </mesh>
        )}
        <group position={GUITAR_JACK}>
          <object3D ref={(o) => { jackAnchor.current = o }} />
          <JackGlow r={0.16} active={jackActive} reduce={reduce} onClick={onJackClick} />
        </group>
      </group>
    </group>
  )
}

function Amp({
  tone, plugStage, reduce, onClick, onJackClick, jackAnchor,
}: {
  tone: string; plugStage: PlugStage; reduce: boolean
  onClick: () => void; onJackClick: () => void
  jackAnchor: React.MutableRefObject<THREE.Object3D | null>
}) {
  const { scene } = useGLTF(AMP)
  const { root, f, jackPos } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => { (o as THREE.Mesh).castShadow = true })
    const f = fit(root, 2.15)
    const jackPos = AMP_JACK_NATIVE.clone().sub(f.center).multiplyScalar(f.scale)
    return { root, f, jackPos }
  }, [scene])
  const jackActive = plugStage === 'armed' || plugStage === 'drag-guitar'
  return (
    <group position={[1.35, -0.15, 0]} rotation={[0, -0.3, 0]} {...HOVER} onPointerDown={(e) => { e.stopPropagation(); onClick() }}>
      <group scale={f.scale} position={[-f.center.x * f.scale, -f.center.y * f.scale, -f.center.z * f.scale]}>
        <primitive object={root} />
      </group>
      <mesh position={[0.32, 0.94, 0.75]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial emissive={tone === 'drive' ? '#ff5a2a' : tone === 'reverb' ? '#4aa3ff' : '#59d98a'} emissiveIntensity={2.2} color="#111" />
      </mesh>
      <group position={jackPos}>
        <object3D ref={(o) => { jackAnchor.current = o }} />
        <group position={[0, 0, 0.08]}>
          <JackGlow r={0.085} active={jackActive} reduce={reduce} onClick={onJackClick} />
        </group>
      </group>
    </group>
  )
}

const PLUG_SCALE = 0.8
const PLUG_BACK = 0.2 * PLUG_SCALE
function makePlug(): THREE.Group {
  const g = new THREE.Group()
  const chrome = new THREE.MeshStandardMaterial({ color: '#dfe3ea', roughness: 0.16, metalness: 1 })
  const sleeve = new THREE.MeshStandardMaterial({ color: '#141417', roughness: 0.5, metalness: 0.35 })
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.13, 16), chrome)
  shaft.rotation.x = Math.PI / 2; shaft.position.z = -0.065
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 12), chrome); tip.position.z = -0.13
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 18), chrome)
  collar.rotation.x = Math.PI / 2; collar.position.z = -0.005
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.15, 18), sleeve)
  barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.08
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.03, 0.08, 12), sleeve)
  relief.rotation.x = Math.PI / 2; relief.position.z = 0.2
  g.add(shaft, tip, collar, barrel, relief); g.scale.setScalar(PLUG_SCALE)
  return g
}

function InstrumentCable({ plugStage, guitarJack, ampJack }: {
  plugStage: PlugStage
  guitarJack: React.MutableRefObject<THREE.Object3D | null>
  ampJack: React.MutableRefObject<THREE.Object3D | null>
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const built = useRef(false)
  const plugA = useMemo(makePlug, [])
  const plugB = useMemo(makePlug, [])
  const { camera, pointer, scene } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.55), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const qa = useMemo(() => new THREE.Quaternion(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => { scene.add(plugA, plugB); return () => { scene.remove(plugA, plugB) } }, [scene, plugA, plugB])

  useFrame(() => {
    if (!mesh.current) return
    const dragging = plugStage === 'drag-guitar' || plugStage === 'drag-amp'
    const show = dragging || plugStage === 'plugged'
    mesh.current.visible = show; plugA.visible = show; plugB.visible = show
    if (!show) { built.current = false; return }
    const gAnchor = guitarJack.current, aAnchor = ampJack.current
    if (!gAnchor || !aAnchor) return

    const seat = (anchor: THREE.Object3D, plug: THREE.Group, out: THREE.Vector3): THREE.Vector3 => {
      anchor.getWorldPosition(tmp); anchor.getWorldQuaternion(qa)
      out.set(0, 0, 1).applyQuaternion(qa).normalize()
      plug.quaternion.copy(qa); plug.position.copy(tmp).addScaledVector(out, 0.03)
      return tmp.clone().addScaledVector(out, 0.03 + PLUG_BACK)
    }

    let cableStart: THREE.Vector3, cableEnd: THREE.Vector3
    if (plugStage === 'plugged') {
      if (built.current) return // jacks are static once plugged — skip the rebuild
      cableStart = seat(gAnchor, plugA, a); cableEnd = seat(aAnchor, plugB, b)
      built.current = true
    } else {
      const anchor = plugStage === 'drag-amp' ? aAnchor : gAnchor
      const seated = plugStage === 'drag-amp' ? plugB : plugA
      const loose = plugStage === 'drag-amp' ? plugA : plugB
      cableStart = seat(anchor, seated, a)
      ray.setFromCamera(pointer, camera)
      if (!ray.ray.intersectPlane(plane, hit)) return
      loose.position.copy(hit)
      loose.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0.35).normalize())
      cableEnd = hit.clone().add(new THREE.Vector3(0, -PLUG_BACK, 0.05))
    }

    const mid1 = cableStart.clone().lerp(cableEnd, 0.35)
    const mid2 = cableStart.clone().lerp(cableEnd, 0.7)
    const slack = Math.max(0.25, 1.1 - cableStart.distanceTo(cableEnd) * 0.18)
    mid1.y -= slack; mid2.y -= slack * 0.8
    const curve = new THREE.CatmullRomCurve3([cableStart, mid1, mid2, cableEnd])
    mesh.current.geometry.dispose()
    mesh.current.geometry = new THREE.TubeGeometry(curve, 36, 0.032, 8, false)
  })

  return (
    <mesh ref={mesh} visible={false}>
      <bufferGeometry />
      <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} />
    </mesh>
  )
}

/** Applies camera limits and hands a reset() to the page. */
function Rig({ apiRef }: { apiRef?: React.MutableRefObject<SceneApi | null> }) {
  const cc = useRef<CameraControls>(null)
  useEffect(() => {
    const c = cc.current; if (!c) return
    c.minPolarAngle = 0.35; c.maxPolarAngle = Math.PI * 0.62
    if (apiRef) apiRef.current = { resetView: () => { void c.reset(true) } }
  }, [apiRef])
  return <CameraControls ref={cc} makeDefault minDistance={0.9} maxDistance={9} />
}

export default function Scene({
  bodyColor, accentColor, tone, plugStage, capo, reduce, apiRef,
  onPluck, onStrum, onAmpClick, onJackClick, onCapoDrag, onReady, onFail,
}: {
  bodyColor: string; accentColor: string; tone: string; plugStage: PlugStage; capo: number; reduce: boolean
  apiRef?: React.MutableRefObject<SceneApi | null>
  onPluck: (i: number) => void; onStrum: () => void; onAmpClick: () => void
  onJackClick: (which: 'guitar' | 'amp') => void
  onCapoDrag: (fret: number) => void
  onReady: () => void; onFail: () => void
}) {
  const [failed] = useState(false)
  const guitarJack = useRef<THREE.Object3D | null>(null)
  const ampJack = useRef<THREE.Object3D | null>(null)
  useEffect(() => () => setCursor(''), [])
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
      <directionalLight position={[3.5, 4, 3]} intensity={0.7} color="#fff4e6" />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#bcd3ff" />
      <Guitar
        bodyColor={bodyColor} accentColor={accentColor} capo={capo} plugStage={plugStage} reduce={reduce}
        onPluck={onPluck} onStrum={onStrum} onJackClick={() => onJackClick('guitar')} onCapoDrag={onCapoDrag} jackAnchor={guitarJack}
      />
      <Amp tone={tone} plugStage={plugStage} reduce={reduce} onClick={onAmpClick} onJackClick={() => onJackClick('amp')} jackAnchor={ampJack} />
      <InstrumentCable plugStage={plugStage} guitarJack={guitarJack} ampJack={ampJack} />
      <ContactShadows position={[0, -1.55, 0]} opacity={0.55} scale={12} blur={2.6} far={3} resolution={1024} frames={1} />
      <Rig apiRef={apiRef} />
    </Canvas>
  )
}
