import { useEffect, useRef } from 'react'
import type { ComponentRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import { addTask } from '../lib/ticker'
import { StudioEnvironment, Watch } from '../lib/meridianScene'
import { DEFAULT_SELECTION } from '../pages/MeridianConfigurator/config'

type ControlsRef = React.RefObject<ComponentRef<typeof OrbitControls> | null>

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Drives the idle spin on the demand frameloop: OrbitControls' own
 * autoRotate advances one step per rendered frame, so all this task does is
 * request ~30fps of frames while the card is on screen and the hand is off
 * it. Off screen or under reduced motion, the canvas goes fully idle.
 */
function Spin({ active, dragging }: { active: boolean; dragging: React.RefObject<boolean> }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    invalidate() // paint at least one frame on (re)activation
    if (!active || reducedMotion()) return
    let acc = 0
    let last = performance.now()
    return addTask((now) => {
      const dt = now - last
      last = now
      if (dragging.current) return false
      acc += dt
      if (acc >= 33) {
        acc = 0
        invalidate()
      }
      return false
    })
  }, [active, dragging, invalidate])
  return null
}

/**
 * The Range-card teaser: the real Meridian watch (shared geometry from
 * lib/meridianScene), idle-spinning, drag-to-orbit — no zoom, no pan, no
 * configurator controls. A clean click (press + release without a drag)
 * hands off to the full configurator page via onActivate; a lost GL context
 * hands the slot back to the static thumbnail via onFail.
 */
export default function MeridianLive({
  active,
  onActivate,
  onFail,
}: {
  /** False while the card is scrolled off screen — pauses the spin. */
  active: boolean
  onActivate: () => void
  onFail: () => void
}) {
  const controls: ControlsRef = useRef(null)
  const dragging = useRef(false)
  const resumeTimer = useRef(0)
  const down = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  const onStart = () => {
    window.clearTimeout(resumeTimer.current)
    dragging.current = true
    if (controls.current) controls.current.autoRotate = false
  }
  const onEnd = () => {
    window.clearTimeout(resumeTimer.current)
    // Resume the idle spin after the hand has been away for a moment.
    resumeTimer.current = window.setTimeout(() => {
      dragging.current = false
      if (controls.current) controls.current.autoRotate = !reducedMotion()
    }, 2500)
  }

  return (
    <div
      className="h-full w-full cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        const d = down.current
        down.current = null
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) onActivate()
      }}
      role="img"
      aria-label="Meridian watch preview — drag to orbit, click to open the configurator"
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [1.5, 0.5, 2.3], fov: 35 }}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onFail()
          })
        }}
      >
        <StudioEnvironment />
        <Watch selection={DEFAULT_SELECTION} />
        <ContactShadows position={[0, -0.55, 0]} opacity={0.4} scale={4.5} blur={3} far={1.3} resolution={512} frames={4} />
        <OrbitControls
          ref={controls}
          makeDefault
          enableZoom={false}
          enablePan={false}
          autoRotate={!reducedMotion()}
          autoRotateSpeed={0.8}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2 + 0.2}
          onStart={onStart}
          onEnd={onEnd}
        />
        <Spin active={active} dragging={dragging} />
      </Canvas>
    </div>
  )
}
