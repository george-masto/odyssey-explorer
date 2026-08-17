<script lang="ts">
	import { goto } from '$app/navigation';
	import { stopBySeq, stops, type Stop } from '$lib/data/stops';
	import { nowState } from '$lib/state/now.svelte';
	import Excerpt from '$lib/components/Excerpt.svelte';
	import EtymologyCard from '$lib/components/EtymologyCard.svelte';

	let { stop }: { stop: Stop } = $props();

	const prev = $derived(stopBySeq(stop.seq - 1));
	const next = $derived(stopBySeq(stop.seq + 1));

	// Mobile bottom-sheet behavior: collapsed shows just the header strip.
	let collapsed = $state(false);

	let railEl: HTMLElement | undefined;

	function sail(target: Stop | undefined) {
		if (target) goto(`/stop/${target.id}`, { noScroll: true, keepFocus: true });
	}

	// New landfall: scroll the rail back to the top.
	$effect(() => {
		void stop.id;
		railEl?.scrollTo({ top: 0 });
	});
</script>

<aside class="rail" class:collapsed aria-label="Current landfall" bind:this={railEl}>
	<button
		class="grab"
		aria-label={collapsed ? 'Expand landfall details' : 'Collapse landfall details'}
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="grab-bar"></span>
	</button>
	<div class="seq">Landfall {stop.seq} of {stops.length}</div>
	<h1>{stop.title}</h1>
	<div class="grc">{stop.ancient.grc} <span class="translit">· {stop.ancient.translit}</span></div>

	<div class="tags">
		<span class="tag">{stop.certainty} identification</span>
		{#each stop.book_refs as ref (ref)}
			<span class="tag ref">{ref}</span>
		{/each}
	</div>

	<p class="summary">{stop.summary}</p>

	{#if stop.excerpt}
		<Excerpt excerpt={stop.excerpt} interlinear={stop.interlinear} />
	{/if}

	{#each stop.etymology ?? [] as etym (etym.lemma)}
		<EtymologyCard {etym} />
	{/each}

	{#if stop.tidbits?.length}
		<section class="tidbits" aria-label="Worth knowing">
			<div class="card-t">Worth knowing</div>
			<ul>
				{#each stop.tidbits as tidbit, i (i)}
					<li>{tidbit.text} <span class="tidbit-src">[{tidbit.source}]</span></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if stop.art?.length}
		<section class="artstrip" aria-label="Art">
			{#each stop.art as piece (piece.file)}
				<figure>
					<a href={piece.source_url} target="_blank" rel="noopener noreferrer">
						<img src={piece.file} alt={`${piece.title} — ${piece.artist}`} loading="lazy" />
					</a>
					<figcaption>
						<i>{piece.title}</i> — {piece.artist}, {piece.year}{piece.collection
							? ` · ${piece.collection}`
							: ''} · {piece.license}
					</figcaption>
				</figure>
			{/each}
		</section>
	{/if}

	<div class="modern" class:now-lit={nowState.on}>
		<span class="modern-label">Today</span>
		{stop.modern.primary.name}{stop.modern.primary.country !== '—'
			? ` · ${stop.modern.primary.country}`
			: ''}
		{#if stop.certainty !== 'mythic'}
			<a
				class="gmaps"
				href={`https://www.google.com/maps/search/?api=1&query=${stop.coords.lat},${stop.coords.lng}`}
				target="_blank"
				rel="noopener noreferrer">Open in Google Maps ↗</a
			>
		{/if}
		{#if nowState.on && stop.now_today}
			<div class="now-today">{stop.now_today}</div>
		{/if}
		{#if nowState.on && stop.certainty !== 'secure'}
			<div class="now-note">
				{stop.certainty === 'mythic'
					? 'No real location is claimed — coordinates exist only to keep the voyage line unbroken.'
					: `A ${stop.certainty} identification — Homer names the place; tradition pinned it here.`}
			</div>
		{/if}
	</div>

	<div class="crew" title={stop.crew_note}>
		⚓ companions remaining: <b>{stop.crew.remaining}</b>
		{#if stop.crew.lost_here > 0}
			<span class="lost">lost here: {stop.crew.lost_here}</span>
		{/if}
	</div>

	<nav class="sailnav" aria-label="Sail between landfalls">
		<button onclick={() => sail(prev)} disabled={!prev}>
			← {prev ? `${prev.seq} · ${prev.title}` : 'Troy'}
		</button>
		<button onclick={() => sail(next)} disabled={!next}>
			{next ? `${next.seq} · ${next.title}` : 'Ithaca'} →
		</button>
	</nav>
	<p class="hint">
		arrow keys sail · N toggles now · click any numbered stop · <a class="about-link" href="/about"
			>about & credits</a
		>
	</p>
</aside>
