import { useMemo } from 'react'
import * as THREE from 'three'
import { BODY_OUTLINE } from './bodyOutline'

/**
 * A Stratocaster, modelled from scratch — no downloaded mesh. The body and
 * headstock are extruded 2D outlines; everything else is primitives. Built in
 * a face-up local frame: the guitar lies in the X-Y plane (neck up +Y, body
 * down), its face toward +Z. The caller tilts/positions the whole group.
 *
 * Units: roughly 1 = 1 cm-ish; the whole instrument is ~100 tall.
 */

// ---- geometry constants (local frame) --------------------------------------
const SCALE = 0.03 // final group scale so the guitar reads ~3 units tall
export const NECK_JOIN_Y = 20 // body/neck seam
export const NUT_Y = 63 // top of fretboard
export const BRIDGE_Y = -14 // where strings anchor on the body
const STRING_HALF = 3.4 // half the string spread at the bridge
const NUT_HALF = 2.4 // half the spread at the nut (narrower)
const FACE_Z = 3 // front face of the body
const N_STRINGS = 6

// The body outline is traced from the reference Stratocaster photo (see
// bodyOutline.ts / trace_guitar.py), then Chaikin-smoothed — a real guitar's
// silhouette, not hand-guessed curves.
function bodyShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(BODY_OUTLINE[0][0], BODY_OUTLINE[0][1])
  for (let i = 1; i < BODY_OUTLINE.length; i++) s.lineTo(BODY_OUTLINE[i][0], BODY_OUTLINE[i][1])
  s.closePath()
  return s
}

// The pickguard — the classic Strat shape, hugging the upper/treble body and
// tapering to the lower control area, covering all three pickups.
function pickguardShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(3.4, 16.6)
  s.bezierCurveTo(1, 15.6, -2, 15.6, -3.6, 16) // top edge under the neck
  s.bezierCurveTo(-5, 12, -7.6, 9, -7.8, 4) // down the bass side
  s.bezierCurveTo(-8, -1, -5.4, -4.5, -5.8, -8.5) // waist to lower
  s.bezierCurveTo(-6, -12.5, -2.8, -14, 1.5, -13.8) // lower control bump
  s.bezierCurveTo(5.4, -13.6, 7.2, -9.5, 7, -5) // lower treble
  s.bezierCurveTo(6.8, -1, 5, 2.5, 5.4, 7.5) // up the treble edge
  s.bezierCurveTo(5.6, 11.5, 4.6, 14.8, 3.4, 16.6)
  s.closePath()
  return s
}

// Headstock outline (the classic Strat "6-in-line" droop), local to the nut.
const HEAD_PTS: [number, number][] = [
  [-2.2, 0], [-2.4, 6], [-1.8, 12], [0.2, 15.5], [2.6, 15],
  [3.4, 12], [2.2, 9], [2.4, 4], [2.2, 0],
]
function headShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(HEAD_PTS[0][0], HEAD_PTS[0][1])
  s.splineThru(HEAD_PTS.slice(1).map(([x, y]) => new THREE.Vector2(x, y)))
  s.closePath()
  return s
}

export function stringX(i: number, atNut: boolean): number {
  const half = atNut ? NUT_HALF : STRING_HALF
  return half * (i / (N_STRINGS - 1) - 0.5) * 2
}

