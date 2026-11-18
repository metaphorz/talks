# Modeling — An Introduction

The first of three talks (`modeling`, `flcatmodeling`, `flcatmodels`). It introduces modeling with
models the audience already knows (sandbox, Tinkertoys, LEGO, the Bourton-on-the-Water model
village), then moves to the first of three kinds of model: **knowledge models**. Same engine and
look as `ai1`: a fixed 1280×720 stage, step builds, presenter view (P), fullscreen (F).

Serve it over HTTP so the live apps can talk to the deck (`python3 -m http.server` in `talks/`),
or use the published page.

## The slides

| # | Slide | What moves or responds | Source |
|---|---|---|---|
| 1 | Title | 40 blocks morph: a house → a village with a copy of itself → a graph | new |
| 2 | We Learn by Modeling | build | `ai1` slide 3 |
| 3 | What Is a Model? | flowing look/test loop; four properties build in | new |
| 4 | A Model of a Model of a Model | zoom 1:1 → 1:9 → 1:81 → ≈1:729 | `deeplookingweek3` |
| 5 | What Does a Model Keep? | drag cards into kept / lost | `deeplookingweek3` |
| 6 | Three Kinds of Model | kinds 2 and 3 are placeholders | new |
| 7 | The Same Village, as Knowledge | each sentence highlights, becomes triples, grows the graph | new |
| 8 | One Village, Four Maps | 12 concepts glide between semantic net / concept map / mind map / knowledge graph; click a node | new (extends `ai1` 1D) |
| 9 | Sentences Become Triples | runs itself: words fly into subject / relation / object slots | new |
| 10 | Let AI Build the Model | **live** `apps/kgmaker`; buttons send a passage into the app | `~/code/ai/knowledgegraphs/knowledgegraph1` |
| 11 | A Model of How Scholars Kept Books | **live** `apps/bookcases` | `~/code/ai/knowledgegraphs/bookcases` |
| 12 | From a Document to a Graph | pipeline stages light with the builds | `knowledgegraph2` (robert-mcdermott/ai-knowledge-graph) |
| 13 | The Industrial Revolution, as a Graph | **live** `apps/industrial` | `knowledgegraph2/outputs/test-openrouter.html` |
| 14 | Two Models of One Village | stone vs statements, row by row | new |
| 15 | Resources | links | new |

## The live apps (`apps/`)

Copies, so the originals in `~/code/ai/knowledgegraphs` are untouched. Each slide loads its app
the first time it is shown (`data-src`), so the presenter preview never loads them twice.
Apps are drawn at full size and scaled onto the page; “Open full size ↗” opens them in a tab.

- `kgmaker/` — changes from the original: no `config.js`; the OpenRouter key is typed into a field
  and kept in that browser's localStorage only (never in the published page); model list updated to
  Claude Sonnet 5.5, GPT-5.6 Sol, Gemini 3.8 Flash, Grok 4.7; accepts a passage from the deck by
  `postMessage`; vis-network pinned to 9.1.9.
- `bookcases/` — photos resized to 1000 px; the 9 MB animated GIF replaced by its first frame.
- `industrial/` — vis loaded from cdnjs (4.21.0) instead of `../node_modules`.

When an app has keyboard focus, arrow keys stay in the app; click the paper margin to return to the
deck. A clicker's Page Up / Page Down still moves the deck.
