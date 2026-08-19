# Odyssey Explorer

An interactive atlas of Odysseus's voyage home: a cinematic map you sail stop-by-stop
from Troy to Ithaca, with the ancient Greek text, public-domain translations,
etymology, sourced tidbits, and 2,500 years of art at every landfall.

**Live at [georgemasto.com/odyssey](https://georgemasto.com/odyssey)** (proxied from the
personal-site Vercel project; standalone at
[odyssey-explorer.vercel.app/odyssey](https://odyssey-explorer.vercel.app/odyssey)).

The full approved design lives at
`~/.gstack/projects/odyssey_interactive/gmm-nobranch-design-20260814-164515.md`
(five pillars, NOW toggle spec, interaction grammar, milestones M1–M5, rights chain).
The five marquee interlinear passages are documented in
[docs/marquee-passages.md](docs/marquee-passages.md).

## Stack

- **SvelteKit + adapter-static** — every stop prerenders to a real URL
  (`/stop/scylla-charybdis`); no backend anywhere.
- **MapLibre GL JS, one map, two worlds** — a single north-locked map whose NOW
  toggle (N key) swaps whole layer groups: the ancient parchment world (polytonic
  toponyms, ink route) ↔ the modern world (EOX Sentinel-2 cloudless satellite +
  modern names + Google Maps links). Vector data via OpenFreeMap hosted tiles.
- **Content as data** — one Markdown+frontmatter file per stop in
  [content/stops/](content/stops/), parsed at build (`src/lib/data/stops.ts`):
  CTS-verified Greek excerpts, Murray 1919 translation, tap-a-word interlinear on
  the five marquee passages, etymology chains, sourced tidbits, PD/CC art with
  attribution. Greek is extracted from the vendored Perseus TEI editions in
  [sources/perseus/](sources/perseus/) via `node scripts/perseus.mjs` — never
  typed from memory.
- **Credits** — every licence and artwork attributed on [/about](src/routes/about/+page.svelte).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # svelte-check
npm run build      # prerenders all 18 pages into build/
```

Gotcha: `maplibre-gl` must stay in `optimizeDeps.exclude` (vite.config.ts) — Vite's
dep optimizer 404s its web worker in dev.

## Milestones

- [x] **M1 — Spine**: 17 thin stops, route line, ship + arrow/click/marker sailing,
      per-stop prerendered URLs, mobile stack.
- [x] **M2 — Signature**: parchment cartography with polytonic toponyms (OpenFreeMap
      Noto glyphs), NOW toggle, mobile bottom sheet. (The M2 dual-pane layout and
      per-stop satellite patches were replaced after user testing — see below.)
- [x] **M2.5 — Restructure from testing feedback**: ONE north-locked map; NOW swaps
      ancient ↔ modern worlds; full EOX Sentinel-2 cloudless basemap; Google Maps
      link per stop.
- [x] **M3 — Ceiling**: deep-content schema locked on Scylla (excerpt, interlinear,
      etymology, tidbits, art).
- [x] **M4 — The Lake**: all 17 stops fully authored (CTS-verified Greek, Murray,
      tidbits with citations, etymology, PD/CC art).
- [x] **M5 — Polish & deploy**: 18 generated OG cards (`scripts/generate-og.mjs`),
      Lighthouse a11y 96/100 (stop pages / about; the one residual flag is the
      inline Greek word buttons — WCAG 2.5.8 inline-target exemption), citation
      checker in CI, deployed to Vercel behind `georgemasto.com/odyssey`.

## Deploy

The Vercel project is `odyssey-explorer` (static build nested under `/odyssey/`,
see vercel.json). Deploy with:

```bash
npx vercel deploy --prod
```

georgemasto.com/odyssey is a rewrite in the personal-site repo's vercel.json
proxying to `odyssey-explorer.vercel.app/odyssey/:path*`. To make pushes to
`main` auto-deploy instead: grant the Vercel GitHub app access to this repo
(github.com/apps/vercel → Configure), then run `npx vercel git connect`.

Regenerate OG cards after content changes (`node scripts/generate-og.mjs`, commit
the PNGs — they render with macOS system fonts and are not rebuilt in CI).

## Rights

Systematic text is public domain (A.T. Murray 1919, Samuel Butler 1900 + the ancient
Greek). Art via Wikimedia Commons (PD/CC with attribution). Base map data © OpenStreetMap
contributors (ODbL) via OpenFreeMap/OpenMapTiles. Satellite patches (M2+) will carry
"Contains modified Copernicus Sentinel data [year]". Full manifest lands with M4.
