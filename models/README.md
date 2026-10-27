# Models of Amelia Island

A presentation of the nine browser models of Amelia Island, built with the same deck engine and
methods as `~/code/talks/ai1` and `ai2`: a fixed 1280×720 stage, paper-and-teal theme, step builds,
presenter view, and live motion graphics and interactive diagrams on most slides. There is also a
one-page 3×3 poster.

Open `index.html` directly in a browser. It needs no server and no build step; only the Google font
needs a network connection. Open `poster.html` the same way, or use the rendered `poster.pdf` / `poster.png`.

| Key | Action |
|---|---|
| → / space / click | next build or slide (click the left fifth to go back) |
| ← | back |
| ↑ ↓ | whole slides |
| number + Enter | jump to a slide |
| F | fullscreen |
| P | presenter window with notes, next slide and timer |
| M | music on the title slide |

## Files

| File | Role |
|---|---|
| `index.html` | All 21 slides, their markup and per-slide CSS. Speaker notes are in each slide’s `<aside class="notes">`. |
| `slides.js` | Title animation, music and every interactive or simulated diagram. |
| `deck.js`, `deck.css` | The deck engine, copied unchanged from `talks/ai2`: transport, builds (`data-b`), magic move, linked hover (`data-lens`), presenter view, print. |
| `data.js` | Generated real data: island polygons, the sea-level curve, 14,034 tree points. Do not edit. |
| `src/build_data.py` | Regenerates `data.js` from the model folders in `~/code/ameliaisland`: `python3 src/build_data.py` |
| `poster.html` | The 3×3 poster. It is a fixed 1800×2700 sheet (2:3, prints as 24×36 in) and draws the island from `data.js`. |
| `poster.pdf`, `poster.png` | The poster rendered by headless Chrome. |
| `img/`, `video/`, `audio/` | Assets copied or derived from the model folders (see Provenance). |

`slides.js` loads **before** `deck.js`. Slides 3 and 5 create their build steps in script, and
`deck.js` counts the builds when it starts.

## The slides

| # | Slide | What moves or responds | Source in `~/code/ameliaisland` |
|---|---|---|---|
| 1 | Title | Canvas: the real island outline, wave crests from the NE, sand grains drifting south (longshore drift), beach ridges pulsing, pulses running along leaders to nine labelled places. Music: “The Luminous Tide — Arrival”. | geomorphology `snapshots.geojson`; oak `assets/audio` |
| 2 | One Island, Nine Models | 3×3 tiles; clicking one (or auto-cycling) shows what it asks, its method and what it was built with, and pings its pin on the island map. | all READMEs and plans |
| 3 | From a Stone to an Ice Age | Log–log chart of spatial size × time covered; models pop in smallest first; hover highlights. | derived from each model’s scope |
| 4 | 125,000 Years on One Slider | A log-time slider, play button and draggable sea-level chart. The real polygons switch by era: core, migrating sandbar (morphed point-for-point from the 8 ka to the 6 ka shape), Holocene wedge by age, marsh, ridges, jetties. The sea turns to dry shelf at the lowstand. The era captions are the app’s own. | geomorphology `viewer.js` ERAS, `data/` |
| 5 | When the Sea Slowed Down | Bars of the rate of sea-level rise computed from the curve, with the ~2 mm/yr threshold and the weld. A west→east cross-section builds in four steps: core, sea, sandbar, weld and marsh. | geomorphology paper §Narrative |
| 6 | Growing a Coast from Waves | A live one-line Ashton–Murray model (CERC flux, plus hyperdiffusion for stability), a live wave rose and the climate diffusivity μ₂. The app’s four presets plus a labelled high-angle end-member. | drumstick `js/physics`, paper §Wave climate |
| 7 | Three Ways to Make a Barrier | Three looping sketches: de Beaumont, Hoyt, Fisher. Then the 8,000-year run and the validation table. | drumstick paper |
| 8 | Water Comes and Goes | The app’s illustrative tide (R = 1.83 m, 12.42 h). A draggable chart drives a marsh cross-section: flooding cordgrass, fish, and a heron that wades at the water’s edge. | Egans Creek `src/science.js`, PLAN.md |
| 9 | A Model That Says What It Knows | Three claim levels. The app’s `depth()` datum guard runs live: MLLW−MLLW works and MLLW−NAVD88 throws. Three AI builds of the creek. | Egans Creek PLAN, RESEARCH, `chatgpt/`, `gemini4/` |
| 10 | 14,034 Trees in One City | Every city-inventory point is replanted on canvas over the island. Hovering a species isolates it; a toggle shows dead records; the species bars grow; the condition strip. | Tree Atlas `data/fernandina-trees.geojson` |
| 11 | A Tree Shaped by Salt Wind | A 2-D live oak grown from the app’s rules: crown dome, salt-shear ramp (thin shoots die to stubs, thick limbs flatten), flagging, leeward lean, buttressed roots, moss away from the salt face. Compass dial, sliders, skeleton view, grow animation. | oak README, `docs/` |
| 12 | One Skeleton, Three Renderers | Three.js and Unreal orbit videos; the pipeline cards light with the renderer; animated light-seeking bars. | oak `oak_orbit_*.mp4`, README tables |
| 13 | A Stone Full of Holes | The app’s seeded Fourier profile (same generator and formula as `model.js`) morphs as the sliders move. Photo vs model; the seven density passes. | wormstone `model.js`, `validation/` |
| 14 | Light Through Moving Water | A CPU version of the photon idea: a wave heightfield plus a vortex dimple; jittered photons are displaced by the surface slope and accumulated. Bright caustics and a black disc. Click to drop a wave. | water `projectplan.md`, `docs/water-nozzles.tex` |
| 15 | Shake the Sliders, Find the Bug | Gaussian variation: z-scores stay fixed while the mean moves, and clipped draws pile on the end stops. The instability: one kick decays with a 22 s e-fold; a kick every step piles up ~1,333×. | water manual §Variation, §Stability |
| 16 | Breeding Victorian Houses | A 3×3 grid of SVG house elevations drawn from genomes, using the app’s palettes and measured odds. Breed, crossover, randomize, gene locks; the genome readout. | victorian `js/genome.js`, `reference/` |
| 17 | Sand That Organizes Itself | A live Werner (1995) slab automaton: hop 5, p = 0.6 / 0.4, 15° shadow (3·tan 15°), avalanching, a hillshade and a profile. Plus the three lines of dune work. | dunes `C#_CellularAutomaton/Model.cs` and ports |
| 18 | Reading the Models Together | A graph of what one model hands another; hovering a link or a node lights its edges. | cross-reading of all nine |
| 19 | How They Were Made | The look → plan → build → verify → write loop (animated) and the evidence each project ships. | each folder’s plan, tests and docs |
| 20 | What Each Model Leaves Out | Each model’s stated limits, paraphrased. | READMEs and papers |
| 21 | Resources | Live sites, sources, papers and the poster. | |

