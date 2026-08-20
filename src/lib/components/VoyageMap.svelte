<script lang="ts">
	import '$lib/map/worker';
	import { Map as MaplibreMap, Marker } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { stops, type Stop } from '$lib/data/stops';
	import { explorerStyle } from '$lib/map/styles';
	import { sailMarker } from '$lib/map/animate';
	import { nowState } from '$lib/state/now.svelte';
	import shipUrl from '$lib/assets/ship.png';

	let { current, onselect }: { current: Stop; onselect: (id: string) => void } = $props();

	let container: HTMLDivElement;
	let map: MaplibreMap | undefined;
	let ship: Marker | undefined;
	let ready = $state(false);

	const SAIL_MS = 4600;

	const reducedMotion =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Phones get ~30% larger map labels (chosen at load; a mobile viewer misread
	// the tiny region toponyms as stop labels).
	const smallScreen =
		typeof matchMedia !== 'undefined' && matchMedia('(max-width: 760px)').matches;

	onMount(() => {
		map = new MaplibreMap({
			container,
			style: explorerStyle(smallScreen ? 1.3 : 1),
			center: [current.coords.lng, current.coords.lat],
			zoom: current.camera.zoom,
			// North is always up (post-M2 user feedback): no rotation, no tilt.
			bearing: 0,
			pitch: 0,
			dragRotate: false,
			pitchWithRotate: false,
			touchPitch: false,
			// Collapsed ⓘ badge; credits expand on click (full list on /about).
			attributionControl: { compact: true }
		});
		map.touchZoomRotate.disableRotation();
		map.keyboard.disableRotation();

		map.on('load', () => {
			if (!map) return;
			// Compact attribution starts expanded; collapse it to the ⓘ badge
			// (it reopens on click; full credits live on /about).
			container.querySelector('details.maplibregl-ctrl-attrib')?.removeAttribute('open');
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
			shipEl.innerHTML = `<img src="${shipUrl}" alt="" draggable="false" />`;
			shipEl.setAttribute('aria-hidden', 'true');
			ship = new Marker({ element: shipEl })
				.setLngLat([current.coords.lng, current.coords.lat])
				.addTo(map);
			ready = true;
		});

		return () => map?.remove();
	});

	// Sail when the current stop changes (arrows, buttons, marker clicks, URL):
	// the camera flies and the trireme glides along the route line in step.
	let cancelSail: (() => void) | undefined;
	$effect(() => {
		const s = current;
		if (!map || !ready) return;
		const target: [number, number] = [s.coords.lng, s.coords.lat];
		const cam = { center: target, zoom: s.camera.zoom };
		cancelSail?.();
		if (reducedMotion) {
			ship?.setLngLat(target);
			map.jumpTo(cam);
		} else {
			// Unhurried passage (user feedback: fast transitions disorient).
			if (ship) cancelSail = sailMarker(ship, target, SAIL_MS);
			map.flyTo({ ...cam, duration: SAIL_MS, curve: 1.25 });
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
