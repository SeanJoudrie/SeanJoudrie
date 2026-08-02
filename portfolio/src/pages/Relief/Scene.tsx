import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { ReliefMeta } from './meta'
import { loadHeightfield } from './heightfield'
import type { Heightfield } from './heightfield'
import { Viewshed } from './viewshed'
import type { ViewshedStats } from './viewshed'

/**
 * Relief — real-time viewshed over the Grand Canyon.
 *
 * Terrain is one plane displaced in the vertex shader from a Terrarium-encoded
 * heightmap baked out of the Copernicus GLO-30 DEM (scripts/bake-relief.mjs).
 * Normals come from per-fragment finite differences rather than geometry, so
 * ridgelines stay crisp and the mesh can halve on phones without the shading
 * degrading. Contours are derived from decoded elevation with fwidth
 * antialiasing.
 *
 * Visibility comes from viewshed.ts — a GPU reference-angle pass rendered to a
 * texture on demand, which this shader samples per fragment.
 *
 * No terrain library, no GIS library. The DEM decode happens at build time;
 * everything here is plain GLSL.
 */

const HEIGHTMAP_URL = `${import.meta.env.BASE_URL}relief/heightmap.png`

const SEG_DESKTOP = 512
const SEG_MOBILE = 256
const VIEWSHED_DESKTOP = 1024
const VIEWSHED_MOBILE = 512
/**
 * March steps. Deliberately NOT reduced on mobile: step count is the accuracy
 * knob, and halving it made the phone report 12.7% visible where the desktop
 * said 11.1% — a coarser march steps over small occluders and over-reports.
 * Target *resolution* is the thing that scales down instead, which costs
 * boundary sharpness rather than correctness.
 */
const STEPS = 256

/** Minor contour interval, metres. Index (heavy) contours every 5th. */
const CONTOUR_M = 100

/** World units are kilometres — keeps camera near/far in a sane range. */
const M_TO_WORLD = 0.001

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
  uniform float uElevScale;
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
  uniform sampler2D uViewshed;
  uniform vec2  uTexel;
  uniform vec2  uMetresPerPx;
  uniform float uContour;
  uniform vec3  uSun;
  uniform vec3  uRock;
  uniform vec3  uVisible;
  uniform float uMinElev;
  uniform float uMaxElev;
  uniform float uHasViewshed;

  varying vec2  vUv;
  varying float vElev;

  ${DECODE_GLSL}

  /**
   * Normal from central differences on the heightmap, using the real ground
   * sample distance per axis — a degree of longitude is ~19% shorter than a
   * degree of latitude at 36°N, and treating them alike would stretch slopes.
   */
  vec3 terrainNormal(vec2 uv) {
    float l = elevAt(uHeight, uv - vec2(uTexel.x, 0.0));
    float r = elevAt(uHeight, uv + vec2(uTexel.x, 0.0));
    float d = elevAt(uHeight, uv - vec2(0.0, uTexel.y));
    float u = elevAt(uHeight, uv + vec2(0.0, uTexel.y));
    float dzdx = (r - l) / (2.0 * uMetresPerPx.x);
    float dzdy = (u - d) / (2.0 * uMetresPerPx.y);
    return normalize(vec3(-dzdx, -dzdy, 1.0));
  }

  /**
   * Antialiased contour line: 1.0 on the line, 0.0 off it.
   * fract(f + 0.5) - 0.5 is the signed distance to the nearest interval
   * multiple; fwidth gives its screen footprint, keeping line weight constant
   * under zoom instead of thickening as the camera pulls back.
   */
  float contour(float elev, float interval, float widthPx) {
    float f = elev / interval;
    float df = fwidth(f) * widthPx;
    float d = abs(fract(f + 0.5) - 0.5);
    return 1.0 - smoothstep(0.0, max(df, 1e-5), d);
  }

  void main() {
    vec3 n = terrainNormal(vUv);

    // Standard shaded relief: sun from the north-west at ~40°, plus a sky fill
    // proportional to how much sky the facet sees so slopes facing away stay
    // readable rather than going to black.
    float key   = max(dot(n, normalize(uSun)), 0.0);
    float fill  = 0.35 + 0.65 * max(n.z, 0.0);
    float shade = 0.30 + 0.70 * key;

    float t = clamp((vElev - uMinElev) / max(uMaxElev - uMinElev, 1.0), 0.0, 1.0);
    vec3 base = mix(uRock * 0.70, uRock * 1.25, t);
    vec3 col = base * shade * mix(0.78, 1.12, fill) * 1.45;

    // Contours: minor thin, index (every 5th) heavier. Faded on steep faces
    // where 100 m spacing stacks a dozen lines into the same few pixels and
    // reads as hatching noise rather than elevation.
    float minor = contour(vElev, uContour, 0.9);
    float index = contour(vElev, uContour * 5.0, 1.4);
    float openness = smoothstep(0.26, 0.58, n.z);
    col = mix(col, col * 0.62, minor * 0.55 * openness);
    col = mix(col, col * 0.38 + vec3(0.045), index * 0.85 * openness);

    // Visibility overlay. Hidden ground is desaturated and darkened but never
    // crushed to black — the shape of what the observer cannot see is as much
    // of the result as the shape of what they can.
    float vis = texture2D(uViewshed, vUv).r * uHasViewshed;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 hidden  = mix(vec3(lum), col, 0.34) * 0.60;
    vec3 visible = col * 1.04 + uVisible * 0.26 * (0.45 + 0.55 * key);
    col = mix(hidden, visible, vis);

    gl_FragColor = vec4(col, 1.0);
  }
