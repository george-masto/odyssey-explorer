<script lang="ts">
	import { Map as MaplibreMap, Marker, type StyleSpecification } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { stops, routeLine, stopsGeoJSON, type Stop } from '$lib/data/stops';
	import { modernNautical, parchment } from '$lib/map/styles';
	import { nowState } from '$lib/state/now.svelte';

	let {
		current,
		onselect,
		mobileMode = 'modern'
	}: { current: Stop; onselect: (id: string) => void; mobileMode?: 'modern' | 'ancient' } =
		$props();

	let modernEl: HTMLDivElement;
	let ancientEl: HTMLDivElement;
	let modern: MaplibreMap | undefined;
	let ancient: MaplibreMap | undefined;
	let ships: Marker[] = [];
	let modernReady = $state(false);
	let ancientReady = $state(false);
	let patchManifest = $state<Record<string, { url: string; coordinates: number[][] }>>({});

	const reducedMotion =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	// --- camera sync: bidirectional mirror with a re-entry guard (design
	// interaction grammar). Whichever map the user or flyTo moves, the other follows.
	let syncing = false;
	function mirror(from: MaplibreMap, to: MaplibreMap) {
		return () => {
			if (syncing) return;
			syncing = true;
			to.jumpTo({
				center: from.getCenter(),
				zoom: from.getZoom(),
				bearing: from.getBearing(),
				pitch: from.getPitch()
			});
			syncing = false;
		};
	}

	function makeMap(container: HTMLElement, style: StyleSpecification): MaplibreMap {
		return new MaplibreMap({
			container,
			style,
			center: [current.coords.lng, current.coords.lat],
			zoom: current.camera.zoom,
			bearing: current.camera.bearing,
			pitch: current.camera.pitch
		});
	}

	function addShip(map: MaplibreMap): Marker {
		const el = document.createElement('div');
		el.className = 'ship-marker';
		el.textContent = '⛵';
		el.setAttribute('aria-hidden', 'true');
		return new Marker({ element: el })
			.setLngLat([current.coords.lng, current.coords.lat])
			.addTo(map);
	}

	onMount(() => {
		modern = makeMap(modernEl, modernNautical());
		ancient = makeMap(ancientEl, parchment());

		modern.on('move', mirror(modern, ancient));
		ancient.on('move', mirror(ancient, modern));

		modern.on('load', () => {
			if (!modern) return;
			modern.addSource('route', { type: 'geojson', data: routeLine });
			modern.addSource('stops', { type: 'geojson', data: stopsGeoJSON });
			modern.addLayer({
				id: 'route-line',
				type: 'line',
				source: 'route',
				paint: {
					'line-color': '#2f5d8a',
					'line-width': 2,
					'line-opacity': 0.8,
					'line-dasharray': [2, 2]
				}
			});
			// Modern place-names of the stops themselves: the NOW reveal's headline act.
			modern.addLayer({
				id: 'now-stop-modern-name',
				type: 'symbol',
				source: 'stops',
				layout: {
					visibility: 'none',
					'text-field': ['get', 'modern'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12,
					'text-offset': [0, 1.4],
					'text-anchor': 'top',
					'text-max-width': 14
				},
				paint: {
					'text-color': '#ffd769',
					'text-halo-color': '#0a1626',
					'text-halo-width': 1.4
				}
			});

			for (const s of stops) {
				const el = document.createElement('button');
				el.className = 'stop-marker' + (s.certainty === 'mythic' ? ' mythic' : '');
				el.textContent = String(s.seq);
				el.setAttribute('aria-label', `Sail to stop ${s.seq}: ${s.title}`);
				el.title = `${s.seq} · ${s.title}`;
				el.addEventListener('click', () => onselect(s.id));
				new Marker({ element: el }).setLngLat([s.coords.lng, s.coords.lat]).addTo(modern!);
			}
			ships.push(addShip(modern));
			modernReady = true;
		});

		ancient.on('load', () => {
			if (!ancient) return;
			ancient.addSource('route', { type: 'geojson', data: routeLine });
			ancient.addSource('stops', { type: 'geojson', data: stopsGeoJSON });
			ancient.addLayer({
				id: 'route-ink',
				type: 'line',
				source: 'route',
				paint: {
					'line-color': '#8a744a',
					'line-width': 1.6,
					'line-opacity': 0.75,
					'line-dasharray': [2, 3]
				}
			});
			ancient.addLayer({
				id: 'stop-dots-ink',
				type: 'circle',
				source: 'stops',
				paint: {
					'circle-radius': 3.5,
					'circle-color': '#6b5327',
					'circle-stroke-color': '#efe6cc',
					'circle-stroke-width': 1
				}
			});
			ancient.addLayer({
				id: 'stop-grc-label',
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
			});
			ships.push(addShip(ancient));
			ancientReady = true;
		});

		fetch('/now/manifest.json')
			.then((r) => (r.ok ? r.json() : {}))
			.then((m) => (patchManifest = m))
			.catch(() => {});

		return () => {
			modern?.remove();
			ancient?.remove();
		};
	});

	// --- sail on stop change: drive the modern map; the mirror carries the ancient pane.
	$effect(() => {
		const s = current;
		if (!modern || !modernReady) return;
		for (const ship of ships) ship.setLngLat([s.coords.lng, s.coords.lat]);
		const cam = {
			center: [s.coords.lng, s.coords.lat] as [number, number],
			zoom: s.camera.zoom,
			bearing: s.camera.bearing,
			pitch: s.camera.pitch
		};
		if (reducedMotion) {
			modern.jumpTo(cam);
			ancient?.jumpTo(cam);
		} else {
			modern.flyTo({ ...cam, duration: 2600, curve: 1.3 });
		}
	});

	// --- NOW reveal: flip every `now-` layer on the modern pane.
	$effect(() => {
		const on = nowState.on;
		if (!modern || !modernReady) return;
		const vis = on ? 'visible' : 'none';
		for (const layer of modern.getStyle().layers ?? []) {
			if (layer.id.startsWith('now-')) modern.setLayoutProperty(layer.id, 'visibility', vis);
		}
	});

	// --- NOW satellite patch for the current stop (pre-rendered Sentinel-2,
	// self-hosted; see scripts/fetch-now-patches.mjs).
	$effect(() => {
		const on = nowState.on;
		const s = current;
		const manifest = patchManifest;
		if (!modern || !modernReady) return;
		if (modern.getLayer('now-patch-layer')) modern.removeLayer('now-patch-layer');
		if (modern.getSource('now-patch')) modern.removeSource('now-patch');
		const patch = manifest[s.id];
		if (on && patch) {
			modern.addSource('now-patch', {
				type: 'image',
				url: patch.url,
				coordinates: patch.coordinates as [
					[number, number],
					[number, number],
					[number, number],
					[number, number]
				]
			});
			modern.addLayer(
				{
					id: 'now-patch-layer',
					type: 'raster',
					source: 'now-patch',
					paint: { 'raster-opacity': 0.92, 'raster-fade-duration': 400 }
				},
				'now-stop-modern-name' // beneath the revealed labels
			);
		}
	});

	// --- mobile flip: the hidden pane is display:none'd by CSS; MapLibre needs a
	// resize nudge when a pane becomes visible again.
	$effect(() => {
		void mobileMode;
		requestAnimationFrame(() => {
			modern?.resize();
			ancient?.resize();
		});
	});
</script>

<div class="panes" data-mobile-mode={mobileMode}>
	<div class="pane pane-modern">
		<div class="map" bind:this={modernEl}></div>
		{#if nowState.on}
			<div class="sat-credit">Contains modified Copernicus Sentinel data 2026</div>
		{/if}
	</div>
	<div class="pane pane-ancient">
		<div class="map" bind:this={ancientEl}></div>
	</div>
</div>

<style>
	.panes {
		position: absolute;
		inset: 0;
		display: flex;
	}

	.pane {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.pane-modern {
		border-right: 1px solid #24344a;
	}

	.map {
		position: absolute;
		inset: 0;
	}

	.sat-credit {
		position: absolute;
		left: 6px;
		bottom: 6px;
		z-index: 5;
		font-size: 10px;
		color: #c8d4e0;
		background: rgba(10, 22, 38, 0.75);
		padding: 2px 6px;
		border-radius: 3px;
		pointer-events: none;
	}

	@media (max-width: 760px) {
		.panes[data-mobile-mode='modern'] .pane-ancient {
			display: none;
		}

		.panes[data-mobile-mode='ancient'] .pane-modern {
			display: none;
		}

		.pane-modern {
			border-right: none;
		}
	}
</style>
