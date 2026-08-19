import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Runes mode everywhere (no Svelte libraries in the dep tree to exempt).
	compilerOptions: { runes: true },
	kit: {
		// Static output: every stop prerenders to a real URL (design premise 6 —
		// deep-linkable stops; no backend anywhere).
		adapter: adapter({ strict: true }),

		// Served at georgemasto.com/odyssey (proxied from the personal-site
		// project); every internal link/asset goes through `base`.
		paths: { base: '/odyssey' }
	}
};

export default config;
