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

<div class="flex h-svh w-svw flex-col gap-4 p-4">
	{@render children()}
</div>
