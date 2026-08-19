<script lang="ts">
	let { open = $bindable() }: { open: boolean } = $props();

	const slides = [
		{
			icon: '⛵',
			title: 'Sail the Odyssey',
			body: "Seventeen landfalls from Troy to Ithaca — the world's greatest homecoming on an ancient chart. Every stop carries Homer's own Greek, the story, sourced lore, art, and what stands in that exact place today."
		},
		{
			icon: '🧭',
			title: 'Getting around',
			body: 'Use the ← → arrow keys to sail stop to stop. Or click any numbered marker on the map, the progress dots at the top, or the next / previous buttons in the panel.'
		},
		{
			icon: '🛰️',
			title: 'Myth ↔ NOW',
			body: "Press N — or the NOW button, top right — to swap the ancient chart for today's satellite view. These are real places: every stop links out to Google Maps."
		},
		{
			icon: '✍️',
			title: 'Touch the Greek',
			body: 'Words with dashed underlines are tappable — on the famous passages, every single word carries a gloss. Etymology cards trace names like Scylla and words like nostalgia from Homer to English.'
		}
	];

	let index = $state(0);
	let dialogEl = $state<HTMLElement | undefined>(undefined);

	function close() {
		open = false;
		try {
			localStorage.setItem('odyssey-onboarded-v1', '1');
		} catch {
			/* private mode */
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowRight' && index < slides.length - 1) {
			e.preventDefault();
			index++;
		} else if (e.key === 'ArrowLeft' && index > 0) {
			e.preventDefault();
			index--;
		}
	}

	$effect(() => {
		if (open) {
			index = 0;
			dialogEl?.focus();
		}
	});
</script>

<svelte:window {onkeydown} />

{#if open}
	<div
		class="backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		role="presentation"
	>
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-label="How to use Odyssey Explorer"
			tabindex="-1"
			bind:this={dialogEl}
		>
			<div class="icon" aria-hidden="true">{slides[index].icon}</div>
			<h2>{slides[index].title}</h2>
			<p>{slides[index].body}</p>

			<div class="slide-dots">
				{#each slides as slide, i (i)}
					<button
						class="slide-dot"
						class:on={i === index}
						aria-label={`Slide ${i + 1}: ${slide.title}`}
						onclick={() => (index = i)}
					></button>
				{/each}
			</div>

			<div class="row">
				{#if index > 0}
					<button class="ghost" onclick={() => index--}>← Back</button>
				{:else}
					<button class="ghost" onclick={close}>Skip</button>
				{/if}
				{#if index < slides.length - 1}
					<button class="primary" onclick={() => index++}>Next →</button>
				{:else}
					<button class="primary" onclick={close}>Set sail ⛵</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(6, 12, 22, 0.78);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.dialog {
		width: min(430px, 92vw);
		background: #f0e8d2;
		color: #241a0c;
		border: 1px solid #a08d5a;
		border-radius: 10px;
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
		padding: 30px 28px 22px;
		text-align: center;
		outline: none;
	}

	.icon {
		font-size: 44px;
		line-height: 1;
		margin-bottom: 12px;
	}

	h2 {
		font-family: var(--serif);
		font-size: 26px;
		margin-bottom: 10px;
	}

	p {
		font-size: 14.5px;
		line-height: 1.6;
		color: #4a3a1c;
		min-height: 92px;
	}

	.slide-dots {
		display: flex;
		justify-content: center;
		gap: 7px;
		margin: 14px 0 16px;
	}

	.slide-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 1px solid #8a6d1d;
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.slide-dot.on {
		background: #8a6d1d;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	.row button {
		flex: 1;
		font-size: 14px;
		font-weight: 700;
		padding: 10px 12px;
		border-radius: 7px;
		cursor: pointer;
	}

	.ghost {
		background: transparent;
		border: 1px solid #a08d5a;
		color: #6b5327;
	}

	.primary {
		background: #26190e;
		border: 1px solid #26190e;
		color: #f0e8d2;
	}

	.primary:hover {
		background: #3a2a16;
	}
</style>
