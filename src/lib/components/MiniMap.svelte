<script lang="ts">
	import '$lib/map/worker';
	import { Map as MaplibreMap, Marker } from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { explorerStyle } from '$lib/map/styles';
	import { sailMarker } from '$lib/map/animate';
	import type { Stop } from '$lib/data/stops';

	let { current }: { current: Stop } = $props();

	let container: HTMLDivElement;
	let map: MaplibreMap | undefined;
	let dot: Marker | undefined;
	let ready = $state(false);

	// The whole voyage, Djerba to Troy, in one fixed frame. The camera NEVER
	// moves (user spec) — only the dot does.
	const VOYAGE_BOUNDS: [[number, number], [number, number]] = [
		[8.0, 31.8],
		[28.0, 42.8]
	];

	onMount(() => {
		map = new MaplibreMap({
			container,
			style: explorerStyle(), // modern (`m-`) layers stay hidden: the inset is always the chart
			interactive: false,
			attributionControl: false // sources are attributed on the main map on the same page
		});
		map.fitBounds(VOYAGE_BOUNDS, { padding: 8, duration: 0 });

		map.on('load', () => {
			if (!map) return;
			// Inset-specific label treatment: tiny frame, so compact single-line
			// Greek, slightly smaller, black and bold for legibility.
			for (const layer of ['a-toponym-land', 'a-toponym-sea']) {
				map.setLayoutProperty(layer, 'text-field', ['get', 'grc']);
				map.setLayoutProperty(layer, 'text-size', 9.5);
				map.setLayoutProperty(layer, 'text-font', ['Noto Sans Bold']);
				map.setLayoutProperty(layer, 'text-letter-spacing', 0.05);
				map.setPaintProperty(layer, 'text-color', '#1c1408');
				map.setPaintProperty(layer, 'text-halo-color', '#efe6cc');
				map.setPaintProperty(layer, 'text-halo-width', 1.4);
			}
			const el = document.createElement('div');
			el.className = 'mini-dot';
			el.setAttribute('aria-hidden', 'true');
			dot = new Marker({ element: el })
				.setLngLat([current.coords.lng, current.coords.lat])
				.addTo(map);
			ready = true;
		});

		return () => map?.remove();
	});

	let cancelGlide: (() => void) | undefined;
	const reducedMotion =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		const s = current;
		if (!ready || !dot) return;
		cancelGlide?.();
		if (reducedMotion) dot.setLngLat([s.coords.lng, s.coords.lat]);
		else cancelGlide = sailMarker(dot, [s.coords.lng, s.coords.lat], 2600);
	});
</script>

<div
	class="minimap"
	bind:this={container}
	role="img"
	aria-label="Voyage overview — current position marked"
></div>

<style>
	.minimap {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 210px;
		height: 140px;
		z-index: 6;
		border: 1px solid #a08d5a;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
		pointer-events: none;
	}

	@media (max-width: 760px) {
		.minimap {
			width: 132px;
			height: 90px;
			top: 8px;
			right: 8px;
		}
	}
</style>
