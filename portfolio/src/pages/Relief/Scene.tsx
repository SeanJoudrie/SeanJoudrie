import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import type { ReliefMeta, ReliefSite } from './meta'
import { heightmapUrl, previewUrl, previewMeta } from './meta'
import { loadHeightmap } from './heightfield'
import type { Heightfield } from './heightfield'
import { Viewshed } from './viewshed'
import { Shadow, sunVector } from './shadow'
import type { ViewshedStats } from './viewshed'

/**
 * Relief — a real-time viewshed, over any of four sites.
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
  /**
   * Linear -> sRGB.
   *
   * THREE.Color converts a hex literal to linear on construction, and three
   * appends its colour-space conversion only to its own materials — a raw
   * ShaderMaterial writes whatever it computes straight to the framebuffer. So
   * linear values were being displayed as if they were already sRGB, and the
   * whole scene rendered far darker than authored: #141a24 arrived on screen as
   * rgb(2,3,5). Every ambient level tuned before this was compensating for it.
   */
  vec3 linearToSRGB(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }

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
  uniform vec3  uLow;
  uniform vec3  uHigh;
  uniform vec3  uVisible;
  uniform float uMinElev;
  uniform float uMaxElev;
  uniform float uHasViewshed;
  uniform float uViewshedTexel;
  uniform float uHazeDensity;
  uniform float uEdgeFade;
  uniform float uExag;
  uniform sampler2D uShadow;
  uniform float uHasShadow;

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

    // Shaded relief from the SAME sun the cast-shadow pass marches toward.
    // These were two different suns until the sites went in — hillshade lit from
    // the cartographic north-west while shadows fell from wherever the site's
    // sun was — so shadows landed across brightly lit slopes. The north-west
    // convention exists to defeat the relief-inversion illusion on a flat map;
    // in an oblique perspective view with real cast shadows there is no illusion
    // to defeat, and coherence is worth more.
    float key   = max(dot(n, normalize(uSun)), 0.0);

    // Cast shadow only attenuates light that would otherwise arrive. Facets
    // already turned away from the sun are already dark; multiplying them by
    // a shadow term as well double-darkens, and it is exactly those grazing
    // surfaces where a heightmap march is most prone to shadowing itself.
    float shadow = mix(1.0, texture2D(uShadow, vUv).r, uHasShadow);
    key *= shadow;
    // Two separable terms rather than one blended factor, because a cast shadow
    // removes the SUN and nothing else. Sky light still arrives in shadow, and
    // it is what keeps the canyon floor readable instead of crushed: measured
    // at 26.5% of the frame below 12/255 with the previous single-factor model,
    // and no detail left in the darkest quartile.
    float skyLight = 0.55 + 0.45 * max(n.z, 0.0); // hemisphere the facet can see
    float direct = key;                            // sun, already shadow-attenuated

    // Hypsometric tint across the site's own elevation range: two stops, lowest
    // ground in the frame to highest. Two is enough for all four sites because
    // the ramp is free to run either way — Death Valley's salt is the brightest
    // thing in its frame and also the lowest, so its ramp descends.
    float t = clamp((vElev - uMinElev) / max(uMaxElev - uMinElev, 1.0), 0.0, 1.0);
    vec3 base = mix(uLow, uHigh, t);
    vec3 col = base * (0.30 * skyLight + 0.62 * direct) * 1.0;

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

    // Five taps, not one. At a grazing sight line the reference angle and the
    // cell's own angle differ by less than the noise in a 30 m posting, so the
    // result flips cell to cell and the boundary breaks into a dither — real,
    // and at this camera distance one viewshed cell is about five pixels, so it
    // reads as compression noise across the whole near plateau. Averaging over
    // roughly 90 m of ground costs nothing structurally on a 20 km frame.
    //
    // This is the DISPLAY only. Every reported figure comes from the separate
    // statistics pass in viewshed.ts, which samples the unfiltered result.
    float e = uViewshedTexel * 0.75;
    float cov = (
      texture2D(uViewshed, vUv).r * 2.0 +
      texture2D(uViewshed, vUv + vec2( e,  e)).r +
      texture2D(uViewshed, vUv + vec2(-e,  e)).r +
      texture2D(uViewshed, vUv + vec2( e, -e)).r +
      texture2D(uViewshed, vUv + vec2(-e, -e)).r
    ) / 6.0 * uHasViewshed;
    float vis = smoothstep(0.0, 0.12, cov) * mix(0.62, 1.0, cov);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 hidden  = mix(vec3(lum), col, 0.34) * 0.72;
    // The warm tint scales with how bright the ground already is. A flat additive
    // term swamps anything dark: Crater Lake's water sits at the very bottom of
    // its own palette, the whole lake is inside the viewshed, and the overlay
    // painted it the same sand colour as the rim. Brightness still separates
    // visible from hidden — 1.10 against 0.72 — so nothing is lost by letting
    // dark ground keep its own colour.
    float tint = 0.30 * (0.45 + 0.55 * key) * (0.15 + 0.85 * smoothstep(0.0, 0.25, lum));
    vec3 visible = col * 1.10 + uVisible * tint;
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

    gl_FragColor = vec4(linearToSRGB(col), 1.0);
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
          void main() { gl_FragColor = vec4(linearToSRGB(skyAtFragment()), 1.0); }
        `}
      />
    </mesh>
  )
}

function Terrain({
  meta,
  site,
  texture,
  sun,
  viewshedSize,
  viewshed,
  shadow,
  hasObserver,
  exaggeration,
}: {
  meta: ReliefMeta
  site: ReliefSite
  texture: THREE.Texture
  sun: THREE.Vector3
  viewshedSize: number
  viewshed: Viewshed | null
  shadow: Shadow | null
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
      uContour: { value: site.contourM },
      // Local +Y is north (the texture is flipped on upload, so v=1 is the
      // first raster row, which the bake wrote as the northern edge).
      uSun: { value: sun.clone() },
      uLow: { value: new THREE.Color(site.palette.low) },
      uHigh: { value: new THREE.Color(site.palette.high) },
      // NOT per site. The terrain changes; the instrument does not. Holding the
      // overlay colour fixed across all four is what makes them comparable.
      uVisible: { value: new THREE.Color('#ffb95c') },
      uMinElev: { value: meta.minElev },
      uMaxElev: { value: meta.maxElev },
      uHasViewshed: { value: 0 },
      uViewshedTexel: { value: 1 / VIEWSHED_DESKTOP },
      uHazeDensity: { value: 0.007 },
      uShadow: { value: null as THREE.Texture | null },
      uHasShadow: { value: 0 },
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

  // The height texture is swapped, not rebuilt: the preview tier renders first
  // and the full raster replaces it in place a moment later. Everything derived
  // from the raster's DIMENSIONS has to follow it across that swap — a 1024²
  // texel size on a 256² preview would sample a sixteenth of the intended
  // footprint and the hillshade would turn to noise.
  useEffect(() => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uHeight.value = texture
    ;(m.uniforms.uTexel.value as THREE.Vector2).set(1 / meta.width, 1 / meta.height)
    ;(m.uniforms.uMetresPerPx.value as THREE.Vector2).set(
      meta.metersPerPixelX,
      meta.metersPerPixelY,
    )
    m.uniforms.uMinElev.value = meta.minElev
    m.uniforms.uMaxElev.value = meta.maxElev
    m.uniforms.uContour.value = site.contourM
    m.uniforms.uViewshedTexel.value = 1 / viewshedSize
    ;(m.uniforms.uSun.value as THREE.Vector3).copy(sun)
    ;(m.uniforms.uLow.value as THREE.Color).set(site.palette.low)
    ;(m.uniforms.uHigh.value as THREE.Color).set(site.palette.high)
  }, [texture, meta, site, sun, viewshedSize])

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
    const sh = shadow ? shadow.texture : null
    m.uniforms.uShadow.value = sh
    m.uniforms.uHasShadow.value = sh ? 1 : 0
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
const CAM_ELEV_DEG_PORTRAIT = 24
/** Distance back from the look-at point, as a share of frame width. */
const CAM_DIST_FRAC = 0.42
/** Portrait has a narrow horizontal field of view, so pull in closer. */
const CAM_DIST_FRAC_PORTRAIT = 0.3

/** How far back the opening camera stands. Shared by the framing and by the
 *  idle dolly, which needs it to size its travel — see Idle. */
const framingDistance = (meta: ReliefMeta, portrait: boolean) =>
  meta.widthM * M_TO_WORLD * (portrait ? CAM_DIST_FRAC_PORTRAIT : CAM_DIST_FRAC)

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

  const d = framingDistance(meta, portrait)
  const elev = portrait ? CAM_ELEV_DEG_PORTRAIT : CAM_ELEV_DEG
  const h = d * Math.tan((elev * Math.PI) / 180)

  /**
   * Stand OUTWARD from the frame centre, behind the observer, looking back
   * across the terrain.
   *
   * A fixed bearing — always south of the subject, looking north — composes well
   * only when the subject happens to sit south of centre. It does not: the seed
   * positions are chosen for what they can see, and what can see the most is
   * usually near an edge. Framing the Matterhorn's seed that way put the camera
   * off the north-east corner with the massif behind it, and a fifth of the
   * frame was empty sky. Badwater Basin's put half the frame off the map.
   *
   * Taking the bearing from the centre-to-observer vector instead means the bulk
   * of the terrain is always the thing being looked at, whichever corner the
   * observer landed in, and the longest sight lines in the frame — the diagonals
   * — are the ones the camera looks down.
   */
  const len = Math.hypot(tx, tz)
  // An observer at the exact centre has no outward direction; face south, which
  // is where the fixed bearing used to point.
  const dirX = len < 1e-3 ? 0 : tx / len
  const dirZ = len < 1e-3 ? 1 : tz / len

  controls.setLookAt(tx + dirX * d, ty + h, tz + dirZ * d, tx, ty, tz, false)
}

/**
 * Idle motion: a slow lateral dolly along the ridge rather than a spin about
 * the centre. Parallax between near and far ridges as the camera slides is the
 * cheapest convincing depth cue there is; orbiting the centre gives almost none
 * because everything rotates together.
 *
 * BOUNDED, and it starts only once the site has fully loaded. Unbounded, it ran
 * during the load window — between the opening framing and the observer being
 * seeded — and trucked the camera a few kilometres sideways by however long the
 * download happened to take. Every site opened on a different composition, and
 * the same site opened differently on every visit; two runs of probe-look.mjs
 * disagreed by 15% of mean brightness on a frame nothing had changed in.
 *
 * The budget is a share of the CAMERA DISTANCE, not of the frame. Sized against
 * the frame it was an angle that depended on how close the camera happened to
 * stand: the same 4% swept 2.3 degrees on a laptop and 5.7 on a phone, where the
 * horizontal field of view is only 23 degrees to begin with — a quarter of the
 * frame, enough to carry the observer marker to the very edge of the screen.
 */
const IDLE_TRAVEL_FRAC = 0.06
const IDLE_SECONDS = 5

function Idle({
  controls,
  active,
  limit,
}: {
  controls: React.RefObject<CameraControls | null>
  active: boolean
  limit: number
}) {
  const travelled = useRef(0)
  useFrame((_, dt) => {
    if (!active || document.hidden || travelled.current >= limit) return
    const step = Math.min((dt * limit) / IDLE_SECONDS, limit - travelled.current)
    travelled.current += step
    controls.current?.truck(step, 0, false)
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
 * Live GPU allocation counts, for the smoke suite.
 *
 * Four sites, each holding two viewshed targets, a shadow pair and a heightmap
 * texture, is enough that "we call dispose somewhere" is not good enough — a
 * missed one is invisible until the tab is minutes old. This makes the count
 * assertable: cycle every site and come back, and the totals should return to
 * where they started.
 */
function useAllocationProbe() {
  const { gl } = useThree()
  useEffect(() => {
    const w = window as unknown as {
      __reliefInfo?: () => { textures: number; geometries: number }
    }
    w.__reliefInfo = () => ({
      textures: gl.info.memory.textures,
      geometries: gl.info.memory.geometries,
    })
    return () => {
      delete w.__reliefInfo
    }
  }, [gl])
}

/**
 * Owns the single Viewshed instance and wires it to both the terrain that
 * samples it and the interaction that recomputes it. Lives inside the Canvas
 * so it can reach the renderer.
 */
/**
 * Sets the opening pose once, as soon as there is something to aim at.
 *
 * "Something" is the seed position, not the seeded observer — the preview tier
 * renders before the full raster has decoded and therefore before any observer
 * exists, and waiting for one would open on the default overview and then snap
 * to the low oblique a second later. Both tiers aim at the same point, so the
 * pose that gets set first is already the right one and the swap is invisible.
 */
function Framing({
  meta,
  field,
  seed,
  observers,
  exaggeration,
  controls,
}: {
  meta: ReliefMeta
  field: Heightfield
  seed: { u: number; v: number }
  observers: Observer[]
  exaggeration: number
  controls: React.RefObject<CameraControls | null>
}) {
  const { size } = useThree()
  const done = useRef(false)
  useFrame(() => {
    if (done.current || !controls.current) return
    done.current = true
    const target = observers[0] ?? { ...seed, ground: field.elevAt(seed.u, seed.v) }
    applyFraming(controls.current, meta, target, exaggeration, size.height > size.width)
  })
  return null
}

function Content({
  site,
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
  site: ReliefSite
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
  useAllocationProbe()

  // The most site-specific value there is. A caldera wants a low sun to cast its
  // rim across the water; a peak at the same angle turns its own faces black.
  const sun = useMemo(
    () => sunVector(site.sun.azimuth, site.sun.elevation),
    [site.sun.azimuth, site.sun.elevation],
  )

  // Both of these hold GPU render targets, and both are keyed on the height
  // texture — so the preview→full swap and a change of site each retire the old
  // pair through the disposal effects below. Four sites' worth of undisposed
  // targets is a real leak, not a theoretical one.
  const viewshedSize = small ? VIEWSHED_MOBILE : VIEWSHED_DESKTOP
  const viewshed = useMemo(
    () =>
      new Viewshed(heightTex, meta, {
        size: viewshedSize,
        statsSize: 256,
        steps: STEPS,
      }),
    [heightTex, meta, viewshedSize],
  )
  useEffect(() => () => viewshed.dispose(), [viewshed])

  const shadow = useMemo(
    () => new Shadow(heightTex, meta, small ? 512 : 1024),
    [heightTex, meta, small],
  )
  useEffect(() => () => shadow.dispose(), [shadow])

  // Sun and exaggeration are the only inputs; both change rarely, so this runs
  // on demand and never in the render loop.
  const { gl } = useThree()
  useEffect(() => {
    shadow.compute(gl, sun, exaggeration)
  }, [shadow, gl, sun, exaggeration])

  return (
    <>
      <Framing
        meta={meta}
        field={field}
        seed={site.seed}
        observers={observers}
        exaggeration={exaggeration}
        controls={controls}
      />
      <Sky top={SKY_TOP} horizon={SKY_HORIZON} />
      <Terrain
        meta={meta}
        site={site}
        sun={sun}
        texture={heightTex}
        viewshedSize={viewshedSize}
        viewshed={viewshed}
        shadow={shadow}
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

/** Whichever elevation model is currently on screen, and which tier it is. */
type Tier = {
  siteId: string
  full: boolean
  texture: THREE.Texture
  field: Heightfield
  meta: ReliefMeta
}

export default function Scene({
  site,
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
  site: ReliefSite
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
  const [tier, setTier] = useState<Tier | null>(null)
  const [idle, setIdle] = useState(true)

  const meta = site.meta
  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * Load a site in two tiers.
   *
   * The full raster is up to 1.2 MB and costs a full CPU decode on top of the
   * download, which is a long blank second on a phone and a long blank second
   * every time the site changes. The 256² preview is the same elevation model at
   * a sixteenth the samples and a tenth the bytes, so terrain appears almost
   * immediately and the full raster replaces it in place.
   *
   * Keyed on site.id rather than a bare once-only guard: the old guard was there
   * to stop an unstable callback dependency from re-firing onReady and wiping
   * the user's observers, but as written it would also have refused to load any
   * second site at all.
   */
  const loadedFor = useRef<string | null>(null)
  const haveFull = useRef(false)
  useEffect(() => {
    if (loadedFor.current === site.id) return
    loadedFor.current = site.id
    haveFull.current = false
    let cancelled = false
    setTier(null)
    onProgress?.(0)

    const pmeta = previewMeta(meta)
    loadHeightmap(previewUrl(site.id), pmeta)
      .then(({ texture, field }) => {
        // Losing the race to the full raster is the normal outcome on a fast
        // connection. Dispose out here rather than inside a state updater —
        // side effects during the update phase are how the observer "+ Add"
        // button came to silently do nothing.
        if (cancelled || haveFull.current) return texture.dispose()
        setTier({ siteId: site.id, full: false, texture, field, meta: pmeta })
      })
      // The preview is an optimisation. Its failure must not take the page down
      // — the full raster is still coming, and onFail belongs to that one.
      .catch(() => {})

    loadHeightmap(heightmapUrl(site.id), meta, (loaded, total) => {
      if (!cancelled) onProgress?.(total ? loaded / total : 0)
    })
      .then(({ texture, field }) => {
        if (cancelled) return texture.dispose()
        haveFull.current = true
        setTier({ siteId: site.id, full: true, texture, field, meta })
        onReady?.(field)
      })
      .catch(() => !cancelled && onFail?.())

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id])

  // Retire the texture a tier leaves behind — on the preview→full swap, on a
  // change of site, and on unmount. Each holds a decoded 1024² RGBA upload.
  useEffect(() => {
    const t = tier
    return () => t?.texture.dispose()
  }, [tier])

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
      {/* Keyed by site: the travel budget is per opening frame, and without the
          key the second site onward would inherit a spent one. */}
      <Idle
        key={site.id}
        controls={controls}
        active={idle && !reduce && !!tier?.full}
        limit={framingDistance(meta, portrait) * IDLE_TRAVEL_FRAC}
      />
      {tier && (
        // Keyed by site so a switch tears the whole subtree down: render targets
        // disposed, and the once-only opening framing armed again for the new
        // terrain. Within a site the key holds steady, so the preview→full swap
        // reuses the mesh and the camera never moves.
        <Content
          key={tier.siteId}
          site={site}
          meta={tier.meta}
          heightTex={tier.texture}
          field={tier.field}
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
