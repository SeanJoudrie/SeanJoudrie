import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Skull — a particle skull. ~61,000 points baked from the BodyParts3D atlas,
 * every bone its own mesh, tagged with a bone id. Select a bone and it glows;
 * the mandible swings on its real temporomandibular hinge, computed at bake
 * time from the condyle points and applied in the vertex shader so the jaw
 * opens without touching the other 60,000 points on the CPU.
 *
 * Particle treatment after cortiz2894's hologram-particles (concept:
 * igloo.inc), rebuilt in plain GLSL. Meshes: BodyParts3D, © The Database
 * Center for Life Science, CC BY-SA 2.1 Japan.
 */

const BIN_URL = `${import.meta.env.BASE_URL}skull/skull.bin`
const MAX_JAW = 0.42 // radians the jaw drops fully open

const COL = {
  bone: new THREE.Color('#d8ccb4'),
  hot: new THREE.Color('#ff6a3d'),
}

type Loaded = { positions: Float32Array; region: Float32Array; count: number }

const VERT = /* glsl */ `
  attribute float aRegion;
  attribute float aSeed;
  uniform float uSelected;
  uniform float uMandible;
  uniform float uJaw;        // 0..MAX radians
  uniform vec3  uHinge;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    bool isSel = abs(aRegion - uSelected) < 0.5;
    bool anySel = uSelected > -0.5;
    vColor = isSel ? COL_HOT : COL_BONE;
    vHot = isSel ? 1.0 : 0.0;
    vAlpha = isSel ? 1.0 : (anySel ? 0.3 : 0.62);

    vec3 p = position;
    // Swing the mandible on the TMJ hinge (rotate in the y–z plane about the
    // left–right axis through the condyles).
    if (abs(aRegion - uMandible) < 0.5 && uJaw > 0.0001) {
      float dy = p.y - uHinge.y;
      float dz = p.z - uHinge.z;
      float c = cos(uJaw), s = sin(uJaw);
      p.y = uHinge.y + dy * c - dz * s;
      p.z = uHinge.z + dy * s + dz * c;
    }

    float pulse = isSel ? (0.9 + 0.1 * sin(uTime * 3.0 + aSeed * 6.2832)) : 1.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
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
  return src.replace(/COL_HOT/g, c(COL.hot)).replace(/COL_BONE/g, c(COL.bone))
}

/** BodyParts3D is z-up; bring it to three's y-up and face the camera. */
const BASE_ROT = new THREE.Euler(-Math.PI / 2, 0, 0)

function Skull({
  data,
  selected,
  mandibleId,
  hinge,
  jawRef,
}: {
  data: Loaded
  selected: number
  mandibleId: number
  hinge: [number, number, number]
  jawRef: React.MutableRefObject<{ open: number; auto: boolean }>
}) {
  const spin = useRef<THREE.Group>(null)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1))
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
        uMandible: { value: mandibleId },
        uJaw: { value: 0 },
        uHinge: { value: new THREE.Vector3(...hinge) },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    })
    return { geometry, material }
  }, [data, mandibleId, hinge])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { material.uniforms.uSelected.value = selected }, [material, selected])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    const j = jawRef.current
    // Auto mode chews slowly; manual mode eases toward the slider.
    const target = j.auto ? (0.5 - 0.5 * Math.cos(u.uTime.value * 1.6)) : j.open
    u.uJaw.value += (target * MAX_JAW - u.uJaw.value) * (1 - Math.exp(-delta * 9))
    if (spin.current && !reduced) spin.current.rotation.y += delta * 0.12
  })

  return (
    <group rotation={BASE_ROT}>
      <group ref={spin}>
        <points geometry={geometry} material={material} />
      </group>
    </group>
  )
}

export default function Scene({
  selected,
  mandibleId,
  hinge,
  jawRef,
  onReady,
  onFail,
}: {
  selected: number
  mandibleId: number
  hinge: [number, number, number]
  jawRef: React.MutableRefObject<{ open: number; auto: boolean }>
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
        setData({ positions, region, count })
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
      camera={{ position: [0, 0, 3.0], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      <Skull data={data} selected={selected} mandibleId={mandibleId} hinge={hinge} jawRef={jawRef} />
      <CameraControls minDistance={1.7} maxDistance={5} />
    </Canvas>
  )
}
