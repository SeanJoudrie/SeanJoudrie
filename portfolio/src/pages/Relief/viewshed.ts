import * as THREE from 'three'
import type { ReliefMeta } from './meta'

/**
 * Viewshed — GPU implementation of the reference-angle (R2) method.
 *
 * A cell is visible from the observer if the vertical angle to it exceeds the
 * maximum vertical angle of every cell on the line between them:
 *
 *     angle_i  = (elev_i - observerElev) / horizontalDistance_i
 *     visible  = angle_target > max(angle_0 .. angle_{target-1})
 *
 * Each fragment of the target marches back along its own ray to the observer,
 * so the whole viewshed is one full-screen pass rather than a sequential sweep.
 * It runs on demand — when the observer moves or its height changes — never
 * per frame.
 *
 * Two corrections that a toy version would skip, both of which matter at this
 * scale (the frame diagonal is ~63 km):
 *   - Earth curvature drops a distant target by d²/2R — over 45 km that is
 *     ~160 m, comparable to the relief itself.
 *   - Atmospheric refraction bends rays back down, recovering a fraction k of
 *     that drop. k = 0.13 is the standard survey value.
 */

const EARTH_R = 6371000.0

/** Compile-time loop bound; the actual count comes from uSteps. */
const MAX_STEPS = 384

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const VIEWSHED_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uHeight;
  uniform vec2  uObserver;    // uv
  uniform float uObsGround;   // ground elevation at the observer, m
  uniform float uObsHeight;   // observer height above ground, m
  uniform vec2  uExtentM;     // ground extent of the raster, m
  uniform float uMaxRadius;   // m
  uniform float uRefractK;    // 0.13, or 0 with the correction off
  uniform int   uSteps;

  varying vec2 vUv;

  // elev_m = (R*256 + G + B/256) - 32768   [scripts/bake-relief.mjs]
  float elevAt(vec2 uv) {
    vec3 c = texture2D(uHeight, uv).rgb;
    return (c.r * 255.0 * 256.0) + (c.g * 255.0) + (c.b * 255.0 / 256.0) - 32768.0;
  }

  /** Apparent elevation of a point d metres away, after curvature+refraction. */
  float apparent(float elev, float d) {
    return elev - (d * d) / (2.0 * ${EARTH_R.toFixed(1)}) * (1.0 - uRefractK);
  }

  void main() {
    vec2 dUv = vUv - uObserver;
    vec2 dM  = dUv * uExtentM;
    float dist = length(dM);

    // The observer's own cell is trivially visible; guard the divide too.
    if (dist < 1.0) { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); return; }
    if (dist > uMaxRadius) { gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); return; }

    float eye = uObsGround + uObsHeight;
    float maxAngle = -1e9;

    // March from the observer outward, stopping one step short of the target —
    // a cell must not occlude itself.
    for (int i = 1; i < ${MAX_STEPS}; i++) {
      if (i >= uSteps) break;
      float t = float(i) / float(uSteps);
      float d = dist * t;
      float e = apparent(elevAt(uObserver + dUv * t), d);
      maxAngle = max(maxAngle, (e - eye) / d);
    }

    float eT = apparent(elevAt(vUv), dist);
    float angT = (eT - eye) / dist;

    float vis = angT >= maxAngle ? 1.0 : 0.0;
    gl_FragColor = vec4(vis, dist / uMaxRadius, 0.0, 1.0);
  }
