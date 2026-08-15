import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// maplibre-gl's web worker 404s under Vite's dep optimizer (worker URL is
	// rewritten into .vite/deps where the file doesn't exist); serve it unbundled.
	optimizeDeps: { exclude: ['maplibre-gl'] },
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static output: every stop prerenders to a real URL (design premise 6 —
			// deep-linkable stops; no backend anywhere).
			adapter: adapter({ strict: true })
		})
	]
});
