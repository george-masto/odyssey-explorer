<script lang="ts">
	import StoryRail from '$lib/components/StoryRail.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Odyssey Explorer — the long way home</title>
	<meta
		name="description"
		content="An interactive atlas of Odysseus's voyage: the ancient Greek, the real places, and a ship you sail from Troy to Ithaca."
	/>
</svelte:head>

<StoryRail stop={data.stop} />