export function StratGuitar({
  bodyColor,
  onPluck,
  onStrum,
}: {
  bodyColor: string
  onPluck: (i: number) => void
  onStrum: () => void
}) {
  const geom = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(bodyShape(), {
      depth: FACE_Z * 2,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.6,
      bevelSegments: 4,
      curveSegments: 24,
    })
    // Extrude runs z=0..depth; re-center in z ONLY (not x/y — the neck & bridge
    // are placed in this same raw x/y frame) so the front face sits at FACE_Z.
    body.translate(0, 0, -FACE_Z)
    const pg = new THREE.ExtrudeGeometry(pickguardShape(), {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 1,
      curveSegments: 20,
    })
    const head = new THREE.ExtrudeGeometry(headShape(), {
      depth: 1.4,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 1,
      curveSegments: 16,
    })
    return { body, pg, head }
  }, [])

  const mat = useMemo(() => {
    const m = {
      body: new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.15, roughness: 0.22 }),
      guard: new THREE.MeshStandardMaterial({ color: '#f3f0e8', metalness: 0.1, roughness: 0.35 }),
      neck: new THREE.MeshStandardMaterial({ color: '#d8b184', metalness: 0.05, roughness: 0.55 }),
      board: new THREE.MeshStandardMaterial({ color: '#3a2015', metalness: 0.1, roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 0.95, roughness: 0.25 }),
      dark: new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.3, roughness: 0.5 }),
      string: new THREE.MeshStandardMaterial({ color: '#d7dae0', metalness: 1, roughness: 0.3 }),
      dot: new THREE.MeshStandardMaterial({ color: '#efe7d2', metalness: 0.1, roughness: 0.5 }),
    }
    return m
  }, [bodyColor])

  // fret + inlay positions along the neck (Y), roughly to scale.
  const fretYs = useMemo(() => {
    const scaleLen = NUT_Y - BRIDGE_Y
    const ys: number[] = []
    for (let n = 1; n <= 21; n++) {
      const d = 1 - 1 / Math.pow(2, n / 12) // distance from nut as fraction of scale
      ys.push(NUT_Y - d * scaleLen)
    }
    return ys
  }, [])
  const inlayFrets = [3, 5, 7, 9, 15, 17, 19]

  const bevelZ = FACE_Z + 0.8 // actual front face after the z re-center

  return (
    <group scale={SCALE}>
      {/* ---- body ---- */}
      <mesh geometry={geom.body} material={mat.body} castShadow onPointerDown={(e) => { e.stopPropagation(); onStrum() }} />

      {/* ---- pickguard (just proud of the face) ---- */}
      <mesh geometry={geom.pg} material={mat.guard} position={[0, 0, bevelZ + 0.05]} />

      {/* ---- pickups: three single-coils, bridge one slanted ---- */}
      {[
        { y: -6, rot: 0.28 },
        { y: 1.5, rot: 0 },
        { y: 8.5, rot: 0 },
      ].map((p, i) => (
        <group key={i} position={[-0.3, p.y, bevelZ + 0.8]} rotation={[0, 0, p.rot]}>
          <mesh material={mat.dark}>
            <boxGeometry args={[6.4, 1.8, 0.7]} />
          </mesh>
          {[...Array(6)].map((_, j) => (
            <mesh key={j} material={mat.metal} position={[(j - 2.5) * 1.0, 0, 0.35]}>
              <cylinderGeometry args={[0.18, 0.18, 0.4, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---- bridge + saddles + trem ---- */}
      <group position={[-0.3, BRIDGE_Y + 3, bevelZ + 0.5]}>
        <mesh material={mat.metal}>
          <boxGeometry args={[7, 3, 0.8]} />
        </mesh>
        {[...Array(6)].map((_, j) => (
          <mesh key={j} material={mat.metal} position={[stringX(j, false), 0.2, 0.5]}>
            <boxGeometry args={[0.7, 1.6, 0.6]} />
          </mesh>
        ))}
      </group>

      {/* ---- control knobs + jack ---- */}
      {[[-5, -2], [-4.2, -5.5], [-2.6, -7.5]].map(([x, y], i) => (
        <mesh key={i} material={mat.guard} position={[x - 0.3, y, bevelZ + 0.85]}>
          <cylinderGeometry args={[0.8, 0.8, 0.9, 16]} />
        </mesh>
      ))}

      {/* ---- neck ---- */}
      <mesh material={mat.neck} position={[0, (NECK_JOIN_Y + NUT_Y) / 2, FACE_Z - 0.5]}>
        <boxGeometry args={[6.2, NUT_Y - NECK_JOIN_Y + 2, 3]} />
      </mesh>
      {/* fretboard on the face of the neck */}
      <mesh material={mat.board} position={[0, (NECK_JOIN_Y + NUT_Y) / 2, FACE_Z + 1.0]}>
        <boxGeometry args={[6.0, NUT_Y - NECK_JOIN_Y + 2, 0.7]} />
      </mesh>
      {/* frets */}
      {fretYs.map((y, i) => (
        <mesh key={i} material={mat.metal} position={[0, y, FACE_Z + 1.4]}>
          <boxGeometry args={[6.0, 0.25, 0.2]} />
        </mesh>
      ))}
      {/* inlays */}
      {inlayFrets.map((n) => {
        const y = (fretYs[n - 1] + fretYs[n - 2]) / 2
        return (
          <mesh key={n} material={mat.dot} position={[0, y, FACE_Z + 1.45]}>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 12]} />
          </mesh>
        )
      })}
      {/* twin dots at the 12th */}
      {[-1.3, 1.3].map((x, i) => {
        const y = (fretYs[11] + fretYs[10]) / 2
        return (
          <mesh key={i} material={mat.dot} position={[x, y, FACE_Z + 1.45]}>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 12]} />
          </mesh>
        )
      })}
      {/* nut */}
      <mesh material={mat.dot} position={[0, NUT_Y + 0.6, FACE_Z + 1.1]}>
        <boxGeometry args={[6.0, 0.8, 1]} />
      </mesh>

      {/* ---- headstock ---- */}
      <group position={[0, NUT_Y + 1, FACE_Z - 0.5]} rotation={[-0.12, 0, 0]}>
        <mesh geometry={geom.head} material={mat.neck} />
        {/* six tuners along the top edge */}
        {[...Array(6)].map((_, i) => (
          <group key={i} position={[-1.6 + (i % 2) * 0.2, 3 + i * 1.9, 1.2]}>
            <mesh material={mat.metal} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.6, 12]} />
            </mesh>
            <mesh material={mat.metal} position={[-1.4, 0, 0]}>
              <boxGeometry args={[1.4, 0.7, 0.4]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- strings (clickable) ---- */}
      {[...Array(N_STRINGS)].map((_, i) => {
        const xNut = stringX(i, true)
        const xBridge = stringX(i, false)
        const y0 = BRIDGE_Y + 3
        const y1 = NUT_Y + 2
        const mid = new THREE.Vector3((xNut + xBridge) / 2, (y0 + y1) / 2, FACE_Z + 1.8)
        const len = y1 - y0
        const angle = Math.atan2(xNut - xBridge, y1 - y0)
        const r = 0.09 + i * 0.02
        return (
          <mesh
            key={i}
            position={mid}
            rotation={[0, 0, -angle]}
            onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}
          >
            <cylinderGeometry args={[r, r, len, 6]} />
            <primitive object={mat.string} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
