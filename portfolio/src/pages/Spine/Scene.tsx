import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Spine — a particle vertebral column. ~64,000 points baked from the
 * BodyParts3D atlas: every vertebra (C1..C7, T1..T12, L1..L5, sacrum) its own
 * mesh, area-weighted sampled and tagged with a region id. Select one and it
 * glows. The spinal cord isn't in the bone atlas, so it's synthesized at bake
 * time as a tube threaded through the vertebral canal — a Catmull-Rom spline
 * through the vertebra centroids — and a nerve signal travels down it in the
 * vertex shader.
 *
 * Particle treatment after cortiz2894's hologram-particles (concept:
 * igloo.inc), rebuilt in plain GLSL. Meshes: BodyParts3D, © The Database
 * Center for Life Science, CC BY-SA 2.1 Japan.
 */

const BIN_URL = `${import.meta.env.BASE_URL}spine/spine.bin`

const COL = {
  bone: new THREE.Color('#d9d3c3'),
  cord: new THREE.Color('#e8b24c'),
  hot: new THREE.Color('#33d1e6'),
}

type Loaded = { positions: Float32Array; region: Float32Array; cordH: Float32Array; count: number }

const VERT = /* glsl */ `
  attribute float aRegion;
  attribute float aSeed;
  attribute float aCordH;    // 0 at cord top (C1) → 1 at cord tip; 0 for bone
  uniform float uSelected;
  uniform float uCord;       // cord region id
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPulse;      // signal position down the cord, 0..1
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

    float pulse = isSel ? (0.9 + 0.1 * sin(uTime * 3.0 + aSeed * 6.2832)) : 1.0;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
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

function inject(src: string) {
  const c = (col: THREE.Color) => `vec3(${col.r.toFixed(4)}, ${col.g.toFixed(4)}, ${col.b.toFixed(4)})`
  return src
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
}: {
  data: Loaded
  selected: number
  cordId: number
  pulseRef: React.MutableRefObject<{ pos: number; auto: boolean }>
}) {
  const spin = useRef<THREE.Group>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1))
    geometry.setAttribute('aCordH', new THREE.BufferAttribute(data.cordH, 1))
    const seed = new Float32Array(data.count)
    for (let i = 0; i < data.count; i++) seed[i] = (i * 0.61803398) % 1
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: inject(VERT),
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
      },
    })
    return { geometry, material }
  }, [data, cordId])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { material.uniforms.uSelected.value = selected }, [material, selected])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    const p = pulseRef.current
    // Auto mode runs the signal down the cord on a loop; manual holds the slider.
    u.uPulse.value = p.auto ? (u.uTime.value * 0.22) % 1 : p.pos
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

export default function Scene({
  selected,
  cordId,
  pulseRef,
  onReady,
  onFail,
}: {
  selected: number
  cordId: number
  pulseRef: React.MutableRefObject<{ pos: number; auto: boolean }>
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
        // First pass: positions + region; track the cord's vertical extent.
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
        setData({ positions, region, cordH, count })
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
      <Column data={data} selected={selected} cordId={cordId} pulseRef={pulseRef} />
      <CameraControls minDistance={1.4} maxDistance={5} />
    </Canvas>
  )
}
