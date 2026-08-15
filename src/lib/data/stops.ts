import { parse } from 'yaml';

export type Certainty = 'secure' | 'traditional' | 'disputed' | 'mythic';

export interface Stop {
	id: string;
	seq: number;
	phase: 'wanderings' | 'telemachy' | 'epilogues';
	title: string;
	book_refs: string[];
	coords: { lat: number; lng: number };
	camera: { zoom: number; bearing: number; pitch: number };
	certainty: Certainty;
	ancient: { grc: string; translit: string };
	modern: { primary: { name: string; country: string } };
	crew: { remaining: number; lost_here: number };
	crew_note?: string;
	summary: string;
	marquee_passage?: string;
}

// Frontmatter-only at M1; markdown bodies become stop content in M3/M4.
const raw = import.meta.glob('/content/stops/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function frontmatter(src: string, path: string): Stop {
	const match = /^---\n([\s\S]*?)\n---/.exec(src);
	if (!match) throw new Error(`missing frontmatter: ${path}`);
	return parse(match[1]) as Stop;
}

export const stops: Stop[] = Object.entries(raw)
	.map(([path, src]) => frontmatter(src, path))
	.sort((a, b) => a.seq - b.seq);

export const stopById = new Map(stops.map((s) => [s.id, s]));

export function stopBySeq(seq: number): Stop | undefined {
	return stops.find((s) => s.seq === seq);
}

export const routeLine = {
	type: 'Feature' as const,
	properties: {},
	geometry: {
		type: 'LineString' as const,
		coordinates: stops.map((s) => [s.coords.lng, s.coords.lat])
	}
};

// One point per stop for map symbol/circle layers (ancient pane dots + Greek
// labels; modern pane NOW-gated modern names).
export const stopsGeoJSON = {
	type: 'FeatureCollection' as const,
	features: stops.map((s) => ({
		type: 'Feature' as const,
		properties: {
			id: s.id,
			seq: s.seq,
			grc: s.ancient.grc,
			modern: s.modern.primary.name,
			certainty: s.certainty
		},
		geometry: { type: 'Point' as const, coordinates: [s.coords.lng, s.coords.lat] }
	}))
};