`

export type ViewshedParams = {
  /** Observer position in raster uv. */
  u: number
  v: number
  /** Ground elevation under the observer, metres. */
  ground: number
  /** Height above ground, metres. */
  height: number
  /** Maximum radius considered, metres. */
  radius: number
  /** Apply the atmospheric refraction correction. */
  refraction: boolean
}

export type ViewshedStats = {
  /** Visible ground area within the frame, km². */
  visibleKm2: number
  /** Visible share of the frame, 0..1. */
  visibleFraction: number
  /** Distance to the furthest visible cell, km. */
  furthestKm: number
}

export class Viewshed {
  /**
   * Two display targets, used ping-pong. The terrain material samples the
   * texture of whichever was written last, so writing into that same texture
   * would bind it for read and write in the same draw — a feedback loop, which
   * WebGL leaves undefined and which silently yields an empty target on some
   * drivers. Rendering into the *other* one and then swapping avoids it.
   */
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private front = 0
  private statsTarget: THREE.WebGLRenderTarget
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private material: THREE.ShaderMaterial
  private readback: Uint8Array
  private meta: ReliefMeta
  private steps: number

  constructor(
    heightTexture: THREE.Texture,
    meta: ReliefMeta,
    opts: { size: number; statsSize: number; steps: number },
  ) {
    this.meta = meta
    this.steps = Math.min(opts.steps, MAX_STEPS - 1)

    const targetOpts = {
      depthBuffer: false,
      stencilBuffer: false,
      // Linear filtering antialiases the visibility boundary when the terrain
      // samples it — the boundary is the product, so it must not stair-step.
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      generateMipmaps: false,
    } as const

    this.targets = [
      new THREE.WebGLRenderTarget(opts.size, opts.size, targetOpts),
      new THREE.WebGLRenderTarget(opts.size, opts.size, targetOpts),
    ]
    // A second, small pass purely for statistics. Reading back the display
    // target would stall on several MB per drag frame; 256² is ~256 KB.
    this.statsTarget = new THREE.WebGLRenderTarget(opts.statsSize, opts.statsSize, {
      ...targetOpts,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    })
    this.readback = new Uint8Array(opts.statsSize * opts.statsSize * 4)

    this.material = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: VIEWSHED_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uHeight: { value: heightTexture },
        uObserver: { value: new THREE.Vector2(0.5, 0.5) },
        uObsGround: { value: 0 },
        uObsHeight: { value: 2 },
        uExtentM: { value: new THREE.Vector2(meta.widthM, meta.heightM) },
        uMaxRadius: { value: Math.hypot(meta.widthM, meta.heightM) },
        uRefractK: { value: 0.13 },
        uSteps: { value: this.steps },
      },
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    quad.frustumCulled = false
    this.scene.add(quad)
  }

  /** The texture the terrain should currently sample. */
  get texture(): THREE.Texture {
    return this.targets[this.front].texture
  }

  /** Recompute the viewshed and return fresh statistics plus the new texture. */
  compute(
    renderer: THREE.WebGLRenderer,
    p: ViewshedParams,
  ): { stats: ViewshedStats; texture: THREE.Texture } {
    const u = this.material.uniforms
    ;(u.uObserver.value as THREE.Vector2).set(p.u, p.v)
    u.uObsGround.value = p.ground
    u.uObsHeight.value = p.height
    u.uMaxRadius.value = p.radius
    u.uRefractK.value = p.refraction ? 0.13 : 0
    u.uSteps.value = this.steps

    const prev = renderer.getRenderTarget()

    // Write into the back target — the front one may be bound for sampling.
    const back = 1 - this.front
    renderer.setRenderTarget(this.targets[back])
    renderer.render(this.scene, this.camera)
    this.front = back

    renderer.setRenderTarget(this.statsTarget)
    renderer.render(this.scene, this.camera)
    renderer.readRenderTargetPixels(
      this.statsTarget,
      0,
      0,
      this.statsTarget.width,
      this.statsTarget.height,
      this.readback,
    )

    renderer.setRenderTarget(prev)

    return { stats: this.reduce(p.radius), texture: this.texture }
  }

  /** Count visible cells and find the furthest, from the small readback. */
  private reduce(radius: number): ViewshedStats {
    const n = this.statsTarget.width * this.statsTarget.height
    let visible = 0
    let furthestNorm = 0
    for (let i = 0; i < n; i++) {
      const o = i * 4
      if (this.readback[o] > 127) {
        visible++
        const d = this.readback[o + 1]
        if (d > furthestNorm) furthestNorm = d
      }
    }
    const frameKm2 = (this.meta.widthM / 1000) * (this.meta.heightM / 1000)
    const fraction = visible / n
    return {
      visibleKm2: fraction * frameKm2,
      visibleFraction: fraction,
      // The distance channel is quantised to 8 bits over uMaxRadius.
      furthestKm: ((furthestNorm / 255) * radius) / 1000,
    }
  }

  dispose() {
    this.targets[0].dispose()
    this.targets[1].dispose()
    this.statsTarget.dispose()
    this.material.dispose()
  }
}
