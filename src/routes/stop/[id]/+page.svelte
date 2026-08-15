<script lang="ts">
	import StoryRail from '$lib/components/StoryRail.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.stop.seq} · {data.stop.title} — Odyssey Explorer</title>
	<meta name="description" content={data.stop.summary} />
</svelte:head>

<StoryRail stop={data.stop} />
