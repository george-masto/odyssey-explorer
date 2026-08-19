<script lang="ts">
	import '$lib/map/worker';
	import { Map as MaplibreMap, Marker } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { stops, type Stop } from '$lib/data/stops';
	import { explorerStyle } from '$lib/map/styles';
	import { nowState } from '$lib/state/now.svelte';
	import trireme from '$lib/map/trireme.svg?raw';

	let { current, onselect }: { current: Stop; onselect: (id: string) => void } = $props();

	let container: HTMLDivElement;
	let map: MaplibreMap | undefined;
	let ship: Marker | undefined;
	let ready = $state(false);

	const reducedMotion =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	onMount(() => {
		map = new MaplibreMap({
			container,
			style: explorerStyle(),
			center: [current.coords.lng, current.coords.lat],
			zoom: current.camera.zoom,
			// North is always up (post-M2 user feedback): no rotation, no tilt.
			bearing: 0,
			pitch: 0,
			dragRotate: false,
			pitchWithRotate: false,
			touchPitch: false
		});
		map.touchZoomRotate.disableRotation();
		map.keyboard.disableRotation();

		map.on('load', () => {
			if (!map) return;
			for (const s of stops) {
				const el = document.createElement('button');
				el.className = 'stop-marker' + (s.certainty === 'mythic' ? ' mythic' : '');
				el.textContent = String(s.seq);
				el.setAttribute('aria-label', `Sail to stop ${s.seq}: ${s.title}`);
				el.title = `${s.seq} · ${s.title}`;
				el.addEventListener('click', () => onselect(s.id));
				new Marker({ element: el }).setLngLat([s.coords.lng, s.coords.lat]).addTo(map!);
			}
			const shipEl = document.createElement('div');
			shipEl.className = 'ship-marker';
			shipEl.innerHTML = trireme;
			shipEl.setAttribute('aria-hidden', 'true');
			ship = new Marker({ element: shipEl })
				.setLngLat([current.coords.lng, current.coords.lat])
				.addTo(map);
			ready = true;
		});

		return () => map?.remove();
	});

	// Sail when the current stop changes (arrows, buttons, marker clicks, URL).
	$effect(() => {
		const s = current;
		if (!map || !ready) return;
		ship?.setLngLat([s.coords.lng, s.coords.lat]);
		const cam = { center: [s.coords.lng, s.coords.lat] as [number, number], zoom: s.camera.zoom };
		if (reducedMotion) {
			map.jumpTo(cam);
		} else {
			map.flyTo({ ...cam, duration: 2600, curve: 1.3 });
		}
	});

	// The NOW reveal: flip the ancient (`a-`) and modern (`m-`) layer groups.
	$effect(() => {
		const on = nowState.on;
		if (!map || !ready) return;
		for (const layer of map.getStyle().layers ?? []) {
			if (layer.id.startsWith('m-')) {
				map.setLayoutProperty(layer.id, 'visibility', on ? 'visible' : 'none');
			} else if (layer.id.startsWith('a-')) {
				map.setLayoutProperty(layer.id, 'visibility', on ? 'none' : 'visible');
			}
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
