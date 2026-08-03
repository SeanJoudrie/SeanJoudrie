import * as THREE from 'three'
import type { ReliefMeta } from './meta'

/**
 * Cast shadows — a visibility test from a light at infinity.
 *
 * Structurally the same idea as the viewshed, and cheaper: the rays are
 * parallel, so there is one direction for the whole scene, no per-cell observer
 * and no curvature term. Each texel marches toward the sun and asks whether any
 * terrain rises above the ray.
 *
 * This is the depth cue hillshade cannot provide. Hillshade says which way a
 * facet points; it says nothing about what stands in front of what, so a slope
 * in shade looks identical whether or not a ridge is towering over it.
 *
 * Two details that decide whether this looks right or broken:
 *
 *   - The march uses EXAGGERATED elevations. This is the one place vertical
 *     exaggeration is supposed to propagate — shadows computed on true geometry
 *     would not line up with the terrain the viewer is actually looking at.
 *     (It still never reaches viewshed.ts, where it would corrupt the numbers.)
 *
 *   - Shadows get long fast. At 20° a 6.5 km exaggerated relief throws a shadow
 *     nearly 18 km — around 40% of this frame. Size the ray to the relief and
 *     the sun angle or shadows truncate in mid-air and read as clipping.
 */

const MAX_STEPS = 256

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const SHADOW_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uHeight;
  uniform vec3  uSun;        // normalised, local space: x east, y north, z up
  uniform vec2  uExtentM;    // ground extent of the raster, metres
  uniform float uExag;
  uniform float uMaxLen;     // longest shadow worth chasing, metres
  uniform float uBias;       // metres, lifts the ray off its own surface
  uniform int   uSteps;

  varying vec2 vUv;

  // elev_m = (R*256 + G + B/256) - 32768   [scripts/bake-relief.mjs]
  float elevAt(vec2 uv) {
    vec3 c = texture2D(uHeight, uv).rgb;
    return ((c.r * 255.0 * 256.0) + (c.g * 255.0) + (c.b * 255.0 / 256.0) - 32768.0) * uExag;
  }

  void main() {
    vec2 horiz = uSun.xy;
    float hlen = length(horiz);

    // Sun directly overhead: nothing can shadow anything.
    if (hlen < 1e-4) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); return; }

    // Metres of climb per metre travelled horizontally toward the sun.
    float slope = uSun.z / hlen;
    vec2 dir = horiz / hlen;

    float e0 = elevAt(vUv);
    float shadow = 1.0;

    for (int i = 1; i < ${MAX_STEPS}; i++) {
      if (i >= uSteps) break;
      float d = uMaxLen * (float(i) / float(uSteps));
      // Step in uv along the sun's horizontal bearing.
      vec2 uv = vUv + dir * (d / uExtentM);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;

      float ray = e0 + d * slope + uBias;
      float h = elevAt(uv);
      if (h > ray) {
        // Soften with the height of the blocker above the ray: a ridge that
        // barely clips the ray gives a soft edge, a wall gives a hard one.
        shadow = min(shadow, 1.0 - smoothstep(0.0, 40.0, h - ray));
        if (shadow <= 0.02) break;
      }
    }

    gl_FragColor = vec4(shadow, 0.0, 0.0, 1.0);
  }
`

/** Direction toward the sun, from compass azimuth and elevation in degrees. */
export function sunVector(azimuthDeg: number, elevationDeg: number): THREE.Vector3 {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  const h = Math.cos(el)
  // Azimuth is clockwise from north; local +y is north, +x is east.
  return new THREE.Vector3(Math.sin(az) * h, Math.cos(az) * h, Math.sin(el)).normalize()
}

export class Shadow {
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private front = 0
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private meta: ReliefMeta

  constructor(heightTexture: THREE.Texture, meta: ReliefMeta, size: number) {
    this.meta = meta
    const opts = {
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      generateMipmaps: false,
    } as const
    // Ping-pong for the same reason the viewshed does: the terrain samples the
    // front texture, and writing into a texture that is bound for reading is a
    // feedback loop WebGL leaves undefined.
    this.targets = [
      new THREE.WebGLRenderTarget(size, size, opts),
      new THREE.WebGLRenderTarget(size, size, opts),
    ]

    this.material = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: SHADOW_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uHeight: { value: heightTexture },
        uSun: { value: new THREE.Vector3(0, 1, 0.4).normalize() },
        uExtentM: { value: new THREE.Vector2(meta.widthM, meta.heightM) },
        uExag: { value: 1 },
        uMaxLen: { value: 10000 },
        uBias: { value: 12 },
        uSteps: { value: MAX_STEPS - 1 },
      },
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    quad.frustumCulled = false
    this.scene.add(quad)
  }

  get texture(): THREE.Texture {
    return this.targets[this.front].texture
  }

  compute(renderer: THREE.WebGLRenderer, sun: THREE.Vector3, exaggeration: number): THREE.Texture {
    const u = this.material.uniforms
    ;(u.uSun.value as THREE.Vector3).copy(sun)
    u.uExag.value = exaggeration

    // Longest shadow the terrain can actually throw: full exaggerated relief
    // divided by the tangent of the sun's elevation. Clamped so a very low sun
    // does not ask for a march across several frame widths.
    const relief = (this.meta.maxElev - this.meta.minElev) * exaggeration
    const tan = Math.max(sun.z / Math.max(Math.hypot(sun.x, sun.y), 1e-4), 0.02)
    u.uMaxLen.value = Math.min(relief / tan, this.meta.widthM * 1.2)

    const prev = renderer.getRenderTarget()
    const back = 1 - this.front
    renderer.setRenderTarget(this.targets[back])
    renderer.render(this.scene, this.camera)
    this.front = back
    renderer.setRenderTarget(prev)
    return this.texture
  }

  dispose() {
    this.targets[0].dispose()
    this.targets[1].dispose()
    this.material.dispose()
  }
}
