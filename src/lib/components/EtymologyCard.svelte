<script lang="ts">
	import type { Etymology } from '$lib/data/stops';

	let { etym }: { etym: Etymology } = $props();

	const LANG_LABEL: Record<string, string> = {
		grc: 'ancient greek',
		el: 'modern greek',
		la: 'latin',
		it: 'italian',
		en: 'english',
		fr: 'french'
	};
</script>

<div class="card etym-card">
	<div class="card-t">Etymology — {etym.lemma}</div>
	<div class="chain">
		{#each etym.stages as stage, i (i)}
			{#if i > 0}<span class="arrow">→</span>{/if}
			<span class="stage">
				<span class="stage-form">{stage.form}</span>
				{#if stage.gloss}<span class="stage-gloss">‘{stage.gloss}’</span>{/if}
				<span class="stage-lang">{LANG_LABEL[stage.lang] ?? stage.lang}{stage.note
						? ` · ${stage.note}`
						: ''}</span>
			</span>
		{/each}
	</div>
	{#if etym.note}<div class="etym-note">{etym.note}</div>{/if}
	{#if etym.sources?.length}
		<div class="etym-sources">{etym.sources.join(' · ')}</div>
	{/if}
</div>
