<script lang="ts">
	import StoryRail from '$lib/components/StoryRail.svelte';
	import { SITE_URL, SITE_NAME } from '$lib/config';

	let { data } = $props();

	const description =
		"Sail Odysseus's ten-year voyage home: seventeen landfalls with the ancient Greek, tap-a-word glosses, etymology, sourced lore, art — and a NOW toggle that reveals the real places from orbit.";
</script>

<svelte:head>
	<title>{SITE_NAME} — the long way home</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${SITE_URL}/`} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={`${SITE_NAME} — the long way home`} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={`${SITE_URL}/`} />
	<meta property="og:image" content={`${SITE_URL}/og/site.png?v=2`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${SITE_NAME} — the long way home`} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={`${SITE_URL}/og/site.png?v=2`} />
</svelte:head>

<StoryRail stop={data.stop} />
