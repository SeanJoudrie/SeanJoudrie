import { useMemo } from 'react'
import { BoxGeometry, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { MM } from './Case'
import { makeDialTexture } from '../textures'

/**
 * The dial: a canvas-textured face (sunray, minute track, brand print)
 * with applied 3D hour indices riding above it in brass. 12 o'clock is
 * local −Z, matching the lugs; the texture's top maps there.
 */

const DIAL_Y = 4.1 // mm — the face plane
const INDEX_R = 11.6 // mm — index centers

export function Dial() {
  // Default build: midnight-blue sunray. The config system re-targets this.
  const texture = useMemo(
    () => makeDialTexture({ base: '#2e4468', deep: '#101b30', ink: '#e8e6df' }),
    [],
  )

  const indices = useMemo(() => {
    const geo = new BoxGeometry(1.15 * MM, 0.55 * MM, 3.1 * MM)
    const mesh = new InstancedMesh(geo, undefined as never, 13)
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    let slot = 0
    const place = (angle: number, lateral: number) => {
      const dir = new Vector3(Math.sin(angle), 0, -Math.cos(angle))
      const side = new Vector3().crossVectors(up, dir) // lateral offset axis
      const pos = dir
        .clone()
        .multiplyScalar(INDEX_R * MM)
        .add(side.multiplyScalar(lateral * MM))
        .setY((DIAL_Y + 0.35) * MM)
      q.setFromAxisAngle(up, Math.atan2(dir.x, dir.z))
      m.compose(pos, q, new Vector3(1, 1, 1))
      mesh.setMatrixAt(slot++, m)
    }
    for (let h = 0; h < 12; h++) {
      const angle = (h / 12) * Math.PI * 2
      if (h === 0) {
        // Double marker at 12 — the one orientation cue every watch needs.
        place(angle, -0.95)
        place(angle, 0.95)
      } else {
        place(angle, 0)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [])

  return (
    <group>
      <mesh position={[0, DIAL_Y * MM, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[14.35 * MM, 96]} />
        <meshPhysicalMaterial map={texture} roughness={0.38} metalness={0.35} dithering />
      </mesh>
      <primitive object={indices}>
        <meshPhysicalMaterial attach="material" color="#c9a55a" metalness={1} roughness={0.2} clearcoat={0.4} clearcoatRoughness={0.3} dithering />
      </primitive>
    </group>
  )
}
