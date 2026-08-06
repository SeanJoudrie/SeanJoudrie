#!/usr/bin/env node
/**
 * check-determinism.mjs — will a shared track reproduce?
 *
 *   node --experimental-strip-types scripts/check-determinism.mjs
 *
 * Margin's entire design rests on one promise: a level string is a complete
 * replay, so sharing needs no backend and a run is a pure function of the
 * drawing. That promise fails silently. A physics loop that picks up a frame
 * delta, a `Math.sin` that rounds differently in another browser, a level that
 * moves by half a ULP through its own serialiser — none of them throw, none of
 * them look wrong on the machine that wrote them, and all of them mean the link
 * you send someone plays a different run than the one you recorded.
 *
 * So this gate does not test that the simulation is *correct*. It tests that it
 * is *the same*: twice in a row, through a serialise round-trip, and with the
 * decoration PRNG removed. Plus two static checks that stop the next person
 * (or the next model) from reintroducing the hazard by hand.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile, makeRig, spawn, step } from '../src/pages/Margin/sim/index.ts'
import { decodeLevel, encodeLevel } from '../src/pages/Margin/level/format.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const SIM_DIR = join(HERE, '../src/pages/Margin/sim')

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` — ${note}` : ''}`)
}

/* ---------------------------------------------------------------- fixture */

/** Pixels → stored half-pixel integers. */
const H = (n) => Math.round(n * 2)
const line = (brush, x1, y1, x2, y2) => [brush, H(x1), H(y1), H(x2), H(y2)]

/** The descent: 19° at the top, steepening to ~44° at the bottom. */
const yAt = (x) => (x * x) / 8000 + x * 0.35

const SEGMENTS = 30
const SEG_W = 80
const TRACK_END = SEGMENTS * SEG_W

/**
 * One long one-way descent, brushed in stretches so every surface is actually
 * ridden rather than merely present in the array, with the stamps placed
 * alongside where the rig will pass through them.
 *
 * It deliberately does *not* loop. A closed circuit with a portal returning the
 * rig to the top is a perpetual motion machine — it descends 340 px a lap and
 * the teleport gives that energy back for free, so speed climbs every lap
 * (6.3 → 8.2 → 10.0 px/tick, measured) until the rig tumbles. Correct physics,
 * useless fixture: the run always ends in a crash, just at an arbitrary tick.
 */
function fixture() {
  const l = []

  // Ink by default, with an ice stretch, a boost pad, and a tar patch.
  const brushAt = (i) => (i >= 5 && i < 8 ? 1 : i >= 11 && i < 14 ? 3 : i >= 20 && i < 23 ? 2 : 0)
  for (let i = 0; i < SEGMENTS; i++) {
    const x0 = i * SEG_W
    const x1 = x0 + SEG_W
    l.push(line(brushAt(i), x0, yAt(x0), x1, yAt(x1)))
  }

  // Water surface above the track, so the rig runs submerged through it.
  l.push(line(5, 560, yAt(560) - 40, 800, yAt(800) - 40))
  // Scenery, which must never collide with anything.
  l.push(line(6, 0, -160, TRACK_END, -160))
  // A kill wall at the bottom, so the run ends on the kill path rather than by
  // sailing off the end of the world.
  l.push(line(4, TRACK_END, yAt(TRACK_END) - 90, TRACK_END, yAt(TRACK_END) + 30))

  return {
    v: 1,
    r: [1, 2, 3, 4],
    s: [H(10), H(-70)],
    l,
    // No portal here — see `portalFixture()`. A pair placed downstream on the
    // same track is inescapable: portals are bidirectional, so the rig rides
    // into B going forward, is thrown back to A, rides down to B again, and
    // ping-pongs until it tumbles. Real behaviour, and worth knowing before
    // the editor lets anyone draw it, but it makes the coverage run meaningless.
    p: [],
    // Well well above the track: strong enough to be felt, not to lift him off.
    g: [[H(1000), H(yAt(1000) - 300), 2400]],
    // Wind strength is integer thousandths: 20 → 0.02 px/tick².
    w: [
      [H(300), H(yAt(300) - 30), H(400), H(yAt(400) - 30), 20, 0], // arrow
      [H(1800), H(yAt(1800) - 90), H(1800), H(yAt(1800) - 30), 10, 1], // vortex (segment = radius)
    ],
  }
}

