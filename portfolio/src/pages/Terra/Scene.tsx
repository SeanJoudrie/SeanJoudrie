import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'

/**
 * Terra — a particle Earth. ~45,000 points sampled onto a procedural sphere
 * (a Fibonacci lattice, so no pole clustering and no globe model), split into
 * land and sea by reading a NASA specular map once on a 2D canvas: water is
 * white in that map, land is black, so classification is one luminance
 * threshold per point. A hand-written vertex shader breathes low-frequency
 * noise along the normals and parts the surface around the pointer; the
 * fragment shader draws each point as a soft additive disc.
 *
 * The treatment is after cortiz2894's open-source hologram-particles
 * (concept: igloo.inc) — rebuilt from scratch here in plain GLSL on WebGL,
 * no compute pass, no particle library.
 */

export const PARTICLE_COUNT = 60_000
const MASK_URL = `${import.meta.env.BASE_URL}terra/earth_specular_2048.jpg`

/** Water is bright in the specular map; land is dark. The map is nearly
 *  binary at native resolution (open sea 255, land 0, a thin JPEG gradient
 *  at the coasts), so the midpoint splits it cleanly. */
const WATER_LUMA = 128

const COLORS = {
  sea: new THREE.Color('#3a6fc4'),
  land: new THREE.Color('#7fd7a1'),
  glow: new THREE.Color('#c9f3dc'),
}

const VERT = /* glsl */ `
  attribute float aLand;
  attribute float aSeed;
  uniform float uTime;
  uniform float uAmp;
  uniform vec3 uMouse;
  uniform float uMouseK;
  uniform float uPixelRatio;
  varying float vLand;
  varying float vGlow;

  void main() {
    vLand = aLand;
    vec3 n = normalize(position);

    // Two detuned sines per point stand in for noise — cheap, stateless,
    // and at 0.6% of the radius it reads as breathing, not jitter.
    float breathe = (sin(uTime * 0.55 + aSeed * 6.2832) * 0.5
                   + sin(uTime * 1.55 + aSeed * 15.71) * 0.5) * uAmp;

    // The pointer parts the surface: a smooth radial falloff pushes points
    // outward along their own normal, strongest at the hit, gone by ~0.55
    // radians of arc. uMouse arrives already in this mesh's local space.
    float f = smoothstep(0.55, 0.0, distance(position, uMouse)) * uMouseK;

    // Land sits a hair proud of the sea — a silhouette of topography.
    float relief = aLand * 0.012;

    vec3 p = n * (1.0 + relief + breathe + f * 0.16);
    vGlow = f;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(1.35, 2.05, aLand) + f * 2.2;
    gl_PointSize = size * uPixelRatio * (3.1 / -mv.z);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uSea;
  uniform vec3 uLand;
  uniform vec3 uGlow;
  varying float vLand;
  varying float vGlow;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.1, r);
    vec3 col = mix(uSea, uLand, vLand);
    col = mix(col, uGlow, vGlow * 0.85);
    float alpha = disc * mix(0.42, 0.9, vLand);
    alpha = min(1.0, alpha + vGlow * 0.35);
    gl_FragColor = vec4(col, alpha);
  }
`

type MaskSampler = (u: number, v: number) => boolean

/** Decode the equirectangular mask once; return a (u,v) → isLand lookup. */
function loadMask(url: string): Promise<MaskSampler> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Native resolution: downscaling blurs exactly the features that
      // matter — the Mediterranean, the Baltic, island seas — and fuses
      // them into land at any threshold.
      const w = img.naturalWidth || 2048
      const h = img.naturalHeight || 1024
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return reject(new Error('2d context unavailable'))
      ctx.drawImage(img, 0, 0, w, h)
      const { data } = ctx.getImageData(0, 0, w, h)
      resolve((u, v) => {
        const x = Math.min(w - 1, Math.max(0, Math.floor(u * w)))
        const y = Math.min(h - 1, Math.max(0, Math.floor(v * h)))
        const i = (y * w + x) * 4
        // Rec. 601 luma; water (specular highlight) is bright.
        const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        return luma < WATER_LUMA
      })
    }
    img.onerror = () => reject(new Error(`mask failed to load: ${url}`))
    img.src = url
  })
}

