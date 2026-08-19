<script lang="ts">
	import StoryRail from '$lib/components/StoryRail.svelte';
	import { SITE_URL, SITE_NAME } from '$lib/config';

	let { data } = $props();

	const title = $derived(`${data.stop.seq} · ${data.stop.title} — ${SITE_NAME}`);
	const url = $derived(`${SITE_URL}/stop/${data.stop.id}`);
	const image = $derived(`${SITE_URL}/og/${data.stop.id}.png`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={data.stop.summary} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={data.stop.summary} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={data.stop.summary} />
	<meta name="twitter:image" content={image} />
</svelte:head>

<StoryRail stop={data.stop} />
