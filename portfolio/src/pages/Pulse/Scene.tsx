import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Pulse — a beating particle heart. ~53,000 points from the BodyParts3D
 * atlas: the "wall of heart" mesh split into its four chambers procedurally
 * (superior/inferior for atria vs ventricles, a vessel-defined left/right for
 * the two sides), plus the great vessels. Each chamber carries a contraction
 * amplitude and phase, so the vertex shader beats it on a cardiac cycle — the
 * atria squeeze first, the ventricles follow and squeeze hardest — and a
 * bright surge of "blood" is ejected up the aorta and pulmonary artery on each
 * systole. Deoxygenated (right) heart runs blue, oxygenated (left) red.
 *
 * Particle treatment after cortiz2894's hologram-particles (concept:
 * igloo.inc). Meshes: BodyParts3D, © The Database Center for Life Science,
 * CC BY-SA 2.1 Japan.
 */

const BIN_URL = `${import.meta.env.BASE_URL}pulse/pulse.bin`

const COL = {
  red: new THREE.Color('#e0463a'),   // oxygenated
  blue: new THREE.Color('#3f74d6'),  // deoxygenated
  hot: new THREE.Color('#ffd24a'),   // selected
}

type Region = { id: number; label: string; group: string; centroid: [number, number, number]; amp: number; phase: number }
type Loaded = { positions: Float32Array; region: Float32Array; flow: Float32Array; count: number }

const VERT = /* glsl */ `
  attribute float aRegion;
  attribute float aSeed;
  attribute float aFlow;      // 0 at the heart → 1 at the vessel tip (arteries)
  uniform float uSelected;
  uniform float uCycle;       // 0..1 position in the cardiac cycle
  uniform float uPixelRatio;
  uniform vec3  uCentroid[REGION_COUNT];
  uniform float uAmp[REGION_COUNT];
  uniform float uPhase[REGION_COUNT];
  uniform float uIsRed[REGION_COUNT];
  uniform float uArtery[REGION_COUNT];
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  // One contraction per cycle: quick squeeze (systole), slower release.
  float systole(float u) {
    return clamp(smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.22, 0.44, u)), 0.0, 1.0);
  }

  void main() {
    int rid = int(aRegion + 0.5);
    float phase = uPhase[rid];
    float u = fract(uCycle - phase);
    float beat = systole(u);

    // Contract toward the chamber centroid.
    vec3 cen = uCentroid[rid];
    vec3 p = position - uAmp[rid] * beat * (position - cen);

    bool isSel = abs(aRegion - uSelected) < 0.5;
    bool anySel = uSelected > -0.5;
    vec3 base = uIsRed[rid] > 0.5 ? COL_RED : COL_BLUE;
    vColor = isSel ? COL_HOT : base;
    vHot = isSel ? 1.0 : 0.0;
    vAlpha = isSel ? 1.0 : (anySel ? 0.28 : 0.72);

    // Blood ejected up the arteries on systole: a bright front races outward.
    if (uArtery[rid] > 0.5) {
      float front = fract(uCycle) / 0.30;              // advances during systole
      float d = front - aFlow;                          // behind the front = filled
      float surge = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.0, 0.6, d));
      vColor = mix(vColor, vec3(1.0), surge * 0.7);
      vHot = max(vHot, surge);
      vAlpha = max(vAlpha, surge * 0.6 + 0.3);
    }

    float tw = 0.9 + 0.1 * sin(aSeed * 6.2832);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 1.75 * tw * uPixelRatio * (3.2 / -mv.z);
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
    vec3 col = mix(vColor, vec3(1.0), vHot * smoothstep(0.35, 0.0, r) * 0.5);
    gl_FragColor = vec4(col, disc * vAlpha);
  }
`

function inject(src: string, n: number) {
  const c = (col: THREE.Color) => `vec3(${col.r.toFixed(4)}, ${col.g.toFixed(4)}, ${col.b.toFixed(4)})`
  return src
    .replace(/REGION_COUNT/g, String(n))
    .replace(/COL_HOT/g, c(COL.hot))
    .replace(/COL_RED/g, c(COL.red))
    .replace(/COL_BLUE/g, c(COL.blue))
}

