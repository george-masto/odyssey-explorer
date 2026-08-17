import { error } from '@sveltejs/kit';
import { stops, stopById } from '$lib/data/stops';
import type { EntryGenerator, PageLoad } from './$types';

// Prerender one real URL per landfall (deep links + future OG cards).
export const entries: EntryGenerator = () => stops.map((s) => ({ id: s.id }));

export const load: PageLoad = ({ params }) => {
	const stop = stopById.get(params.id);
	if (!stop) error(404, 'No such landfall on this voyage');
	return { stop };
};
