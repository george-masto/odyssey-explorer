<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import VoyageMap from '$lib/components/VoyageMap.svelte';
	import MiniMap from '$lib/components/MiniMap.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import { stops, stopBySeq, type Stop } from '$lib/data/stops';
	import { nowState } from '$lib/state/now.svelte';

	let { children } = $props();

	let helpOpen = $state(false);

	onMount(() => {
		try {
			if (!localStorage.getItem('odyssey-onboarded-v1')) helpOpen = true;
		} catch {
			/* private mode */
		}
	});

	// The map lives in the layout so it survives stop-to-stop navigation;
	// pages only swap the story rail.
	const current: Stop = $derived(page.data.stop ?? stops[0]);

	function sailTo(id: string) {
		goto(`${base}/stop/${id}`, { noScroll: true, keepFocus: true });
	}

	function sailBySeq(seq: number) {
		const target = stopBySeq(seq);
		if (target) sailTo(target.id);
	}

	function onkeydown(e: KeyboardEvent) {
		if (helpOpen) return; // the onboarding dialog owns the keyboard while open
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
		<div class="topbar-actions">
			<button
				class="now-toggle"
				class:on={nowState.on}
				aria-pressed={nowState.on}
				title="Reveal the modern world (N)"
				onclick={() => (nowState.on = !nowState.on)}
			>
				NOW <span class="now-state">{nowState.on ? 'on' : 'off'}</span> ⇄
			</button>
			<button
				class="help-btn"
				aria-label="How to use this — quick tour"
				title="How to use this"
				onclick={() => (helpOpen = true)}>?</button
			>
		</div>
	</header>

	<Onboarding bind:open={helpOpen} />

	<main class="main">
		<div class="map-wrap">
			<VoyageMap {current} onselect={sailTo} />
			<MiniMap {current} />
		</div>
		{@render children()}
	</main>
</div>
