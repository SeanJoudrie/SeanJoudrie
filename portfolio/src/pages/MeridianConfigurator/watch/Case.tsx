import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
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

      {/* Lugs — two pairs toward 12 (−Z) and 6 (+Z): flat blades that stay
          half-buried in the case flank, tips dipping toward the caseback
          the way a wrist pulls the strap. 20mm between inner faces = the
          strap width. */}
      {([-1, 1] as const).map((side) =>
        ([-1, 1] as const).map((lr) => (
          <RoundedBox
            key={`${side}${lr}`}
            args={[4.6 * MM, 3.4 * MM, 10 * MM]}
            radius={1.1 * MM}
            smoothness={4}
            position={[lr * 10.4 * MM, -1.2 * MM, side * 18.2 * MM]}
            rotation-x={side * 0.32}
          >
            <meshPhysicalMaterial color="#c9cdd3" metalness={1} roughness={0.36} clearcoat={0.3} clearcoatRoughness={0.4} />
          </RoundedBox>
        )),
      )}

      {/* Crown at 3 o'clock — stem buried into the case wall, knurled body
          (texture later), cap lip. */}
      <group position={[21.6 * MM, 0, 0]} rotation-z={-Math.PI / 2}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.6 * MM, 1.6 * MM, 4.5 * MM, 32]} />
          <meshPhysicalMaterial color="#c9cdd3" metalness={1} roughness={0.36} />
        </mesh>
        <mesh position={[0, 3 * MM, 0]}>
          <cylinderGeometry args={[3.7 * MM, 3.5 * MM, 3.4 * MM, 48]} />
          <meshPhysicalMaterial color="#c9cdd3" metalness={1} roughness={0.3} clearcoat={0.4} clearcoatRoughness={0.35} />
        </mesh>
        <mesh position={[0, 4.9 * MM, 0]}>
          <cylinderGeometry args={[3.9 * MM, 3.7 * MM, 0.9 * MM, 48]} />
          <meshPhysicalMaterial color="#c9cdd3" metalness={1} roughness={0.28} clearcoat={0.5} clearcoatRoughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

/** Bezel silhouette in mm — sits on the case's bezel seat, domes gently
    toward the crystal opening. Its own lathe so the config system can give
    it an independent material (polished / brushed / ceramic). */
const BEZEL_MM: [number, number][] = [
  [17.9, 4.1], // tucks INTO the case top bevel — no daylight at the seam
  [19.7, 4.9],
  [20.0, 5.9], // outer wall
  [19.3, 6.9],
  [17.6, 7.5], // dome crest
  [15.6, 7.7],
  [14.6, 7.6], // crystal opening rim
  [14.3, 6.4], // inner wall down toward the dial
]

export function Bezel() {
  const geometry = useMemo(() => {
    const g = new LatheGeometry(
      BEZEL_MM.map(([r, z]) => new Vector2(r * MM, z * MM)),
      160,
    )
    g.computeTangents()
    return g
  }, [])
  return (
    <mesh geometry={geometry}>
      {/* Default: polished steel — near-mirror, the jewelry note against
          the brushed case. */}
      <meshPhysicalMaterial color="#d4d8dd" metalness={1} roughness={0.12} clearcoat={0.6} clearcoatRoughness={0.2} />
    </mesh>
  )
}