## Methods carried over from AI Parts 1 and 2

- **Look first, then build.** Every slide is grounded in the model’s own folder: its plan, paper,
  data or code. Captions quote the apps’ own text where it exists (era narratives, presets,
  validation numbers, limits).
- **Real data in the motion graphics.** The island on slides 1, 2 and 4, and in the poster, is the
  geomorphology model’s polygons. The sea-level curve is the file that geomorphology and drumstick
  share. The tree map is all 14,034 inventory points.
- **Small live models, not pictures of models.** The drumstick shoreline, the Werner dunes, the
  caustics, the wormstone curve, the oak rules and the house genomes all run in the slide, labelled
  as toy versions where they are.
- **Builds and linked hover.** `data-b` steps reveal diagrams in teaching order; `data-lens`
  links chart elements to their labels.
- **Honesty labels.** “Illustrative cycle”, “conceptual”, “schematic” and “toy” appear wherever
  the source apps use them.

### Notes on the live toys

- **Drumstick.** With the app’s wave sampler, μ₂ is +0.60 for Low-angle, +0.36 for Sea Islands,
  +0.16 for Outer Banks and about 0 for Hatteras. Hatteras sits on the edge of instability (the
  app’s 2-D grid tips it into capes). A “High-angle (theory)” button is added and labelled as such.
  A Node check of the toy gave root-mean-square growth of about 3× for Hatteras, 4–6× for
  high-angle, smoothing for Sea Islands and decay for Low-angle.
- **Water.** These are not WebGL photons. It is a 260×195 CPU heightfield whose slope displaces
  one jittered photon per texel, with an exponential moving average over frames, the same idea at
  small scale.
- **Live oak.** This is a 2-D reinterpretation of the rules in the README and docs, not a port
  of `oakGenerator.js`.

## Provenance of assets

| Asset | From |
|---|---|
| `img/geo-*.jpg` | geomorphology `docs/fig/` (Selenium captures) |
| `img/drum-*.jpg` | drumstick `docs/fig/` |
| `img/eganscreek.jpg` | `talks/ai2/img/` (the Egans Creek atlas) |
| `img/egan-chatgpt.jpg`, `egan-sign.jpg`, `egan-photo*.jpg` | Egans Creek `chatgpt/preview-desktop.png` and Paul’s field photos |
| `img/trees-map.jpg` | rendered from slide 10 (real inventory points) |
| `img/oak-*.jpg`, `video/oak-*.mp4/.jpg` | oak `docs/images/`, Meshy reference image, and the first 16–20 s of the two orbit videos, re-encoded with ffmpeg |
| `img/worm-*.jpg` | wormstone `IMG_1925.jpeg` and `validation/` screenshots |
| `img/water-*.jpg` | water `docs/fig_*.png` |
| `img/vic-*.jpg` | victorian `docs/fig_*.png` |
| `img/dune-ca.jpg`, `dune-field.jpg` | dunes `Javascript_CellularAutomaton/report+slides/simulator_interface.png` |
| `audio/luminous_tide_arrival_loop.m4a` | oak `assets/audio/` (Google Flow Music, © Paul Fishwick) |
| `img/paper.jpg`, `deck.*` | `talks/ai2` |

Attributions follow what each app records: Claude Code (geomorphology, drumstick, Live Oak),
OpenAI Codex (wormstone), both (Egans Creek, Tree Atlas). Water, Victorian and dunes do not name a tool,
so the deck doesn’t either.

## Verification

Headless Chrome loaded every slide over `file://` with all builds shown. There were no console
errors. Screenshots were reviewed, and layout issues found that way were fixed: text overflow,
axis overlap, a floating-point edge at 125 ka, and the build-count load order. A scratch harness
drove the oak, drumstick and other controls to check their states. The poster was rendered to PNG
and to a one-page PDF. For the PDF, soft card shadows are replaced by hairlines, because PDF
engines rasterize the shadows into grey boxes.
