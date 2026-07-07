import { useMemo } from 'react'
import * as THREE from 'three'
import { BODY_OUTLINE } from './bodyOutline'
import { PICKGUARD_OUTLINE } from './pickguardOutline'
import { HEADSTOCK_OUTLINE } from './headstockOutline'

/**
 * A Stratocaster, modelled from scratch — no downloaded mesh. The body,
 * pickguard and headstock OUTLINES are all traced from one reference photo
 * (trace_guitar.py) in a single shared coordinate frame, so their sizes and
 * positions relative to each other are a real guitar's, not guesses. The rest
 * (neck, frets, tuners, pickups, knobs, bridge, jack, strings) is primitives.
 *
 * Frame: the guitar lies in X-Y (neck up +Y, body down), face toward +Z.
 */

const SCALE = 0.03
export const NECK_JOIN_Y = 16 // neck heel sinks into the body here
export const NUT_Y = 52.5 // top of fretboard / base of headstock (from the trace)
export const BRIDGE_Y = -12
const STRING_HALF = 3.2 // half string spread at the bridge
const NUT_HALF = 2.2 // half spread at the nut
const FACE_Z = 3
const N_STRINGS = 6

function shapeFrom(pts: readonly [number, number][]): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1])
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
    const body = new THREE.ExtrudeGeometry(shapeFrom(BODY_OUTLINE), {
      depth: FACE_Z * 2, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.6, bevelSegments: 4, curveSegments: 6,
    })
    body.translate(0, 0, -FACE_Z)
    const pg = new THREE.ExtrudeGeometry(shapeFrom(PICKGUARD_OUTLINE), {
      depth: 0.6, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 1, curveSegments: 4,
    })
    const head = new THREE.ExtrudeGeometry(shapeFrom(HEADSTOCK_OUTLINE), {
      depth: 1.6, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 1, curveSegments: 4,
    })
    return { body, pg, head }
  }, [])

  const mat = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.2, roughness: 0.18 }),
    guard: new THREE.MeshStandardMaterial({ color: '#eeeae0', metalness: 0.1, roughness: 0.35 }),
    neck: new THREE.MeshStandardMaterial({ color: '#d7b184', metalness: 0.05, roughness: 0.5 }),
    board: new THREE.MeshStandardMaterial({ color: '#40251a', metalness: 0.1, roughness: 0.55 }),
    metal: new THREE.MeshStandardMaterial({ color: '#cbced4', metalness: 0.95, roughness: 0.22 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.3, roughness: 0.5 }),
    pickup: new THREE.MeshStandardMaterial({ color: '#eae3d2', metalness: 0.1, roughness: 0.4 }),
    knob: new THREE.MeshStandardMaterial({ color: '#e9e2d0', metalness: 0.15, roughness: 0.3 }),
    string: new THREE.MeshStandardMaterial({ color: '#d7dae0', metalness: 1, roughness: 0.3 }),
    dot: new THREE.MeshStandardMaterial({ color: '#efe7d2', metalness: 0.1, roughness: 0.5 }),
  }), [bodyColor])

  const fretYs = useMemo(() => {
    const scaleLen = NUT_Y - BRIDGE_Y
    const ys: number[] = []
    for (let n = 1; n <= 21; n++) ys.push(NUT_Y - (1 - 1 / Math.pow(2, n / 12)) * scaleLen)
    return ys
  }, [])
  const inlayFrets = [3, 5, 7, 9, 15, 17, 19]

  const bevelZ = FACE_Z + 0.8 // front face of the body after z re-center
  const pgZ = bevelZ + 0.05 // pickguard sits on the body
  const pgFace = pgZ + 0.85 // its front, where hardware mounts

  // headstock geometry bounds (traced frame) for placing tuners
  const hx = HEADSTOCK_OUTLINE.map((p) => p[0])
  const headMinX = Math.min(...hx)

  return (
    <group scale={SCALE}>
      {/* ---- body ---- */}
      <mesh geometry={geom.body} material={mat.body} castShadow onPointerDown={(e) => { e.stopPropagation(); onStrum() }} />

      {/* ---- pickguard (traced) ---- */}
      <mesh geometry={geom.pg} material={mat.guard} position={[0, 0, pgZ]} />

      {/* ---- three single-coil pickups (cream), bridge one slanted ---- */}
      {[
        { y: 6, rot: 0 },
        { y: -1, rot: 0 },
        { y: -8, rot: 0.32 },
      ].map((p, i) => (
        <group key={i} position={[0.4, p.y, pgFace]} rotation={[0, 0, p.rot]}>
          <mesh material={mat.pickup}><boxGeometry args={[7.2, 2, 0.8]} /></mesh>
          {[...Array(6)].map((_, j) => (
            <mesh key={j} material={mat.metal} position={[(j - 2.5) * 1.1, 0, 0.45]}>
              <cylinderGeometry args={[0.2, 0.2, 0.5, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---- three control knobs (treble side), clearly proud ---- */}
      {[[8.5, -3], [10, -6], [8.8, -9.5]].map(([x, y], i) => (
        <group key={i} position={[x, y, pgFace]}>
          <mesh material={mat.knob}><cylinderGeometry args={[1, 1.05, 1.5, 20]} /></mesh>
          <mesh material={mat.dark} position={[0, 0.35, 0.78]}><boxGeometry args={[0.2, 1.2, 0.1]} /></mesh>
        </group>
      ))}
      {/* pickup selector switch */}
      <mesh material={mat.metal} position={[6, -6.5, pgFace + 0.3]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.18, 0.18, 2, 8]} />
      </mesh>

      {/* ---- output jack plate on the lower bout ---- */}
      <group position={[11, -16, bevelZ + 0.2]}>
        <mesh material={mat.metal} rotation={[Math.PI / 2, 0, 0.5]}><cylinderGeometry args={[1.7, 1.7, 0.4, 6]} /></mesh>
        <mesh material={mat.dark} position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.6, 12]} /></mesh>
      </group>

      {/* ---- bridge + saddles + tremolo arm ---- */}
      <group position={[0.2, BRIDGE_Y + 3, bevelZ + 0.5]}>
        <mesh material={mat.metal}><boxGeometry args={[7.4, 3, 0.9]} /></mesh>
        {[...Array(6)].map((_, j) => (
          <mesh key={j} material={mat.metal} position={[stringX(j, false), 0.4, 0.5]}>
            <boxGeometry args={[0.75, 1.7, 0.6]} />
          </mesh>
        ))}
        {/* whammy bar */}
        <mesh material={mat.metal} position={[-4, -1.5, 0.6]} rotation={[0, 0, 0.7]}>
          <cylinderGeometry args={[0.22, 0.22, 6, 10]} />
        </mesh>
      </group>

      {/* ---- neck ---- */}
      <mesh material={mat.neck} position={[0, (NECK_JOIN_Y + NUT_Y) / 2, FACE_Z - 0.6]}>
        <boxGeometry args={[7.4, NUT_Y - NECK_JOIN_Y + 2, 3]} />
      </mesh>
      <mesh material={mat.board} position={[0, (NECK_JOIN_Y + NUT_Y) / 2, FACE_Z + 1.0]}>
        <boxGeometry args={[7.2, NUT_Y - NECK_JOIN_Y + 2, 0.8]} />
      </mesh>
      {fretYs.map((y, i) => (
        <mesh key={i} material={mat.metal} position={[0, y, FACE_Z + 1.45]}><boxGeometry args={[7.2, 0.28, 0.22]} /></mesh>
      ))}
      {inlayFrets.map((n) => {
        const y = (fretYs[n - 1] + fretYs[n - 2]) / 2
        return <mesh key={n} material={mat.dot} position={[0, y, FACE_Z + 1.5]}><cylinderGeometry args={[0.55, 0.55, 0.1, 12]} /></mesh>
      })}
      {[-1.5, 1.5].map((x, i) => {
        const y = (fretYs[11] + fretYs[10]) / 2
        return <mesh key={i} material={mat.dot} position={[x, y, FACE_Z + 1.5]}><cylinderGeometry args={[0.55, 0.55, 0.1, 12]} /></mesh>
      })}
      {/* nut */}
      <mesh material={mat.dot} position={[0, NUT_Y + 0.4, FACE_Z + 1.1]}><boxGeometry args={[7.2, 0.8, 1]} /></mesh>

      {/* ---- headstock (traced) with 6-in-line tuners ---- */}
      <mesh geometry={geom.head} material={mat.neck} position={[0, 0, FACE_Z - 1.0]} />
      {[...Array(6)].map((_, i) => {
        const y = 55 + i * 2.0
        return (
          <group key={i} position={[headMinX + 1.4, y, FACE_Z + 0.2]}>
            <mesh material={mat.metal} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 1.4, 12]} /></mesh>
            <mesh material={mat.metal} position={[-1.7, 0, -0.7]}><boxGeometry args={[1.8, 0.8, 0.5]} /></mesh>
          </group>
        )
      })}

      {/* ---- strings (clickable) ---- */}
      {[...Array(N_STRINGS)].map((_, i) => {
        const xNut = stringX(i, true)
        const xBridge = stringX(i, false)
        const y0 = BRIDGE_Y + 3
        const y1 = NUT_Y + 1
        const mid = new THREE.Vector3((xNut + xBridge) / 2, (y0 + y1) / 2, FACE_Z + 1.9)
        const len = y1 - y0
        const angle = Math.atan2(xNut - xBridge, y1 - y0)
        const r = 0.09 + i * 0.02
        return (
          <mesh key={i} position={mid} rotation={[0, 0, -angle]} onPointerDown={(e) => { e.stopPropagation(); onPluck(i) }}>
            <cylinderGeometry args={[r, r, len, 6]} />
            <primitive object={mat.string} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
