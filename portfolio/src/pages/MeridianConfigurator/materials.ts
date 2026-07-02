import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, MeshPhysicalMaterial } from 'three'
import { addTask, easeOutCubic } from '../../lib/ticker'
import type { Metal } from './config'

/**
 * One material instance per configurable metal, shared by every mesh that
 * wears it. Option changes damp the color over ~280ms on the site's shared
 * rAF loop (each frame invalidates the demand-mode canvas); scalar params
 * swap outright — imperceptible next to the color move. Reduced motion
 * snaps. The instance is created once and disposed on unmount, so swaps
 * never allocate GPU resources mid-interaction.
 */
export function useDampedMetal(spec: Metal): MeshPhysicalMaterial {
  const invalidate = useThree((s) => s.invalidate)

  const mat = useMemo(() => {
    const m = new MeshPhysicalMaterial()
    m.dithering = true
    m.color.set(spec.color)
    m.metalness = spec.metalness
    m.roughness = spec.roughness
    m.clearcoat = spec.clearcoat
    m.clearcoatRoughness = 0.35
    m.anisotropy = spec.anisotropy ?? 0
    return m
    // Created once; the effect below tracks spec changes.
  }, [])

  useEffect(() => {
    mat.metalness = spec.metalness
    mat.roughness = spec.roughness
    mat.clearcoat = spec.clearcoat
    mat.anisotropy = spec.anisotropy ?? 0
    const to = new Color(spec.color)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || mat.color.equals(to)) {
      mat.color.copy(to)
      invalidate()
      return
    }
    const from = mat.color.clone()
    const t0 = performance.now()
    return addTask((now) => {
      const p = Math.min(1, (now - t0) / 280)
      mat.color.copy(from).lerp(to, easeOutCubic(p))
      invalidate()
      return p >= 1
    })
  }, [mat, spec, invalidate])

  useEffect(() => () => mat.dispose(), [mat])

  return mat
}
