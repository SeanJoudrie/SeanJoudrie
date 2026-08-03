import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { ReliefMeta } from './meta'
import { loadHeightmap } from './heightfield'
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

/** Sky gradient. Also what the terrain hazes and dissolves toward. */
const SKY_TOP = new THREE.Color('#141a24')
const SKY_HORIZON = new THREE.Color('#4a4036')

/**
 * The sky, as a function of normalised screen height (0 bottom, 1 top).
 *
 * Shared verbatim by the backdrop and the terrain shader. The terrain has to
 * dissolve into *exactly* what the sky is doing at that pixel, so the two must
 * evaluate the same function — fading toward a single average colour leaves a
 * visible seam wherever the gradient has moved away from it.
 */
const SKY_GLSL = /* glsl */ `
  uniform vec3 uSkyTop;
  uniform vec3 uSkyHorizon;
  uniform vec2 uResolution;

  vec3 skyAt(float t) {
    // Weighted toward the horizon so the warm band sits low, as it does in a
    // real sky, rather than washing the whole frame.
    return mix(uSkyHorizon, uSkyTop, pow(clamp(t, 0.0, 1.0), 0.65));
  }
  vec3 skyAtFragment() {
    return skyAt(gl_FragCoord.y / uResolution.y);
  }
`

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
  varying float vDepth;

  ${DECODE_GLSL}

  void main() {
    vUv = uv;
    float e = elevAt(uHeight, uv);
    vElev = e;
    vec3 p = position;
    p.z = e * uElevScale;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z; // distance from the camera, for aerial perspective
    gl_Position = projectionMatrix * mv;
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
  uniform float uHazeDensity;
  uniform float uEdgeFade;
  uniform float uExag;

  varying vec2  vUv;
  varying float vElev;
  varying float vDepth;

  ${SKY_GLSL}
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
    float dzdx = (r - l) * uExag / (2.0 * uMetresPerPx.x);
    float dzdy = (u - d) * uExag / (2.0 * uMetresPerPx.y);
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
    // Ambient floors are deliberately generous. Exaggeration makes almost every
    // facet steep, so a model tuned for gentle 1:1 terrain bottoms out and the
    // whole scene goes to mud — most surfaces end up facing away from the sun at
    // once. Sky fill carries the shadowed side instead.
    float key   = max(dot(n, normalize(uSun)), 0.0);
    float fill  = 0.55 + 0.45 * max(n.z, 0.0);
    float shade = 0.45 + 0.55 * key;

    float t = clamp((vElev - uMinElev) / max(uMaxElev - uMinElev, 1.0), 0.0, 1.0);
    vec3 base = mix(uRock * 0.70, uRock * 1.25, t);
    vec3 col = base * shade * mix(0.82, 1.15, fill) * 1.62;

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
    // R holds the share of observers that can see this cell. Mixing by that
    // share directly would render ground seen by one of four at 0.25 — i.e.
    // nearly hidden — when it is in fact covered. Any coverage at all lights
    // the ground; additional overlap adds the rest. smoothstep rather than a
    // threshold keeps the boundary soft, which is what the linear filter on the
    // viewshed target is there for.
    vec3 sky = skyAtFragment();

    // Aerial perspective, applied BEFORE the visibility treatment. Strictly the
    // overlay should recede with everything else, but the visible/hidden
    // boundary is the product and legibility wins — so haze dulls the rock and
    // the overlay then paints at full strength on top of it.
    float haze = 1.0 - exp(-vDepth * uHazeDensity);
    col = mix(col, sky, clamp(haze, 0.0, 0.92));

    float cov = texture2D(uViewshed, vUv).r * uHasViewshed;
    float vis = smoothstep(0.0, 0.12, cov) * mix(0.62, 1.0, cov);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 hidden  = mix(vec3(lum), col, 0.34) * 0.72;
    vec3 visible = col * 1.04 + uVisible * 0.26 * (0.45 + 0.55 * key);
    col = mix(hidden, visible, vis);

    // Dissolve the frame edge into the sky, LAST, so nothing paints over it.
    //
    // Distance to the nearest edge in uv, not a radius: a radial falloff reads
    // as a lens vignette rather than as atmosphere. This deliberately catches
    // the NEAR edge too — once the camera is low, the closest data boundary sits
    // at the bottom of the screen and is the most conspicuous edge in the frame.
    vec2 toEdge = min(vUv, 1.0 - vUv);
    float edge = min(toEdge.x, toEdge.y);
    col = mix(sky, col, smoothstep(0.0, uEdgeFade, edge));

    gl_FragColor = vec4(col, 1.0);
  }
