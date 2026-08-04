#!/usr/bin/env node
/**
 * check-profile.mjs — does the section agree with the horizon?
 *
 *   node --experimental-strip-types scripts/check-profile.mjs
 *
 * The line-of-sight profile and the GPU viewshed are two implementations of one
 * piece of geometry, written months apart in different languages, and the whole
 * value of having a section is that it is the same answer seen from the side. So
 * this pins the profile to the figure the viewshed self-test is already pinned
 * to: over a perfectly flat plane, a 25 m eye sees exactly 19,135 m, from
 *
 *   sqrt(2 · 6371000 · 25 / (1 - 0.13)) = 19135 m
 *
 * worked by hand rather than taken from either implementation. Anything inside
 * that must be clear, anything beyond it blocked, and the crossing has to land
 * on the number. A flat plane is the one case where a profile has a closed form,
 * and it exercises the earth bulge alone with no terrain to hide behind.
 */
import { lineOfSight } from '../src/pages/Relief/profile.ts'

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` — ${note}` : ''}`)
}

const EXPECTED_HORIZON_M = 19135
const EYE = 25

/** A dead flat plane at sea level, 120 km across, as a Heightfield. */
const SPAN_M = 120000
const flat = {
  width: 2,
  height: 2,
  data: new Float32Array([0, 0, 0, 0]),
  elevAt: () => 0,
}
const meta = { widthM: SPAN_M, heightM: SPAN_M }

/** Look east from the middle of the western edge, a given distance out. */
const shoot = (distanceM, refraction = true) =>
  lineOfSight(flat, meta, { u: 0, v: 0.5 }, { u: distanceM / SPAN_M, v: 0.5 }, EYE, refraction, 2048)

const inside = shoot(EXPECTED_HORIZON_M * 0.9)
check(
  'ground inside the horizon is clear',
  !inside.blocked,
  `${(inside.distanceM / 1000).toFixed(2)} km, min clearance ${inside.minClearanceM.toFixed(1)} m`,
)

const beyond = shoot(EXPECTED_HORIZON_M * 1.15)
check(
  'ground beyond the horizon is blocked',
  beyond.blocked,
  `${(beyond.distanceM / 1000).toFixed(2)} km, min clearance ${beyond.minClearanceM.toFixed(1)} m`,
)

// Walk outward and find where it stops being visible.
let crossing = null
for (let d = EXPECTED_HORIZON_M * 0.8; d < EXPECTED_HORIZON_M * 1.3; d += 5) {
  if (shoot(d).blocked) {
    crossing = d
    break
  }
}
check(
  'the crossing lands on the analytic horizon',
  crossing !== null && Math.abs(crossing - EXPECTED_HORIZON_M) <= EXPECTED_HORIZON_M * 0.02,
  crossing === null
    ? 'never blocked'
    : `${crossing} m vs ${EXPECTED_HORIZON_M} m expected (2% tolerance)`,
)

// Refraction has to matter, and in the right direction: bending the ray
// downward around the curve lets it reach further, so the same shot that clears
// with refraction must fail without it.
const justInside = shoot(EXPECTED_HORIZON_M * 0.98, true)
const sameNoRefraction = shoot(EXPECTED_HORIZON_M * 0.98, false)
check(
  'refraction extends the horizon',
  !justInside.blocked && sameNoRefraction.blocked,
  `at ${(justInside.distanceM / 1000).toFixed(2)} km: k=0.13 clear, k=0 blocked`,
)

// The bulge is zero at both ends and largest in the middle — the shape of the
// correction, independent of its size.
const mid = shoot(60000).samples
const midBulge = mid[Math.floor(mid.length / 2)].apparent - mid[Math.floor(mid.length / 2)].ground
const endBulge = mid[mid.length - 1].apparent - mid[mid.length - 1].ground
check(
  'the earth bulge peaks mid-path and vanishes at the ends',
  midBulge > 50 && Math.abs(endBulge) < 0.01,
  `${midBulge.toFixed(1)} m at 30 km of a 60 km path, ${endBulge.toFixed(3)} m at the far end`,
)

// A terrain-free sanity bound: over 60 km the bulge should be about
// D²/(8·R_eff) at the midpoint = 60000²/(8·6371000/0.87) ≈ 61 m.
const expectedMid = (60000 * 60000) / (8 * (6371000 / (1 - 0.13)))
check(
  'the mid-path bulge matches D²/8R',
  Math.abs(midBulge - expectedMid) < 0.5,
  `${midBulge.toFixed(1)} m vs ${expectedMid.toFixed(1)} m`,
)

console.log(failed ? `\nPROFILE: ${failed} check(s) failed` : '\nPROFILE: passed')
process.exit(failed ? 1 : 0)
