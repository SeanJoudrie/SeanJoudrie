#!/usr/bin/env node
/**
 * check-solar.mjs — is the sun where it says it is?
 *
 *   node --experimental-strip-types scripts/check-solar.mjs
 *
 * The trap with an astronomical routine is that it is entirely self-consistent
 * and entirely wrong: every value derives from the same declination, so a
 * corrupted obliquity moves both sides of any internal comparison together and
 * nothing complains. The same shape of hollow assertion that let a wrong
 * refraction constant through the viewshed self-test until it was pinned to an
 * independently worked figure.
 *
 * So every check below is anchored to something known WITHOUT this code:
 *
 *   - The sun is overhead at the Tropic of Cancer on the June solstice. That is
 *     what the tropic IS — the definition of the line, not a consequence of any
 *     model.
 *   - Likewise the Tropic of Capricorn in December, and the equator at either
 *     equinox.
 *   - On an equinox the sun rises due east everywhere on Earth.
 *   - The equation of time — the gap between mean and apparent solar noon —
 *     swings roughly a quarter hour either way and crosses zero four times a
 *     year. That is a structural fact about an eccentric, tilted orbit and it
 *     exercises both correction terms at once.
 *
 * Tolerances are tenths of a degree, not arc-seconds. These are the
 * low-precision equations and the sun's own disc is half a degree wide; past
 * that, chasing precision here would be measuring the formula rather than the
 * shadow it is for.
 */
import { sunPosition, utcFromLocalSolar } from '../src/pages/Relief/solar.ts'

let failed = 0
const check = (name, ok, note = '') => {
  if (!ok) failed++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` — ${note}` : ''}`)
}

/**
 * The sun at APPARENT noon — its actual highest point that day — found by
 * searching a minute at a time either side of mean noon.
 *
 * Not mean noon, which is what the first version of these checks used, and the
 * equator ones failed at 88.13 degrees against a one-degree tolerance. That was
 * the equation of time showing up exactly where it should: about seven and a
 * half minutes at the March equinox is 1.9 degrees of hour angle, and at the
 * equator with the declination at zero that comes straight off the elevation.
 * Widening the tolerance to swallow it would have been asserting a coincidence.
 * Removing the confound instead lets the tolerance drop to a third of a degree,
 * where it actually constrains something.
 */
const atNoon = (lat, month, day, lon = 0) => {
  let best = null
  for (let mins = -40; mins <= 40; mins++) {
    const p = sunPosition(lat, lon, utcFromLocalSolar(2026, month, day, 12 + mins / 60, lon))
    if (!best || p.elevation > best.elevation) best = p
  }
  return best
}

// --- the tropics, which are defined by exactly this ---------------------------
const OBLIQUITY = 23.44

const cancer = atNoon(OBLIQUITY, 6, 21)
check(
  'overhead at the Tropic of Cancer on the June solstice',
  Math.abs(cancer.elevation - 90) < 0.3,
  `${cancer.elevation.toFixed(2)}° elevation at ${OBLIQUITY}°N`,
)

const capricorn = atNoon(-OBLIQUITY, 12, 21)
check(
  'overhead at the Tropic of Capricorn on the December solstice',
  Math.abs(capricorn.elevation - 90) < 0.3,
  `${capricorn.elevation.toFixed(2)}° elevation at ${OBLIQUITY}°S`,
)

for (const [label, m, d] of [
  ['March', 3, 20],
  ['September', 9, 22],
]) {
  const eq = atNoon(0, m, d)
  check(
    `overhead at the equator on the ${label} equinox`,
    Math.abs(eq.elevation - 90) < 0.3,
    `${eq.elevation.toFixed(2)}° elevation, declination ${eq.declination.toFixed(2)}°`,
  )
}

// --- an equinox sunrise is due east, at any latitude --------------------------
for (const lat of [0, 36.1, 51.5, -33.9]) {
  // Walk the morning in one-minute steps and take the crossing of the horizon.
  let rise = null
  for (let mins = 0; mins < 12 * 60 && rise === null; mins++) {
    const p = sunPosition(lat, 0, utcFromLocalSolar(2026, 3, 20, mins / 60, 0))
    if (p.elevation > 0) rise = p
  }
  check(
    `equinox sunrise is due east at ${lat}°`,
    rise !== null && Math.abs(rise.azimuth - 90) < 1.5,
    rise ? `${rise.azimuth.toFixed(2)}°` : 'sun never rose',
  )
}

// --- the equation of time -----------------------------------------------------
// Apparent noon is when the azimuth passes due south; the offset from mean noon
// is the equation of time. Sampled at a northern mid-latitude where the sun is
// unambiguously southward all year.
const eot = (month, day) => {
  let best = null
  for (let mins = -40; mins <= 40; mins++) {
    const p = sunPosition(45, 0, utcFromLocalSolar(2026, month, day, 12 + mins / 60, 0))
    const off = Math.abs(p.azimuth - 180)
    if (!best || off < best.off) best = { off, mins }
  }
  // Sun late to the meridian means the clock is ahead of the sun: negative.
  return -best.mins
}

const samples = []
for (let m = 1; m <= 12; m++) samples.push({ m, e: eot(m, 15) })
const amplitude = Math.max(...samples.map((s) => Math.abs(s.e)))
check(
  'equation of time swings about a quarter hour',
  amplitude >= 12 && amplitude <= 18,
  `peak ${amplitude} min across the year`,
)

let crossings = 0
for (let i = 1; i < samples.length; i++) {
  if (Math.sign(samples[i].e) !== Math.sign(samples[i - 1].e)) crossings++
}
check(
  'the equation of time crosses zero four times a year',
  crossings === 4,
  `${crossings} sign changes in monthly samples`,
)

// --- declination spans the obliquity, and only that ---------------------------
let dMin = 90
let dMax = -90
for (let day = 0; day < 365; day++) {
  const d = sunPosition(0, 0, new Date(Date.UTC(2026, 0, 1 + day, 12))).declination
  dMin = Math.min(dMin, d)
  dMax = Math.max(dMax, d)
}
check(
  'declination reaches the obliquity and no further',
  Math.abs(dMax - OBLIQUITY) < 0.2 && Math.abs(dMin + OBLIQUITY) < 0.2,
  `${dMin.toFixed(2)}° to ${dMax.toFixed(2)}°`,
)

// --- the sun goes down, and comes back ----------------------------------------
const noonHere = atNoon(36.1, 6, 21, 0)
const antinoon = sunPosition(36.1, 0, utcFromLocalSolar(2026, 6, 21, 0, 0))
check(
  'the sun is below the horizon at local solar midnight',
  antinoon.elevation < 0 && noonHere.elevation > 0,
  `noon ${noonHere.elevation.toFixed(1)}°, midnight ${antinoon.elevation.toFixed(1)}°`,
)

console.log(failed ? `\nSOLAR: ${failed} check(s) failed` : '\nSOLAR: passed')
process.exit(failed ? 1 : 0)
