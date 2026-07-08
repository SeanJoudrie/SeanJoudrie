import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Spine — a particle vertebral column. ~64,000 points baked from the
 * BodyParts3D atlas: every vertebra (C1..C7, T1..T12, L1..L5, sacrum) its own
 * mesh, area-weighted sampled and tagged with a region id. Select one and it
 * glows. The spinal cord isn't in the bone atlas, so it's synthesized at bake
 * time as a tube threaded through the vertebral canal, and a nerve signal runs
 * down it in the vertex shader.
 *
 * The bend is an articulated skeleton computed here at load: one bone per
 * vertebra, chained sacrum→C1, with a per-vertebra inter-vertebral joint. A
 * bend slider drives forward-kinematics on the CPU (25 tiny matrices) each
 * frame; the vertex shader skins each point to its bone by region id, so the
 * vertebrae stay rigid and hinge at real joints while the cord blends between
 * neighbours. Cervical and lumbar joints are mobile, the thoracic (rib) region
 * stiff — the way a real spine flexes.
 *
 * Particle treatment after cortiz2894's hologram-particles (concept:
 * igloo.inc). Meshes: BodyParts3D, © The Database Center for Life Science,
 * CC BY-SA 2.1 Japan.
 */

const BIN_URL = `${import.meta.env.BASE_URL}spine/spine.bin`

const COL = {
  bone: new THREE.Color('#d9d3c3'),
  cord: new THREE.Color('#e8b24c'),
  hot: new THREE.Color('#33d1e6'),
}

// Flexion tuning. Radians per joint; cumulative up the chain, so C1 (top)
// swings the most. FLEX_SIGN aims the bend anteriorly. Every vertebra hinges
// by the same amount, so the column sweeps a smooth circular arc — a full C at
// 100% (~24 joints × ~8.6° ≈ 200°) rather than folding at one spot.
const FLEX_PER_UNIT = 0.15
const FLEX_SIGN = -1

// Joint mobility per region. Uniform across every mobile vertebra so the whole
// column curls evenly into a C; only the sacrum (fused) stays fixed.
const MOBILITY: Record<string, number> = { cervical: 1.0, thoracic: 1.0, lumbar: 1.0, sacral: 0, cord: 0 }

type Bone = { region: number; mobility: number; z: number; pivot: THREE.Vector3; parent: number }
type Region = { id: number; group: string }
type Loaded = {
  positions: Float32Array
  region: Float32Array
  cordH: Float32Array
  bone: Float32Array
  bones: Bone[]
  count: number
}

const VERT = /* glsl */ `
  attribute float aRegion;
  attribute float aSeed;
  attribute float aCordH;    // 0 at cord top (C1) → 1 at cord tip; 0 for bone
  attribute float aBone;     // bone index; fractional on the cord (blends two)
  uniform float uSelected;
  uniform float uCord;       // cord region id
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPulse;      // signal position down the cord, 0..1
  uniform mat4  uBones[BONE_COUNT];
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    bool isCord = abs(aRegion - uCord) < 0.5;
    bool isSel = abs(aRegion - uSelected) < 0.5;
    bool anySel = uSelected > -0.5;

    vec3 base = isCord ? COL_CORD : COL_BONE;
    vColor = isSel ? COL_HOT : base;
    vHot = isSel ? 1.0 : 0.0;
    vAlpha = isSel ? 1.0 : (anySel ? 0.26 : (isCord ? 0.92 : 0.6));

    // A nerve signal running down the cord: a bright band centred on uPulse.
    if (isCord && uPulse >= 0.0) {
      float band = smoothstep(0.05, 0.0, abs(aCordH - uPulse));
      vColor = mix(vColor, COL_HOT, band);
      vHot = max(vHot, band);
      vAlpha = max(vAlpha, band * 0.9 + 0.1);
    }

    // Skin the point to its vertebra bone (rigid); the cord blends two.
    int i0 = int(floor(aBone));
    int i1 = int(min(float(BONE_COUNT - 1), ceil(aBone)));
    float bf = aBone - float(i0);
    vec3 sp = mix((uBones[i0] * vec4(position, 1.0)).xyz,
                  (uBones[i1] * vec4(position, 1.0)).xyz, bf);

    float pulse = isSel ? (0.9 + 0.1 * sin(uTime * 3.0 + aSeed * 6.2832)) : 1.0;
    vec4 mv = modelViewMatrix * vec4(sp, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 1.7 * pulse * uPixelRatio * (3.2 / -mv.z);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;
  void main() {
    if (vAlpha <= 0.0) discard;
    float r = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.08, r);
    vec3 col = mix(vColor, vec3(1.0), vHot * smoothstep(0.35, 0.0, r) * 0.55);
    gl_FragColor = vec4(col, disc * vAlpha);
  }
`

