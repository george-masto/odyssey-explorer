import type { StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import ancientToponyms from './ancient-toponyms.json';
import { routeLine, stopsGeoJSON } from '$lib/data/stops';

// Hosted infra (self-hosted PMTiles + GFS Didot glyphs remain a launch-prep
// option; ODbL + EOX attribution required throughout — design premise 2).
const OFM = 'https://tiles.openfreemap.org';
const GLYPHS = `${OFM}/fonts/{fontstack}/{range}.pbf`; // Noto Sans covers polytonic Greek Extended (verified)
const VECTOR_URL = `${OFM}/planet`;

const OFM_ATTR =
	'<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const EOX_ATTR =
	'<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless</a> by <a href="https://eox.at" target="_blank">EOX</a> (Contains modified Copernicus Sentinel data 2025), CC BY-NC-SA 4.0';

/**
 * One map, two worlds (post-M2 user feedback: no split screen, north always up).
 *
 * Layer ids are grouped by prefix and the NOW toggle flips whole groups:
 *   `a-*` — the ancient world: parchment cartography, polytonic toponyms. Default.
 *   `m-*` — the modern world: full Sentinel-2 cloudless basemap + modern names.
 * Hidden raster layers fetch no tiles, so the satellite costs nothing until
 * the reveal.
 */
export function explorerStyle(): StyleSpecification {
	return {
		version: 8,
		name: 'odyssey-explorer',
		glyphs: GLYPHS,
		sources: {
			openmaptiles: { type: 'vector', url: VECTOR_URL, attribution: OFM_ATTR },
			satellite: {
				type: 'raster',
				tiles: [
					'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg'
				],
				tileSize: 256,
				maxzoom: 15,
				attribution: EOX_ATTR
			},
			'ancient-toponyms': { type: 'geojson', data: ancientToponyms as FeatureCollection },
			route: { type: 'geojson', data: routeLine },
			stops: { type: 'geojson', data: stopsGeoJSON }
		},
		layers: [
			// ===== ancient world (default visible) =====
			// Background IS the land (darker vellum); water paints the sea as
			// lighter page — ink-on-paper at every zoom.
			{ id: 'a-bg', type: 'background', paint: { 'background-color': '#e6d7ae' } },
			{
				id: 'a-water',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: { 'fill-color': '#f0e8d2' }
			},
			{
				id: 'a-coast-ink',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: {
					'line-color': '#a08d5a',
					'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 10, 1.6]
				}
			},
			{
				id: 'a-rivers-ink',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'waterway',
				minzoom: 8,
				paint: { 'line-color': '#b6a377', 'line-width': 0.8 }
			},
			{
				id: 'a-route',
				type: 'line',
				source: 'route',
				paint: {
					'line-color': '#8a744a',
					'line-width': 1.6,
					'line-opacity': 0.75,
					'line-dasharray': [2, 3]
				}
			},
			{
				id: 'a-stop-dots',
				type: 'circle',
				source: 'stops',
				paint: {
					'circle-radius': 3.5,
					'circle-color': '#6b5327',
					'circle-stroke-color': '#efe6cc',
					'circle-stroke-width': 1
				}
			},
			{
				id: 'a-toponym-sea',
				type: 'symbol',
				source: 'ancient-toponyms',
				filter: ['==', ['get', 'kind'], 'sea'],
				layout: {
					'text-field': ['get', 'grc'],
					'text-font': ['Noto Sans Italic'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 17],
					'text-letter-spacing': 0.3,
					'text-max-width': 20
				},
				paint: { 'text-color': '#8d7a4b', 'text-opacity': 0.85 }
			},
			{
				id: 'a-toponym-land',
				type: 'symbol',
				source: 'ancient-toponyms',
				filter: ['==', ['get', 'kind'], 'land'],
				layout: {
					'text-field': ['get', 'grc'],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 9, 15],
					'text-letter-spacing': 0.25
				},
				paint: { 'text-color': '#7d6a3e', 'text-opacity': 0.9 }
			},
			{
				id: 'a-stop-grc',
				type: 'symbol',
				source: 'stops',
				minzoom: 5,
				layout: {
					'text-field': ['get', 'grc'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 12.5,
					'text-offset': [0, 0.9],
					'text-anchor': 'top',
					'text-max-width': 12
				},
				paint: { 'text-color': '#6b5327', 'text-halo-color': '#efe6cc', 'text-halo-width': 1.2 }
			},

			// ===== modern world (revealed by NOW) =====
			{
				id: 'm-sat',
				type: 'raster',
				source: 'satellite',
				layout: { visibility: 'none' },
				paint: { 'raster-fade-duration': 300 }
			},
			{
				id: 'm-route',
				type: 'line',
				source: 'route',
				layout: { visibility: 'none' },
				paint: {
					'line-color': '#9fd8ff',
					'line-width': 1.8,
					'line-opacity': 0.85,
					'line-dasharray': [2, 3]
				}
			},
			{
				id: 'm-place',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'place',
				filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
				layout: {
					visibility: 'none',
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['match', ['get', 'class'], 'city', 13, 11]
				},
				paint: {
					'text-color': '#ffffff',
					'text-halo-color': 'rgba(0,0,0,0.75)',
					'text-halo-width': 1.4
				}
			},
			{
				id: 'm-stop-modern-name',
				type: 'symbol',
				source: 'stops',
				layout: {
					visibility: 'none',
					'text-field': ['get', 'modern'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12.5,
					'text-offset': [0, 1.4],
					'text-anchor': 'top',
					'text-max-width': 14
				},
				paint: {
					'text-color': '#ffd769',
					'text-halo-color': 'rgba(0,0,0,0.8)',
					'text-halo-width': 1.5
				}
			}
		]
	};
}
