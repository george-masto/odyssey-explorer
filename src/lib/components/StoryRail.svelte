<script lang="ts">
	import { goto } from '$app/navigation';
	import { stopBySeq, stops, type Stop } from '$lib/data/stops';
	import { nowState } from '$lib/state/now.svelte';

	let { stop }: { stop: Stop } = $props();

	const prev = $derived(stopBySeq(stop.seq - 1));
	const next = $derived(stopBySeq(stop.seq + 1));

	// Mobile bottom-sheet behavior: collapsed shows just the header strip.
	let collapsed = $state(false);

	function sail(target: Stop | undefined) {
		if (target) goto(`/stop/${target.id}`, { noScroll: true, keepFocus: true });
	}
</script>

<aside class="rail" class:collapsed aria-label="Current landfall">
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
		{#if stop.marquee_passage}
			<span class="tag marquee" title="Full tap-a-word interlinear treatment planned">
				★ marquee · {stop.marquee_passage}
			</span>
		{/if}
	</div>

	<p class="summary">{stop.summary}</p>

	<div class="modern" class:now-lit={nowState.on}>
		<span class="modern-label">Today</span>
		{stop.modern.primary.name}{stop.modern.primary.country !== '—'
			? ` · ${stop.modern.primary.country}`
			: ''}
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
	<p class="hint">arrow keys sail · click any numbered stop</p>
</aside>
