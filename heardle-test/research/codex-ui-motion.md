# Song Guess UI overhaul: research from Codex

Research only; nothing here is decided or built yet. The source is [Codex](https://github.com/SeanJoudrie/Codex) ([live](https://seanjoudrie.github.io/Codex/)), the 1,458-repo inspiration archive. Every repo in the categories that matter for look, motion and sound was sorted relevant / maybe / not relevant (about 450 repos), and the relevant ones had their README and demo read. September 2026.

Slices covered:
- **Motion & animation** and **Interaction & UI**: 97 unique repos
- **Audio & music** (32), **Retro** (50), and the 2D, colour and audio-reactive parts of **Rendering** (162)
- **Design tooling** (83), **Creative tools** (16), **Explorable explanations** (16), and the browser games with notable game feel (from 168)
- The look-and-feel building blocks in `data/features.json`, and the Codex site itself

## 1. Your taste, from the Codex site

The Codex site is the clearest signal of what you like:

- **A technical notebook look.** Warm paper `#f5f4f0`, near-black ink `#16171b`, a muted grey, and one burnt-orange accent (`#b4410f` light, `#f08a4b` dark), with a true dark mode (`#0e0f12`).
- **Type:** IBM Plex Mono for headings, labels, chips and buttons, and IBM Plex Sans for body text. A fixed 12/14/16/20/28px ramp, with uppercase tracked-out mono micro-labels.
- **Layout:** a 4px spacing scale, one 6px radius and one 1px border. Elevation is a border, never a shadow. Hover changes only colour.
- **Motion:** no decoration. Selected chips invert to ink. The loading skeleton pulses only when motion is allowed, and a global reduced-motion switch turns every transition off.

Song Guess today uses a system font, a green accent and white cards: tidy, but anonymous.

## 2. The finding that opens up the most options

**The game can see the music.** Deezer's clip server sends `access-control-allow-origin: *` (tested September 2026 against a live preview URL, with range requests allowed). So a Web Audio `AnalyserNode` on the game's `<audio>` element (with `crossOrigin = "anonymous"`) can read the real frequency and waveform data of each clip. Every audio-reactive idea below depends on this, and it works.

The repo's design standard says animation must be tied to something the person did. Audio playing after a tap on Play counts, so visuals that move with the clip fit the standard. Nothing may animate under `prefers-reduced-motion`.

## 3. Sources by Song Guess moment

Licence notes: MIT, ISC, Apache and OFL are safe to use. MPL, LGPL, EPL and GPL are copyleft: MPL, LGPL and EPL require sharing changes to the library's own files, and GPL makes the whole project GPL. "None" means all rights reserved, so only reimplement the idea. Sizes are gzipped where measured.

### 3.1 Listening layer (drives everything audio-reactive)

| Repo | What it really does | Use in Song Guess | Cost | Licence |
|---|---|---|---|---|
| [wizgrav/clubber](https://github.com/wizgrav/clubber) · [tool](http://wizgrav.github.io/clubber/tool) | FFT turned into energy per MIDI note. "Bands" return smoothed 0–1 values (strongest note, energy, octave), with a fast-rise, slow-fall "snap" mode for kicks. | Makes the Play button, meter or background breathe with the actual song; colour by pitch | 2.5 KB | MIT |
| [karlstav/cava](https://github.com/karlstav/cava) | Documented processing chain (CAVACORE.md): band-limit to about 50 Hz–10 kHz, log spread, "integral" smoothing, gravity fall-off, auto sensitivity | How to make bars look calm and musical, not jittery. A few lines on top of `getByteFrequencyData` | ~0 (technique) | MIT |

### 3.2 Clip meter (the 1 → 16 second bar, the most-used control)

| Repo | What it really does | Use | Cost | Licence |
|---|---|---|---|---|
| [mfcc64/youtube-musical-spectrum](https://github.com/mfcc64/youtube-musical-spectrum) · [demo](https://mfcc64.github.io/ytms/) | Constant-Q spectrum with a note-letter axis (E F G A…) and a scrolling waterfall under album art | A meter that "develops" a mini spectrogram of the seconds you've unlocked | Reference only | LGPL-3.0 |
| [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) · [play](http://adarkroom.doublespeakgames.com) | A button that draws its own cooldown bar (`div.cooldown` drains while disabled); the UI reveals itself one piece at a time | "Play 1 second" becomes one patient button that draws its own playback bar | CSS/JS idea | MPL-2.0 (reimplement) |
| [franktisellano/datatype](https://github.com/franktisellano/datatype) · [specimen](https://franktisellano.github.io/datatype/) | Variable font whose ligatures turn text like `{b:1,3,7,9}` into inline bar charts, `{l:…}` sparklines and `{p:75}` pies. No JS | Meter, score history and share text drawn *as type* | One woff2 | OFL-1.1 |
| [juliangarnier/anime](https://github.com/juliangarnier/anime) · [animejs.com](https://animejs.com) | Tweens, timelines, stagger, springs, SVG line drawing; built-in `reduceMotion` media-query scope | Each unlocked segment snaps in on a spring, like a tape counter | 24.5 KB whole; about 5–11 KB for the modules needed | MIT |
| [mszula/visual-sorting](https://github.com/mszula/visual-sorting) | Canvas bars with Web Audio tones | Bar-style meter reference | Reference | see repo |
| [jameshball/osci-render](https://github.com/jameshball/osci-render) | Draws shapes and text on an audio oscilloscope | Idea: an oscilloscope-trace waveform | Concept only | GPL-3.0 |

### 3.3 Play screen background: "sound made visible"

| Repo | What it really does | Use | Cost | Licence |
|---|---|---|---|---|
| [luciopaiva/chladni](https://github.com/luciopaiva/chladni) · [demo](https://luciopaiva.com/chladni) | Square-plate formula `cos(nπx/L)cos(mπy/L) − cos(mπx/L)cos(nπy/L)`. A worker precomputes a gradient field; particles slide onto the nodal lines (about 100 ms for 500k points on a desktop) | Sand that settles into a new figure at each unlocked stage (1s, 2s, 4s…); the (m, n) pair could come from the song's dominant pitch | Canvas + worker; needs far fewer particles on phones | None (reimplement from the published formula) |
| [addiebarron/chladni](https://github.com/addiebarron/chladni) · [demo](https://addiebarron.github.io/chladni) | p5.js closed-form Chladni | The MIT version to learn from | Reference | MIT |
| [nolangz/3D-Chladni](https://github.com/nolangz/3D-Chladni) · [demo](https://nolangz.github.io/3D-Chladni/) | Audio-reactive 3D Chladni fields. Dark UI with gold sand | Look reference only; its README warns it drains a laptop battery | Too heavy | Apache-2.0 code, CC BY-NC media |
| [jberg/butterchurn](https://github.com/jberg/butterchurn) · [demo](https://butterchurnviz.com) | MilkDrop presets on WebGL 2 | Rejected as the brand: psychedelic, glowing, often purple | 62 KB + presets, WebGL 2 | MIT |

### 3.4 The reveal (the signature moment)

| Repo | What it really does | Use | Cost | Licence |
|---|---|---|---|---|
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) · [reactbits.dev](https://reactbits.dev) (DecryptedText) | Every 50 ms, unrevealed letters are swapped for random characters, then resolve one by one from the start, end or centre | The song title "decrypts" letter by letter: guessing as decoding. Also CountUp for the score | About 30 lines of vanilla JS (port the idea; the component is React) | MIT + Commons Clause |
| [greensock/GSAP](https://github.com/greensock/GSAP) · [gsap.com](https://gsap.com) | Timelines; SplitText, ScrambleText, Flip and MorphSVG are now free | ScrambleText for the title; Flip for moving a picked suggestion into its slot or a cover into the reveal | Not stated; on jsDelivr | Custom "no-charge" licence (fine for a game) |
| [Momciloo/fun-with-clip-path](https://github.com/Momciloo/fun-with-clip-path) · [demo](https://fun-with-clip-path.vercel.app) | `clip-path: circle()` grows from the tap point to `1.42 × 100vmax` | The reveal irises out of the Play or Guess button you tapped | CSS only | MIT |
| [veltman/flubber](https://github.com/veltman/flubber) | Morphs any SVG shape into another with no inversions (`interpolate`, `toCircle`) | Play → check or X; square cover → round disc | Small; "not terribly performant" with many shapes | MIT |
| [fand/vfx-js](https://github.com/fand/vfx-js) · [demo](https://amagi.dev/vfx-js) | WebGL shaders on `<img>`: duotone, halftone, pixelate and focus transitions (also glitch and rainbow) | Cover art comes into focus or de-pixelates on reveal, in brand duotone | Not measured (effect-chain module about 29 KB) | MIT |
| [1etu/MeltGL](https://github.com/1etu/MeltGL) · [demo](https://1etu.github.io/MeltGL/) | GPU fluid solver that melts an image (wax, honey, tar); SVG fallback | "Not this time": the cover melts away, once | GPU-heavy; untested on phones | MIT |
| [bradley/Blotter](https://github.com/bradley/Blotter) · [demo](https://blotter.js.org) | GLSL text materials (ChannelSplit, LiquidDistort, RollDistort) | A distorted title that clears as seconds unlock | 411 KB (bundles Three.js) | MIT per package.json |
| [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | Plays After Effects exports; `playSegments` can scrub | Hand-made stamps ("Got it", logo sting), only if someone animates them | Needs After Effects files | MIT |

### 3.5 Right and wrong feedback, score screen, game feel

| Repo | What it really does | Use | Cost | Licence |
|---|---|---|---|---|
| [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) · [play](https://play2048.co) | Warm fixed palette (`#faf8ef`, tiles mixed toward gold by value); tiles scale in over 200 ms; merge pop 0 → 1.2 → 1; "+N" floats up from the score over 600 ms | Row colour ramps from gold to grey with seconds used; "+points" floats up on a correct guess | CSS only | MIT |
| [lpinca/binb](https://github.com/lpinca/binb) · [binb.co](https://binb.co) | Real-time multiplayer "guess the song"; points for artist/title plus speed; genre rooms tiled with 2×3 cover collages | Closest genre precedent: UX reference only (visually dated) | Reference | MIT |
| [ncase/trust](https://github.com/ncase/trust) | Kit: Howler.js, Tween.js, CC0 freesound effects (coin, drumroll, thump); Futura Handwritten | Short sounds for right, wrong and skip (avoid its one CC BY-NC sound) | Small audio files | CC0 (mostly) |
| [stewdio/beep.js](https://github.com/stewdio/beep.js) | Web Audio synth with note names | Idea: tuned UI tones for right and wrong (about 20 lines to write your own) | Reference | None |
| [abejfehr/parity](https://github.com/abejfehr/parity) | One-sentence how-to-play card with a single button | First-run explanation | Reference | MIT |

### 3.6 Brand system: colour, type, icons, texture

| Repo | What it really does | Use | Cost | Licence |
|---|---|---|---|---|
| [meodai/poline](https://github.com/meodai/poline) · [demo](https://meodai.github.io/poline/) | Samples colours along lines between anchor colours in polar HSL; 8 position functions | Pick an unusual hue arc (away from the current green) | Run once, paste hex values | MIT |
| [adobe/leonardo](https://github.com/adobe/leonardo) · [leonardocolor.io](http://www.leonardocolor.io) | Solves key colours to target contrast ratios in perceptual space | Turn that arc into a few tokens where wrong, skip, accent and muted are all AA in light and dark | Run once | Apache-2.0 |
| [carpdiem/ember](https://github.com/carpdiem/ember) | Palettes that keep contrast and role order under Night Shift | Method for right, wrong and skip colours that still read at night on a phone | Method | MIT |
| [nesbox/TIC-80](https://github.com/nesbox/TIC-80) | Fixed 16-colour palette (Sweetie16) | The discipline of a tiny fixed palette | Idea | MIT |
| [lucide-icons/lucide](https://github.com/lucide-icons/lucide) · [lucide.dev](https://lucide.dev) | 1,600+ icons on a 24px grid with a shared stroke | Standard controls (play, skip, check, x, shuffle, share); inline the SVGs | Per icon | ISC |
| [hundredrabbits/Dotgrid](https://github.com/hundredrabbits/Dotgrid) | Grid vector tool "to create logos, icons and type" | Draw a custom wordmark, app icon and a few signature glyphs on one grid | Tool | MIT code (bundled assets are non-commercial) |
| [opentypejs/opentype.js](https://github.com/opentypejs/opentype.js) | Font → Bézier paths | Turn the wordmark into a static SVG once, for the logo, icon and share image | Offline | MIT |
| [patriciogonzalezvivo/glslCanvas](https://github.com/patriciogonzalezvivo/glslCanvas) | `<canvas data-fragment-url>` runs one shader, with images as textures | A single grain or halftone layer; cover art as a texture | 9 KB | MIT |
| [Auburn/FastNoiseLite](https://github.com/Auburn/FastNoiseLite) | Noise in JS and GLSL | Generate a paper or grain texture once (no per-frame cost) | Offline | MIT |
| [runevision/Dither3D](https://github.com/runevision/Dither3D) | Fractal Bayer to halftone dithering, with controllable dot size | Idea: halftone the cover art into brand colours | Idea (Unity code) | MPL-2.0 |
| [steffest/DPaint-js](https://github.com/steffest/DPaint-js) · [dpaint.app](https://dpaint.app) | Plain-JS palette reduction and dithering | Dither each cover to the brand palette on the CPU, once per song | Reference | MIT |
| [lumberjacque/loadersz-core](https://github.com/lumberjacque/loadersz-core) · [demo](https://loadersz.vercel.app) | Web Component loaders on Canvas 2D; honours reduced motion; pauses in hidden tabs | On-brand loading for playlist fetches and buffering | ~3 KB per state | MIT |
| [Alain00/blobatar](https://github.com/Alain00/blobatar) · [blobatar.dev](https://blobatar.dev) | A consistent SVG blob face from any string | An identity mark for each reserve that has no cover (keep it static) | ~4.4 KB | MIT |

### 3.7 Checks and anti-patterns

- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills): a web-design-guidelines audit of 100+ rules, a second pre-ship check after `docs/vibe-coded-websites-report.md`.
- [vorpus/performativeUI](https://github.com/vorpus/performativeUI): a parody kit of trendy UI tropes. A list of what not to do.

## 4. Where references clash with the design standard

| Reference | Clash | Keep it? |
|---|---|---|
| butterchurn, vanta, cool-retro-term, react-bits ShinyText/BlurText | Glow, neon, purple | No |
| Liquid glass (ybouane, deepika-builds, samasante) | "No semi-transparent or blurred headers"; real refraction only in Chromium | No |
| 2048 high-value tiles | Large `box-shadow` glow | Take the pop and "+N"; drop the glow |
| Blotter ChannelSplit, vfx-js glitch/rainbow | Leans "glitch" | Only duotone, halftone, pixelate, focus |
| glslCanvas with a `u_time` loop | Motion not tied to the player | Only while the clip plays; frozen under reduced motion |
| blobatar `animate="hover"` | Hover animation | Static only |
| lenis, barba, react-kino, mouse-follower | Scroll or cursor driven; the game is single-page and touch-first | No |

## 5. Directions the sources point to (for the prompt step)

Three coherent directions come out of the research. Each is a combination of the sources above, not a decision.

1. **Sound made visible.** The Codex notebook palette (paper, ink, one warm accent) plus clubber-driven visuals. Chladni sand settles into a new figure at each unlocked second. The clip meter is a small note-axis spectrogram. The title decrypts on reveal. The most ownable of the three; also the most work (a canvas particle field on phones).
2. **Tape deck.** Amber-on-dark warmth (cool-retro-term's palette, without the glow) and an IBM Plex Mono counter. The meter snaps in on anime.js springs like a tape counter. Play → stop morphs with flubber. Cover art is halftoned (Dither3D/DPaint idea) into two brand colours. Cheapest to build, and very consistent.
3. **Data as type.** Typographic and restrained (A Dark Room's single patient button). The meter, score history and share text are set in Datatype's chart ligatures. "+N" floats and the row colour ramps like 2048. The reveal irises out from the tapped button with clip-path. Almost no JavaScript; the most accessible and lightest.

All three share the same small toolkit:
- **Colour:** poline → leonardo tokens
- **Icons:** Lucide for standard controls, plus a Dotgrid wordmark
- **Loading:** loadersz
- **Sound:** CC0 right, wrong and skip sounds
- **Motion:** a reduced-motion switch like Codex's

## 6. Not verified yet

- **Phone performance:** anything canvas or WebGL (Chladni particles, vfx-js, MeltGL) is unmeasured on a real phone.
- **Library sizes:** unknown for GSAP, lottie-web, vfx-js (total), flubber, poline, leonardo and the Datatype woff2.
- **CDN paths:** no no-build CDN/ESM path confirmed for anime.js v4 or loadersz.
- **Live demos:** flubber's demo URL in the archive returns 404; the binb, prism, Zop and Beatrix demos were not seen in play.
- **Licences:** Blotter's licence is only in package.json (no LICENSE file); beep.js has none. The archive shows "unknown" licences for Blotter, react-bits and canvas-ui, but the repos say MIT (react-bits and canvas-ui add the Commons Clause).
- **Ranker gaps:** "vinyl turntable" and "cassette tape" found nothing, and there's no cover-art colour *extractor* in the archive (a small canvas-sampling routine would do).

## Appendix: slices reviewed and found not relevant

- **Motion & Interaction:** 3D, WebGL and physics engines; scroll-story and cursor libraries; desktop, terminal and SaaS apps; tutorials and awesome-lists (about 80 repos).
- **Audio:** synths, live-coding languages and hardware (fugleramme, dogalog, voog, Orca, BespokeSynth, vital, sapf, genish.js and others).
- **Retro:** emulators, recomps, ports and pixel editors (46 repos).
- **Rendering:** 3D engines, path and ray tracers, raymarching, Gaussian splats, physics, globes and ML (about 145 repos).
- **Design:** game engines, source releases, 3D and texture tools (about 70 repos).
- **Creative tools:** 14 repos. **Explainers:** 15 repos.
- **Games:** about 155 engines, native or 3D games and old jam games with no notable UI.