/** BodyParts3D is z-up; bring it to three's y-up and face the camera. */
const BASE_ROT = new THREE.Euler(-Math.PI / 2, 0, 0)
const ARTERY = new Set([4, 5]) // aorta, pulmonary artery
// Real wall motion is modest; exaggerate it so the beat reads at a glance.
const BEAT_GAIN = 1.8

function Heart({
  data,
  regions,
  selected,
  bpmRef,
}: {
  data: Loaded
  regions: Region[]
  selected: number
  bpmRef: React.MutableRefObject<{ bpm: number }>
}) {
  const spin = useRef<THREE.Group>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const cycle = useRef(0)

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1))
    geometry.setAttribute('aFlow', new THREE.BufferAttribute(data.flow, 1))
    const seed = new Float32Array(data.count)
    for (let i = 0; i < data.count; i++) seed[i] = (i * 0.61803398) % 1
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

    const n = regions.length
    const centroid = regions.map((r) => new THREE.Vector3(...r.centroid))
    const amp = regions.map((r) => r.amp * BEAT_GAIN)
    const phase = regions.map((r) => r.phase)
    const isRed = regions.map((r) => (r.group === 'red' ? 1 : 0))
    const artery = regions.map((r) => (ARTERY.has(r.id) ? 1 : 0))

    const material = new THREE.ShaderMaterial({
      vertexShader: inject(VERT, n),
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSelected: { value: -1 },
        uCycle: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uCentroid: { value: centroid },
        uAmp: { value: amp },
        uPhase: { value: phase },
        uIsRed: { value: isRed },
        uArtery: { value: artery },
      },
    })
    return { geometry, material }
  }, [data, regions])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { material.uniforms.uSelected.value = selected }, [material, selected])

  useFrame((_, delta) => {
    const bpm = bpmRef.current.bpm
    cycle.current = (cycle.current + delta * (bpm / 60)) % 1
    material.uniforms.uCycle.value = cycle.current
    if (spin.current && !reduced) spin.current.rotation.y += delta * 0.18
  })

  return (
    <group ref={spin}>
      <group rotation={BASE_ROT}>
        <points geometry={geometry} material={material} />
      </group>
    </group>
  )
}

/** Flow coordinate for artery points: 0 at the heart, 1 at the far tip, so the
 *  ejection surge has something to travel along. 0 everywhere else. */
function buildFlow(positions: Float32Array, region: Float32Array, count: number): Float32Array {
  const flow = new Float32Array(count)
  // heart centre = mean of all points
  let hx = 0, hy = 0, hz = 0
  for (let i = 0; i < count; i++) { hx += positions[i * 3]; hy += positions[i * 3 + 1]; hz += positions[i * 3 + 2] }
  hx /= count; hy /= count; hz /= count
  const min = new Map<number, number>(), max = new Map<number, number>()
  const dist = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const r = region[i]
    if (!ARTERY.has(r)) continue
    const d = Math.hypot(positions[i * 3] - hx, positions[i * 3 + 1] - hy, positions[i * 3 + 2] - hz)
    dist[i] = d
    min.set(r, Math.min(min.get(r) ?? Infinity, d))
    max.set(r, Math.max(max.get(r) ?? -Infinity, d))
  }
  for (let i = 0; i < count; i++) {
    const r = region[i]
    if (!ARTERY.has(r)) continue
    const lo = min.get(r) ?? 0, hi = max.get(r) ?? 1
    flow[i] = (dist[i] - lo) / (hi - lo || 1)
  }
  return flow
}

export default function Scene({
  regions,
  selected,
  bpmRef,
  onReady,
  onFail,
}: {
  regions: Region[]
  selected: number
  bpmRef: React.MutableRefObject<{ bpm: number }>
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
        for (let i = 0; i < count; i++) {
          positions[i * 3] = dv.getInt16(o, true) * Q
          positions[i * 3 + 1] = dv.getInt16(o + 2, true) * Q
          positions[i * 3 + 2] = dv.getInt16(o + 4, true) * Q
          region[i] = dv.getUint8(o + 6)
          o += 7
        }
        const flow = buildFlow(positions, region, count)
        setData({ positions, region, flow, count })
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
      camera={{ position: [0, 0, 2.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      <Heart data={data} regions={regions} selected={selected} bpmRef={bpmRef} />
      <CameraControls minDistance={1.3} maxDistance={5} />
    </Canvas>
  )
}
