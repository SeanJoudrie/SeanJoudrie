import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { ReliefMeta } from './meta'

/**
 * Relief — real-time viewshed over the Grand Canyon.
 *
 * The terrain is a single plane displaced in the vertex shader from a
 * Terrarium-encoded heightmap baked out of the Copernicus GLO-30 DEM
 * (see scripts/bake-relief.mjs). Normals are computed per-fragment from
 * heightmap finite differences rather than from geometry, so ridgelines stay
 * crisp no matter how coarse the mesh is — which lets the mesh drop to 256²
 * on phones without the shading falling apart.
 *
 * Contours are derived from the decoded elevation in the fragment shader with
 * fwidth() antialiasing: minor lines at CONTOUR_M, index lines every fifth.
 *
 * No terrain library, no GIS library. The DEM decode happens at build time;
 * everything here is plain GLSL.
 */

const HEIGHTMAP_URL = `${import.meta.env.BASE_URL}relief/heightmap.png`

/** Mesh subdivision. Dropped on small viewports — normals don't depend on it. */
const SEG_DESKTOP = 512
const SEG_MOBILE = 256

/** Minor contour interval, metres. Index (heavy) contours every 5th. */
const CONTOUR_M = 100

/**
 * World units are kilometres — keeps camera near/far and control speeds in a
 * sane numeric range instead of tens of thousands of metres.
 */
const M_TO_WORLD = 0.001

/** Terrarium decode, shared by every shader that reads the heightmap. */
const DECODE_GLSL = /* glsl */ `
  // elev_m = (R*256 + G + B/256) - 32768   [scripts/bake-relief.mjs]
  float decodeElev(vec3 c) {
    return (c.r * 255.0 * 256.0) + (c.g * 255.0) + (c.b * 255.0 / 256.0) - 32768.0;
  }
  float elevAt(sampler2D tex, vec2 uv) {
    return decodeElev(texture2D(tex, uv).rgb);
  }
`

const VERT = /* glsl */ `
  uniform sampler2D uHeight;
  uniform float uElevScale;   // metres -> world units
  varying vec2 vUv;
  varying float vElev;

  ${DECODE_GLSL}

  void main() {
    vUv = uv;
    float e = elevAt(uHeight, uv);
    vElev = e;
    vec3 p = position;
    p.z = e * uElevScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uHeight;
  uniform vec2  uTexel;        // 1 / heightmap size
  uniform vec2  uMetresPerPx;  // ground sample distance, x and y
  uniform float uContour;      // minor contour interval, metres
  uniform vec3  uSun;          // normalised, world space
  uniform vec3  uRock;
  uniform float uMinElev;
  uniform float uMaxElev;

  varying vec2  vUv;
  varying float vElev;

  ${DECODE_GLSL}

  /**
   * Normal from central differences on the heightmap. Using the real ground
   * sample distance (which differs per axis — a degree of longitude is shorter
   * than a degree of latitude at 36°N) keeps slopes true rather than stretched.
   */
  vec3 terrainNormal(vec2 uv) {
    float l = elevAt(uHeight, uv - vec2(uTexel.x, 0.0));
    float r = elevAt(uHeight, uv + vec2(uTexel.x, 0.0));
    float d = elevAt(uHeight, uv - vec2(0.0, uTexel.y));
    float u = elevAt(uHeight, uv + vec2(0.0, uTexel.y));
    // dz/dx and dz/dy in metres per metre
    float dzdx = (r - l) / (2.0 * uMetresPerPx.x);
    float dzdy = (u - d) / (2.0 * uMetresPerPx.y);
    return normalize(vec3(-dzdx, -dzdy, 1.0));
  }

  /**
   * Antialiased contour line: 1.0 on the line, 0.0 off it.
   * fract(f + 0.5) - 0.5 is the signed distance to the nearest integer
   * multiple, so |it| is 0 exactly on a contour. fwidth gives the screen-space
   * footprint of one interval, which keeps line weight constant under zoom
   * instead of thickening as the camera pulls back.
   */
  float contour(float elev, float interval, float widthPx) {
    float f = elev / interval;
    float df = fwidth(f) * widthPx;
    float d = abs(fract(f + 0.5) - 0.5);
    return 1.0 - smoothstep(0.0, max(df, 1e-5), d);
  }

  void main() {
    vec3 n = terrainNormal(vUv);

    // Standard shaded-relief key: sun from the north-west at ~40° elevation,
    // plus a sky fill proportional to how much sky the facet sees, so slopes
    // facing away stay readable rather than going to black.
    float key  = max(dot(n, normalize(uSun)), 0.0);
    float fill = 0.35 + 0.65 * max(n.z, 0.0);
    float shade = 0.30 + 0.70 * key;

    // Subtle elevation tint — the contours carry the quantitative reading,
    // so this stays nearly monochrome rather than a hypsometric rainbow.
    float t = clamp((vElev - uMinElev) / max(uMaxElev - uMinElev, 1.0), 0.0, 1.0);
    vec3 base = mix(uRock * 0.70, uRock * 1.25, t);

    vec3 col = base * shade * mix(0.78, 1.12, fill) * 1.45;

    // Contours: minor thin, index (every 5th) heavier.
    float minor = contour(vElev, uContour, 0.9);
    float index = contour(vElev, uContour * 5.0, 1.4);
    // Fade contours on near-vertical faces where they'd stack into mush.
    // Fade contours out on steep faces. At 100 m intervals the canyon walls
    // stack a dozen lines into the same few pixels, which reads as hatching
    // noise rather than elevation — so they only fully appear on ground gentle
    // enough to space them apart.
    float openness = smoothstep(0.26, 0.58, n.z);
    col = mix(col, col * 0.62, minor * 0.55 * openness);
    col = mix(col, col * 0.38 + vec3(0.045), index * 0.85 * openness);

    gl_FragColor = vec4(col, 1.0);
  }
`