`

export type Observer = { u: number; v: number; ground: number; height: number }

/**
 * Sky backdrop. A full-screen quad pinned to the far plane, drawn before
 * everything else — the terrain fades into this exact gradient at the frame
 * edge, so the two must agree pixel for pixel.
 *
 * Replaces a flat black clear colour, which gave the terrain nothing to recede
 * into and left it reading as an object on a table rather than a landscape.
 */
function Sky({ top, horizon }: { top: THREE.Color; horizon: THREE.Color }) {
  const { size } = useThree()
  const ref = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uSkyTop: { value: top.clone() },
      uSkyHorizon: { value: horizon.clone() },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame(() => {
    if (ref.current) (ref.current.uniforms.uResolution.value as THREE.Vector2).set(size.width, size.height)
  })

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        vertexShader={/* glsl */ `
          void main() {
            // z = 1 places it on the far plane regardless of the camera.
            gl_Position = vec4(position.xy, 1.0, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;
          ${SKY_GLSL}
          void main() { gl_FragColor = vec4(skyAtFragment(), 1.0); }
        `}
      />
    </mesh>
  )
}

function Terrain({
  meta,
  texture,
  viewshed,
  hasObserver,
  exaggeration,
}: {
  meta: ReliefMeta
  texture: THREE.Texture
  viewshed: Viewshed | null
  hasObserver: boolean
  exaggeration: number
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
      uHazeDensity: { value: 0.007 },
      uExag: { value: 1 },
      uEdgeFade: { value: 0.1 },
      uSkyTop: { value: SKY_TOP.clone() },
      uSkyHorizon: { value: SKY_HORIZON.clone() },
      uResolution: { value: new THREE.Vector2(1, 1) },
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
    // Vertical exaggeration is applied HERE and nowhere that matters. It scales
    // the displacement the viewer sees; viewshed.ts keeps working from true
    // elevations in metres and never learns this value exists. smoke-relief
    // asserts the statistics are byte-identical across settings.
    m.uniforms.uElevScale.value = M_TO_WORLD * exaggeration
    m.uniforms.uExag.value = exaggeration
    ;(m.uniforms.uResolution.value as THREE.Vector2).set(size.width, size.height)
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
function Marker({
  meta,
  obs,
  dim = false,
  exaggeration,
}: {
  meta: ReliefMeta
  obs: Observer
  dim?: boolean
  exaggeration: number
}) {
  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD
  const x = (obs.u - 0.5) * widthW
  const z = -(obs.v - 0.5) * heightW
  const groundY = obs.ground * M_TO_WORLD * exaggeration
  const stem = Math.max(obs.height * M_TO_WORLD * exaggeration, widthW * 0.0015)
  const bead = widthW * 0.0045

  return (
    <group position={[x, groundY, z]}>
      <mesh position={[0, stem / 2, 0]}>
        <cylinderGeometry args={[widthW * 0.0009, widthW * 0.0009, stem, 6]} />
        <meshBasicMaterial color={dim ? '#a8794a' : '#ffb95c'} />
      </mesh>
      <mesh position={[0, stem, 0]}>
        <sphereGeometry args={[bead * (dim ? 0.8 : 1), 12, 10]} />
        <meshBasicMaterial color={dim ? '#c9a071' : '#ffe0b0'} />
      </mesh>
    </group>
  )
}

/**
 * Opening framing.
 *
 * The old camera sat ~40 km out at about 36 degrees above horizontal, looking
 * at the centre of the frame. From there nothing hides anything — which is the
 * single biggest reason the terrain read flat. Occlusion is the strongest depth
 * cue there is and that pose eliminated it.
 *
 * This drops to a low oblique inside the terrain, aimed across the gorge rather
 * than down at it, so near ridges cut in front of far ones.
 */
const CAM_ELEV_DEG = 17
/** Portrait looks down harder — a tall frame at 17 degrees is mostly sky. */
const CAM_ELEV_DEG_PORTRAIT = 26
/** Distance back from the look-at point, as a share of frame width. */
const CAM_DIST_FRAC = 0.42
/** Portrait has a narrow horizontal field of view, so pull in closer. */
const CAM_DIST_FRAC_PORTRAIT = 0.3

function applyFraming(
  controls: CameraControls,
  meta: ReliefMeta,
  target: { u: number; v: number; ground: number },
  exaggeration: number,
  portrait: boolean,
) {
  const widthW = meta.widthM * M_TO_WORLD
  const heightW = meta.heightM * M_TO_WORLD
  const tx = (target.u - 0.5) * widthW
  const tz = -(target.v - 0.5) * heightW
  const ty = target.ground * M_TO_WORLD * exaggeration

  const d = widthW * (portrait ? CAM_DIST_FRAC_PORTRAIT : CAM_DIST_FRAC)
  const elev = portrait ? CAM_ELEV_DEG_PORTRAIT : CAM_ELEV_DEG
  const h = d * Math.tan((elev * Math.PI) / 180)
  // Stand south of the subject looking north across it: local +Y is north, and
  // the plane's rotation puts north at negative world Z.
  controls.setLookAt(tx, ty + h, tz + d, tx, ty, tz, false)
}

/**
 * Idle motion: a slow lateral dolly along the ridge rather than a spin about
 * the centre. Parallax between near and far ridges as the camera slides is the
 * cheapest convincing depth cue there is; orbiting the centre gives almost none
 * because everything rotates together.
 */
function Idle({ controls, active }: { controls: React.RefObject<CameraControls | null>; active: boolean }) {
  useFrame((_, dt) => {
    if (!active || document.hidden) return
    controls.current?.truck(dt * 0.55, 0, false)
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
  observers,
  active,
  moveActive,
  radius,
  refraction,
  onStats,
  viewshed,
  controls,
  onUserInput,
  exaggeration,
}: {
  meta: ReliefMeta
  field: Heightfield
  observers: Observer[]
  active: number
  moveActive: (u: number, v: number, ground: number) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  viewshed: Viewshed
  controls: React.RefObject<CameraControls | null>
  onUserInput: () => void
  exaggeration: number
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
        if (s.y <= field.elevAt(s.u, s.v) * M_TO_WORLD * exaggeration) {
          // Bisect the last interval for a sub-step-accurate hit.
          let lo = prev
          let hi = t
          for (let k = 0; k < 24; k++) {
            const mid = (lo + hi) / 2
            const m = uvAt(mid)
            if (m.y <= field.elevAt(m.u, m.v) * M_TO_WORLD * exaggeration) hi = mid
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
    [gl, camera, raycaster, widthW, heightW, diag, field, exaggeration],
  )

  // Pointer handling. Left-drag stays on the camera (the conventional gesture);
  // a click places the observer, and the marker itself can be grabbed and
  // dragged for live updates.
  useEffect(() => {
    const el = gl.domElement

    const cur = observers[active]
    const near = (x: number, y: number) => {
      if (!cur) return false
      const hit = pick(x, y)
      return !!hit && Math.hypot(hit.u - cur.u, hit.v - cur.v) < 0.035
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
      if (hit) moveActive(hit.u, hit.v, hit.ground)
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
      if (hit) moveActive(hit.u, hit.v, hit.ground)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
  }, [gl, pick, observers, active, moveActive, controls, onUserInput])

  // Recompute whenever the observer or the corrections change. This is the only
  // place the viewshed runs — never per frame.
  useEffect(() => {
    if (!observers.length) return
    const { stats } = viewshed.compute(gl, {
      observers: observers.map((o) => ({ u: o.u, v: o.v, ground: o.ground })),
      height: observers[0].height,
      radius,
      refraction,
    })
    onStats(stats)
  }, [viewshed, gl, observers, radius, refraction, onStats])

  return null
}

/**
 * Occlusion probe.
 *
 * "A ridge is hidden behind another ridge" is a judgement call, and judgement
 * calls get confirmed under pressure. This measures it instead: for a grid of
 * cells, march from the cell toward the camera and see whether terrain gets in
 * the way. The fraction hidden is exactly the depth cue the old framing was
 * missing — a camera 40 km out and high could see essentially everything, which
 * is why the terrain read as a texture map rather than a landscape.
 *
 * Exposed on window so the smoke suite can assert on it. Cheap, CPU-side, run
 * on demand — never in the render loop.
 */
function useOcclusionProbe(
  field: Heightfield | null,
  meta: ReliefMeta,
  exaggeration: number,
  camera: THREE.Camera,
) {
  useEffect(() => {
    if (!field) return
    const widthW = meta.widthM * M_TO_WORLD
    const heightW = meta.heightM * M_TO_WORLD

    const w = window as unknown as { __reliefOcclusion?: () => number }
    w.__reliefOcclusion = () => {
      const scale = M_TO_WORLD * exaggeration
      const cam = camera.position
      const N = 96
      const STEPS = 96
      let hidden = 0
      const p = new THREE.Vector3()
      for (let iy = 0; iy < N; iy++) {
        for (let ix = 0; ix < N; ix++) {
          const u = (ix + 0.5) / N
          const v = (iy + 0.5) / N
          const cellX = (u - 0.5) * widthW
          const cellZ = -(v - 0.5) * heightW
          const cellY = field.elevAt(u, v) * scale
          let blocked = false
          // Start slightly along the ray so the cell cannot occlude itself.
          for (let k = 2; k < STEPS; k++) {
            const t = k / STEPS
            p.set(
              cellX + (cam.x - cellX) * t,
              cellY + (cam.y - cellY) * t,
              cellZ + (cam.z - cellZ) * t,
            )
            const su = p.x / widthW + 0.5
            const sv = -p.z / heightW + 0.5
            if (su < 0 || su > 1 || sv < 0 || sv > 1) continue
            if (p.y < field.elevAt(su, sv) * scale) {
              blocked = true
              break
            }
          }
          if (blocked) hidden++
        }
      }
      return hidden / (N * N)
    }
    return () => {
      delete w.__reliefOcclusion
    }
  }, [field, meta, exaggeration, camera])
}

/**
 * Owns the single Viewshed instance and wires it to both the terrain that
 * samples it and the interaction that recomputes it. Lives inside the Canvas
 * so it can reach the renderer.
 */
/** Sets the opening pose once, as soon as there is something to aim at. */
function Framing({
  meta,
  observers,
  exaggeration,
  controls,
}: {
  meta: ReliefMeta
  observers: Observer[]
  exaggeration: number
  controls: React.RefObject<CameraControls | null>
}) {
  const { size } = useThree()
  const done = useRef(false)
  useFrame(() => {
    if (done.current || !controls.current || !observers.length) return
    done.current = true
    applyFraming(
      controls.current,
      meta,
      observers[0],
      exaggeration,
      size.height > size.width,
    )
  })
  return null
}

function Content({
  meta,
  heightTex,
  field,
  observers,
  active,
  moveActive,
  radius,
  refraction,
  onStats,
  controls,
  onUserInput,
  exaggeration,
}: {
  meta: ReliefMeta
  heightTex: THREE.Texture
  field: Heightfield
  observers: Observer[]
  active: number
  moveActive: (u: number, v: number, ground: number) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  controls: React.RefObject<CameraControls | null>
  onUserInput: () => void
  exaggeration: number
}) {
  const { size, camera } = useThree()
  const small = size.width < 768
  useOcclusionProbe(field, meta, exaggeration, camera)

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
      <Framing meta={meta} observers={observers} exaggeration={exaggeration} controls={controls} />
      <Sky top={SKY_TOP} horizon={SKY_HORIZON} />
      <Terrain
        meta={meta}
        texture={heightTex}
        viewshed={viewshed}
        hasObserver={observers.length > 0}
        exaggeration={exaggeration}
      />
      <Interaction
        meta={meta}
        field={field}
        exaggeration={exaggeration}
        observers={observers}
        active={active}
        moveActive={moveActive}
        radius={radius}
        refraction={refraction}
        onStats={onStats}
        viewshed={viewshed}
        controls={controls}
        onUserInput={onUserInput}
      />
      {observers.map((o, i) => (
        <Marker key={i} meta={meta} obs={o} dim={i !== active} exaggeration={exaggeration} />
      ))}
    </>
  )
}

export default function Scene({
  meta,
  observers,
  active,
  moveActive,
  radius,
  refraction,
  onStats,
  onReady,
  onFail,
  onProgress,
  exaggeration,
}: {
  meta: ReliefMeta
  observers: Observer[]
  active: number
  moveActive: (u: number, v: number, ground: number) => void
  radius: number
  refraction: boolean
  onStats: (s: ViewshedStats) => void
  onReady?: (field: Heightfield) => void
  onFail?: () => void
  onProgress?: (fraction: number) => void
  exaggeration: number
}) {
  const controls = useRef<CameraControls | null>(null)
  const [heightTex, setHeightTex] = useState<THREE.Texture | null>(null)
  const [field, setField] = useState<Heightfield | null>(null)
  const [idle, setIdle] = useState(true)

  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // The heightmap costs ~3 MB and a full CPU decode, and onReady seeds page
  // state — so this must run exactly once. It previously listed the callbacks
  // as dependencies; onFail was an inline arrow, so every render re-ran the
  // load and re-fired onReady, silently resetting the observers the user had
  // just added.
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    let cancelled = false
    loadHeightmap(HEIGHTMAP_URL, meta, (loaded, total) => {
      if (!cancelled) onProgress?.(total ? loaded / total : 0)
    })
      .then(({ texture, field }) => {
        if (cancelled) return
        setHeightTex(texture)
        setField(field)
        onReady?.(field)
      })
      .catch(() => !cancelled && onFail?.())
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

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
      onCreated={({ gl }) => gl.setClearColor(SKY_TOP)}
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
      <Idle controls={controls} active={idle && !reduce && !observers.length} />
      {heightTex && field && (
        <Content
          meta={meta}
          heightTex={heightTex}
          field={field}
          observers={observers}
          active={active}
          moveActive={moveActive}
          radius={radius}
          refraction={refraction}
          onStats={onStats}
          controls={controls}
          onUserInput={() => setIdle(false)}
          exaggeration={exaggeration}
        />
      )}
    </Canvas>
  )
}