`

export type Observer = { u: number; v: number; ground: number; height: number }

function Terrain({
  meta,
  texture,
  viewshed,
  hasObserver,
}: {
  meta: ReliefMeta
  texture: THREE.Texture
  viewshed: Viewshed | null
  hasObserver: boolean
}) {
  const { size } = useThree()
  const segments = size.width < 768 ? SEG_MOBILE : SEG_DESKTOP
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uHeight: { value: texture },
      uViewshed: { value: null as THREE.Texture | null },
      uElevScale: { value: M_TO_WORLD },
      uTexel: { value: new THREE.Vector2(1 / meta.width, 1 / meta.height) },
      uMetresPerPx: { value: new THREE.Vector2(meta.metersPerPixelX, meta.metersPerPixelY) },
      uContour: { value: CONTOUR_M },
      // Cartographic convention: sun from the north-west at 40° elevation.
      // Local +Y is north (the texture is flipped on upload, so v=1 is the
      // first raster row, which the bake wrote as the northern edge).
      uSun: { value: new THREE.Vector3(-0.542, 0.542, 0.643).normalize() },
      uRock: { value: new THREE.Color('#8a7f72') },
      uVisible: { value: new THREE.Color('#ffb95c') },
      uMinElev: { value: meta.minElev },
      uMaxElev: { value: meta.maxElev },
      uHasViewshed: { value: 0 },
    }),
    // Intentionally built once — later changes are pushed imperatively below so
    // the material is never rebuilt mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Pull the current texture straight off the Viewshed each frame rather than
  // routing it through React state. The instance swaps between two ping-pong
  // targets, so the identity changes on every recompute; propagating that as
  // state meant the material could keep sampling a stale target and the overlay
  // never appeared even though the pass was computing correctly.
  useFrame(() => {
    const m = matRef.current
    if (!m) return
    const tex = viewshed ? viewshed.texture : null
    m.uniforms.uViewshed.value = tex
    m.uniforms.uHasViewshed.value = tex && hasObserver ? 1 : 0
  })

  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[widthW, heightW, segments, segments]} />
      <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  )
}

/** Observer marker: a stem from the ground up to eye height, capped by a bead. */
function Marker({ meta, obs }: { meta: ReliefMeta; obs: Observer }) {
  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD
  const x = (obs.u - 0.5) * widthW
  const z = -(obs.v - 0.5) * heightW
  const groundY = obs.ground * M_TO_WORLD
  const stem = Math.max(obs.height * M_TO_WORLD, widthW * 0.0015)
  const bead = widthW * 0.0045

  return (
    <group position={[x, groundY, z]}>
      <mesh position={[0, stem / 2, 0]}>
        <cylinderGeometry args={[widthW * 0.0009, widthW * 0.0009, stem, 6]} />
        <meshBasicMaterial color="#ffb95c" />
      </mesh>
      <mesh position={[0, stem, 0]}>
        <sphereGeometry args={[bead, 12, 10]} />
        <meshBasicMaterial color="#ffe0b0" />
      </mesh>
    </group>
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

/**
 * Picking and viewshed computation. Lives inside the Canvas so it can reach the
 * renderer; reports results outward through callbacks.
 */
function Interaction({
  meta,
  field,
  observer,
  setObserver,
  radius,
  refraction,
  onStats,
  viewshed,
  controls,
  onUserInput,
}: {
  meta: ReliefMeta
  field: Heightfield
  observer: Observer | null
  setObserver: (o: Observer) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  viewshed: Viewshed
  controls: React.RefObject<CameraControls | null>
  onUserInput: () => void
}) {
  const { gl, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const dragging = useRef(false)
  const downAt = useRef<{ x: number; y: number } | null>(null)

  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD
  const diag = Math.hypot(widthW, heightW)

  /** March the pointer ray against the heightfield; the flat geometry can't be
   *  raycast directly because displacement happens on the GPU. */
  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect()
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      )
      const ray = raycaster.ray
      const p = new THREE.Vector3()
      const uvAt = (t: number) => {
        p.copy(ray.origin).addScaledVector(ray.direction, t)
        return { u: p.x / widthW + 0.5, v: -p.z / heightW + 0.5, y: p.y }
      }
      const step = diag / 700
      let prev = 0
      for (let t = 0; t < diag * 4; t += step) {
        const s = uvAt(t)
        if (s.u < 0 || s.u > 1 || s.v < 0 || s.v > 1) {
          prev = t
          continue
        }
        if (s.y <= field.elevAt(s.u, s.v) * M_TO_WORLD) {
          // Bisect the last interval for a sub-step-accurate hit.
          let lo = prev
          let hi = t
          for (let k = 0; k < 24; k++) {
            const mid = (lo + hi) / 2
            const m = uvAt(mid)
            if (m.y <= field.elevAt(m.u, m.v) * M_TO_WORLD) hi = mid
            else lo = mid
          }
          const h = uvAt(hi)
          const u = Math.min(Math.max(h.u, 0), 1)
          const v = Math.min(Math.max(h.v, 0), 1)
          return { u, v, ground: field.elevAt(u, v) }
        }
        prev = t
      }
      return null
    },
    [gl, camera, raycaster, widthW, heightW, diag, field],
  )

  // Pointer handling. Left-drag stays on the camera (the conventional gesture);
  // a click places the observer, and the marker itself can be grabbed and
  // dragged for live updates.
  useEffect(() => {
    const el = gl.domElement

    const near = (x: number, y: number) => {
      if (!observer) return false
      const hit = pick(x, y)
      return !!hit && Math.hypot(hit.u - observer.u, hit.v - observer.v) < 0.035
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      onUserInput()
      downAt.current = { x: e.clientX, y: e.clientY }
      if (near(e.clientX, e.clientY)) {
        dragging.current = true
        if (controls.current) controls.current.enabled = false
        el.setPointerCapture(e.pointerId)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const hit = pick(e.clientX, e.clientY)
      if (hit) setObserver({ ...hit, height: observer?.height ?? 2 })
    }

    const onUp = (e: PointerEvent) => {
      const start = downAt.current
      downAt.current = null
      if (dragging.current) {
        dragging.current = false
        if (controls.current) controls.current.enabled = true
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* capture may already be gone */
        }
        return
      }
      // A click (not an orbit drag) places the observer.
      if (!start) return
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return
      const hit = pick(e.clientX, e.clientY)
      if (hit) setObserver({ ...hit, height: observer?.height ?? 2 })
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
  }, [gl, pick, observer, setObserver, controls, onUserInput])

  // Recompute whenever the observer or the corrections change. This is the only
  // place the viewshed runs — never per frame.
  useEffect(() => {
    if (!observer) return
    const { stats } = viewshed.compute(gl, {
      u: observer.u,
      v: observer.v,
      ground: observer.ground,
      height: observer.height,
      radius,
      refraction,
    })
    onStats(stats)
  }, [viewshed, gl, observer, radius, refraction, onStats])

  return null
}

/**
 * Owns the single Viewshed instance and wires it to both the terrain that
 * samples it and the interaction that recomputes it. Lives inside the Canvas
 * so it can reach the renderer.
 */
function Content({
  meta,
  heightTex,
  field,
  observer,
  setObserver,
  radius,
  refraction,
  onStats,
  controls,
  onUserInput,
}: {
  meta: ReliefMeta
  heightTex: THREE.Texture
  field: Heightfield
  observer: Observer | null
  setObserver: (o: Observer) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  controls: React.RefObject<CameraControls | null>
  onUserInput: () => void
}) {
  const { size } = useThree()
  const small = size.width < 768

  const viewshed = useMemo(
    () =>
      new Viewshed(heightTex, meta, {
        size: small ? VIEWSHED_MOBILE : VIEWSHED_DESKTOP,
        statsSize: 256,
        steps: STEPS,
      }),
    [heightTex, meta, small],
  )
  useEffect(() => () => viewshed.dispose(), [viewshed])

  return (
    <>
      <Terrain meta={meta} texture={heightTex} viewshed={viewshed} hasObserver={!!observer} />
      <Interaction
        meta={meta}
        field={field}
        observer={observer}
        setObserver={setObserver}
        radius={radius}
        refraction={refraction}
        onStats={onStats}
        viewshed={viewshed}
        controls={controls}
        onUserInput={onUserInput}
      />
      {observer && <Marker meta={meta} obs={observer} />}
    </>
  )
}

export default function Scene({
  meta,
  observer,
  setObserver,
  radius,
  refraction,
  onStats,
  onReady,
  onFail,
}: {
  meta: ReliefMeta
  observer: Observer | null
  setObserver: (o: Observer) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  onReady?: (field: Heightfield) => void
  onFail?: () => void
}) {
  const controls = useRef<CameraControls | null>(null)
  const [heightTex, setHeightTex] = useState<THREE.Texture | null>(null)
  const [field, setField] = useState<Heightfield | null>(null)
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
        // NearestFilter + NoColorSpace: the viewshed march and the normal
        // differences both need the raw sample. Interpolating or sRGB-decoding
        // a Terrarium triple across a G-channel wrap yields a garbage
        // elevation spike of hundreds of metres.
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        tex.generateMipmaps = false
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.colorSpace = THREE.NoColorSpace
        tex.needsUpdate = true
        setHeightTex(tex)
      },
      undefined,
      () => !cancelled && onFail?.(),
    )
    loadHeightfield(HEIGHTMAP_URL, meta)
      .then((f) => {
        if (cancelled) return
        setField(f)
        onReady?.(f)
      })
      .catch(() => !cancelled && onFail?.())
    return () => {
      cancelled = true
    }
  }, [meta, onReady, onFail])

  const diag = Math.hypot(meta.widthM, meta.heightM) * M_TO_WORLD

  // A portrait viewport has a narrow horizontal FOV, so the same camera that
  // frames well on a laptop leaves a third of a phone screen as empty sky.
  // Dolly in and flatten the angle when the viewport is taller than it is wide.
  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  const camStart: [number, number, number] = portrait
    ? [0, diag * 0.30, diag * 0.42]
    : [0, diag * 0.45, diag * 0.62]

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: camStart, fov: 42, near: 0.05, far: diag * 6 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#0b0d10')}
    >
      <CameraControls
        ref={controls}
        minDistance={diag * 0.1}
        maxDistance={diag * 1.6}
        /* Stop just above the horizon so the camera can never slip beneath the
           terrain and stare at unlit backfaces. */
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={0.05}
      />
      <Idle controls={controls} active={idle && !reduce && !observer} />
      {heightTex && field && (
        <Content
          meta={meta}
          heightTex={heightTex}
          field={field}
          observer={observer}
          setObserver={setObserver}
          radius={radius}
          refraction={refraction}
          onStats={onStats}
          controls={controls}
          onUserInput={() => setIdle(false)}
        />
      )}
    </Canvas>
  )
}
