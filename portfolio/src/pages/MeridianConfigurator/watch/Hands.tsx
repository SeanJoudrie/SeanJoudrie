import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CylinderGeometry } from 'three'
import type { Group } from 'three'
import { MM } from './Case'

/**
 * The hands keep real local time. Hour and minute read continuously; the
 * seconds hand TICKS once per second — quartz behavior — and each tick is
 * the only thing that renders an idle scene (frameloop="demand" +
 * a 1Hz invalidate). Battery strategy and authenticity, same decision.
 *
 * Clock math is deliberately naive: `new Date()` local fields only —
 * hour = (h%12 + m/60)×30°, minute = (m + s/60)×6°, second = s×6°.
 * The local Date IS the wrist time; anything more is a bug farm.
 */

/** A tapered flat baton: 4-segment cylinder = diamond cross-section,
    flattened, pointing −Z (12 o'clock) with its pivot at the hub. */
function baton(len: number, w0: number, w1: number, tail = 1.6) {
  const g = new CylinderGeometry((w1 / 2) * MM, (w0 / 2) * MM, len * MM, 4, 1, false)
  g.rotateY(Math.PI / 4) // diamond → square-on axes
  g.scale(1, 1, 0.42) // flatten into a blade
  g.rotateX(-Math.PI / 2) // axis → −Z
  g.translate(0, 0, (-len / 2 + tail) * MM)
  return g
}

export function Hands() {
  const invalidate = useThree((s) => s.invalidate)
  const hourRef = useRef<Group>(null)
  const minuteRef = useRef<Group>(null)
  const secondRef = useRef<Group>(null)

  const hourGeo = useMemo(() => baton(9.2, 1.8, 1.0), [])
  const minuteGeo = useMemo(() => baton(13.2, 1.5, 0.8), [])
  const secondGeo = useMemo(() => baton(14.6, 0.55, 0.35, 3.2), [])

  useEffect(() => {
    const set = () => {
      const now = new Date()
      const h = now.getHours() % 12
      const m = now.getMinutes()
      const s = now.getSeconds()
      // Clockwise from 12 (−Z) means negative rotation about +Y.
      if (hourRef.current) hourRef.current.rotation.y = -((h + m / 60) / 12) * Math.PI * 2
      if (minuteRef.current) minuteRef.current.rotation.y = -((m + s / 60) / 60) * Math.PI * 2
      if (secondRef.current) secondRef.current.rotation.y = -(s / 60) * Math.PI * 2
      invalidate()
    }
    set()
    // 1Hz wall-clock tick — NOT a rAF loop; the whole idle-battery win.
    const id = window.setInterval(set, 1000)
    return () => window.clearInterval(id)
  }, [invalidate])

  const steel = <meshPhysicalMaterial color="#dfe3e8" metalness={1} roughness={0.22} clearcoat={0.4} clearcoatRoughness={0.25} dithering />

  return (
    <group>
      <group ref={hourRef} position={[0, 4.62 * MM, 0]}>
        <mesh geometry={hourGeo}>{steel}</mesh>
      </group>
      <group ref={minuteRef} position={[0, 4.92 * MM, 0]}>
        <mesh geometry={minuteGeo}>{steel}</mesh>
      </group>
      <group ref={secondRef} position={[0, 5.2 * MM, 0]}>
        <mesh geometry={secondGeo}>
          <meshPhysicalMaterial color="#c9a55a" metalness={1} roughness={0.25} dithering />
        </mesh>
      </group>
      {/* Hub cap over the stack. */}
      <mesh position={[0, 4.95 * MM, 0]}>
        <cylinderGeometry args={[1.15 * MM, 1.15 * MM, 1.3 * MM, 32]} />
        <meshPhysicalMaterial color="#c9a55a" metalness={1} roughness={0.2} dithering />
      </mesh>
    </group>
  )
}

/** The crystal — a flattened sphere cap seated on the bezel's inner rim.
    transmission renders the dial through real refraction. */
export function Crystal() {
  return (
    <mesh position={[0, -5.77 * MM, 0]} scale={[1, 0.5, 1]}>
      <sphereGeometry args={[30 * MM, 96, 24, 0, Math.PI * 2, 0, 0.497]} />
      <meshPhysicalMaterial
        transmission={1}
        thickness={1.2 * MM}
        ior={1.5}
        roughness={0.05}
        clearcoat={1}
        clearcoatRoughness={0.06}
        dithering
      />
    </mesh>
  )
}
