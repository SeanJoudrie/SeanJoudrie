import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  Quaternion,
  Shape,
  Vector3,
} from 'three'
import { addTask, easeOutCubic } from '../../../lib/ticker'
import type { StrapOption } from '../config'
import { makeLeatherBump } from '../textures'
import { MM } from './Case'

/**
 * The straps: two halves drooping from the lugs the way a watch sits on a
 * display cushion. Leather and rubber share one extruded geometry (a
 * rounded cross-section swept along the droop curve); the bracelet places
 * five links per side along the same curve, wearing the CASE's material so
 * it always matches the case configuration.
 */

const droop = (side: 1 | -1) =>
  new CatmullRomCurve3(
    [
      new Vector3(0, -1.0 * MM, side * 16.5 * MM),
      new Vector3(0, -3.6 * MM, side * 25 * MM),
      new Vector3(0, -10 * MM, side * 31.5 * MM),
      new Vector3(0, -19 * MM, side * 35 * MM),
      // The tail turns nearly vertical, so the extrusion's flat cap faces
      // the floor instead of the camera.
      new Vector3(0, -27 * MM, side * 35.5 * MM),
    ],
    false,
    'catmullrom',
    0.4,
  )

function strapProfile(): Shape {
  const w = 19 * MM
  const t = 3.2 * MM
  const r = 1.1 * MM
  const s = new Shape()
  const hw = w / 2
  const ht = t / 2
  s.moveTo(-hw + r, -ht)
  s.lineTo(hw - r, -ht)
  s.quadraticCurveTo(hw, -ht, hw, -ht + r)
  s.lineTo(hw, ht - r)
  s.quadraticCurveTo(hw, ht, hw - r, ht)
  s.lineTo(-hw + r, ht)
  s.quadraticCurveTo(-hw, ht, -hw, ht - r)
  s.lineTo(-hw, -ht + r)
  s.quadraticCurveTo(-hw, -ht, -hw + r, -ht)
  return s
}

function BandStrap({ option }: { option: StrapOption }) {
  const invalidate = useThree((s) => s.invalidate)
  const geometries = useMemo(() => {
    const profile = strapProfile()
    return ([1, -1] as const).map((side) => new ExtrudeGeometry(profile, { steps: 44, bevelEnabled: false, extrudePath: droop(side) }))
  }, [])
  const bump = useMemo(() => makeLeatherBump(), [])
  const material = useMemo(() => {
    const m = new MeshPhysicalMaterial()
    m.dithering = true
    m.color.set(option.color)
    return m
    // Created once; the effect keeps it in sync.
  }, [])

  useEffect(() => {
    const leather = option.kind === 'leather'
    material.bumpMap = leather ? bump : null
    material.bumpScale = leather ? 0.35 : 0
    material.roughness = leather ? 0.62 : 0.58
    material.clearcoat = leather ? 0.15 : 0.3
    material.needsUpdate = true
    const to = new Color(option.color)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || material.color.equals(to)) {
      material.color.copy(to)
      invalidate()
      return
    }
    const from = material.color.clone()
    const t0 = performance.now()
    return addTask((now) => {
      const p = Math.min(1, (now - t0) / 280)
      material.color.copy(from).lerp(to, easeOutCubic(p))
      invalidate()
      return p >= 1
    })
  }, [material, bump, option, invalidate])

  useEffect(
    () => () => {
      material.dispose()
      bump.dispose()
      geometries.forEach((g) => g.dispose())
    },
    [material, bump, geometries],
  )

  return (
    <group>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} material={material} />
      ))}
    </group>
  )
}

function BraceletStrap({ caseMaterial }: { caseMaterial: MeshPhysicalMaterial }) {
  const Z = useMemo(() => new Vector3(0, 0, 1), [])
  const links = useMemo(() => {
    const out: { position: Vector3; quaternion: Quaternion }[] = []
    for (const side of [1, -1] as const) {
      const curve = droop(side)
      const N = 9
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N
        const position = curve.getPointAt(t)
        // Shortest-arc: box depth (+Z) follows the tangent; for a curve in
        // the YZ plane this keeps the 19mm width lateral with no roll.
        const quaternion = new Quaternion().setFromUnitVectors(Z, curve.getTangentAt(t).normalize())
        out.push({ position, quaternion })
      }
    }
    return out
  }, [Z])
  return (
    <group>
      {links.map((l, i) => (
        <mesh key={i} position={l.position} quaternion={l.quaternion} material={caseMaterial}>
          {/* Slight overlap between neighbors — links read connected. */}
          <boxGeometry args={[19 * MM, 3 * MM, 4.2 * MM]} />
        </mesh>
      ))}
    </group>
  )
}

export function Strap({ option, caseMaterial }: { option: StrapOption; caseMaterial: MeshPhysicalMaterial }) {
  if (option.kind === 'bracelet') return <BraceletStrap caseMaterial={caseMaterial} />
  return <BandStrap option={option} />
}
