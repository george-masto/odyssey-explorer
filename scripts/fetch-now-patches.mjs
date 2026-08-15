// Fetch one Sentinel-2 "NOW" satellite patch per geographic stop.
//
// Source: Earth Search STAC API (Element84, no auth) → sentinel-2-l2a visual
// (TCI) Cloud-Optimized GeoTIFFs on AWS open data. We window-read ~20 km around
// each stop via HTTP range requests (geotiff.js picks the right overview) and
// write a JPEG + a manifest MapLibre uses as `image` sources when NOW is on.
//
// Licence: Copernicus Sentinel data — patches must be credited
// "Contains modified Copernicus Sentinel data [year]" (design premise 2).
//
// Usage: node scripts/fetch-now-patches.mjs [stop-id ...]   (default: all geographic stops)

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import jpeg from 'jpeg-js';
import { parse as parseYaml } from 'yaml';

const STAC = 'https://earth-search.aws.element84.com/v1/search';
const OUT_DIR = 'static/now';
const SIZE = 1024; // output px
const HALF_LAT = 0.09; // ~10 km half-height

const stops = readdirSync('content/stops')
	.filter((f) => f.endsWith('.md'))
	.map((f) => {
		const src = readFileSync(`content/stops/${f}`, 'utf8');
		return parseYaml(/^---\n([\s\S]*?)\n---/.exec(src)[1]);
	})
	.filter((s) => s.certainty !== 'mythic'); // mythic-stop contract: no NOW imagery

const only = process.argv.slice(2);
const targets = only.length ? stops.filter((s) => only.includes(s.id)) : stops;

function patchBBox(stop) {
	const { lat, lng } = stop.coords;
	const halfLng = HALF_LAT / Math.cos((lat * Math.PI) / 180);
	return [lng - halfLng, lat - HALF_LAT, lng + halfLng, lat + HALF_LAT]; // W,S,E,N
}

async function findItem(bbox) {
	const res = await fetch(STAC, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			collections: ['sentinel-2-l2a'],
			bbox,
			datetime: '2024-01-01T00:00:00Z/..',
			query: { 'eo:cloud_cover': { lt: 8 } },
			sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }],
			limit: 8
		})
	});
	if (!res.ok) throw new Error(`STAC ${res.status}`);
	const { features } = await res.json();
	// Prefer a scene that fully contains the patch (avoids black tile-edge seams).
	const contains = (f) =>
		f.bbox[0] <= bbox[0] && f.bbox[1] <= bbox[1] && f.bbox[2] >= bbox[2] && f.bbox[3] >= bbox[3];
	return features.find(contains) ?? features[0];
}

async function fetchPatch(stop) {
	const bbox = patchBBox(stop);
	const item = await findItem(bbox);
	if (!item) throw new Error('no scene found');
	const epsg = item.properties['proj:epsg'] ?? item.properties['proj:code']?.replace('EPSG:', '');
	if (!epsg) throw new Error('no EPSG on item');
	const toUtm = proj4('EPSG:4326', `+proj=utm +zone=${String(epsg).slice(-2)} +datum=WGS84 +units=m +no_defs`);
	const [w, s] = toUtm.forward([bbox[0], bbox[1]]);
	const [e, n] = toUtm.forward([bbox[2], bbox[3]]);

	const tiff = await fromUrl(item.assets.visual.href);
	const raster = await tiff.readRasters({
		bbox: [w, s, e, n],
		samples: [0, 1, 2],
		width: SIZE,
		height: SIZE,
		interleave: true
	});

	const rgba = Buffer.alloc(SIZE * SIZE * 4);
	for (let i = 0, j = 0; i < SIZE * SIZE; i++, j += 3) {
		rgba[i * 4] = raster[j];
		rgba[i * 4 + 1] = raster[j + 1];
		rgba[i * 4 + 2] = raster[j + 2];
		rgba[i * 4 + 3] = 255;
	}
	const { data } = jpeg.encode({ data: rgba, width: SIZE, height: SIZE }, 82);
	writeFileSync(`${OUT_DIR}/${stop.id}.jpg`, data);

	return {
		url: `/now/${stop.id}.jpg`,
		// WGS84 corners TL,TR,BR,BL for the maplibre image source
		coordinates: [
			[bbox[0], bbox[3]],
			[bbox[2], bbox[3]],
			[bbox[2], bbox[1]],
			[bbox[0], bbox[1]]
		],
		scene: item.id,
		cloud: item.properties['eo:cloud_cover'],
		datetime: item.properties.datetime
	};
}

mkdirSync(OUT_DIR, { recursive: true });
let manifest = {};
try {
	manifest = JSON.parse(readFileSync(`${OUT_DIR}/manifest.json`, 'utf8'));
} catch {
	/* fresh manifest */
}

for (const stop of targets) {
	process.stdout.write(`${stop.id} … `);
	try {
		manifest[stop.id] = await fetchPatch(stop);
		console.log(`ok (${manifest[stop.id].scene}, cloud ${manifest[stop.id].cloud?.toFixed(1)}%)`);
	} catch (err) {
		console.log(`FAILED: ${err.message}`);
	}
}
writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, '\t'));
console.log(`\nmanifest: ${Object.keys(manifest).length} patches`);
