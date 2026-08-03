/**
 * GLSL shared between every pass that draws into the scene.
 *
 * Extracted so the terrain, the sky backdrop and the water surface evaluate
 * literally the same functions rather than three copies that drift. The sky is
 * the one that matters most: terrain and water both dissolve into it at the
 * frame edge and haze toward it with distance, and fading toward anything other
 * than exactly what the backdrop is drawing at that pixel leaves a seam.
 *
 * World-space note for anything that needs a direction: the terrain plane is
 * rotated -90 degrees about X, so raster-local (x east, y north, z up) maps to
 * world (x, z, -y). See toWorld below.
 */

/** Sky gradient, plus the colour-space conversion every pass needs. */
export const SKY_GLSL = /* glsl */ `
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

  /** Raster-local (x east, y north, z up) -> world, for the plane's rotation. */
  vec3 toWorld(vec3 local) {
    return vec3(local.x, local.z, -local.y);
  }
`

/** Terrarium decode, matching scripts/bake-relief.mjs byte for byte. */
export const DECODE_GLSL = /* glsl */ `
  // elev_m = (R*256 + G + B/256) - 32768   [scripts/bake-relief.mjs]
  float decodeElev(vec3 c) {
    return (c.r * 255.0 * 256.0) + (c.g * 255.0) + (c.b * 255.0 / 256.0) - 32768.0;
  }
  float elevAt(sampler2D tex, vec2 uv) {
    return decodeElev(texture2D(tex, uv).rgb);
  }
`