/**
 * A second, deliberately boring fixture for the portal alone: one straight
 * ramp, one pair, nothing else. Because the ramp is straight, translating the
 * rig by exactly (B.start − A.start) puts it back on the surface at precisely
 * the height and attitude it left — the transit is seamless, which is the
 * property worth pinning. The exit sits downstream of every other mouth, so
 * there is nothing left to cross and no ping-pong.
 */
function portalFixture() {
  const ramp = (x) => x * 0.35
  const l = []
  for (let i = 0; i < 10; i++) {
    const x0 = i * 80
    l.push(line(0, x0, ramp(x0), x0 + 80, ramp(x0 + 80)))
  }
  return {
    v: 1,
    r: [0, 0, 0, 0],
    s: [H(10), H(-60)],
    l,
    p: [
      [
        H(400), H(ramp(400) - 50), H(400), H(ramp(400) + 50),
        H(600), H(ramp(600) - 50), H(600), H(ramp(600) + 50),
      ],
    ],
    g: [],
    w: [],
  }
}

/* -------------------------------------------------------------- checksum */

// Hash the raw bits of every double, so a one-ULP divergence is caught rather
// than rounded away by a tolerance.
const bitBuf = new ArrayBuffer(8)
const asF64 = new Float64Array(bitBuf)
const asU32 = new Uint32Array(bitBuf)

function fnv(h, v) {
  h ^= v >>> 0
  return Math.imul(h, 0x01000193) >>> 0
}
function fnvF64(h, v) {
  asF64[0] = v
  return fnv(fnv(h, asU32[0]), asU32[1])
}

/** Roll a checksum over the full rig state at every tick of the run. */
function runChecksum(level, ticks) {
  const world = compile(level)
  const rig = makeRig()
  spawn(rig, world.start.x, world.start.y)

  let h = 0x811c9dc5
  let movedTicks = 0
  let maxX = world.start.x
  let topSpeed = 0
  let transits = 0
  let prevX = rig.x[0]
  for (let t = 0; t < ticks; t++) {
    step(rig, world)
    for (let i = 0; i < rig.x.length; i++) {
      h = fnvF64(h, rig.x[i])
      h = fnvF64(h, rig.y[i])
      h = fnvF64(h, rig.px[i])
      h = fnvF64(h, rig.py[i])
    }
    h = fnv(h, rig.ticks)
    h = fnv(h, (rig.crashed ? 1 : 0) | (rig.gone ? 2 : 0))
    if (!rig.crashed && !rig.gone) {
      movedTicks++
      if (rig.x[0] > maxX) maxX = rig.x[0]
      const vx = rig.x[0] - rig.px[0]
      const vy = rig.y[0] - rig.py[0]
      const v = Math.sqrt(vx * vx + vy * vy)
      if (v > topSpeed) topSpeed = v
      // A jump far larger than any one tick's travel is a portal transit.
      if (v > 0 && Math.abs(rig.x[0] - prevX) > 60) transits++
    }
    prevX = rig.x[0]
  }
  return { h, rig, movedTicks, maxX, topSpeed, transits }
}

/* ------------------------------------------------------------- the tests */

const TICKS = 3000
console.log(`\ncheck-determinism — ${TICKS} ticks over every brush and stamp\n`)

const level = fixture()

const a = runChecksum(level, TICKS)
const b = runChecksum(level, TICKS)

// Determinism holds trivially for a rig that fell over at tick 3 and froze, so
// the gate first has to establish there was a real run to be identical about.
check(
  'the rig rides the descent',
  a.maxX > 1200 && a.movedTicks > 250,
  `${a.movedTicks} live ticks, reached x=${a.maxX.toFixed(0)}/${TRACK_END}, top speed ${a.topSpeed.toFixed(2)} px/tick`,
)
check('same level, twice, same run', a.h === b.h, `0x${a.h.toString(16)}`)

