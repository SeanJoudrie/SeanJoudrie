# Creative-Coding Experiments — Master Doc

**What this is:** a catalogue of 26 creative-coding project ideas, the 94 public GitHub
repos they came from, and the licence status of each. Built for Sean Joudrie (designer-builder,
WebGL/Three.js, ships solo). Paste this whole file into a new chat as context.

**Existing portfolio to build against:** particle atlases built on baked geometry (Cortex —
a brain rendered as 3D points; Skull), and a daily time-seeded flag puzzle. So the highest-value
new work is anything that is a *different muscle* from baked point clouds.

**Verified:** 2026-08-18 · 41 of 94 licences checked directly. `UNVERIFIED` means not checked,
not safe.

---

## Licence rules

| Marker | Meaning |
|---|---|
| `PERMISSIVE` | MIT / Unlicense / Apache / zlib — use freely, keep the copyright notice |
| `COPYLEFT` | GPL-3.0 — **if you use the code, your project must also be GPL-3.0** |
| `NONCOMMERCIAL` | Cannot go in anything monetized, ever |
| `NO-LICENCE` | No licence file = **all rights reserved.** Public ≠ free to use. Ask first |
| `UNVERIFIED` | Not checked. Check before lifting anything |

**The rule that covers most cases:** reading a technique is not copying code. How the pheromone
channels split, why the integrator matters, which parameters make physarum look alive —
reimplementing a method you understood needs nobody's permission. Copying the file does.
When unsure: read it, close it, write it yourself.

**Verifying one yourself:** repo sidebar under *About* shows the licence. If nothing's there,
look for `LICENSE` / `LICENSE.md` / `COPYING` or a licence section at the bottom of the README —
GitHub only auto-detects standard files, so custom licences hide in READMEs. Still nothing?
Assume all rights reserved.

### Every non-permissive repo in this doc

These are the only ones with real restrictions. Everything else marked `PERMISSIVE` below is safe
with attribution.

