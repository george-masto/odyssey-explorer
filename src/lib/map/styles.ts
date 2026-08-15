import type { StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import ancientToponyms from './ancient-toponyms.json';

// M1/M2 hosted infra (swapped for self-hosted PMTiles + GFS Didot glyphs at the
// self-hosting milestone; ODbL attribution required throughout — design premise 2).
const OFM = 'https://tiles.openfreemap.org';
const GLYPHS = `${OFM}/fonts/{fontstack}/{range}.pbf`; // Noto Sans covers polytonic Greek Extended (verified)
const VECTOR_URL = `${OFM}/planet`;

const ATTRIBUTION =
	'<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

/**
 * Modern pane: dark nautical chart. With NOW off it shows pure geography —
 * every layer carrying modern information has an id prefixed `now-` and starts
 * hidden; the NOW toggle flips their visibility (design pillar 2: same style,
 * toggled label visibility — no third style, no terrain data).
 */
export function modernNautical(): StyleSpecification {
	return {
		version: 8,
		name: 'odyssey-modern-nautical',
		glyphs: GLYPHS,
		sources: {
			openmaptiles: { type: 'vector', url: VECTOR_URL, attribution: ATTRIBUTION }
		},
		layers: [
			// Background IS the land; water polygons paint the sea on top. (The
			// openmaptiles schema has no all-zoom land polygon layer — this is the
			// standard pattern, and it survives every zoom.)
			{ id: 'background', type: 'background', paint: { 'background-color': '#1a2634' } },
			{
				id: 'water',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: { 'fill-color': '#0c1b2e' }
			},
			{
				id: 'coastline',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: { 'line-color': '#3d5a78', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 10, 1.4] }
			},
			{
				id: 'waterway',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'waterway',
				minzoom: 8,
				paint: { 'line-color': '#1d3550', 'line-width': 1 }
			},
			// --- everything below is modern information: hidden until NOW ---
			{
				id: 'now-boundary',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'boundary',
				filter: ['<=', ['get', 'admin_level'], 2],
				layout: { visibility: 'none' },
				paint: { 'line-color': '#31465e', 'line-width': 1, 'line-dasharray': [3, 2] }
			},
			{
				id: 'now-water-name',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'water_name',
				layout: {
					visibility: 'none',
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Italic'],
					'text-size': 13,
					'text-letter-spacing': 0.15
				},
				paint: { 'text-color': '#5b7da0', 'text-halo-color': '#0a1626', 'text-halo-width': 1 }
			},
			{
				id: 'now-place',
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
					'text-color': '#c8d4e0',
					'text-halo-color': '#0a1626',
					'text-halo-width': 1.2
				}
			}
		]
	};
}

/**
 * Ancient pane: parchment cartography. Zero modern information by design —
 * the NOW toggle must have something to reveal (second-opinion design note).
 * Labels are our own polytonic toponyms, not OSM data.
 */
export function parchment(): StyleSpecification {
	return {
		version: 8,
		name: 'odyssey-parchment',
		glyphs: GLYPHS,
		sources: {
			openmaptiles: { type: 'vector', url: VECTOR_URL, attribution: ATTRIBUTION },
			'ancient-toponyms': { type: 'geojson', data: ancientToponyms as FeatureCollection }
		},
		layers: [
			// Background IS the land (darker vellum); water paints the sea as
			// lighter page — the wireframe's ink-on-paper read, at every zoom.
			{ id: 'background', type: 'background', paint: { 'background-color': '#e6d7ae' } },
			{
				id: 'water',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: { 'fill-color': '#f0e8d2' }
			},
			{
				id: 'coastline-ink',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: {
					'line-color': '#a08d5a',
					'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 10, 1.6]
				}
			},
			{
				id: 'rivers-ink',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'waterway',
				minzoom: 8,
				paint: { 'line-color': '#b6a377', 'line-width': 0.8 }
			},
			{
				id: 'toponym-sea',
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
				id: 'toponym-land',
				type: 'symbol',
				source: 'ancient-toponyms',
				filter: ['==', ['get', 'kind'], 'land'],
				layout: {
					'text-field': ['get', 'grc'],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 9, 15],
					'text-letter-spacing': 0.25,
					'text-transform': 'none'
				},
				paint: { 'text-color': '#7d6a3e', 'text-opacity': 0.9 }
			}
		]
	};
}
