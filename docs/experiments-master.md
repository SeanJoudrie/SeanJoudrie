# Experiments — Master Document

Ideas, sources, licenses, attribution. Everything from the ranking session, in a form that survives.

**Last verified:** 2026-08-18 · **Repos catalogued:** 92 · **Licenses verified:** 41

This doc exists so that when you build something a year from now, you can still answer
"where did this come from and who do I credit?" Keep it updated as you go — the
`STATUS` and `TAKEN FROM` columns are yours to fill in.

---

## 0. How to use this

- **§1** is the part that changed since the first pass. Read it before you copy a line of code.
- **§2** is where the work actually goes — three projects, each fusing several ideas.
- **§3** is the full idea catalog, ranked, each with its sources.
- **§4** is the flat source registry: every repo, author, license, what it's for.
- **§5** is paste-ready attribution.
- **§6** is who to message and whether you did.

---

## 1. Read this before you copy any code

I originally shipped this list without checking licenses. I've now verified 41 of them,
and **five of my earlier recommendations have real restrictions.** These are corrections,
not footnotes.

### License key

| Marker | Meaning |
|---|---|
| `PERMISSIVE` | MIT / Unlicense / zlib — use freely, keep the copyright notice |
| `COPYLEFT` | GPL-3.0 — **if you build on the code, your project must also be GPL-3.0** |
| `NONCOMMERCIAL` | Cannot be used in anything monetized, ever |
| `NO-LICENSE` | No license file = **all rights reserved.** Public ≠ free to use. Ask first |
| `UNVERIFIED` | I didn't check. Check before you lift anything |

### The five corrections

