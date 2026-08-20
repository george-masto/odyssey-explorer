# Odyssey Explorer — engineering brief

Interactive atlas of Odysseus's 17-landfall voyage. **Live** at
https://georgemasto.com/odyssey (proxied; standalone at
https://odyssey-explorer.vercel.app/odyssey). Public repo. Launched Aug 2026.

## Commands

```bash
npm run dev                        # localhost:5173/odyssey (note the base path)
npm run check                      # svelte-check — keep at 0 errors
npm run build                      # prerenders everything into build/
node scripts/validate-content.mjs  # content checks CI runs — must pass
node scripts/perseus.mjs grc 12 85 92   # extract exact Greek (also: eng|butler <book> <line>)
node scripts/generate-og.mjs       # regenerate social cards (see gotchas)
npx vercel deploy --prod           # manual deploy (normally: push to main auto-deploys)
```

## Non-negotiable invariants (CI enforces most)

1. **Greek is never typed from memory.** Every excerpt line comes from the vendored
   Perseus TEI (`sources/perseus/`) via `scripts/perseus.mjs`. The validator
   re-extracts and fails on one character of drift.
2. **Every stop is complete**: excerpt + full word-by-word `interlinear` (tokens must
   rejoin the line exactly), ≥3 sourced tidbits, etymology, attributed art, `now_today`.
3. **Rights**: PD/CC only for systematic content; never NC/ND for art (validator
   rejects). Modern copyrighted translations (Wilson/Fagles) may be *mentioned*, never
   systematically displayed. Credits live on `/about` + README.
4. **North is always up; one map, no split screen; discrete stop-to-stop sailing** —
   these were explicit user decisions after live testing. Don't re-litigate.
5. Kit config (adapter, `paths.base: '/odyssey'`) lives in **svelte.config.js only** —
   options passed to the `sveltekit()` vite plugin silently override the entire file.

## Hard-won gotchas (each cost a real debugging session)

- **MapLibre worker**: dev needs `optimizeDeps.exclude: ['maplibre-gl']`
  (vite.config.ts) AND production needs `src/lib/map/worker.ts`
  (`?worker&url` + `setWorkerUrl`) — without the latter, maps construct but never
  load (silent worker 404). The dev fix does NOT cover production.
- **Verify the PRODUCTION build in a REAL browser** before calling any map change
  done: `npm run preview` then a real/headed browser. curl only sees HTML; the
  Claude in-app pane never fires requestAnimationFrame (maps stall); default
  headless chromium has no WebGL. `BROWSE_HEADED=1` with gstack browse works.
- **Both `/odyssey` and `/odyssey/` must return 200** on both hosts — link scrapers
  die on redirects (this killed OG previews once). Don't reintroduce
  `trailingSlash` config; the personal-site proxy (see Deploy) has explicit
  rewrites for both forms.
- **OG cards** (`static/og/`) render with macOS system fonts — regenerate locally and
  commit the PNGs (CI doesn't rebuild them). When `site.png` changes, bump the
  `?v=N` on `og:image` in `src/routes/(voyage)/+page.svelte` to bust scraper caches.
- **Map style land/water**: openmaptiles has no all-zoom land polygons — background
  color IS the land, water paints on top. Region toponyms are zoom-gated per-feature
  (`['>=',['zoom'],['get','minzoom']]`) and styled as spaced caps so they can't be
  mistaken for stop labels (a real mobile complaint).
- Label sizes scale 1.3× on small screens via `explorerStyle(textScale)`.

## Architecture in one breath

SvelteKit static (`(voyage)` route group = map shell; `/about` standalone), one
MapLibre map with two layer groups toggled by the era switch (`a-*` ancient
parchment / `m-*` EOX Sentinel-2 satellite + modern labels; state in
`src/lib/state/now.svelte.ts`, N key). Content: one Markdown+frontmatter file per
stop in `content/stops/` (schema exemplar: `12-scylla-charybdis.md`), parsed at
build by `src/lib/data/stops.ts`. Components: `VoyageMap` (map, painted-trireme
marker `src/lib/assets/ship.png`, sail animation `src/lib/map/animate.ts`),
`MiniMap` (fixed-frame inset, blue dot), `StoryRail` (+ `Excerpt` tap-gloss,
`EtymologyCard`), `Onboarding` (first-visit tour, localStorage
`odyssey-onboarded-v1`).

## Deploy

Push to `main` → Vercel project `odyssey-explorer` auto-builds (~15s) → live.
vercel.json nests output under `/odyssey/`. georgemasto.com/odyssey is TWO rewrite
rules in the SEPARATE personal-site repo (`~/Documents/personal_dev/website`,
george-masto/website) proxying to odyssey-explorer.vercel.app — `/odyssey` and
`/odyssey/` both, before its catch-all.

## Backlog (designed, not built — see full design doc*)

Telemachy stops (Ithaca-departure, Pylos — real Nestor's palace, Sparta);
Epilogues/Telegony (Elis, Thesprotia oar-journey, Telegonus, Aeaea coda,
Dante's last voyage); audio layer (hypotactic.com recordings — **verify license
first**); voyage/poem dual-order toggle (both indices already in data).

\* Full design history (premises, amendments, review trail):
`~/.gstack/projects/odyssey_interactive/gmm-nobranch-design-20260814-164515.md`
on the original dev machine (not in this public repo).