function inject(src: string, boneCount: number) {
  const c = (col: THREE.Color) => `vec3(${col.r.toFixed(4)}, ${col.g.toFixed(4)}, ${col.b.toFixed(4)})`
  return src
    .replace(/BONE_COUNT/g, String(boneCount))
    .replace(/COL_HOT/g, c(COL.hot))
    .replace(/COL_CORD/g, c(COL.cord))
    .replace(/COL_BONE/g, c(COL.bone))
}

/** BodyParts3D is z-up; bring it to three's y-up and face the camera. */
const BASE_ROT = new THREE.Euler(-Math.PI / 2, 0, 0)

function Column({
  data,
  selected,
  cordId,
  pulseRef,
  bendRef,
}: {
  data: Loaded
  selected: number
  cordId: number
  pulseRef: React.MutableRefObject<{ pos: number; auto: boolean }>
  bendRef: React.MutableRefObject<{ val: number }>
}) {
  const spin = useRef<THREE.Group>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  // One world matrix per bone — the uniform array the shader skins against.
  const world = useMemo(() => data.bones.map(() => new THREE.Matrix4()), [data.bones])
  const fk = useMemo(() => ({ T: new THREE.Matrix4(), R: new THREE.Matrix4(), Ti: new THREE.Matrix4(), local: new THREE.Matrix4() }), [])

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1))
    geometry.setAttribute('aCordH', new THREE.BufferAttribute(data.cordH, 1))
    geometry.setAttribute('aBone', new THREE.BufferAttribute(data.bone, 1))
    const seed = new Float32Array(data.count)
    for (let i = 0; i < data.count; i++) seed[i] = (i * 0.61803398) % 1
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: inject(VERT, data.bones.length),
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSelected: { value: -1 },
        uCord: { value: cordId },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uPulse: { value: 0 },
        uBones: { value: world },
      },
    })
    return { geometry, material }
  }, [data, cordId, world])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { material.uniforms.uSelected.value = selected }, [material, selected])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    const p = pulseRef.current
    // Auto mode runs the signal down the cord on a loop; manual holds the slider.
    u.uPulse.value = p.auto ? (u.uTime.value * 0.22) % 1 : p.pos

    // Forward kinematics: each bone = parent × (rotate about its rest joint).
    const bend = bendRef.current.val
    const bones = data.bones
    for (let k = 0; k < bones.length; k++) {
      const b = bones[k]
      if (b.parent < 0) { world[k].identity(); continue }
      const ang = bend * FLEX_PER_UNIT * b.mobility * FLEX_SIGN
      fk.R.makeRotationX(ang)
      fk.T.makeTranslation(b.pivot.x, b.pivot.y, b.pivot.z)
      fk.Ti.makeTranslation(-b.pivot.x, -b.pivot.y, -b.pivot.z)
      fk.local.copy(fk.T).multiply(fk.R).multiply(fk.Ti)
      world[k].copy(world[b.parent]).multiply(fk.local)
    }
    material.uniformsNeedUpdate = true

    if (spin.current && !reduced) spin.current.rotation.y += delta * 0.12
  })

  // Turntable spin lives OUTSIDE the upright rotation: spinning about world-up
  // keeps the tall column vertical. (Nesting it inside would cone an elongated
  // shape around in the screen plane.)
  return (
    <group ref={spin}>
      <group rotation={BASE_ROT}>
        <points geometry={geometry} material={material} />
      </group>
    </group>
  )
}

/** Build the articulation skeleton from the loaded points: one bone per
 *  vertebra, chained low→high, joint pivots at the mid-points between adjacent
 *  vertebra centroids. Returns bones plus a per-point bone index (fractional on
 *  the cord so it blends smoothly between the two vertebrae it spans). */
