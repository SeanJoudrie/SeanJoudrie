#!/usr/bin/env node
/**
 * probe-solar-match.mjs — which moment produces the sun each site was authored
 * with?
 *
 * The per-site azimuth and elevation were chosen by eye, for the look. Now that
 * the sun can be computed, the question is whether those looks correspond to a
 * real time of day at that latitude — because if they do, the authored scene
 * survives and stops being arbitrary, and every other moment becomes reachable
 * by dragging. Searches the four preset dates at one-minute resolution.
 */
import { sunPosition, utcFromLocalSolar, siteCentre, DATE_PRESETS, SOLAR_YEAR } from '../src/pages/Relief/solar.ts'
import { SITES } from './relief-sites.mjs'

const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

for (const site of SITES) {
  const { lat, lon } = siteCentre(site.bbox)
  let best = null
  for (const d of DATE_PRESETS) {
    for (let m = 0; m < 24 * 60; m++) {
      const p = sunPosition(lat, lon, utcFromLocalSolar(SOLAR_YEAR, d.month, d.day, m / 60, lon))
      if (p.elevation < 1) continue
      // Elevation weighted harder: it sets how long the shadows are, which is
      // what the look was actually tuned on.
      // Elevation FIRST, as a hard band: it sets shadow length, which is what
      // the look was tuned on. Then the closest azimuth within that band. The
      // unconstrained version quietly traded 10 degrees of elevation away on
      // the Grand Canyon, whose authored pair turns out to be unreachable —
      // at 36N the sun is never as low as 20 degrees while due south, because
      // December noon is its minimum there at 30.5.
      if (Math.abs(p.elevation - site.sun.elevation) > 1) continue
      const cost = angDiff(p.azimuth, site.sun.azimuth)
      if (!best || cost < best.cost) best = { cost, date: d, m, p }
    }
  }
  const hh = String(Math.floor(best.m / 60)).padStart(2, '0')
  const mm = String(best.m % 60).padStart(2, '0')
  console.log(
    `${site.id.padEnd(14)} authored ${String(site.sun.azimuth).padStart(3)}°/${String(site.sun.elevation).padStart(2)}°  ->  ` +
      `${best.date.label.padEnd(13)} ${hh}:${mm}  =  ${best.p.azimuth.toFixed(1)}°/${best.p.elevation.toFixed(1)}°  ` +
      `(off by ${angDiff(best.p.azimuth, site.sun.azimuth).toFixed(1)}° az, ${Math.abs(best.p.elevation - site.sun.elevation).toFixed(1)}° el)`,
  )
}