function Terrain({ meta, texture }: { meta: ReliefMeta; texture: THREE.Texture }) {
  const { size } = useThree()
  const segments = size.width < 768 ? SEG_MOBILE : SEG_DESKTOP

  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD

  const uniforms = useMemo(
    () => ({
      uHeight: { value: texture },
      uElevScale: { value: M_TO_WORLD },
      uTexel: { value: new THREE.Vector2(1 / meta.width, 1 / meta.height) },
      uMetresPerPx: { value: new THREE.Vector2(meta.metersPerPixelX, meta.metersPerPixelY) },
      uContour: { value: CONTOUR_M },
      // Cartographic convention: sun from the north-west at 40° elevation.
      // Local +Y is north (the texture is flipped on upload, so v=1 is the
      // first raster row, which the bake wrote as the northern edge).
      uSun: { value: new THREE.Vector3(-0.542, 0.542, 0.643).normalize() },
      uRock: { value: new THREE.Color('#8a7f72') },
      uMinElev: { value: meta.minElev },
      uMaxElev: { value: meta.maxElev },
    }),
    [texture, meta],
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      {/*
        The plane is built in XY and rotated flat, so displacement is along
        local +Z. Segment counts are one less than sample counts by convention;
        matching them to the mesh keeps texel centres aligned to vertices.
      */}
      <planeGeometry args={[widthW, heightW, segments, segments]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  )
}

/** Slow orbit until the user takes control, unless reduced motion is set. */
function Idle({ controls, active }: { controls: React.RefObject<CameraControls | null>; active: boolean }) {
  useFrame((_, dt) => {
    if (!active) return
    controls.current?.rotate(dt * 0.045, 0, false)
  })
  return null
}

export default function Scene({
  meta,
  onReady,
  onFail,
}: {
  meta: ReliefMeta
  onReady?: () => void
  onFail?: () => void
}) {
  const controls = useRef<CameraControls | null>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [idle, setIdle] = useState(true)

  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      HEIGHTMAP_URL,
      (tex) => {
        if (cancelled) return
        // NearestFilter: the viewshed march and the normal differences both
        // want the raw sample, not a blend of two encoded bytes — interpolating
        // a Terrarium triple across a G-channel wrap produces a garbage
        // elevation spike.
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        tex.generateMipmaps = false
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.colorSpace = THREE.NoColorSpace // raw bytes, never sRGB-decoded
        tex.needsUpdate = true
        setTexture(tex)
        onReady?.()
      },
      undefined,
      () => !cancelled && onFail?.(),
    )
    return () => {
      cancelled = true
    }
  }, [onReady, onFail])

  const diag = Math.hypot(meta.widthM, meta.heightM) * M_TO_WORLD

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, diag * 0.45, diag * 0.62], fov: 42, near: 0.05, far: diag * 6 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#0b0d10')}
      onPointerDown={() => setIdle(false)}
      onWheel={() => setIdle(false)}
    >
      <CameraControls
        ref={controls}
        minDistance={diag * 0.12}
        maxDistance={diag * 1.6}
        /* Stop just above the horizon so the camera can never slip under the
           terrain and look at the unlit backfaces. */
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={0.05}
      />
      <Idle controls={controls} active={idle && !reduce} />
      {texture && <Terrain meta={meta} texture={texture} />}
    </Canvas>
  )
}
