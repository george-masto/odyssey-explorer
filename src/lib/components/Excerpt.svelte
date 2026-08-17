<script lang="ts">
	import type { Excerpt, InterlinearLine, GlossWord } from '$lib/data/stops';

	let { excerpt, interlinear }: { excerpt: Excerpt; interlinear?: InterlinearLine[] } = $props();

	const byLine = $derived(new Map((interlinear ?? []).map((l) => [l.line, l.words])));

	let selected = $state<{ line: number; word: GlossWord } | null>(null);

	function pick(line: number, word: GlossWord) {
		selected = selected?.word === word ? null : { line, word };
	}

	// Reset the open gloss when the stop (and thus the excerpt) changes.
	$effect(() => {
		void excerpt;
		selected = null;
	});
</script>

<section class="excerpt" aria-label="Homeric text">
	<div class="grc-block" class:tappable={byLine.size > 0}>
		{#each excerpt.lines as line (line.n)}
			<div class="grc-line">
				<span class="lineno">{line.n}</span>
				{#if byLine.has(line.n)}
					<span class="words">
						{#each byLine.get(line.n)! as word, i (i)}
							<button
								class="gr-word"
								class:sel={selected?.word === word}
								onclick={() => pick(line.n, word)}>{word.w}</button
							>
						{/each}
					</span>
				{:else}
					<span class="grc-text">{line.grc}</span>
				{/if}
			</div>
		{/each}
	</div>

	{#if selected}
		<div class="gloss" role="status">
			<span class="gloss-w">{selected.word.w}</span>
			{#if selected.word.lemma && selected.word.lemma !== selected.word.w}
				<span class="gloss-lemma">← {selected.word.lemma}</span>
			{/if}
			<span class="gloss-g">{selected.word.gloss}</span>
		</div>
	{:else if byLine.size > 0}
		<div class="gloss hint-gloss">tap any Greek word</div>
	{/if}

	<p class="trans">“{excerpt.en}”</p>
	<div class="cite">{excerpt.cite}</div>
</section>
