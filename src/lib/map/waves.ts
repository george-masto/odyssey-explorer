import type { Map as MaplibreMap, StyleImageInterface } from 'maplibre-gl';

/**
 * Ambient sea: a seamlessly tiling pattern of engraved wave strokes — the
 * stylized water of old charts — drifting and glinting as if under a light
 * breeze. Runs as an animated `fill-pattern` on an `a-waves` layer over the
 * ancient water fill, so the era toggle hides it with the rest of the `a-*`
 * group and the satellite sea stays untouched.
 *
 * Cost control: the texture redraws on a ~10 fps interval (not per frame),
 * `triggerRepaint` fires only on those ticks, background tabs skip work, and
 * reduced-motion gets a single static draw of the same pattern.
 */

const SIZE = 256; // device px; declared at pixelRatio 2 → repeats every 128 css px
const ROWS = 9;
const SLOT = 64; // horizontal spacing of wave strokes within a row
const TICK_MS = 100;

// Deterministic per-stroke randomness — positions must be stable across frames
// (only drift and glint animate) or the sea would boil.
function hash(a: number, b: number): number {
	const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
	return h - Math.floor(h);
}

export function addAmbientWaves(map: MaplibreMap, animate: boolean): () => void {
	const canvas = document.createElement('canvas');
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return () => {};

	const arc = (x: number, y: number, style: string, width: number) => {
		ctx.strokeStyle = style;
		ctx.lineWidth = width;
		ctx.lineCap = 'round';
		// Draw at x and both wrap positions so strokes crossing the tile edge
		// reappear on the other side — the pattern must tile seamlessly.
		for (const dx of [-SIZE, 0, SIZE]) {
			ctx.beginPath();
			ctx.moveTo(x + dx - 13, y);
			ctx.quadraticCurveTo(x + dx, y - 6, x + dx + 13, y);
			ctx.stroke();
		}
	};

	const draw = (tSec: number) => {
		ctx.clearRect(0, 0, SIZE, SIZE);
		for (let r = 0; r < ROWS; r++) {
			const y = ((r + 0.5) / ROWS) * SIZE;
			const drift = (tSec * (4 + 4 * hash(r, 7))) % SIZE; // px/s varies per row
			for (let c = 0; c < SIZE / SLOT + 1; c++) {
				if (hash(r, c) < 0.3) continue; // thin the grid so it reads as scatter, not weave
				const x =
					(c * SLOT + (r % 2) * (SLOT / 2) + (hash(r, c + 50) - 0.5) * 22 + drift) % SIZE;
				const yj = y + (hash(r, c + 90) - 0.5) * 10;
				// Each stroke breathes on its own slow cycle — the glitter of light
				// chop, not rolling surf.
				const glint = 0.5 + 0.5 * Math.sin(tSec * (0.5 + 0.6 * hash(r, c + 130)) + hash(r, c + 170) * 6.283);
				arc(x, yj, `rgba(146, 122, 76, ${(0.1 + 0.2 * glint).toFixed(3)})`, 2.4);
				arc(x, yj + 3, `rgba(255, 252, 240, ${(0.05 + 0.13 * (1 - glint)).toFixed(3)})`, 2);
			}
		}
	};

	let dirty = true;
	const start = performance.now();
	const image: StyleImageInterface = {
		width: SIZE,
		height: SIZE,
		data: new Uint8Array(SIZE * SIZE * 4),
		render() {
			if (!dirty) return false;
			dirty = false;
			draw((performance.now() - start) / 1000);
			this.data = ctx.getImageData(0, 0, SIZE, SIZE).data;
			return true;
		}
	};

	map.addImage('a-wave-pattern', image, { pixelRatio: 2 });
	map.addLayer(
		{
			id: 'a-waves',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'water',
			paint: { 'fill-pattern': 'a-wave-pattern', 'fill-opacity': 0.6 }
		},
		'a-coast-ink'
	);

	if (!animate) return () => {};
	const timer = setInterval(() => {
		if (document.hidden) return; // no repaints for a tab nobody is watching
		dirty = true;
		map.triggerRepaint();
	}, TICK_MS);
	return () => clearInterval(timer);
}
