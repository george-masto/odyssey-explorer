<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import VoyageMap from '$lib/components/VoyageMap.svelte';
	import { stops, stopBySeq, type Stop } from '$lib/data/stops';
	import { nowState } from '$lib/state/now.svelte';

	let { children } = $props();

	// The map lives in the layout so it survives stop-to-stop navigation;
	// pages only swap the story rail.
	const current: Stop = $derived(page.data.stop ?? stops[0]);

	function sailTo(id: string) {
		goto(`/stop/${id}`, { noScroll: true, keepFocus: true });
	}

	function sailBySeq(seq: number) {
		const target = stopBySeq(seq);
		if (target) sailTo(target.id);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			sailBySeq(current.seq + 1);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			sailBySeq(current.seq - 1);
		} else if (e.key === 'n' || e.key === 'N') {
			nowState.on = !nowState.on;
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="app">
	<header class="topbar">
		<div class="title">ODYSSEY EXPLORER <span>— the long way home</span></div>
		<nav class="dots" aria-label="Voyage progress">
			{#each stops as s (s.id)}
				<button
					class="dot"
					class:active={s.seq === current.seq}
					class:visited={s.seq < current.seq}
					aria-label={`Stop ${s.seq}: ${s.title}`}
					aria-current={s.seq === current.seq ? 'step' : undefined}
					onclick={() => sailTo(s.id)}
				></button>
			{/each}
			<span class="dots-count">{current.seq}/{stops.length}</span>
		</nav>
		<button
			class="now-toggle"
			class:on={nowState.on}
			aria-pressed={nowState.on}
			title="Reveal the modern world (N)"
			onclick={() => (nowState.on = !nowState.on)}
		>
			NOW <span class="now-state">{nowState.on ? 'on' : 'off'}</span> ⇄
		</button>
	</header>

	<div class="main">
		<div class="map-wrap">
			<VoyageMap {current} onselect={sailTo} />
		</div>
		{@render children()}
	</div>
</div>
