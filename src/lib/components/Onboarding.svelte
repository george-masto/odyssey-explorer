<script lang="ts">
	import trireme from '$lib/map/trireme.svg?raw';

	let { open = $bindable() }: { open: boolean } = $props();

	const windRose = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
		<path d="M13 13 L29 27 L27 29 Z" fill="#8a744a"/><path d="M51 13 L35 27 L37 29 Z" fill="#8a744a"/>
		<path d="M13 51 L27 35 L29 37 Z" fill="#8a744a"/><path d="M51 51 L35 37 L37 35 Z" fill="#8a744a"/>
		<path d="M32 3 L36.5 27.5 L32 32 L27.5 27.5 Z" fill="#c9a227" stroke="#26190e" stroke-width="1.2"/>
		<path d="M32 61 L36.5 36.5 L32 32 L27.5 36.5 Z" fill="#26190e"/>
		<path d="M3 32 L27.5 27.5 L32 32 L27.5 36.5 Z" fill="#26190e"/>
		<path d="M61 32 L36.5 27.5 L32 32 L36.5 36.5 Z" fill="#26190e"/>
		<circle cx="32" cy="32" r="5.5" fill="#b0402c" stroke="#26190e" stroke-width="1.5"/>
	</svg>`;

	const heliosSun = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
		<g fill="#c9a227" stroke="#26190e" stroke-width="1.1">
			<path d="M32 4 L36 15 L28 15 Z"/><path d="M32 4 L36 15 L28 15 Z" transform="rotate(45 32 32)"/>
			<path d="M32 4 L36 15 L28 15 Z" transform="rotate(90 32 32)"/><path d="M32 4 L36 15 L28 15 Z" transform="rotate(135 32 32)"/>
			<path d="M32 4 L36 15 L28 15 Z" transform="rotate(180 32 32)"/><path d="M32 4 L36 15 L28 15 Z" transform="rotate(225 32 32)"/>
			<path d="M32 4 L36 15 L28 15 Z" transform="rotate(270 32 32)"/><path d="M32 4 L36 15 L28 15 Z" transform="rotate(315 32 32)"/>
		</g>
		<circle cx="32" cy="32" r="13.5" fill="#b0402c" stroke="#26190e" stroke-width="1.6"/>
		<circle cx="32" cy="32" r="8.5" fill="none" stroke="#c9a227" stroke-width="1.4"/>
	</svg>`;

	const scroll = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
		<rect x="13" y="18" width="38" height="28" fill="#f0e8d2" stroke="#26190e" stroke-width="1.6"/>
		<rect x="7" y="14" width="9" height="36" rx="4.5" fill="#e6d7ae" stroke="#26190e" stroke-width="1.6"/>
		<rect x="48" y="14" width="9" height="36" rx="4.5" fill="#e6d7ae" stroke="#26190e" stroke-width="1.6"/>
		<g stroke="#6b5327" stroke-width="1.7" stroke-linecap="round">
			<line x1="21" y1="26" x2="43" y2="26"/><line x1="21" y1="32" x2="43" y2="32"/><line x1="21" y1="38" x2="35" y2="38"/>
		</g>
		<text x="40" y="41" font-family="Georgia, serif" font-size="9" fill="#b0402c">α</text>
	</svg>`;

	const slides = [
		{
			icon: trireme,
			title: 'Sail the Odyssey',
			body: "Seventeen landfalls from Troy to Ithaca — the world's greatest homecoming on an ancient chart. Every stop carries Homer's own Greek, the story, sourced lore, art, and what stands in that exact place today."
		},
		{
			icon: windRose,
			title: 'Getting around',
			body: 'Use the ← → arrow keys to sail stop to stop. Or click any numbered marker on the map, the progress dots at the top, or the next / previous buttons in the panel.'
		},
		{
			icon: heliosSun,
			title: 'Myth ↔ Today',
			body: "Press N — or the Map Era switch, top right — to swap the ancient chart for today's satellite view. These are real places: every stop links out to Google Maps."
		},
		{
			icon: scroll,
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
			<div class="icon" aria-hidden="true">{@html slides[index].icon}</div>
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
		height: 74px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.icon :global(svg) {
		height: 100%;
		width: auto;
		max-width: 150px;
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