// Portals on their own controlled ramp.
const pf = portalFixture()
const p1 = runChecksum(pf, 1200)
const p2 = runChecksum(pf, 1200)
check('the rig transits a portal cleanly', p1.transits >= 1 && p1.maxX > 700, `${p1.transits} transit(s), reached x=${p1.maxX.toFixed(0)}`)
check('a portal run is deterministic', p1.h === p2.h, `0x${p1.h.toString(16)}`)
const pRound = decodeLevel(encodeLevel(pf))
check('portal geometry survives the round trip', pRound !== null && runChecksum(pRound, 1200).h === p1.h)

// Serialise round-trip: the level that ships must simulate identically to the
// level that was drawn.
const encoded = encodeLevel(level)
const decoded = decodeLevel(encoded)
check('level survives encode → decode', decoded !== null && JSON.stringify(decoded) === JSON.stringify(level))
const c = decoded ? runChecksum(decoded, TICKS) : { h: -1 }
check('round-tripped level runs identically', c.h === a.h, `${encoded.length} chars on the wire`)

// A truncated or corrupt string must fail closed rather than simulate garbage.
check('a corrupt level decodes to null, not to nonsense', decodeLevel('!!!!not-a-level') === null)

// Crash determinism, separately — the main fixture deliberately never crashes.
const killLevel = { ...fixture(), l: [...fixture().l, line(4, -60, -60, 200, 20)] }
const k1 = runChecksum(killLevel, 600)
const k2 = runChecksum(killLevel, 600)
check('a crashing run is deterministic too', k1.h === k2.h && k1.rig.crashed, `crashed=${k1.rig.crashed}`)

/* ------------------------------------------------------- static hazards */

const simFiles = readdirSync(SIM_DIR).filter((f) => f.endsWith('.ts'))
check('sim/ has files to check', simFiles.length >= 6, simFiles.join(', '))

// IEEE-754 requires correct rounding for + - * / and sqrt, and requires nothing
// of the transcendentals — so engines are free to differ in the last bit.
// Anything on this list is banned inside the simulation, forever.
const BANNED =
  /Math\.(sin|cos|tan|asin|acos|atan2?|sinh|cosh|tanh|pow|exp|expm1|log|log1p|log2|log10|cbrt|hypot|fround|random)\b|\*\*/

/**
 * Blank out comments before scanning, keeping line numbers intact — otherwise
 * every `/**` JSDoc opener trips the `**` rule and the gate cries wolf until
 * someone turns it off.
 */
function stripComments(src) {
  const out = []
  let inBlock = false
  for (const raw of src.split('\n')) {
    let line = ''
    let i = 0
    while (i < raw.length) {
      if (inBlock) {
        const end = raw.indexOf('*/', i)
        if (end < 0) {
          i = raw.length
        } else {
          inBlock = false
          i = end + 2
        }
      } else if (raw.startsWith('/*', i)) {
        inBlock = true
        i += 2
      } else if (raw.startsWith('//', i)) {
        break
      } else {
        line += raw[i]
        i++
      }
    }
    out.push(line)
  }
  return out
}

const offenders = []
for (const f of simFiles) {
  stripComments(readFileSync(join(SIM_DIR, f), 'utf8')).forEach((code, i) => {
    if (BANNED.test(code)) offenders.push(`${f}:${i + 1}`)
  })
}
check(
  'no transcendentals or ** inside sim/',
  offenders.length === 0,
  offenders.length ? offenders.join(', ') : 'arithmetic and sqrt only',
)

// The decoration PRNG (parallax trees, ink wobble) lives outside sim/. One
// accidental import of it into a physics path would make every run unique, and
// nobody would notice for months.
const leaks = []
for (const f of simFiles) {
  const src = readFileSync(join(SIM_DIR, f), 'utf8')
  for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
    if (!m[1].startsWith('./')) leaks.push(`${f} → ${m[1]}`)
  }
}
check(
  'sim/ imports nothing from outside sim/',
  leaks.length === 0,
  leaks.length ? leaks.join(', ') : 'self-contained',
)

console.log(`\n${failed === 0 ? 'determinism holds' : `${failed} check(s) failed`}\n`)
process.exit(failed === 0 ? 0 : 1)
