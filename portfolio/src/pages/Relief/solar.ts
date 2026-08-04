/**
 * Where the sun actually is.
 *
 * The shadow pass and the hillshade both take a compass azimuth and an
 * elevation, and until now those were two numbers chosen per site because they
 * looked good. This computes them instead, from a place and a moment.
 *
 * That turns a slider labelled "sun angle" into something a person can ask a
 * real question with: when does this slope fall into shadow, what does the
 * valley look like at eight in the morning in March. The site's latitude and
 * longitude are already in the manifest — they are the centre of the bounding
 * box the DEM was cut from — so nothing new has to be shipped to do it.
 *
 * ALGORITHM — the low-precision solar position equations published by NOAA and
 * the USNO, good to about 0.01 degrees, which is far inside the half-degree the
 * sun's own disc subtends. Nothing here is iterative and nothing needs a table.
 *
 * TIME — local mean solar time, not civil clock time. There is no timezone
 * database in this bundle and shipping one to render a shadow would be absurd,
 * but more importantly civil time is a political fact and the sun does not
 * observe it: noon local solar time means the sun is on your meridian, by
 * definition, everywhere. The offset from UTC is exactly longitude / 15 hours.
 * The page says so rather than implying clock time.
 */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Julian date from a UTC instant. 2440587.5 is the Julian date of the epoch. */
export const julianDate = (d: Date) => d.getTime() / 86400000 + 2440587.5

export type SunPosition = {
  /** Compass bearing of the sun, degrees clockwise from north. */
  azimuth: number
  /** Degrees above the horizon. Negative when the sun is down. */
  elevation: number
  /** Solar declination, degrees. The latitude the sun is overhead at. */
  declination: number
}

/**
 * Sun position for a place and a UTC instant.
 *
 * The azimuth convention is the one the rest of this project uses — clockwise
 * from north — which the atan2 form below produces directly. Checked against
 * two cases that need no ephemeris to know: at local noon the result is due
 * south (180) whenever the sun is south of you, and six hours before that, on
 * an equinox, it is due east (90).
 */
export function sunPosition(latDeg: number, lonDeg: number, date: Date): SunPosition {
  const n = julianDate(date) - 2451545.0

  // Mean longitude and mean anomaly of the sun, degrees.
  const L = 280.46 + 0.9856474 * n
  const g = (357.528 + 0.9856003 * n) * RAD

  // Ecliptic longitude: the mean longitude plus the equation of centre, which
  // is what the Earth's orbital eccentricity does to the sun's apparent speed.
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const eps = (23.439 - 0.0000004 * n) * RAD

  const declination = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const rightAscension = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))

  // Greenwich mean sidereal time, hours, then the local hour angle of the sun.
  const gmst = 18.697374558 + 24.06570982441908 * n
  const lst = gmst + lonDeg / 15
  const H = (lst * 15 - rightAscension * DEG) * RAD

  const phi = latDeg * RAD
  const sinAlt =
    Math.sin(phi) * Math.sin(declination) +
    Math.cos(phi) * Math.cos(declination) * Math.cos(H)
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinAlt)))

  // Azimuth clockwise from north. At H = 0 the second term is sin(dec - phi),
  // negative for a sun to the south, so atan2(0, -) lands on exactly 180.
  const azimuth = Math.atan2(
    -Math.cos(declination) * Math.sin(H),
    Math.sin(declination) * Math.cos(phi) - Math.cos(declination) * Math.sin(phi) * Math.cos(H),
  )

  return {
    azimuth: (azimuth * DEG + 360) % 360,
    elevation: elevation * DEG,
    declination: declination * DEG,
  }
}

/**
 * The UTC instant at a given local-solar-time-of-day.
 *
 * Local mean solar time runs longitude/15 hours ahead of UTC, exactly and by
 * definition — no timezone, no daylight saving, no politics.
 */
export function utcFromLocalSolar(
  year: number,
  month: number,
  day: number,
  localHours: number,
  lonDeg: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + (localHours - lonDeg / 15) * 3600000)
}

/** Centre of a site's bounding box — the place its shadows belong to. */
export const siteCentre = (bbox: { north: number; south: number; west: number; east: number }) => ({
  lat: (bbox.north + bbox.south) / 2,
  lon: (bbox.west + bbox.east) / 2,
})

/**
 * Dates worth offering. The solstices and equinoxes are the extremes and the
 * midpoint of the whole year's range of sun angles, so between them they bound
 * everything the terrain can do.
 *
 * Fixed to 2026 so a given link renders the same scene next year. The dates are
 * the conventional ones; the exact instant of each event drifts by a day or so
 * across the leap cycle, which moves the declination by well under a degree.
 */
export const DATE_PRESETS = [
  { label: 'Mar equinox', month: 3, day: 20 },
  { label: 'Jun solstice', month: 6, day: 21 },
  { label: 'Sep equinox', month: 9, day: 22 },
  { label: 'Dec solstice', month: 12, day: 21 },
]
export const SOLAR_YEAR = 2026
