import { useMemo } from 'react'
import { LatheGeometry, Vector2 } from 'three'

/**
 * The case body — a lathed silhouette authored in real millimeters
 * (Meridian One: 40mm across, 11.6mm thick) and scaled 40mm → 1 scene unit.
 * 128 radial segments keep the silhouette smooth at 2× zoom (the Phase-1
 * faceting bar). The lathe axis is +Y: the dial faces +Y until the parent
 * group orients the watch.
 */
export const MM = 1 / 40

/** Case silhouette: (radius, axial) pairs in mm, caseback rim → dial
    opening. The lathe deliberately STOPS at the caseback opening instead of
    running to r=0 — at the pole the UV fan degenerates and anisotropy bands
    into wedges; a separate flat disc with planar UVs caps it cleanly. */
const PROFILE_MM: [number, number][] = [
  [13.5, -5.55], // caseback opening
  [16.8, -5.2],
  [18.6, -4.35], // caseback bevel
  [19.6, -2.9],
  [20, -0.6], // side wall — flatter than a bangle, it's a tool watch
  [20, 2.0],
  [19.5, 3.4], // top bevel begins
  [18.4, 4.5],
  [16.9, 5.35], // bezel seat
  [16.2, 5.8], // top rim
  [14.8, 5.8], // rim lip
  [14.4, 4.6], // down into the dial opening
]

export function CaseBody() {
  const geometry = useMemo(() => {
    const points = PROFILE_MM.map(([r, z]) => new Vector2(r * MM, z * MM))
    const g = new LatheGeometry(points, 160)
    // Without a tangent attribute the anisotropy shader falls back to
    // screen-space derivatives — constant per triangle, i.e. visible wedge
    // banding. Real vertex tangents interpolate smoothly.
    g.computeTangents()
    return g
  }, [])
  return (
    <group>
      <mesh geometry={geometry}>
        {/* Brushed steel: anisotropy stretches the highlight the way a real
            radial brush does — the strongest "reads as metal" lever we have. */}
        <meshPhysicalMaterial
          color="#c9cdd3"
          metalness={1}
          roughness={0.34}
          anisotropy={0.55}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
        />
      </mesh>
      {/* Caseback cap — planar UVs → linear brush, no pole singularity. */}
      <mesh position={[0, -5.45 * MM, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[13.9 * MM, 96]} />
        <meshPhysicalMaterial color="#c2c6cc" metalness={1} roughness={0.4} anisotropy={0.3} />
      </mesh>
    </group>
  )
}
