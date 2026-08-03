/**
 * relief-sites.mjs — the canonical site list.
 *
 * Single source of truth: the bake reads this and writes a manifest the app
 * fetches, so bounding boxes and render settings cannot drift apart between
 * build and runtime. Change anything here and re-run `node scripts/bake-relief.mjs
 * --manifest` to republish it; only a bbox change needs a full re-bake.
 *
 * Frame, elevation and ratio figures are MEASURED (scripts/probe-sites.mjs, at
 * 1024², 0.5 m quantisation, Paeth filtering) rather than looked up. Ratio is
 * frame width to relief; lower is more dramatic.
 *
 * Vertical exaggeration is NOT listed — it is derived at runtime from each
 * site's own measured geometry, targeting an effective ratio near 1:7 and never
 * going below true scale. The Matterhorn correctly lands on 1.0x with no
 * special case, which is the point of deriving rather than hard-coding it.
 *
 * SEEDS are measured too: `VS_SEARCH=1 VS_SITE=<id> node scripts/check-viewshed.mjs`
 * scores a grid of candidate observers by the area each actually sees. Every
 * site needs its own — the highest ground is a trap at three of these four, and
 * a position chosen on a canyon rim means nothing on a caldera.
 *
 * WATER is the flood surface: `default` is where the slider starts (null for dry)
 * and `presets` are levels worth one tap. Both accept 'min', meaning the lowest
 * ground in the frame, so nothing here has to repeat a baked number. Only two of
 * the four sites have a level that means something; the rest just get the
 * slider, because inventing a landmark elevation would be worse than none.
 *
 * PALETTE is a two-stop ramp from the lowest ground in the frame to the highest.
 * Two colours cover every case here including the inverted one: Death Valley's
 * salt is the brightest thing in its frame and sits at the BOTTOM of the range,
 * so its ramp runs pale to dark while the others run dark to pale.
 */
export const SITES = [
  {
    id: 'grand-canyon',
    name: 'Grand Canyon',
    subtitle: 'South Rim · Arizona',
    bbox: { north: 36.19, south: 36.02, west: -112.22, east: -112.0 },
    // 19.8 x 18.9 km | 713–2523 m | relief 1810 | 1:10.9
    // Light across the gorge's east–west axis: one wall lights, the other falls
    // away. Straight down the axis would flatten both.
    sun: { azimuth: 190, elevation: 20 },
    contourM: 100,
    // ground 2148 m, sees 20.8% — the rim, not the high point.
    seed: { u: 0.3, v: 0.3 },
    palette: { low: '#60564b', high: '#ad9f8e' },
    water: { default: null, presets: [] },
    note: 'Re-cropped from the original 45 km frame, which measured 1:20.8 — the tighter window nearly halves the ratio with no new data.',
  },
  {
    id: 'matterhorn',
    name: 'Matterhorn',
    subtitle: 'Zermatt · Switzerland',
    bbox: { north: 46.05, south: 45.92, west: 7.6, east: 7.79 },
    // 14.7 x 14.4 km | 1472–4329 m | relief 2858 | 1:5.2
    // A peak wants a higher sun than a canyon does; at 20° its faces go black.
    sun: { azimuth: 250, elevation: 32 },
    contourM: 150,
    // ground 3597 m, sees 29.7% — a shoulder, 732 m below the summit, which
    // sees more than the summit does.
    seed: { u: 0.8, v: 0.2 },
    palette: { low: '#6b6f75', high: '#e8edf2' },
    water: { default: null, presets: [] },
    note: 'The best ratio measured anywhere on the shortlist, and the proof that the flatness was framing rather than rendering — it needs no exaggeration at all.',
  },
  {
    id: 'crater-lake',
    name: 'Crater Lake',
    subtitle: 'Caldera · Oregon',
    bbox: { north: 42.98, south: 42.905, west: -122.17, east: -122.07 },
    // 8.2 x 8.3 km | 1883–2469 m | relief 587 | 1:13.9
    sun: { azimuth: 300, elevation: 20 },
    contourM: 50,
    // ground 2221 m, sees 80.9% — on the rim. The unfiltered search wanted to
    // stand on the lake itself (1,883 m, 81.9%), which the DEM permits and
    // reality does not; VS_MIN_GROUND=1950 excludes the water plane.
    seed: { u: 0.2, v: 0.8 },
    palette: { low: '#2b4763', high: '#8f8578' },
    // Opens dry like every other site, with the lake reachable in one tap. It
    // is tempting to start wet — the lowest ground here IS the lake, a flat
    // plane at the published 1,883 m surface — but the DEM has no bathymetry,
    // so the tool can only ever show that surface as a film half a metre deep.
    // Better to let someone press it and see the caveat than to open on it.
    water: { default: null, presets: [{ label: 'lake surface', at: 'min' }] },
    note: 'The minimum elevation here is exactly 1,883 m — the published lake surface. The DEM carries the real water plane as a perfectly flat surface, which is also why it costs a third of the other sites.',
  },
  {
    id: 'death-valley',
    name: 'Death Valley',
    subtitle: 'Badwater Basin · California',
    bbox: { north: 36.35, south: 36.15, west: -116.9, east: -116.7 },
    // 18.0 x 22.2 km | -91–1744 m | relief 1835 | 1:9.8
    // Low from the west so the Panamint shadows sweep out across the salt flat.
    sun: { azimuth: 270, elevation: 15 },
    contourM: 100,
    // ground -49 m, sees 72.0% — on the basin floor. Flat ground hides nothing,
    // which is the whole point of putting it next to the canyon's 20.8%.
    seed: { u: 0.1, v: 0.3 },
    palette: { low: '#b9ae95', high: '#8a6f52' },
    // Sea level is not a landmark here, it is a fact: the basin floor is below
    // it. One tap and the salt flat is underwater while the frame's own minimum
    // is still 91 m further down.
    water: { default: null, presets: [{ label: 'sea level', at: 0 }] },
    note: 'Reaches 91 m below sea level in the same frame as 1,744 m of mountain — the only site here that goes negative.',
  },
]

export const siteById = (id) => SITES.find((s) => s.id === id)

/** The manifest entry for a site: everything the app needs, nothing it doesn't.
 *  Deliberately omits the bbox-and-source detail that only the bake uses. */
export const manifestEntry = (site, meta) => ({
  id: site.id,
  name: site.name,
  subtitle: site.subtitle,
  note: site.note,
  sun: site.sun,
  contourM: site.contourM,
  seed: site.seed,
  palette: site.palette,
  water: site.water ?? { default: null, presets: [] },
  meta,
})
