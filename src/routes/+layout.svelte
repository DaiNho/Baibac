<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import './layout.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Sâm log</title>
</svelte:head>

<div class="relative flex h-svh w-svw flex-col bg-neutral-950 font-sans text-foreground selection:bg-primary/30">
	<!-- Subtle ambient spotlight for a premium feel -->
	<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-neutral-950 to-neutral-950"></div>

	<!-- Main content area: floating card on desktop, full screen on mobile -->
	<main class="z-10 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 p-4 sm:my-6 sm:h-[calc(100svh-3rem)] sm:rounded-3xl sm:border sm:border-primary/20 sm:bg-card/40 sm:p-6 sm:shadow-2xl sm:backdrop-blur-xl">
		{@render children()}
	</main>
</div>
