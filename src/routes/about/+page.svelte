<script lang="ts">
	import { base } from '$app/paths';
	import { stops } from '$lib/data/stops';

	const artCredits = $derived(
		stops.flatMap((s) => (s.art ?? []).map((a) => ({ stop: s.title, ...a })))
	);
</script>

<svelte:head>
	<title>About & Credits — Odyssey Explorer</title>
	<meta
		name="description"
		content="Sources, licences, and methods behind the Odyssey Explorer: Perseus texts, public-domain art, open map data."
	/>
</svelte:head>

<main class="about">
	<a class="back" href="{base}/">← back to the voyage</a>
	<h1>About & Credits</h1>

	<p>
		Odyssey Explorer is an interactive atlas of Odysseus's ten-year journey home: seventeen
		landfalls from Troy to Ithaca, each carrying the ancient Greek text, a public-domain
		translation, word-level glosses, etymologies, sourced notes, and art. Toggle
		<b>NOW</b> to see where the myth touches the modern Mediterranean.
	</p>

	<h2>Honesty about geography</h2>
	<p>
		Nobody knows where most of these places "really" are — ancient geographers already argued
		about it (Eratosthenes joked you would trace the route when you found the cobbler who sewed
		the bag of the winds; Strabo, <i>Geography</i> 1.2.15, disagreed). Every stop is tagged:
		<span class="tag">secure</span> (a real, identified place),
		<span class="tag">traditional</span> (the classical identification),
		<span class="tag">disputed</span> (serious rival candidates), or
		<span class="tag">mythic</span> (no location claimed; coordinates exist only to keep the
		voyage line unbroken).
	</p>

	<h2>Texts</h2>
	<ul>
		<li>
			Ancient Greek: <i>Odyssey</i>, ed. A.T. Murray (1919), via the
			<a href="https://github.com/PerseusDL/canonical-greekLit" target="_blank" rel="noopener"
				>Perseus Digital Library</a
			>
			(canonical-greekLit), licence CC BY-SA 4.0.
		</li>
		<li>English translation: A.T. Murray (1919), public domain.</li>
		<li>Crew arithmetic follows Homer's own numbers (companions, excluding Odysseus).</li>
	</ul>

	<h2>Maps & imagery</h2>
	<ul>
		<li>
			Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener"
				>OpenStreetMap contributors</a
			>
			(ODbL), served as vector tiles by
			<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> /
			<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>.
		</li>
		<li>
			Satellite view: <a href="https://s2maps.eu" target="_blank" rel="noopener"
				>Sentinel-2 cloudless 2025</a
			>
			by <a href="https://eox.at" target="_blank" rel="noopener">EOX IT Services GmbH</a>, licence
			CC BY-NC-SA 4.0 — contains modified Copernicus Sentinel data 2025.
		</li>
		<li>Polytonic Greek map labels rendered with Noto Sans glyphs via OpenFreeMap.</li>
	</ul>

	<h2>Art</h2>
	<ul>
		{#each artCredits as credit (credit.file)}
			<li>
				<i>{credit.title}</i> — {credit.artist}, {credit.year}{credit.collection
					? ` · ${credit.collection}`
					: ''} · {credit.license} ·
				<a href={credit.source_url} target="_blank" rel="noopener">Wikimedia Commons</a>
				<span class="forstop">({credit.stop})</span>
			</li>
		{/each}
	</ul>

	<h2>Built with</h2>
	<p>
		SvelteKit (static), MapLibre GL JS, and the conviction that the Greek is the attraction, not
		the barrier. No backend, no tracking, no accounts.
	</p>
</main>

<style>
	.about {
		max-width: 720px;
		margin: 0 auto;
		padding: 48px 24px 80px;
		line-height: 1.65;
		font-size: 15px;
	}

	.back {
		color: var(--gold);
		text-decoration: none;
		font-size: 13px;
	}

	h1 {
		font-family: var(--serif);
		font-size: 34px;
		margin: 18px 0 14px;
	}

	h2 {
		font-family: var(--serif);
		font-size: 21px;
		margin: 28px 0 8px;
		color: var(--gold);
	}

	ul {
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	a {
		color: var(--gold);
	}

	.tag {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: 1px 5px;
		color: var(--ink-dim);
	}

	.forstop {
		color: var(--ink-dim);
		font-size: 12.5px;
	}
</style>
