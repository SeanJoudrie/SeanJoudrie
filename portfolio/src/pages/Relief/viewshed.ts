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
  uniform vec2  uObs[4];      // observer positions, uv
  uniform float uObsGround[4];// ground elevation under each, m
  uniform int   uCount;       // observers in use, 1..4
  uniform float uObsHeight;   // shared height above ground, m
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
    int seen = 0;
    // Distance to the NEAREST observer that can see this cell. For one
    // observer this is just its distance; for several it is what "how far out
    // does coverage reach" actually means.
    float nearest = 1.0;

    for (int o = 0; o < 4; o++) {
      if (o >= uCount) break;

      vec2 dUv = vUv - uObs[o];
      float dist = length(dUv * uExtentM);
      if (dist > uMaxRadius) continue;
      if (dist < 1.0) { seen++; nearest = 0.0; continue; }

      float eye = uObsGround[o] + uObsHeight;
      float maxAngle = -1e9;

      // March outward, stopping one step short of the target — a cell must not
      // occlude itself.
      for (int i = 1; i < ${MAX_STEPS}; i++) {
        if (i >= uSteps) break;
        float t = float(i) / float(uSteps);
        float d = dist * t;
        maxAngle = max(maxAngle, (apparent(elevAt(uObs[o] + dUv * t), d) - eye) / d);
      }

      if ((apparent(elevAt(vUv), dist) - eye) / dist >= maxAngle) {
        seen++;
        nearest = min(nearest, dist / uMaxRadius);
      }
    }

    // R carries the share of observers that can see this cell, so the terrain
    // shades by coverage depth for free and reduces to plain visible/hidden
    // when there is only one.
    gl_FragColor = vec4(float(seen) / float(uCount), nearest, float(seen) / 4.0, 1.0);
  }
`

export type ViewshedObserver = {
  /** Position in raster uv. */
  u: number
  v: number
  /** Ground elevation beneath, metres. */
  ground: number
}

export const MAX_OBSERVERS = 4

export type ViewshedParams = {
  /** One to MAX_OBSERVERS observers. Extras are ignored. */
  observers: ViewshedObserver[]
  /** Shared height above ground, metres. */
  height: number
  /** Maximum radius considered, metres. */
  radius: number
  /** Apply the atmospheric refraction correction. */
  refraction: boolean
}

export type ViewshedStats = {
  /** Ground seen by at least one observer, km². */
  visibleKm2: number
  /** Share of the frame seen by at least one observer, 0..1. */
  visibleFraction: number
  /** Share seen by every observer, 0..1. Equals visibleFraction when there
   *  is only one, so callers can show it only when it says something new. */
  overlapFraction: number
  /** Furthest any covered cell sits from its nearest seeing observer, km. */
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
        uObs: { value: Array.from({ length: MAX_OBSERVERS }, () => new THREE.Vector2(0.5, 0.5)) },
        uObsGround: { value: new Array(MAX_OBSERVERS).fill(0) },
        uCount: { value: 1 },
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
    const obs = p.observers.slice(0, MAX_OBSERVERS)
    const positions = u.uObs.value as THREE.Vector2[]
    const grounds = u.uObsGround.value as number[]
    obs.forEach((o, i) => {
      positions[i].set(o.u, o.v)
      grounds[i] = o.ground
    })
    u.uCount.value = Math.max(obs.length, 1)
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

  /**
   * Reduce the small readback. R holds seen/count, so any non-zero value means
   * at least one observer sees the cell and a saturated value means all of them
   * do. The threshold sits at 4/255 rather than 0 to stay clear of the linear
   * filter's edge blending.
   */
  private reduce(radius: number): ViewshedStats {
    const n = this.statsTarget.width * this.statsTarget.height
    let covered = 0
    let overlap = 0
    let furthestNorm = 0
    for (let i = 0; i < n; i++) {
      const o = i * 4
      const cov = this.readback[o]
      if (cov > 4) {
        covered++
        if (cov > 250) overlap++
        const d = this.readback[o + 1]
        if (d > furthestNorm) furthestNorm = d
      }
    }
    const frameKm2 = (this.meta.widthM / 1000) * (this.meta.heightM / 1000)
    const fraction = covered / n
    return {
      visibleKm2: fraction * frameKm2,
      visibleFraction: fraction,
      overlapFraction: overlap / n,
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
