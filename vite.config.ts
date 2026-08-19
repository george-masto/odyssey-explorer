import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// maplibre-gl's web worker 404s under Vite's dep optimizer (worker URL is
	// rewritten into .vite/deps where the file doesn't exist); serve it unbundled.
	optimizeDeps: { exclude: ['maplibre-gl'] },
	// All SvelteKit + compiler config lives in svelte.config.js — passing options
	// to the plugin here overrides that file entirely.
	plugins: [sveltekit()]
});
