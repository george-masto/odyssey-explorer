# Odyssey Explorer

An interactive atlas of Odysseus's voyage home: a cinematic map you sail stop-by-stop
from Troy to Ithaca, with the ancient Greek text, public-domain translations,
etymology, sourced tidbits, and 2,500 years of art at every landfall.

**Status: M1 (the spine) — private preview. Complete-then-launch: no public URL until
all 17 wanderings stops are fully authored.**

The full approved design lives at
`~/.gstack/projects/odyssey_interactive/gmm-nobranch-design-20260814-164515.md`
(five pillars, NOW toggle spec, interaction grammar, milestones M1–M5, rights chain).
The five marquee interlinear passages are documented in
[docs/marquee-passages.md](docs/marquee-passages.md).

## Stack

- **SvelteKit + adapter-static** — every stop prerenders to a real URL
  (`/stop/scylla-charybdis`); no backend anywhere.
- **MapLibre GL JS** — vector map with flyTo camera choreography.
  M1 uses OpenFreeMap's hosted tiles (dev convenience); M2 swaps in the self-hosted
  PMTiles Mediterranean extract + custom dark-nautical and parchment styles.
- **Content as data** — one Markdown+frontmatter file per stop in
  [content/stops/](content/stops/), parsed at build (`src/lib/data/stops.ts`).
  Crew-ticker arithmetic convention is documented in the Scylla stop's frontmatter.

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
- [ ] **M2 — Signature**: parchment pane + camera sync, polytonic glyphs, NOW toggle v1.
- [ ] **M3 — Ceiling**: one fully deep stop (Scylla) locks the content schema.
- [ ] **M4 — The Lake**: all 17 stops fully authored (Greek, translation, tidbits, art).
- [ ] **M5 — Polish & launch**: OG cards, a11y ≥ 95, citation checker, colophon, launch.

## Rights

Systematic text is public domain (A.T. Murray 1919, Samuel Butler 1900 + the ancient
Greek). Art via Wikimedia Commons (PD/CC with attribution). Base map data © OpenStreetMap
contributors (ODbL) via OpenFreeMap/OpenMapTiles. Satellite patches (M2+) will carry
"Contains modified Copernicus Sentinel data [year]". Full manifest lands with M4.
