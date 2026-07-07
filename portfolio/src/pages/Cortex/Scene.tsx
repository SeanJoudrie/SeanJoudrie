import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Cortex — a particle brain. ~80,000 points baked from the BodyParts3D
 * anatomical atlas (every structure its own mesh), area-weighted sampled and
 * tagged with a region id, shipped as one 548 KB binary. A hand-written
 * shader keeps the cortex a soft blue haze; select a structure and the shell
 * ghosts out while that region glows red — deep structures like the
 * hippocampus surface from inside the folds.
 *
 * Particle treatment after cortiz2894's hologram-particles (concept:
 * igloo.inc), rebuilt from scratch in plain GLSL. Meshes: BodyParts3D,
 * © The Database Center for Life Science, CC BY-SA 2.1 Japan.
 */

const BIN_URL = `${import.meta.env.BASE_URL}cortex/cortex.bin`

const COL = {
  shell: new THREE.Color('#5b8fd6'),
  deep: new THREE.Color('#6ea8e8'),
  hot: new THREE.Color('#ff4d43'),
  hotCore: new THREE.Color('#ffd0c2'),
}

export type Loaded = {
  positions: Float32Array
  region: Float32Array
  group: Float32Array // 0 shell, 1 deep
  count: number
}

const VERT = /* glsl */ `
  attribute float aRegion;
  attribute float aGroup;   // 0 = shell (cortex), 1 = deep structure
  attribute float aSeed;
  uniform float uSelected;  // region id, or -1
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHot;

  void main() {
    bool isSel = abs(aRegion - uSelected) < 0.5;
    bool anySel = uSelected > -0.5;
    bool deep = aGroup > 0.5;

    float vis;
    vec3 col;
    if (isSel) {
      vis = 1.0;
      col = COL_HOT;
      vHot = 1.0;
    } else if (deep) {
      vis = 0.0;                 // deep structures hide until chosen
      col = COL_DEEP;
      vHot = 0.0;
    } else {
      vis = anySel ? 0.14 : 0.5; // cortex: ghost when something is selected
      col = COL_SHELL;
      vHot = 0.0;
    }

    vColor = col;
    vAlpha = vis;

    // Selected structure breathes so the eye catches it as it rotates.
    float pulse = isSel ? (0.85 + 0.15 * sin(uTime * 3.0 + aSeed * 6.2832)) : 1.0;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float base = deep ? 2.3 : 1.7;
    gl_PointSize = base * pulse * uPixelRatio * (3.2 / -mv.z) * (vis > 0.0 ? 1.0 : 0.0);
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
    // hot points get a bright core
    vec3 col = mix(vColor, vec3(1.0), vHot * smoothstep(0.35, 0.0, r) * 0.6);
    gl_FragColor = vec4(col, disc * vAlpha);
  }
`

function injectColors(src: string) {
  const c = (col: THREE.Color) => `vec3(${col.r.toFixed(4)}, ${col.g.toFixed(4)}, ${col.b.toFixed(4)})`
  return src
    .replace(/COL_HOT/g, c(COL.hot))
    .replace(/COL_DEEP/g, c(COL.deep))
    .replace(/COL_SHELL/g, c(COL.shell))
}

/** BodyParts3D is z-up; bring it to three's y-up and face the camera. */
const BASE_ROT = new THREE.Euler(-Math.PI / 2, 0, 0)

function Brain({ data, selected }: { data: Loaded; selected: number }) {
  const group = useRef<THREE.Group>(null)

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRegion', new THREE.BufferAttribute(data.region, 1))
    geometry.setAttribute('aGroup', new THREE.BufferAttribute(data.group, 1))
    const seed = new Float32Array(data.count)
    for (let i = 0; i < data.count; i++) seed[i] = (i * 0.61803398) % 1
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: injectColors(VERT),
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSelected: { value: -1 },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    })
    return { geometry, material }
  }, [data])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { material.uniforms.uSelected.value = selected }, [material, selected])

  const reduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
    if (group.current && !reduced) group.current.rotation.y += delta * 0.12
  })

  return (
    <group rotation={BASE_ROT}>
      <group ref={group}>
        <points geometry={geometry} material={material} />
      </group>
    </group>
  )
}

export default function Scene({
  selected,
  deepFlags,
  onReady,
  onFail,
}: {
  selected: number
  deepFlags: Uint8Array // index = region id, 1 if deep
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
        const groupArr = new Float32Array(count)
        const Q = 1.2 / 32767
        let o = 4
        for (let i = 0; i < count; i++) {
          positions[i * 3] = dv.getInt16(o, true) * Q
          positions[i * 3 + 1] = dv.getInt16(o + 2, true) * Q
          positions[i * 3 + 2] = dv.getInt16(o + 4, true) * Q
          const rid = dv.getUint8(o + 6)
          region[i] = rid
          groupArr[i] = deepFlags[rid] ?? 0
          o += 7
        }
        setData({ positions, region, group: groupArr, count })
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
      camera={{ position: [0, 0.1, 3.0], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      <Brain data={data} selected={selected} />
      <CameraControls minDistance={1.7} maxDistance={5} />
    </Canvas>
  )
}