| Repo | Licence | Consequence |
|---|---|---|
| [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) | GPL-3.0 | Your project becomes GPL-3.0. Read for understanding; use nicoptere's instead |
| [jasonwebb/reaction-diffusion-playground](https://github.com/jasonwebb/reaction-diffusion-playground) | CC BY-NC-SA 4.0 | Non-commercial **and** share-alike |
| [R74nCom/sandboxels](https://github.com/R74nCom/sandboxels) | R74n Content Licence | Non-commercial; the reaction table is the restricted part; R74n can demand removal |
| [Hartrik/sand-game-js](https://github.com/Hartrik/sand-game-js) | Proprietary | Derivative works need explicit permission |
| [Caltrop256/plop](https://github.com/Caltrop256/plop) | GPL-3.0 | Copyleft |
| [emre-aki/raycast.js](https://github.com/emre-aki/raycast.js) | GPL-3.0 | Copyleft |
| [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) | GPL-3.0 | Copyleft |
| [MisterPrada/singularity](https://github.com/MisterPrada/singularity) | None | All rights reserved — ask before using |
| [evanw/webgl-water](https://github.com/evanw/webgl-water) | None | All rights reserved |
| [luciopaiva/chladni](https://github.com/luciopaiva/chladni) | None | All rights reserved |
| [tuqire/webcam-particles](https://github.com/tuqire/webcam-particles) | None | All rights reserved |
| [unconed/NeverSeenTheSky](https://github.com/unconed/NeverSeenTheSky) | None | All rights reserved |
| [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) | None | All rights reserved |
| [vinibiavatti1/RayCastingTutorial](https://github.com/vinibiavatti1/RayCastingTutorial) | None | All rights reserved |
| [jasonwebb/morphogenesis-resources](https://github.com/jasonwebb/morphogenesis-resources) | None | Link collection, not code |
| [erkie/erkie.github.com](https://github.com/erkie/erkie.github.com) | zlib-style custom | Fine to use; attribution required, don't misrepresent origin |

Note: Sebastian Lague's repos are licensed **individually** — Boids, Portals, Hydraulic-Erosion,
Ray-Marching and Solar-System are all MIT; only Slime-Simulation is GPL-3.0. Check each one.

---

## The three projects

Where the work actually goes. Each fuses several ideas and has a licence-clean source stack.

### Project A — Agents on your own geometry  *(the one to build)*

Slime mold, ant colony, boids, reaction-diffusion and frost are the same program: a field in a
texture, agents reading and writing it, a diffuse-and-decay pass. Every demo of them in existence
runs on a flat rectangle, because a plane is easy.

**Run yours on the brain from Cortex.** Physarum forms transport networks; a cortex *is* a
transport network. Trails pool in the sulci and read as white-matter tracts — anatomically right
by accident, and that accident is the piece. Then swap the steering rule and change nothing else:
frost on the skull, reaction-diffusion pigment blooming across the surface, boids in a shell
around it. One engine, five unrelated-looking works.

**The hard part:** the field must diffuse across the *surface*, and neighbours in 3D aren't
neighbours in UV space — seams cut the sim into islands. That's the real engineering, and the
reason everyone uses a rectangle.

- **v1** — field per-vertex on a subdivided mesh, diffuse along edges. No UVs, no seams, correct
  by construction, limited by vertex count. A weekend, and it already looks extraordinary.
- **v2** — UV atlas with a precomputed seam-adjacency map so the blur reads across cuts. That's
  the version you write up.

| Piece | Repo | Licence |
|---|---|---|
| Physarum core | [nicoptere/physarum](https://github.com/nicoptere/physarum) | `PERMISSIVE` Unlicense |
| Parameter presets | [fogleman/physarum](https://github.com/fogleman/physarum) | `PERMISSIVE` MIT |
| Understanding only — do not port | [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) | `COPYLEFT` GPL-3.0 |
| Reaction-diffusion rule | [piellardj/reaction-diffusion-webgl](https://github.com/piellardj/reaction-diffusion-webgl) | `PERMISSIVE` MIT |
| Frost / DLA rule | [fogleman/dlaf](https://github.com/fogleman/dlaf) | `PERMISSIVE` MIT |
| Boids rule | [SebLague/Boids](https://github.com/SebLague/Boids) | `PERMISSIVE` MIT |
| Ant pheromone rule | [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) | `COPYLEFT` — read only |

Start with brain + physarum. Everything else is a `#define`.

### Project B — The impossible gallery

Non-Euclidean corridor where each door opens into one of your projects, rendered deliberately
retro so nobody grades the lighting. Not an ornament beside your work — it's how people move
through it.

| Piece | Repo | Licence |
|---|---|---|
| Non-Euclidean engine | [HackerPoet/NonEuclidean](https://github.com/HackerPoet/NonEuclidean) | `PERMISSIVE` MIT |
| Portal rendering, clearest | [SebLague/Portals](https://github.com/SebLague/Portals) | `PERMISSIVE` MIT |
| Raycaster teaching | [vinibiavatti1/RayCastingTutorial](https://github.com/vinibiavatti1/RayCastingTutorial) | `NO-LICENCE` — read only |
| Raycaster, advanced | [emre-aki/raycast.js](https://github.com/emre-aki/raycast.js) | `COPYLEFT` GPL-3.0 |
| Raycaster in pure DOM | [yurkagon/ReactCasting](https://github.com/yurkagon/ReactCasting) | `UNVERIFIED` |

### Project C — Liquid glass over the live portfolio

The weekend one. Everything else is a demo in a box; this bends *your actual site* — your text,
your cards, your work — so it can't be lifted off a template and can't be demoed without demoing
your portfolio. All sources permissive.

| Piece | Repo | Licence |
|---|---|---|
| Headless DOM lens — start here | [samasante/liquid-glass](https://github.com/samasante/liquid-glass) | `PERMISSIVE` MIT |
| WebGL shader route | [ybouane/liquidglass](https://github.com/ybouane/liquidglass) | `PERMISSIVE` MIT |
| One-file SVG displacement | [deepika-builds/liquid-glass](https://github.com/deepika-builds/liquid-glass) | `PERMISSIVE` MIT |
| Shader math reference | [OverShifted/LiquidGlass](https://github.com/OverShifted/LiquidGlass) | `PERMISSIVE` MIT |
| Physics, if you add wrecking | [liabru/matter-js](https://github.com/liabru/matter-js) | `PERMISSIVE` MIT |

---

## All 26 ideas, ranked

Marks: `SHOT` survives a phone screenshot · `FLEX` makes someone who knows the cost sit up ·
`RARE` how few have shipped one · `NEW` how different a muscle from the particle atlases ·
then honest build cost.

### Tier 1 — chase one of these

**01. Non-Euclidean space** — `●●● ●●● ●●● ●●●` · Month+
Rarest thing here, not close. People film it and argue in the replies. Only entry where the
reference implementation is desktop C++, so a browser version is genuinely yours.
- [HackerPoet/NonEuclidean](https://github.com/HackerPoet/NonEuclidean) — 6,445★ C++ — `PERMISSIVE` MIT — canonical; stencil buffers + camera matrix surgery
- [SebLague/Portals](https://github.com/SebLague/Portals) — 926★ — `PERMISSIVE` MIT — recursive portals, screen-space slicing
- [EricPlayZ/NonEuclidean-Godot](https://github.com/EricPlayZ/NonEuclidean-Godot) — 34★ — `UNVERIFIED`
- [mmagdics/noneuclideanunity](https://github.com/mmagdics/noneuclideanunity) — 29★ — `UNVERIFIED` — shader-side not stencil-side

**02. Liquid glass over your own page** — `●●● ●●○ ●●○ ●●●` · Weekend
Best effort-to-impact ratio here. See Project C for sources.

**03. Falling-sand alchemy** — `●●○ ●●● ●●○ ●●●` · Week
The only idea people *stay* for. Ten minutes, not ten seconds.
- [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel) — 3,155★ Rust/WASM — `PERMISSIVE` MIT — closest to what you'd build
- [R74nCom/sandboxels](https://github.com/R74nCom/sandboxels) — 441★ — `NONCOMMERCIAL` — reaction table restricted, build your own
- [Caltrop256/plop](https://github.com/Caltrop256/plop) — 61★ C/WASM — `COPYLEFT` GPL-3.0
- [Hartrik/sand-game-js](https://github.com/Hartrik/sand-game-js) — 39★ — `NONCOMMERCIAL` — built for mobile browsers, the part everyone skips
- [PieKing1215/FallingSandEngine](https://github.com/PieKing1215/FallingSandEngine) — 70★ Rust — `UNVERIFIED`

**04. Slime mold** — `●●● ●●○ ●●○ ●●○` · Weekend
Best beauty-per-line-of-code on the list. See Project A.
- [nicoptere/physarum](https://github.com/nicoptere/physarum) — 321★ JS — `PERMISSIVE` Unlicense — **use this one**
- [fogleman/physarum](https://github.com/fogleman/physarum) — 919★ Go — `PERMISSIVE` MIT — his presets are why his renders look better
- [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) — 1,513★ — `COPYLEFT` — clearest explanation, read only
- [DavidMcLaughlin208/SlimeMoldPhysarum](https://github.com/DavidMcLaughlin208/SlimeMoldPhysarum) — 6★ — `UNVERIFIED` — 1M+ particles

**05. Black hole** — `●●● ●●● ●●○ ●●●` · Week
Hypnotic to everyone and *correct* to the few whose opinion you'd want.
- [MisterPrada/singularity](https://github.com/MisterPrada/singularity) — 299★ Three.js/TSL — `NO-LICENCE` — your exact stack, ask before lifting
- [mdreem/gr_raytracer](https://github.com/mdreem/gr_raytracer) — Rust — `UNVERIFIED` — Schwarzschild + Kerr, go for physics
- [T-Spink/Schwarzschild-Black-Hole](https://github.com/T-Spink/Schwarzschild-Black-Hole) — C++ — `UNVERIFIED`
- [Rani367/singularity](https://github.com/Rani367/singularity) — C — `UNVERIFIED` — 50 FPS on a 1-bit Playdate screen

### Tier 2 — strong, each one different

**06. Wrecking the page** — `●●● ●○○ ●●○ ●●●` · Weekend
- [erkie/erkie.github.com](https://github.com/erkie/erkie.github.com) — `PERMISSIVE` zlib-style — the original Kick Ass bookmarklet
- [producthunt/asteroids](https://github.com/producthunt/asteroids) — `UNVERIFIED` — maintained fork
- [liabru/matter-js](https://github.com/liabru/matter-js) — `PERMISSIVE` MIT — for the falling version

**07. Boids at scale, with a hawk** — `●●● ●●○ ●○○ ●●○` · Weekend
- [SebLague/Boids](https://github.com/SebLague/Boids) — 946★ — `PERMISSIVE` MIT
- [ercang/boids-js](https://github.com/ercang/boids-js) — 100★ — `UNVERIFIED` — 3D, WebWorkers
- [cubedhuang/boids](https://github.com/cubedhuang/boids) — 71★ — `UNVERIFIED` — spatial subdivision
- [connor-brooks/ecosim](https://github.com/connor-brooks/ecosim) — 402★ — `UNVERIFIED` — hawk behaviour

**08. Ferrofluid** — `●●● ●●● ●●● ●●○` · Week+
Looks impossible and is genuinely hard — field solve plus surface tension, not a metaball hack.
- [robert-leitl/ferrofluid](https://github.com/robert-leitl/ferrofluid) — 32★ WebGL2 — `PERMISSIVE` MIT — the one for you
- [g1n0st/taichi-ferrofluid](https://github.com/g1n0st/taichi-ferrofluid) — 38★ — `UNVERIFIED` — level-set spike physics
- [Univstar/IoB-Ferrofluid-2D](https://github.com/Univstar/IoB-Ferrofluid-2D) — 20★ — `UNVERIFIED`
- [shiinamiyuki/Accurate-Large-Scale-Ferrofluids](https://github.com/shiinamiyuki/Accurate-Large-Scale-Ferrofluids) — 16★ — `UNVERIFIED`

**09. Doom-style raycaster, your work as the level** — `●●○ ●●○ ●●● ●●●` · Week
The only idea that solves a real problem — navigation, not ornament. See Project B.
- [ahuth/raycast](https://github.com/ahuth/raycast) — 354★ React — `UNVERIFIED` — easiest to graft into a site
- (rest in Project B)

**10. Marble sequencer** — `●●○ ●●○ ●●○ ●●●` · Week
Built-in reason to share. Make the layout URL-encodable and it spreads itself.
- [AndrewB330/MusicMarbles](https://github.com/AndrewB330/MusicMarbles) — `PERMISSIVE` MIT — custom C++ physics because JS wasn't deterministic enough
- [yomboprime/marbleMachine](https://github.com/yomboprime/marbleMachine) — Three.js — `UNVERIFIED`
- [liabru/matter-js](https://github.com/liabru/matter-js) — `PERMISSIVE` MIT

**11. Reaction-diffusion** — `●●● ●○○ ●○○ ●●○` · Weekend
Build the paint-into-it hook *first*, not last.
- [piellardj/reaction-diffusion-webgl](https://github.com/piellardj/reaction-diffusion-webgl) — 40★ — `PERMISSIVE` MIT — **use this one**
- [jasonwebb/reaction-diffusion-playground](https://github.com/jasonwebb/reaction-diffusion-playground) — 209★ — `NONCOMMERCIAL` CC BY-NC-SA — best interactive one, restricted
- [linusmossberg/reaction-diffusion](https://github.com/linusmossberg/reaction-diffusion) — 59★ — `UNVERIFIED` — anisotropic + Phong
- [colejd/Reaction-Diffusion-ThreeJS](https://github.com/colejd/Reaction-Diffusion-ThreeJS) — 49★ — `UNVERIFIED`

**12. Terrain that erodes** — `●●○ ●●● ●●○ ●●○` · Week
The timelapse slider is the whole product.
- [LanLou123/Webgl-Erosion](https://github.com/LanLou123/Webgl-Erosion) — 316★ — `PERMISSIVE` MIT — already in the browser
- [SebLague/Hydraulic-Erosion](https://github.com/SebLague/Hydraulic-Erosion) — 1,037★ — `PERMISSIVE` MIT
- [weigert/SimpleHydrology](https://github.com/weigert/SimpleHydrology) — 737★ — `PERMISSIVE` MIT — rivers and lakes first-class
- [bshishov/UnityTerrainErosionGPU](https://github.com/bshishov/UnityTerrainErosionGPU) — 154★ — `UNVERIFIED`

**13. One shader, whole world** — `●○○ ●●● ●●○ ●●●` · Week
Different muscle from the particle atlases. Low legibility to non-technical viewers.
- [electricsquare/raymarching-workshop](https://github.com/electricsquare/raymarching-workshop) — 1,009★ — `PERMISSIVE` MIT — read this first, full stop
- [shader-park/shader-park-core](https://github.com/shader-park/shader-park-core) — 823★ — `PERMISSIVE` MIT — write JS, get a shader
- [SebLague/Ray-Marching](https://github.com/SebLague/Ray-Marching) — 1,089★ — `PERMISSIVE` MIT
- [JiepengTan/FishManShaderTutorial](https://github.com/JiepengTan/FishManShaderTutorial) — 802★ — `UNVERIFIED` — mountains and oceans
- [danielchasehooper/ShapeUp-public](https://github.com/danielchasehooper/ShapeUp-public) — 652★ — `UNVERIFIED`

**14. A galaxy that collides** — `●●● ●●○ ●○○ ●○○` · Week
Shares its GPU core with #05 — two pieces, one gravity solver.
- [Hsin-Hung/N-body-simulation](https://github.com/Hsin-Hung/N-body-simulation) — 30★ CUDA — `UNVERIFIED` — Barnes-Hut, the important one
- [alvinng4/grav_sim](https://github.com/alvinng4/grav_sim) — 141★ — `UNVERIFIED` — bad integrators evaporate galaxies
- [nicosmo/cosmic_web_explorer](https://github.com/nicosmo/cosmic_web_explorer) — 15★ WebGPU — `UNVERIFIED`
- [SebLague/Solar-System](https://github.com/SebLague/Solar-System) — 1,375★ — `PERMISSIVE` MIT — presentation layer

**15. Fluid you can shove** — `●●● ●●○ ○○○ ●●○` · Weekend
Beautiful, but the most cloned effect on the web. Use as a component, not the piece.
- [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) — 16,537★ — `PERMISSIVE` MIT — everyone uses it, which is why using it costs you
- [matsuoka-601/WebGPU-Ocean](https://github.com/matsuoka-601/WebGPU-Ocean) — 541★ — `PERMISSIVE` MIT — **the differentiated route**, 3D MLS-MPM on WebGPU
- [sandydoo/flux](https://github.com/sandydoo/flux) — 864★ Rust — `PERMISSIVE` MIT — restraint reads as more expensive than more dye
- [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) — 46★ — `NO-LICENCE`

### Tier 3 — good, but not what you lead with

**16. Cloth you can cut** — `●●○ ●●○ ●○○ ●●○` · Week
- [Habrador/Ten-Minute-Physics-Unity](https://github.com/Habrador/Ten-Minute-Physics-Unity) — 356★ — `PERMISSIVE` MIT — Matthias Müller's series, XPBD cloth
- [diwi/PixelFlow](https://github.com/diwi/PixelFlow) — 1,284★ — `PERMISSIVE` MIT — softbody on GPU, a whole education
- [sam007961/FastMassSpring](https://github.com/sam007961/FastMassSpring) — 234★ — `UNVERIFIED`
- [Ninjajie/Fusion](https://github.com/Ninjajie/Fusion) — 473★ — `UNVERIFIED`

**17. Origami that folds itself** — `●●○ ●●● ●●● ●●○` · Month+
Best "wait, how" here. The definitive version already exists and is very good.
- [amandaghassaei/OrigamiSimulator](https://github.com/amandaghassaei/OrigamiSimulator) — 1,333★ — `PERMISSIVE` MIT — MIT folding-research lineage
- [oriedita/oriedita](https://github.com/oriedita/oriedita) — 125★ — `UNVERIFIED` — crease-pattern editor
- [zzhuyii/OrigamiSimulator](https://github.com/zzhuyii/OrigamiSimulator) — 52★ MATLAB — `UNVERIFIED`

**18. Aurora** — `●●● ●●○ ●●○ ●●○` · Week
Real hook: tune to live solar-wind data so tonight's page is what the sky is doing.
- [olawlor/AuroraRendererUnity](https://github.com/olawlor/AuroraRendererUnity) — `UNVERIFIED` — Lawlor wrote the paper *and* the renderer
- [lun0522/AuroraSketcher](https://github.com/lun0522/AuroraSketcher) — `UNVERIFIED` — lets you *draw* the curtains
- [unconed/NeverSeenTheSky](https://github.com/unconed/NeverSeenTheSky) — `NO-LICENCE` — Steven Wittens; cheapest convincing browser route
- [ksd3/aurorasim](https://github.com/ksd3/aurorasim) — `UNVERIFIED` — physics-first

**19. Sound made visible (Chladni)** — `●●○ ●●○ ●●○ ●●○` · Weekend
- [luciopaiva/chladni](https://github.com/luciopaiva/chladni) — 60★ — `NO-LICENCE` — cleanest read
- [nolangz/3D-Chladni](https://github.com/nolangz/3D-Chladni) — 28★ — `UNVERIFIED` — audio-reactive, 3D
- [hilbertcube/Chladni-Patterns-Generator](https://github.com/hilbertcube/Chladni-Patterns-Generator) — 42★ — `UNVERIFIED` — solves the PDE properly
- [addiebarron/chladni](https://github.com/addiebarron/chladni) — 39★ p5 — `UNVERIFIED`

**20. Ant colony** — `●●○ ●●○ ●○○ ●●○` · Weekend
- [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) — 17★ — `COPYLEFT` GPL-3.0 — split to-food/to-home channels, the detail everyone skips
- [nilsgollub/AntSim_V2](https://github.com/nilsgollub/AntSim_V2) — TS/Pixi — `UNVERIFIED`
- [Nikorasu/NantArray](https://github.com/Nikorasu/NantArray) — `UNVERIFIED` — CA rewrite, maps to a fragment shader

**21. Ice that grows** — `●●○ ●●○ ●●○ ●○○` · Weekend
- [fogleman/dlaf](https://github.com/fogleman/dlaf) — 195★ — `PERMISSIVE` MIT — the spatial index is the whole trick
- [jasonwebb/2d-diffusion-limited-aggregation-experiments](https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments) — 66★ — `UNVERIFIED` — check, his other repo is NC
- [BrutPitt/DLAf-optimized](https://github.com/BrutPitt/DLAf-optimized) — 20★ — `UNVERIFIED` — 3D

**22. A city that grows** — `●●○ ●●● ●●○ ●●○` · Month+
Four systems, not one. Easiest project here to leave 80% finished.
- [jstrait/city-tour](https://github.com/jstrait/city-tour) — 86★ Three.js — `PERMISSIVE` MIT — the right starting point
- [a-b-street/abstreet](https://github.com/a-b-street/abstreet) — 8,152★ — `UNVERIFIED` — how road networks are really modelled
- [AndyQ/MetalCity](https://github.com/AndyQ/MetalCity) — 38★ — `UNVERIFIED` — lighting does the work
- [TheDuckCow/godot-road-generator](https://github.com/TheDuckCow/godot-road-generator) — 1,159★ — `UNVERIFIED`

**23. Your face, 60,000 points** — `●●○ ●●○ ●●○ ○○○` · Week
Webcam prompt loses a cold audience. Closest to what you already do, so least added range.
- [tuqire/webcam-particles](https://github.com/tuqire/webcam-particles) — `NO-LICENCE` — the pipeline, assembled
- [tensorflow/tfjs-models](https://github.com/tensorflow/tfjs-models/tree/master/depth-estimation) — `PERMISSIVE` Apache-2.0 — per-pixel depth from one camera

**24. Wave tank** — `●○○ ●●○ ●○○ ●○○` · Weekend
Slits give you double-slit diffraction free. Reads as "a ripple effect" on a phone.
- [evanw/webgl-water](https://github.com/evanw/webgl-water) — 1,260★ — `NO-LICENCE` — Evan Wallace, later Figma's renderer and esbuild
- [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) — 46★ — `NO-LICENCE`

**25. Ripple tank of traffic** — `○○○ ●○○ ●●○ ●○○` · Weekend
Best teaching idea, weakest visually. A small explainer, not a headline.
- [toruseo/UXsim](https://github.com/toruseo/UXsim) — 252★ — `UNVERIFIED` — car-following model that makes the phantom jam
- [a-b-street/abstreet](https://github.com/a-b-street/abstreet) — 8,152★ — `UNVERIFIED`
- [cityflow-project/CityFlow](https://github.com/cityflow-project/CityFlow) — 1,008★ — `UNVERIFIED`

**26. A world that keeps going without you** — *not a project, a modifier*
Time-seed a sim and every visitor sees the same weather, season and drift, no backend. Bolt it
onto erosion, the city or the aurora and that piece stops being a demo and becomes a place.
Alone it's nothing to look at.
- [davidbau/seedrandom](https://github.com/davidbau/seedrandom) — 2,130★ — `PERMISSIVE` MIT — seed off `floor(Date.now() / 86400000)`

---

## Attribution

### CREDITS.md — ship one per project

```markdown
# Credits

Built by studying the following open work. Where code was used directly it is marked;
everything else is technique learned and reimplemented.

## Code used
- [nicoptere/physarum](https://github.com/nicoptere/physarum) by Nicolas Barradeau —
  Unlicense (public domain). Agent stepping and trail-deposit loop, adapted.

## Technique learned, reimplemented
- [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) by Sebastian
  Lague — the sense-rotate-move formulation.
- [fogleman/physarum](https://github.com/fogleman/physarum) by Michael Fogleman —
  parameter presets and palette approach.

## Papers
- Jones, J. (2010). "Characteristics of pattern formation and evolution in approximations
  of Physarum transport networks."
```

### In-code header, where you adapted something

```js
// Agent stepping adapted from nicoptere/physarum (Unlicense)
// https://github.com/nicoptere/physarum
// Surface-space adaptation and seam handling are original.
```

### Outreach message

> Hi <name> — I'm building a WebGL piece that runs a physarum simulation across the surface
> of a 3D mesh (a cortex model I made) instead of a flat plane. Your <repo> was where I
> learned <specific thing>. Two questions if you have a minute: is there anything you'd want
> credited beyond a link, and did you ever try running it on a non-planar surface? Happy to
> send you the result either way.
>
> — Sean

Specific, proves you read the code, asks no permission you don't need, gives them an easy
interesting question. If the repo has no licence, add: *"There's no LICENSE file on the repo —
would you be OK with me adapting parts of it, and how would you like to be credited?"*

### Who to message, best first

| Person | Repo | Why |
|---|---|---|
| Nicolas Barradeau | [nicoptere/physarum](https://github.com/nicoptere/physarum) | Project A depends on his code. Unlicense so no permission needed — credit him anyway |
| Amanda Ghassaei | [OrigamiSimulator](https://github.com/amandaghassaei/OrigamiSimulator) | Researcher, MIT, publishes to be built on. Highest-value reply available |
| Jason Webb | [morphogenesis-resources](https://github.com/jasonwebb/morphogenesis-resources) | Maintains the field's bibliography so people build on it. His RD repo is NC — ask first |
| Michael Fogleman | [physarum](https://github.com/fogleman/physarum), [dlaf](https://github.com/fogleman/dlaf) | Prolific, generous with technique, both MIT |
| Max Bittker | [sandspiel](https://github.com/MaxBittker/sandspiel) | Deep in creative-coding, responsive, MIT |
| Robert Leitl | [ferrofluid](https://github.com/robert-leitl/ferrofluid) | Small account, same stack, hardest thing here to solve alone |
| Orion Lawlor | [AuroraRendererUnity](https://github.com/olawlor/AuroraRendererUnity) | Wrote the aurora paper *and* the renderer. Academic, email is normal |
| MisterPrada | [singularity](https://github.com/MisterPrada/singularity) | No licence — must ask if you want to use it |
| Evan Wallace | [webgl-water](https://github.com/evanw/webgl-water) | No licence. Also built Figma's renderer and esbuild |
| David McLaughlin | [SlimeMoldPhysarum](https://github.com/DavidMcLaughlin208/SlimeMoldPhysarum) | Six stars, a million particles. Will be delighted you noticed |

---

## Build log

Record what you actually took, so attribution stays honest as time passes.

| Date | Project | Repo | What was taken | Credited |
|---|---|---|---|---|
| | | | | |
