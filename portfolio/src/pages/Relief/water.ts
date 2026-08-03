import type { Heightfield } from './heightfield'
import type { ReliefMeta } from './meta'
import { SKY_GLSL, DECODE_GLSL } from './glsl'

/**
 * Water — a flood surface at a chosen elevation.
 *
 * The same question the viewshed asks, turned ninety degrees: instead of "what
 * can be seen from here", "what is below this line". Inundation mapping is the
 * other half of the terrain-analysis pair, and the elevation model on the GPU
 * already holds everything it needs.
 *
 * ONE FLAT PLANE, not displaced geometry. The surface is a two-triangle quad at
 * the water's world height; every fragment reads the ground beneath it and
 * discards where the ground is higher. That single test produces the coastline
 * exactly — every bay, island and side canyon — with no mesh, no marching
 * squares and no contour extraction. It also stays correct at any camera angle,
 * which shading the terrain blue in place would not: water hugging the canyon
 * floor reads as wet rock, not as a lake, because real water is level and that
 * flatness is the entire visual cue.
 *
 * The water level NEVER reaches viewshed.ts. A bare-earth viewshed does not care
 * that a valley is flooded — a lake does not hide the ridge behind it, and the
 * sight line over water is the same sight line. smoke-relief asserts the
 * visibility statistics do not move when the water does, exactly as it does for
 * vertical exaggeration.
 */

export const WATER_VERT = /* glsl */ `
  varying vec2  vUv;
  varying vec3  vWorld;
  varying float vDepthCam;

  void main() {
    vUv = uv;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepthCam = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

export const WATER_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uHeight;
  uniform float uLevel;        // metres, true elevation — never exaggerated
  uniform vec3  uShallow;
  uniform vec3  uDeep;
  uniform vec3  uSun;          // raster-local: x east, y north, z up
  uniform float uHazeDensity;
  uniform float uEdgeFade;

  varying vec2  vUv;
  varying vec3  vWorld;
  varying float vDepthCam;

  ${SKY_GLSL}
  ${DECODE_GLSL}

  void main() {
    float ground = elevAt(uHeight, vUv);
    float depth = uLevel - ground;
    // The coastline, for free and exactly. Everything above the line is simply
    // not drawn, so the shore follows the terrain to the resolution of the DEM
    // rather than to the resolution of some extracted polygon.
    if (depth <= 0.0) discard;

    vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 120.0, depth));

    // Shallows. A brighter band in the first few metres is what makes a flooded
    // valley read as filling rather than as a blue mask laid over the terrain.
    col = mix(col, uShallow * 1.55, (1.0 - smoothstep(0.0, 7.0, depth)) * 0.7);

    vec3 V = normalize(cameraPosition - vWorld);
    vec3 sky = skyAtFragment();

    // Fresnel. At a grazing angle water is a mirror and at a steep one it is
    // dark and transparent; that single fact does more for believability than
    // any amount of colour tuning. The surface normal is world +Y, so V.y IS
    // the cosine of the view angle.
    float fresnel = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
    col = mix(col, sky * 1.3, fresnel * 0.72);

    // Sun glint off a level surface.
    vec3 sunW = normalize(toWorld(uSun));
    float spec = pow(max(dot(reflect(-sunW, vec3(0.0, 1.0, 0.0)), V), 0.0), 64.0);
    col += vec3(1.0, 0.93, 0.82) * spec * 0.45;

    // Recede exactly as the terrain does, or the far shore detaches from the
    // landscape it belongs to.
    float haze = 1.0 - exp(-vDepthCam * uHazeDensity);
    col = mix(col, sky, clamp(haze, 0.0, 0.92));

    // Shallow water is see-through; deep water is not. Same edge dissolve as
    // the terrain so the frame boundary stays a single soft edge.
    vec2 toEdge = min(vUv, 1.0 - vUv);
    float edge = min(toEdge.x, toEdge.y);
    float alpha = mix(0.55, 0.93, smoothstep(0.0, 28.0, depth)) * smoothstep(0.0, uEdgeFade, edge);

    gl_FragColor = vec4(linearToSRGB(col), alpha);
  }
`

export type FloodStats = {
  /** Water elevation, metres. */
  level: number
  /** Ground below the line, square kilometres. */
  floodedKm2: number
  /** Share of the frame, 0..1. */
  fraction: number
  /** Deepest point, metres. */
  maxDepthM: number
}

/**
 * Flooded area, straight off the CPU heightfield.
 *
 * A million comparisons, well under a millisecond, and exact for the raster —
 * no sampling and no GPU readback. Cell area comes from the per-axis ground
 * sample distance because they differ: a degree of longitude is about 19%
 * shorter than a degree of latitude at 36N, and treating the cells as square
 * would misreport every area by that much.
 */
export function floodStats(field: Heightfield, meta: ReliefMeta, level: number): FloodStats {
  const data = field.data
  let below = 0
  let deepest = 0
  for (let i = 0; i < data.length; i++) {
    const d = level - data[i]
    if (d > 0) {
      below++
      if (d > deepest) deepest = d
    }
  }
  const cellArea = meta.metersPerPixelX * meta.metersPerPixelY
  return {
    level,
    floodedKm2: (below * cellArea) / 1e6,
    fraction: below / data.length,
    maxDepthM: deepest,
  }
}

/**
 * Slider range for a site: from just under the lowest ground to three quarters
 * of the way up its relief. Filling the whole range is pointless — long before
 * the top there is nothing left but the highest ridge, and the interesting part
 * of every one of these sites is the bottom half.
 */
export function waterRange(meta: ReliefMeta) {
  const relief = meta.maxElev - meta.minElev
  return { min: meta.minElev - Math.max(relief * 0.002, 1), max: meta.minElev + relief * 0.75 }
}