1. **`SebLague/Slime-Simulation` is GPL-3.0, not MIT.** This matters more than any other
   line in this document, because slime mold is the core of Project A. If you port his
   code, your project becomes GPL-3.0. **Use [`nicoptere/physarum`](https://github.com/nicoptere/physarum)
   instead — it's Unlicense (public domain), already JS/WebGL, and the better starting
   point anyway.** Read Lague's for understanding; that's always fine and needs no permission.

2. **`jasonwebb/reaction-diffusion-playground` is CC BY-NC-SA 4.0.** Non-commercial *and*
   share-alike. I called Jason "the easiest yes" — still true for a conversation, but you
   cannot lift this code into anything you'd ever monetize, and derivatives must carry the
   same license. Use [`piellardj/reaction-diffusion-webgl`](https://github.com/piellardj/reaction-diffusion-webgl)
   (MIT) as the code basis.

3. **`R74nCom/sandboxels` is under a custom non-commercial license** requiring attribution,
   and R74n reserves the right to demand removal at any time. I specifically told you to
   copy the reaction table — **that is exactly what's restricted.** Build your own table,
   or write and get explicit permission.

4. **`MisterPrada/singularity` has no license file.** It was my "start here" for the black
   hole. All rights reserved. Read it, learn the TSL approach, then write your own — or ask.

5. **`emre-aki/raycast.js` and `Caltrop256/plop` are GPL-3.0.** Fine if you're happy going
   GPL; a problem if you aren't. `vinibiavatti1/RayCastingTutorial` has no license, so the
   raycaster path needs care throughout.

### The rule that covers most of this

**Reading a technique is not copying code.** How the pheromone channels split, why the
integrator matters, which parameters make physarum look alive — reimplementing a method
you understood from a paper or a repo is normal practice and needs nobody's permission.
Copying the file does. When in doubt, read it, close it, and write it yourself.

---

## 2. The three projects

This is where the work goes. Each fuses several ideas; each has a license-clean source stack.

### Project A — Agents on your own geometry  *(the one to build)*

Slime mold, ant colony, boids, reaction-diffusion and frost are the same program: a field
in a texture, agents reading and writing it, a diffuse-and-decay pass. Every demo of them
in existence runs on a flat rectangle, because a plane is easy.

**Run yours on the brain from Cortex.** Physarum forms transport networks; a cortex *is* a
transport network. The trails will pool in the sulci and read as white-matter tracts —
anatomically right by accident, and that accident is the piece. Then swap the steering rule
and change nothing else: frost on the skull, reaction-diffusion pigment blooming across the
surface, boids in a shell around it. One engine, five unrelated-looking works.

**The hard part:** the field must diffuse across the *surface*, and neighbours in 3D aren't
neighbours in UV space — seams cut the sim into islands. That's the real engineering and
the reason everyone uses a rectangle.

- **v1** — field per-vertex on a subdivided mesh, diffuse along edges. No UVs, no seams,
  correct by construction, limited by vertex count. A weekend, and it already looks extraordinary.
- **v2** — UV atlas with a precomputed seam-adjacency map so the blur reads across cuts.
  That's the version you write up.

**Clean source stack:**

| Piece | Repo | License |
|---|---|---|
| Physarum core | [nicoptere/physarum](https://github.com/nicoptere/physarum) | `PERMISSIVE` Unlicense |
| Parameter presets | [fogleman/physarum](https://github.com/fogleman/physarum) | `PERMISSIVE` MIT |
| Understanding only — do not port | [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) | `COPYLEFT` GPL-3.0 |
| Reaction-diffusion rule | [piellardj/reaction-diffusion-webgl](https://github.com/piellardj/reaction-diffusion-webgl) | `PERMISSIVE` MIT |
| Frost / DLA rule | [fogleman/dlaf](https://github.com/fogleman/dlaf) | `PERMISSIVE` MIT |
| Boids rule | [SebLague/Boids](https://github.com/SebLague/Boids) | `PERMISSIVE` MIT |
| Ant pheromone rule | [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) | `COPYLEFT` GPL-3.0 — read only |

Start with brain + physarum. Everything else is a `#define`.

### Project B — The impossible gallery

Non-Euclidean corridor where each door opens into one of your projects, rendered
deliberately retro so nobody grades the lighting. Not an ornament beside your work — it's
how people move through it. A container, not a simulation.

| Piece | Repo | License |
|---|---|---|
| Non-Euclidean engine | [HackerPoet/NonEuclidean](https://github.com/HackerPoet/NonEuclidean) | `PERMISSIVE` MIT |
| Portal rendering, clearest | [SebLague/Portals](https://github.com/SebLague/Portals) | `PERMISSIVE` MIT |
| Raycaster teaching | [vinibiavatti1/RayCastingTutorial](https://github.com/vinibiavatti1/RayCastingTutorial) | `NO-LICENSE` — read only |
| Raycaster, advanced | [emre-aki/raycast.js](https://github.com/emre-aki/raycast.js) | `COPYLEFT` GPL-3.0 |
| Raycaster in pure DOM | [yurkagon/ReactCasting](https://github.com/yurkagon/ReactCasting) | `UNVERIFIED` |

### Project C — Liquid glass over the live portfolio

The weekend one. Everything else is a demo in a box; this bends *your actual site* — your
text, your cards, your work — so it can't be lifted off a template and can't be demoed
without demoing your portfolio. All sources permissive.

| Piece | Repo | License |
|---|---|---|
| Headless DOM lens — start here | [samasante/liquid-glass](https://github.com/samasante/liquid-glass) | `PERMISSIVE` MIT |
| WebGL shader route | [ybouane/liquidglass](https://github.com/ybouane/liquidglass) | `PERMISSIVE` MIT |
| One-file SVG displacement | [deepika-builds/liquid-glass](https://github.com/deepika-builds/liquid-glass) | `PERMISSIVE` MIT |
| Shader math reference | [OverShifted/LiquidGlass](https://github.com/OverShifted/LiquidGlass) | `PERMISSIVE` MIT |
| Physics, if you add wrecking | [liabru/matter-js](https://github.com/liabru/matter-js) | `PERMISSIVE` MIT |

---

## 3. Idea catalog

Ranked by portfolio impact. Marks: `SHOT` survives a phone screenshot · `FLEX` makes
someone who knows the cost sit up · `RARE` how few have shipped one · `NEW` how different
a muscle from the particle atlases · `LIFT` honest build cost.

### Tier 1 — chase one of these

**01. Non-Euclidean space** — `●●● ●●● ●●● ●●●` · Month+
Rarest thing here, not close. People film it and argue in the replies. Only entry where the
reference implementation is desktop C++, so a browser version is genuinely yours.
- [HackerPoet/NonEuclidean](https://github.com/HackerPoet/NonEuclidean) — 6,445★ C++ — `PERMISSIVE` MIT — the canonical one; stencil buffers + camera matrix surgery
- [SebLague/Portals](https://github.com/SebLague/Portals) — 926★ — `PERMISSIVE` MIT — recursive portals, screen-space slicing
- [EricPlayZ/NonEuclidean-Godot](https://github.com/EricPlayZ/NonEuclidean-Godot) — 34★ — `UNVERIFIED`
- [mmagdics/noneuclideanunity](https://github.com/mmagdics/noneuclideanunity) — 29★ — `UNVERIFIED` — shader-side not stencil-side

**02. Liquid glass over your own page** — `●●● ●●○ ●●○ ●●●` · Weekend
Best effort-to-impact ratio here. Bends your actual portfolio. See Project C.

**03. Falling-sand alchemy** — `●●○ ●●● ●●○ ●●●` · Week
The only idea people *stay* for. Ten minutes, not ten seconds.
- [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel) — 3,155★ Rust/WASM — `PERMISSIVE` MIT — closest to what you'd build
- [R74nCom/sandboxels](https://github.com/R74nCom/sandboxels) — 441★ — `NONCOMMERCIAL` R74n Content License — **reaction table is restricted, build your own**
- [Caltrop256/plop](https://github.com/Caltrop256/plop) — 61★ C/WASM — `COPYLEFT` GPL-3.0
- [Hartrik/sand-game-js](https://github.com/Hartrik/sand-game-js) — 39★ — `NONCOMMERCIAL` custom, derivatives need permission
- [PieKing1215/FallingSandEngine](https://github.com/PieKing1215/FallingSandEngine) — 70★ Rust — `UNVERIFIED`

**04. Slime mold** — `●●● ●●○ ●●○ ●●○` · Weekend
Best beauty-per-line-of-code on the list. See Project A for the clean stack.
- [nicoptere/physarum](https://github.com/nicoptere/physarum) — 321★ JS — `PERMISSIVE` Unlicense — **use this one**
- [fogleman/physarum](https://github.com/fogleman/physarum) — 919★ Go — `PERMISSIVE` MIT — his presets are why his renders look better
- [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) — 1,513★ — `COPYLEFT` GPL-3.0 — clearest explanation, read only
- [DavidMcLaughlin208/SlimeMoldPhysarum](https://github.com/DavidMcLaughlin208/SlimeMoldPhysarum) — 6★ — `UNVERIFIED` — 1M+ particles

**05. Black hole** — `●●● ●●● ●●○ ●●●` · Week
Hypnotic to everyone and *correct* to the few whose opinion you'd want.
- [MisterPrada/singularity](https://github.com/MisterPrada/singularity) — 299★ Three.js/TSL — `NO-LICENSE` — your exact stack, but ask before lifting
- [mdreem/gr_raytracer](https://github.com/mdreem/gr_raytracer) — Rust — `UNVERIFIED` — Schwarzschild + Kerr, go for physics
- [T-Spink/Schwarzschild-Black-Hole](https://github.com/T-Spink/Schwarzschild-Black-Hole) — C++ — `UNVERIFIED`
- [Rani367/singularity](https://github.com/Rani367/singularity) — C — `UNVERIFIED` — 50 FPS on a 1-bit Playdate screen

### Tier 2 — strong, each one different

**06. Wrecking the page** — `●●● ●○○ ●●○ ●●●` · Weekend
- [erkie/erkie.github.com](https://github.com/erkie/erkie.github.com) — `PERMISSIVE` zlib-style, attribution required — the original Kick Ass bookmarklet
- [producthunt/asteroids](https://github.com/producthunt/asteroids) — `UNVERIFIED` — maintained fork
- [liabru/matter-js](https://github.com/liabru/matter-js) — `PERMISSIVE` MIT — for the falling version

**07. Boids at scale, with a hawk** — `●●● ●●○ ●○○ ●●○` · Weekend
- [SebLague/Boids](https://github.com/SebLague/Boids) — 946★ — `PERMISSIVE` MIT
- [ercang/boids-js](https://github.com/ercang/boids-js) — 100★ — `UNVERIFIED` — 3D, WebWorkers
- [cubedhuang/boids](https://github.com/cubedhuang/boids) — 71★ — `UNVERIFIED` — spatial subdivision
- [connor-brooks/ecosim](https://github.com/connor-brooks/ecosim) — 402★ — `UNVERIFIED` — go here for hawk behaviour

**08. Ferrofluid** — `●●● ●●● ●●● ●●○` · Week+
Looks impossible and is genuinely hard — field solve plus surface tension, not a metaball hack.
- [robert-leitl/ferrofluid](https://github.com/robert-leitl/ferrofluid) — 32★ WebGL2 — `PERMISSIVE` MIT — the one for you
- [g1n0st/taichi-ferrofluid](https://github.com/g1n0st/taichi-ferrofluid) — 38★ — `UNVERIFIED` — level-set spike physics
- [Univstar/IoB-Ferrofluid-2D](https://github.com/Univstar/IoB-Ferrofluid-2D) — 20★ — `UNVERIFIED`
- [shiinamiyuki/Accurate-Large-Scale-Ferrofluids](https://github.com/shiinamiyuki/Accurate-Large-Scale-Ferrofluids) — 16★ — `UNVERIFIED`

**09. Doom-style raycaster, your work as the level** — `●●○ ●●○ ●●● ●●●` · Week
See Project B. Note the license spread — the raycaster path needs care.

**10. Marble sequencer** — `●●○ ●●○ ●●○ ●●●` · Week
Built-in reason to share. Make the layout URL-encodable and it spreads itself.
- [AndrewB330/MusicMarbles](https://github.com/AndrewB330/MusicMarbles) — `PERMISSIVE` MIT — custom C++ physics because JS wasn't deterministic enough
- [yomboprime/marbleMachine](https://github.com/yomboprime/marbleMachine) — Three.js — `UNVERIFIED`
- [liabru/matter-js](https://github.com/liabru/matter-js) — `PERMISSIVE` MIT

**11. Reaction-diffusion** — `●●● ●○○ ●○○ ●●○` · Weekend
Build the paint-into-it hook *first*, not last.
- [piellardj/reaction-diffusion-webgl](https://github.com/piellardj/reaction-diffusion-webgl) — 40★ — `PERMISSIVE` MIT — **use this one**
- [jasonwebb/reaction-diffusion-playground](https://github.com/jasonwebb/reaction-diffusion-playground) — 209★ — `NONCOMMERCIAL` CC BY-NC-SA 4.0 — best interactive one, restricted
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
- [alvinng4/grav_sim](https://github.com/alvinng4/grav_sim) — 141★ — `UNVERIFIED` — integrators matter, bad ones evaporate galaxies
- [nicosmo/cosmic_web_explorer](https://github.com/nicosmo/cosmic_web_explorer) — 15★ WebGPU — `UNVERIFIED`
- [SebLague/Solar-System](https://github.com/SebLague/Solar-System) — 1,375★ — `PERMISSIVE` MIT — presentation layer

**15. Fluid you can shove** — `●●● ●●○ ○○○ ●●○` · Weekend
Beautiful, but the most cloned effect on the web. Use as a component, not the piece.
- [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) — 16,537★ — `PERMISSIVE` MIT — everyone uses it, which is why using it costs you
- [matsuoka-601/WebGPU-Ocean](https://github.com/matsuoka-601/WebGPU-Ocean) — 541★ — `PERMISSIVE` MIT — **the differentiated route**, 3D MLS-MPM on WebGPU
- [sandydoo/flux](https://github.com/sandydoo/flux) — 864★ Rust — `PERMISSIVE` MIT — restraint reads as more expensive than more dye
- [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) — 46★ — `NO-LICENSE`

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
- [unconed/NeverSeenTheSky](https://github.com/unconed/NeverSeenTheSky) — `NO-LICENSE` — Steven Wittens; cheapest convincing browser route
- [ksd3/aurorasim](https://github.com/ksd3/aurorasim) — `UNVERIFIED` — physics-first

**19. Sound made visible (Chladni)** — `●●○ ●●○ ●●○ ●●○` · Weekend
- [luciopaiva/chladni](https://github.com/luciopaiva/chladni) — 60★ — `NO-LICENSE` — cleanest read
- [nolangz/3D-Chladni](https://github.com/nolangz/3D-Chladni) — 28★ — `UNVERIFIED` — audio-reactive, 3D
- [hilbertcube/Chladni-Patterns-Generator](https://github.com/hilbertcube/Chladni-Patterns-Generator) — 42★ — `UNVERIFIED` — solves the PDE properly
- [addiebarron/chladni](https://github.com/addiebarron/chladni) — 39★ p5 — `UNVERIFIED`

**20. Ant colony** — `●●○ ●●○ ●○○ ●●○` · Weekend
- [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) — 17★ — `COPYLEFT` GPL-3.0 — split to-food/to-home channels, the detail everyone skips
- [nilsgollub/AntSim_V2](https://github.com/nilsgollub/AntSim_V2) — TS/Pixi — `UNVERIFIED`
- [Nikorasu/NantArray](https://github.com/Nikorasu/NantArray) — `UNVERIFIED` — CA rewrite, maps to a fragment shader

**21. Ice that grows** — `●●○ ●●○ ●●○ ●○○` · Weekend
- [fogleman/dlaf](https://github.com/fogleman/dlaf) — 195★ — `PERMISSIVE` MIT — the spatial index is the whole trick
- [jasonwebb/2d-diffusion-limited-aggregation-experiments](https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments) — 66★ — `UNVERIFIED` — check, given his other repo is NC
- [BrutPitt/DLAf-optimized](https://github.com/BrutPitt/DLAf-optimized) — 20★ — `UNVERIFIED` — 3D

**22. A city that grows** — `●●○ ●●● ●●○ ●●○` · Month+
Four systems, not one. Easiest project here to leave 80% finished.
- [jstrait/city-tour](https://github.com/jstrait/city-tour) — 86★ Three.js — `PERMISSIVE` MIT — the right starting point
- [a-b-street/abstreet](https://github.com/a-b-street/abstreet) — 8,152★ — `UNVERIFIED` — how road networks are really modelled
- [AndyQ/MetalCity](https://github.com/AndyQ/MetalCity) — 38★ — `UNVERIFIED` — lighting does the work
- [TheDuckCow/godot-road-generator](https://github.com/TheDuckCow/godot-road-generator) — 1,159★ — `UNVERIFIED`

**23. Your face, 60,000 points** — `●●○ ●●○ ●●○ ○○○` · Week
Webcam prompt loses a cold audience. Closest to what you already do, so least added range.
- [tuqire/webcam-particles](https://github.com/tuqire/webcam-particles) — `NO-LICENSE` — the pipeline, assembled
- [tensorflow/tfjs-models](https://github.com/tensorflow/tfjs-models/tree/master/depth-estimation) — `PERMISSIVE` Apache-2.0 — per-pixel depth from one camera

**24. Wave tank** — `●○○ ●●○ ●○○ ●○○` · Weekend
Slits give you double-slit diffraction free. Reads as "a ripple effect" on a phone.
- [evanw/webgl-water](https://github.com/evanw/webgl-water) — 1,260★ — `NO-LICENSE` — Evan Wallace, later Figma's renderer and esbuild
- [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) — 46★ — `NO-LICENSE`

**25. Ripple tank of traffic** — `○○○ ●○○ ●●○ ●○○` · Weekend
Best teaching idea, weakest visually. A small explainer, not a headline.
- [toruseo/UXsim](https://github.com/toruseo/UXsim) — 252★ — `UNVERIFIED` — car-following model that makes the phantom jam
- [a-b-street/abstreet](https://github.com/a-b-street/abstreet) — 8,152★ — `UNVERIFIED`
- [cityflow-project/CityFlow](https://github.com/cityflow-project/CityFlow) — 1,008★ — `UNVERIFIED`

### Not a project — a modifier

**A world that keeps going without you.** Time-seed a sim and every visitor sees the same
weather, season and drift, no backend. Bolt it onto erosion, the city, or the aurora and
that piece stops being a demo and becomes a place. Alone it's nothing to look at.
- [davidbau/seedrandom](https://github.com/davidbau/seedrandom) — 2,130★ — `PERMISSIVE` MIT — seed off `floor(Date.now() / 86400000)`

---

## 4. Source registry

Every repo, flat. Fill in `STATUS` and `TAKEN FROM` as you build.

**Status values:** `unused` · `reading` · `technique-borrowed` · `code-used` · `credited`

| Repo | Author | License | For | Status | Taken from |
|---|---|---|---|---|---|
| [HackerPoet/NonEuclidean](https://github.com/HackerPoet/NonEuclidean) | HackerPoet (CodeParade) | MIT | Non-Euclidean | unused | |
| [SebLague/Portals](https://github.com/SebLague/Portals) | Sebastian Lague | MIT | Portals | unused | |
| [SebLague/Boids](https://github.com/SebLague/Boids) | Sebastian Lague | MIT | Boids | unused | |
| [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) | Sebastian Lague | **GPL-3.0** | Slime mold | unused | |
| [SebLague/Hydraulic-Erosion](https://github.com/SebLague/Hydraulic-Erosion) | Sebastian Lague | MIT | Erosion | unused | |
| [SebLague/Ray-Marching](https://github.com/SebLague/Ray-Marching) | Sebastian Lague | MIT | SDF/raymarch | unused | |
| [SebLague/Solar-System](https://github.com/SebLague/Solar-System) | Sebastian Lague | MIT | N-body | unused | |
| [nicoptere/physarum](https://github.com/nicoptere/physarum) | Nicolas Barradeau | **Unlicense** | Slime mold | unused | |
| [fogleman/physarum](https://github.com/fogleman/physarum) | Michael Fogleman | MIT | Slime mold | unused | |
| [fogleman/dlaf](https://github.com/fogleman/dlaf) | Michael Fogleman | MIT | DLA/frost | unused | |
| [DavidMcLaughlin208/SlimeMoldPhysarum](https://github.com/DavidMcLaughlin208/SlimeMoldPhysarum) | David McLaughlin | unverified | Slime mold | unused | |
| [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel) | Max Bittker | MIT | Falling sand | unused | |
| [R74nCom/sandboxels](https://github.com/R74nCom/sandboxels) | R74n | **Non-commercial** | Falling sand | unused | |
| [Caltrop256/plop](https://github.com/Caltrop256/plop) | Caltrop256 | **GPL-3.0** | Falling sand | unused | |
| [Hartrik/sand-game-js](https://github.com/Hartrik/sand-game-js) | Hartrik | **Proprietary** | Falling sand | unused | |
| [PieKing1215/FallingSandEngine](https://github.com/PieKing1215/FallingSandEngine) | PieKing1215 | unverified | Falling sand | unused | |
| [samasante/liquid-glass](https://github.com/samasante/liquid-glass) | samasante | MIT | Liquid glass | unused | |
| [ybouane/liquidglass](https://github.com/ybouane/liquidglass) | Y. Bouane | MIT | Liquid glass | unused | |
| [deepika-builds/liquid-glass](https://github.com/deepika-builds/liquid-glass) | deepika-builds | MIT | Liquid glass | unused | |
| [OverShifted/LiquidGlass](https://github.com/OverShifted/LiquidGlass) | OverShifted | MIT | Liquid glass | unused | |
| [MisterPrada/singularity](https://github.com/MisterPrada/singularity) | MisterPrada | **None** | Black hole | unused | |
| [mdreem/gr_raytracer](https://github.com/mdreem/gr_raytracer) | mdreem | unverified | Black hole | unused | |
| [T-Spink/Schwarzschild-Black-Hole](https://github.com/T-Spink/Schwarzschild-Black-Hole) | T-Spink | unverified | Black hole | unused | |
| [Rani367/singularity](https://github.com/Rani367/singularity) | Rani367 | unverified | Black hole | unused | |
| [erkie/erkie.github.com](https://github.com/erkie/erkie.github.com) | erkie | zlib-style | Wrecking page | unused | |
| [producthunt/asteroids](https://github.com/producthunt/asteroids) | Product Hunt | unverified | Wrecking page | unused | |
| [liabru/matter-js](https://github.com/liabru/matter-js) | Liam Brummitt | MIT | 2D physics | unused | |
| [ercang/boids-js](https://github.com/ercang/boids-js) | Ercan Gigi | unverified | Boids | unused | |
| [cubedhuang/boids](https://github.com/cubedhuang/boids) | Daniel Huang | unverified | Boids | unused | |
| [connor-brooks/ecosim](https://github.com/connor-brooks/ecosim) | Connor Brooks | unverified | Boids/predation | unused | |
| [robert-leitl/ferrofluid](https://github.com/robert-leitl/ferrofluid) | Robert Leitl | MIT | Ferrofluid | unused | |
| [g1n0st/taichi-ferrofluid](https://github.com/g1n0st/taichi-ferrofluid) | g1n0st | unverified | Ferrofluid | unused | |
| [Univstar/IoB-Ferrofluid-2D](https://github.com/Univstar/IoB-Ferrofluid-2D) | Univstar | unverified | Ferrofluid | unused | |
| [shiinamiyuki/Accurate-Large-Scale-Ferrofluids](https://github.com/shiinamiyuki/Accurate-Large-Scale-Ferrofluids) | shiinamiyuki | unverified | Ferrofluid | unused | |
| [vinibiavatti1/RayCastingTutorial](https://github.com/vinibiavatti1/RayCastingTutorial) | Vini Biavatti | **None** | Raycaster | unused | |
| [emre-aki/raycast.js](https://github.com/emre-aki/raycast.js) | Emre Akı | **GPL-3.0** | Raycaster | unused | |
| [yurkagon/ReactCasting](https://github.com/yurkagon/ReactCasting) | yurkagon | unverified | Raycaster | unused | |
| [ahuth/raycast](https://github.com/ahuth/raycast) | Adam Hutchinson | unverified | Raycaster | unused | |
| [AndrewB330/MusicMarbles](https://github.com/AndrewB330/MusicMarbles) | Andrew B | MIT | Marble music | unused | |
| [yomboprime/marbleMachine](https://github.com/yomboprime/marbleMachine) | yomboprime | unverified | Marble music | unused | |
| [piellardj/reaction-diffusion-webgl](https://github.com/piellardj/reaction-diffusion-webgl) | Jérémie Piellard | MIT | Reaction-diffusion | unused | |
| [jasonwebb/reaction-diffusion-playground](https://github.com/jasonwebb/reaction-diffusion-playground) | Jason Webb | **CC BY-NC-SA 4.0** | Reaction-diffusion | unused | |
| [linusmossberg/reaction-diffusion](https://github.com/linusmossberg/reaction-diffusion) | Linus Mossberg | unverified | Reaction-diffusion | unused | |
| [colejd/Reaction-Diffusion-ThreeJS](https://github.com/colejd/Reaction-Diffusion-ThreeJS) | Jonathan Cole | unverified | Reaction-diffusion | unused | |
| [jasonwebb/morphogenesis-resources](https://github.com/jasonwebb/morphogenesis-resources) | Jason Webb | **None** | Bibliography | unused | |
| [jasonwebb/2d-diffusion-limited-aggregation-experiments](https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments) | Jason Webb | unverified | DLA | unused | |
| [LanLou123/Webgl-Erosion](https://github.com/LanLou123/Webgl-Erosion) | LanLou123 | MIT | Erosion | unused | |
| [weigert/SimpleHydrology](https://github.com/weigert/SimpleHydrology) | Nicholas Weigert | MIT | Erosion | unused | |
| [bshishov/UnityTerrainErosionGPU](https://github.com/bshishov/UnityTerrainErosionGPU) | Boris Shishov | unverified | Erosion | unused | |
| [electricsquare/raymarching-workshop](https://github.com/electricsquare/raymarching-workshop) | Electric Square | MIT | SDF/raymarch | unused | |
| [shader-park/shader-park-core](https://github.com/shader-park/shader-park-core) | Shader Park | MIT | SDF/raymarch | unused | |
| [JiepengTan/FishManShaderTutorial](https://github.com/JiepengTan/FishManShaderTutorial) | Jiepeng Tan | unverified | SDF/raymarch | unused | |
| [danielchasehooper/ShapeUp-public](https://github.com/danielchasehooper/ShapeUp-public) | Daniel Hooper | unverified | SDF/raymarch | unused | |
| [Hsin-Hung/N-body-simulation](https://github.com/Hsin-Hung/N-body-simulation) | Hsin-Hung | unverified | N-body | unused | |
| [alvinng4/grav_sim](https://github.com/alvinng4/grav_sim) | Alvin Ng | unverified | N-body | unused | |
| [nicosmo/cosmic_web_explorer](https://github.com/nicosmo/cosmic_web_explorer) | nicosmo | unverified | N-body | unused | |
| [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | Pavel Dobryakov | MIT | Fluid | unused | |
| [matsuoka-601/WebGPU-Ocean](https://github.com/matsuoka-601/WebGPU-Ocean) | matsuoka-601 | MIT | Fluid | unused | |
| [sandydoo/flux](https://github.com/sandydoo/flux) | Sander Melnikov | MIT | Fluid | unused | |
| [piellardj/navier-stokes-webgl](https://github.com/piellardj/navier-stokes-webgl) | Jérémie Piellard | **None** | Fluid | unused | |
| [Habrador/Ten-Minute-Physics-Unity](https://github.com/Habrador/Ten-Minute-Physics-Unity) | Erik Nordeus | MIT | Cloth/XPBD | unused | |
| [diwi/PixelFlow](https://github.com/diwi/PixelFlow) | Thomas Diewald | MIT | Softbody/GPU | unused | |
| [sam007961/FastMassSpring](https://github.com/sam007961/FastMassSpring) | sam007961 | unverified | Cloth | unused | |
| [Ninjajie/Fusion](https://github.com/Ninjajie/Fusion) | Ninjajie | unverified | Cloth/PBD | unused | |
| [amandaghassaei/OrigamiSimulator](https://github.com/amandaghassaei/OrigamiSimulator) | Amanda Ghassaei | MIT | Origami | unused | |
| [oriedita/oriedita](https://github.com/oriedita/oriedita) | Oriedita | unverified | Origami | unused | |
| [zzhuyii/OrigamiSimulator](https://github.com/zzhuyii/OrigamiSimulator) | Yi Zhu | unverified | Origami | unused | |
| [olawlor/AuroraRendererUnity](https://github.com/olawlor/AuroraRendererUnity) | Orion Lawlor | unverified | Aurora | unused | |
| [lun0522/AuroraSketcher](https://github.com/lun0522/AuroraSketcher) | lun0522 | unverified | Aurora | unused | |
| [unconed/NeverSeenTheSky](https://github.com/unconed/NeverSeenTheSky) | Steven Wittens | **None** | Aurora | unused | |
| [ksd3/aurorasim](https://github.com/ksd3/aurorasim) | ksd3 | unverified | Aurora | unused | |
| [luciopaiva/chladni](https://github.com/luciopaiva/chladni) | Lucio Paiva | **None** | Chladni | unused | |
| [nolangz/3D-Chladni](https://github.com/nolangz/3D-Chladni) | nolangz | unverified | Chladni | unused | |
| [hilbertcube/Chladni-Patterns-Generator](https://github.com/hilbertcube/Chladni-Patterns-Generator) | hilbertcube | unverified | Chladni | unused | |
| [addiebarron/chladni](https://github.com/addiebarron/chladni) | Addie Barron | unverified | Chladni | unused | |
| [Nikorasu/PyNAnts](https://github.com/Nikorasu/PyNAnts) | Nikorasu | **GPL-3.0** | Ant colony | unused | |
| [nilsgollub/AntSim_V2](https://github.com/nilsgollub/AntSim_V2) | Nils Gollub | unverified | Ant colony | unused | |
| [Nikorasu/NantArray](https://github.com/Nikorasu/NantArray) | Nikorasu | unverified | Ant colony | unused | |
| [BrutPitt/DLAf-optimized](https://github.com/BrutPitt/DLAf-optimized) | BrutPitt | unverified | DLA | unused | |
| [jstrait/city-tour](https://github.com/jstrait/city-tour) | Joel Strait | MIT | City | unused | |
| [a-b-street/abstreet](https://github.com/a-b-street/abstreet) | A/B Street | unverified | City/traffic | unused | |
| [AndyQ/MetalCity](https://github.com/AndyQ/MetalCity) | Andy Qua | unverified | City | unused | |
| [TheDuckCow/godot-road-generator](https://github.com/TheDuckCow/godot-road-generator) | Patrick W. Crawford | unverified | Roads | unused | |
| [tuqire/webcam-particles](https://github.com/tuqire/webcam-particles) | Tuqire Hussain | **None** | Webcam particles | unused | |
| [tensorflow/tfjs-models](https://github.com/tensorflow/tfjs-models) | Google / TensorFlow | Apache-2.0 | Depth estimation | unused | |
| [evanw/webgl-water](https://github.com/evanw/webgl-water) | Evan Wallace | **None** | Wave tank | unused | |
| [toruseo/UXsim](https://github.com/toruseo/UXsim) | Toru Seo | unverified | Traffic | unused | |
| [cityflow-project/CityFlow](https://github.com/cityflow-project/CityFlow) | CityFlow | unverified | Traffic | unused | |
| [davidbau/seedrandom](https://github.com/davidbau/seedrandom) | David Bau | MIT | Seeded RNG | unused | |

---

## 5. Attribution templates

### CREDITS.md — ship one per project

```markdown
# Credits

This project was built by studying the following open work. Where code was used
directly it is marked; everything else is technique learned and reimplemented.

## Code used
- [nicoptere/physarum](https://github.com/nicoptere/physarum) by Nicolas Barradeau —
  Unlicense (public domain). Agent stepping and trail-deposit loop, adapted.

## Technique learned, reimplemented
- [SebLague/Slime-Simulation](https://github.com/SebLague/Slime-Simulation) by
  Sebastian Lague — the sense-rotate-move formulation.
- [fogleman/physarum](https://github.com/fogleman/physarum) by Michael Fogleman —
  parameter presets and palette approach.

## Papers
- Jones, J. (2010). "Characteristics of pattern formation and evolution in
  approximations of Physarum transport networks."
```

### In-code header — where you adapted something

```js
// Agent stepping adapted from nicoptere/physarum (Unlicense)
// https://github.com/nicoptere/physarum
// Surface-space adaptation and seam handling are original.
```

### Outreach message — short, specific, no ask attached

> Hi <name> — I'm building a WebGL piece that runs a physarum simulation across the
> surface of a 3D mesh (a cortex model I made) instead of a flat plane. Your <repo>
> was where I learned <specific thing>. Two questions if you have a minute: is there
> anything you'd want credited beyond a link, and did you ever try running it on a
> non-planar surface? Happy to send you the result either way.
>
> — Sean

Why this works: it's specific, it proves you read the code, it doesn't ask for
permission you don't need, and it gives them an easy interesting question. If the repo
has no license, add one line: *"There's no LICENSE file on the repo — would you be OK
with me adapting parts of it, and how would you like to be credited?"*

---

## 6. Outreach tracker

| Person | Repo | Why them | Sent | Reply |
|---|---|---|---|---|
| Jason Webb | [morphogenesis-resources](https://github.com/jasonwebb/morphogenesis-resources) | Maintains the field's bibliography so people build on it. Note: his RD repo is NC-licensed, so ask before using | ☐ | |
| Amanda Ghassaei | [OrigamiSimulator](https://github.com/amandaghassaei/OrigamiSimulator) | Researcher, MIT-licensed, publishes to be built on. Highest-value reply available | ☐ | |
| Max Bittker | [sandspiel](https://github.com/MaxBittker/sandspiel) | Deep in creative-coding, responsive, MIT | ☐ | |
| Michael Fogleman | [physarum](https://github.com/fogleman/physarum), [dlaf](https://github.com/fogleman/dlaf) | Prolific, generous with technique, both MIT | ☐ | |
| Nicolas Barradeau | [nicoptere/physarum](https://github.com/nicoptere/physarum) | **Project A depends on his code.** Unlicense so no permission needed — credit him anyway | ☐ | |
| Robert Leitl | [ferrofluid](https://github.com/robert-leitl/ferrofluid) | Small account, exact same stack, hardest thing here to solve alone | ☐ | |
| Jérémie Piellard | [piellardj](https://github.com/piellardj) | A dozen clean WebGL sims. Mixed licenses — some MIT, some none | ☐ | |
| Orion Lawlor | [AuroraRendererUnity](https://github.com/olawlor/AuroraRendererUnity) | Wrote the aurora paper *and* the renderer. Academic, email is normal | ☐ | |
| MisterPrada | [singularity](https://github.com/MisterPrada/singularity) | **No license on the repo** — must ask if you want to use it | ☐ | |
| Evan Wallace | [webgl-water](https://github.com/evanw/webgl-water) | **No license.** Also built Figma's renderer and esbuild | ☐ | |
| Sebastian Lague | [SebLague](https://github.com/SebLague) | Six entries cite him. Unlikely to reply at his scale; repos exist to be learned from | ☐ | |
| David McLaughlin | [SlimeMoldPhysarum](https://github.com/DavidMcLaughlin208/SlimeMoldPhysarum) | Six stars, a million particles. Will be delighted you noticed | ☐ | |

---

## 7. Verify a license yourself

Star counts drift and maintainers relicense. Before you lift code:

1. Open the repo and look at the right sidebar under **About** — a license shows there.
2. No sidebar entry? Look for `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `COPYING`, or a
   licence section at the bottom of the README. GitHub only detects standard files, so a
   custom licence often hides in the README.
3. Still nothing? **Assume all rights reserved.** Public does not mean free to use.
4. `UNVERIFIED` in §4 means I didn't check — not that it's safe.

**Quick sanity rules**

- MIT / BSD / Apache / Unlicense / zlib → use it, keep the copyright notice.
- GPL-3.0 → your project becomes GPL-3.0 if you use the code. Fine if you're open-sourcing
  anyway; not fine for a portfolio piece you might commercialise later.
- CC BY-NC-\* → never in anything monetized.
- No license → read to learn, write your own, or ask.

---

## Changelog

- **2026-08-18** — Master doc created. Verified 41 licenses. Five earlier recommendations
  corrected (see §1): Lague's slime sim is GPL-3.0, Jason Webb's RD playground is
  CC BY-NC-SA, sandboxels is non-commercial, MisterPrada's black hole has no license,
  raycast.js is GPL-3.0. Project A's source stack rebuilt around the Unlicense physarum.
- **2026-07-18** — Original ranking of 26 ideas with 92 repos, licenses unchecked.
