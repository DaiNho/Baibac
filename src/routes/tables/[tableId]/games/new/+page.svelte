<script lang="ts">
	import ActionBar from '$/lib/components/ActionBar.svelte';
	import GameForm from '$/lib/components/GameForm.svelte';
	import type { IGameForm } from '$/lib/types/IGameForm';
	import { page } from '$app/state';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	const tableId = $derived(page.params.tableId);
	const table = $derived(tablesStore.find((t) => t.id === tableId));

	let form = $state({
		title: '',
		rewards: [] as string[]
	});

	interface SelectedPlayer {
		name: string;
		playerSource: 'registry' | 'typed';
	}

	let selectedPlayers = $state<SelectedPlayer[]>([]);

	$effect(() => {
		if (!table) {
			untrack(() => goto('/'));
		} else {
			untrack(() => {
				// Initialize selectedPlayers from table.playersWithAvatar (has playerSource)
				if (selectedPlayers.length === 0 && table.players.length > 0) {
					selectedPlayers = table.players.map(name => {
						const pa = table.playersWithAvatar.find(p => p.name === name);
						return {
							name,
							playerSource: pa?.playerSource ?? 'typed'
						};
					});
				}
				// Update rewards to match selected players count
				form.rewards = selectedPlayers.map(() => '');
			});
		}
	});

	function handleChange(data: IGameForm) {
		form = data;
	}

	function handleSelectedPlayersChange(players: SelectedPlayer[]) {
		selectedPlayers = players;
		form.rewards = players.map(() => '');
	}

	function handleCreate() {
		if (!table) return;

		const newGameId = (table.games.length + 1).toString();
		const newGame = {
			id: newGameId,
			createdAt: new Date().toISOString(),
			title: form.title || 'Chơi xong tính tiếp',
			rewards: form.rewards,
			board: selectedPlayers.map(() => []),
			rankings: selectedPlayers.map((sp, i) => {
				// Get playerSource from table.playersWithAvatar (for typed players it's always 'typed')
				const pa = table.playersWithAvatar.find(p => p.name === sp.name);
				const playerSource = pa?.playerSource ?? sp.playerSource;
				// For typed players: always use empty avatar (will get random funny avatar)
				// For registry players: use their saved avatar
				const avatar = playerSource === 'typed' || !pa?.avatar ? '' : pa.avatar;
				return {
					name: sp.name,
					total: 0,
					reward: form.rewards[i] || '',
					avatar,
					playerSource
				};
			}),
			activeCell: { r: -1, c: -1 },
			showKeyboard: false
		};

		table.games.push(newGame);
		goto(`/tables/${tableId}/games/${newGameId}`, { replaceState: true });
	}
</script>

{#if table}
	<GameForm
		title={form.title}
		rewards={form.rewards}
		onchange={handleChange}
		onsubmit={handleCreate}
		{table}
		{selectedPlayers}
		onselectedplayerschange={handleSelectedPlayersChange}
	/>
	<ActionBar title={form.title ? 'Vào việc' : 'Chơi xong tính tiếp'} onClick={handleCreate} />
{/if}
