// MapLibre's minified dist computes its worker URL dynamically, so bundlers
// can't emit the worker file — in production every map silently dies with a
// 404 on maplibre-gl-worker.mjs. Vite's `?worker&url` bundles the worker WITH
// its relative dep graph (maplibre-gl-shared.mjs) into one self-contained
// chunk; setWorkerUrl points MapLibre at it. Import this module before any
// Map is constructed.
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
