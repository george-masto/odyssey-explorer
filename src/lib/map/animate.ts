import type { Marker } from 'maplibre-gl';

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Glide a marker from where it is to `to` over `duration` ms (the ship sailing
 * the route line, the minimap dot trailing it). Returns a cancel function —
 * call it before starting a new leg so mid-voyage course changes don't fight.
 */
export function sailMarker(marker: Marker, to: [number, number], duration: number): () => void {
	const from = marker.getLngLat();
	if (duration <= 0 || (from.lng === to[0] && from.lat === to[1])) {
		marker.setLngLat(to);
		return () => {};
	}
	let raf = 0;
	const start = performance.now();
	const frame = (now: number) => {
		const t = Math.min((now - start) / duration, 1);
		const k = easeInOutCubic(t);
		marker.setLngLat([from.lng + (to[0] - from.lng) * k, from.lat + (to[1] - from.lat) * k]);
		if (t < 1) raf = requestAnimationFrame(frame);
	};
	raf = requestAnimationFrame(frame);
	return () => cancelAnimationFrame(raf);
}