function buildSkeleton(
  positions: Float32Array,
  region: Float32Array,
  count: number,
  cordId: number,
  groupOf: Map<number, string>,
): { bones: Bone[]; bone: Float32Array } {
  // Per-vertebra centroid (skip the cord).
  const acc = new Map<number, { x: number; y: number; z: number; n: number }>()
  for (let i = 0; i < count; i++) {
    const r = region[i]
    if (r === cordId) continue
    const a = acc.get(r) ?? { x: 0, y: 0, z: 0, n: 0 }
    a.x += positions[i * 3]; a.y += positions[i * 3 + 1]; a.z += positions[i * 3 + 2]; a.n++
    acc.set(r, a)
  }
  const cents = [...acc.entries()].map(([r, a]) => ({
    region: r, x: a.x / a.n, y: a.y / a.n, z: a.z / a.n,
  }))
  cents.sort((p, q) => p.z - q.z) // base (sacrum, low z) → top (C1, high z)

  const bones: Bone[] = cents.map((c, k) => {
    const parent = k - 1 // linear chain; -1 for the root
    const prev = cents[k - 1]
    const pivot = parent < 0
      ? new THREE.Vector3(c.x, c.y, c.z)
      : new THREE.Vector3((c.x + prev.x) / 2, (c.y + prev.y) / 2, (c.z + prev.z) / 2)
    return { region: c.region, mobility: MOBILITY[groupOf.get(c.region) ?? ''] ?? 0, z: c.z, pivot, parent }
  })

  const regionToBone = new Map<number, number>()
  bones.forEach((b, i) => regionToBone.set(b.region, i))
  const boneZ = bones.map((b) => b.z)
  const last = bones.length - 1

  const bone = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const r = region[i]
    if (r !== cordId) { bone[i] = regionToBone.get(r) ?? 0; continue }
    // Cord: fractional bone index by height, blending the two bracketing bones.
    const z = positions[i * 3 + 2]
    if (z <= boneZ[0]) { bone[i] = 0; continue }
    if (z >= boneZ[last]) { bone[i] = last; continue }
    let k = 0
    while (k < last && boneZ[k + 1] < z) k++
    const span = boneZ[k + 1] - boneZ[k] || 1
    bone[i] = k + (z - boneZ[k]) / span
  }
  return { bones, bone }
}

export default function Scene({
  selected,
  cordId,
  regions,
  pulseRef,
  bendRef,
  onReady,
  onFail,
}: {
  selected: number
  cordId: number
  regions: Region[]
  pulseRef: React.MutableRefObject<{ pos: number; auto: boolean }>
  bendRef: React.MutableRefObject<{ val: number }>
  onReady: () => void
  onFail: () => void
}) {
  const [data, setData] = useState<Loaded | null>(null)

  useEffect(() => {
    let alive = true
    fetch(BIN_URL)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return
        const dv = new DataView(buf)
        const count = dv.getUint32(0, true)
        const positions = new Float32Array(count * 3)
        const region = new Float32Array(count)
        const Q = 1.2 / 32767
        let o = 4
        let cordMin = Infinity, cordMax = -Infinity
        for (let i = 0; i < count; i++) {
          const z = dv.getInt16(o + 4, true) * Q
          positions[i * 3] = dv.getInt16(o, true) * Q
          positions[i * 3 + 1] = dv.getInt16(o + 2, true) * Q
          positions[i * 3 + 2] = z
          const rg = dv.getUint8(o + 6)
          region[i] = rg
          if (rg === cordId) { if (z < cordMin) cordMin = z; if (z > cordMax) cordMax = z }
          o += 7
        }
        // aCordH: 0 at the top of the cord (superior, high z) → 1 at the tip.
        const span = cordMax - cordMin || 1
        const cordH = new Float32Array(count)
        for (let i = 0; i < count; i++) {
          cordH[i] = region[i] === cordId ? (cordMax - positions[i * 3 + 2]) / span : 0
        }
        const groupOf = new Map(regions.map((r) => [r.id, r.group]))
        const { bones, bone } = buildSkeleton(positions, region, count, cordId, groupOf)
        setData({ positions, region, cordH, bone, bones, count })
        onReady()
      })
      .catch(() => alive && onFail())
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return null

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 2.7], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      <Column data={data} selected={selected} cordId={cordId} pulseRef={pulseRef} bendRef={bendRef} />
      <CameraControls minDistance={1.4} maxDistance={5} />
    </Canvas>
  )
}
