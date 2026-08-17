import { stops } from '$lib/data/stops';
import type { PageLoad } from './$types';

// The voyage opens where the poem's action does: Troy, stop 1.
export const load: PageLoad = () => ({ stop: stops[0] });
