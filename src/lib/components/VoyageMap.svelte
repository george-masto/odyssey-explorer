<script lang="ts">
	import { Map as MaplibreMap, Marker } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { stops, routeLine, type Stop } from '$lib/data/stops';

	let { current, onselect }: { current: Stop; onselect: (id: string) => void } = $props();

	let container: HTMLDivElement;
	let map: MaplibreMap | undefined;
	let ship: Marker | undefined;
	let ready = $state(false);

	// Design interaction grammar: reduced motion turns every flyTo into a cut.
	const reducedMotion =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	onMount(() => {
		map = new MaplibreMap({
			container,
			// M1 dev basemap: OpenFreeMap hosted vector tiles (no key). Replaced in M2
			// by the self-hosted PMTiles + custom dark-nautical style per design doc.
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: [current.coords.lng, current.coords.lat],
			zoom: current.camera.zoom,
			bearing: current.camera.bearing,
			pitch: current.camera.pitch
		});

		map.on('load', () => {
			if (!map) return;
			map.addSource('route', { type: 'geojson', data: routeLine });
			map.addLayer({
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

			for (const s of stops) {
				const el = document.createElement('button');
				el.className = 'stop-marker' + (s.certainty === 'mythic' ? ' mythic' : '');
				el.textContent = String(s.seq);
				el.setAttribute('aria-label', `Sail to stop ${s.seq}: ${s.title}`);
				el.title = `${s.seq} · ${s.title}`;
				el.addEventListener('click', () => onselect(s.id));
				new Marker({ element: el })
					.setLngLat([s.coords.lng, s.coords.lat])
					.addTo(map!);
			}

			const shipEl = document.createElement('div');
			shipEl.className = 'ship-marker';
			shipEl.textContent = '⛵'; // placeholder; black-figure ship art lands in M2
			shipEl.setAttribute('aria-hidden', 'true');
			ship = new Marker({ element: shipEl })
				.setLngLat([current.coords.lng, current.coords.lat])
				.addTo(map);

			ready = true;
		});

		return () => map?.remove();
	});

	// Sail when the current stop changes (arrow keys, buttons, marker clicks, URL).
	$effect(() => {
		const s = current;
		if (!map || !ready) return;
		ship?.setLngLat([s.coords.lng, s.coords.lat]);
		const cam = {
			center: [s.coords.lng, s.coords.lat] as [number, number],
			zoom: s.camera.zoom,
			bearing: s.camera.bearing,
			pitch: s.camera.pitch
		};
		if (reducedMotion) {
			map.jumpTo(cam);
		} else {
			map.flyTo({ ...cam, duration: 2600, curve: 1.3 });
		}
	});
</script>

<div class="map" bind:this={container}></div>

<style>
	.map {
		position: absolute;
		inset: 0;
	}
</style>