/**
 * Fibonacci lattice → positions, land flags, per-point seeds. Longitude 0
 * faces +z so Greenwich looks at the camera on load; east runs toward +x,
 * so continents read the right way round, not mirrored.
 */
function buildGlobe(isLand: MaskSampler) {
  const pos = new Float32Array(PARTICLE_COUNT * 3)
  const land = new Float32Array(PARTICLE_COUNT)
  const seed = new Float32Array(PARTICLE_COUNT)
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const y = 1 - (2 * (i + 0.5)) / PARTICLE_COUNT
    const rad = Math.sqrt(1 - y * y)
    const theta = GOLDEN * i
    const x = Math.cos(theta) * rad
    const z = Math.sin(theta) * rad
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    const u = ((Math.atan2(x, z) / (2 * Math.PI) + 0.5) % 1 + 1) % 1
    const v = 0.5 - Math.asin(y) / Math.PI
    land[i] = isLand(u, v) ? 1 : 0
    seed[i] = (i * 0.618034) % 1
  }
  return { pos, land, seed }
}

const FAR_AWAY = new THREE.Vector3(99, 99, 99)

/** Open on Europe and Africa — the view that reads as "Earth" fastest,
 *  Mediterranean front and center. */
const START_LON_DEG = -20

function Globe({ mask, reduced }: { mask: MaskSampler; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const mouseTarget = useRef(FAR_AWAY.clone())
  const strengthTarget = useRef(0)

  const { geometry, material } = useMemo(() => {
    const { pos, land, seed } = buildGlobe(mask)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aLand', new THREE.BufferAttribute(land, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: reduced ? 0 : 0.006 },
        uMouse: { value: FAR_AWAY.clone() },
        uMouseK: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSea: { value: COLORS.sea },
        uLand: { value: COLORS.land },
        uGlow: { value: COLORS.glow },
      },
    })
    return { geometry, material }
    // The mask is stable for the life of the page; reduced only tunes uAmp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    // Ease the pointer uniforms so the surface parts and heals, not snaps.
    const k = 1 - Math.exp(-delta * 7)
    ;(u.uMouse.value as THREE.Vector3).lerp(mouseTarget.current, k)
    u.uMouseK.value += (strengthTarget.current - u.uMouseK.value) * k
    if (group.current && !reduced) group.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={group} rotation={[0, THREE.MathUtils.degToRad(START_LON_DEG), 0]}>
      <points geometry={geometry} material={material} />
      {/* Invisible hit sphere: R3F raycasts it, and the world-space hit is
          folded into this group's local space so the shader never has to
          know the globe is spinning. */}
      <mesh
        visible={false}
        onPointerMove={(e) => {
          if (!group.current) return
          mouseTarget.current = group.current.worldToLocal(e.point.clone())
          strengthTarget.current = 1
        }}
        onPointerLeave={() => {
          strengthTarget.current = 0
        }}
      >
        <sphereGeometry args={[1.03, 32, 16]} />
      </mesh>
    </group>
  )
}

export default function Scene({
  onFail,
  onReady,
}: {
  onFail: () => void
  onReady: () => void
}) {
  const [mask, setMask] = useState<MaskSampler | null>(null)
  const reduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    let alive = true
    loadMask(MASK_URL).then(
      (m) => {
        if (!alive) return
        setMask(() => m)
        onReady()
      },
      () => alive && onFail(),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mask) return null

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.35, 3.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
      }}
    >
      <Globe mask={mask} reduced={reduced} />
      <CameraControls minDistance={1.9} maxDistance={4.6} />
    </Canvas>
  )
}
