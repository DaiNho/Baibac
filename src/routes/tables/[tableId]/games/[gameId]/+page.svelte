<script lang="ts">
	import ActionBar from '$/lib/components/ActionBar.svelte';
	import ScoreBoard from '$/lib/components/ScoreBoard.svelte';
	import ScoreKeyboard from '$/lib/components/ScoreKeyboard.svelte';
	import ScoreRankings from '$/lib/components/ScoreRankings.svelte';
	import ChangePlayerModal from '$/lib/components/ChangePlayerModal.svelte';
	import { tablesStore, type PlayerRanking } from '$/lib/stores/tablesStore.svelte';
	import { presetPlayersStore } from '$/lib/stores/presetPlayersStore.svelte';
	import { DicesIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { IScoreRankings } from '$/lib/types/IScoreRankings';

	const tableId = $derived(page.params.tableId);
	const gameId = $derived(page.params.gameId);

	const table = $derived(tablesStore.find((t) => t.id === tableId));
	const game = $derived(table?.games.find((g) => g.id === gameId));

	$effect(() => {
		if (!table || !game) {
			untrack(() => goto('/'));
		}
	});

	function handleStartTyping() {
		if (!game) return;
		game.board.forEach((row) => row.push(0));
		game.activeCell = { r: 0, c: game.board[0].length - 1 };
		game.showKeyboard = true;
	}

	// ── Change player modal ──────────────────────────────────
	let changeModalOpen = $state(false);
	let changingPlayer = $state<IScoreRankings | null>(null);

	function handlePlayerClick(item: IScoreRankings) {
		changingPlayer = item;
		changeModalOpen = true;
	}

	// Names of other players in this game (to avoid duplicates)
	const otherNames = $derived.by(() => {
		if (!game || !changingPlayer) return [];
		return game.rankings
			.filter((r) => r.name !== changingPlayer!.name)
			.map((r) => r.name);
	});

	function handlePlayerChange(result: { name: string; avatar: string; playerSource: 'registry' | 'typed' }) {
		if (!game || !table || !changingPlayer) return;

		const oldName = changingPlayer.name;
		const { name: newName, avatar: newAvatar, playerSource: newSource } = result;

		// Update game.rankings entry
		const rankIdx = game.rankings.findIndex((r) => r.name === oldName);
		if (rankIdx !== -1) {
			game.rankings[rankIdx] = {
				...game.rankings[rankIdx],
				name: newName,
				avatar: newAvatar,
				playerSource: newSource
			};
		}

		// Update table.players list
		const pIdx = table.players.indexOf(oldName);
		if (pIdx !== -1) {
			table.players[pIdx] = newName;
		}

		// Update table.playersWithAvatar
		const paIdx = table.playersWithAvatar.findIndex((p) => p.name === oldName);
		if (paIdx !== -1) {
			table.playersWithAvatar[paIdx] = {
				name: newName,
				avatar: newAvatar,
				playerSource: newSource
			};
		} else {
			table.playersWithAvatar.push({ name: newName, avatar: newAvatar, playerSource: newSource });
		}

		// If registry player, also save to preset store
		if (newSource === 'registry' && !presetPlayersStore.some((p) => p.name.toLowerCase() === newName.toLowerCase())) {
			presetPlayersStore.push({
				id: newName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
				name: newName,
				avatar: newAvatar,
				playerSource: 'registry'
			});
		}

		changingPlayer = null;
	}
</script>

{#if table && game}
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="flex size-8 items-center justify-center rounded bg-muted">
				<DicesIcon class="size-4" />
			</div>
			<span class="text-sm font-medium">{game.title}</span>
		</div>
		<span class="text-xs text-muted-foreground">
			{new Date(game.createdAt).toLocaleString('vi-VN')}
		</span>
	</div>

	<ScoreRankings items={game.rankings} onPlayerClick={handlePlayerClick} />

	<ScoreBoard players={table.players} {game} />

	{#if game.showKeyboard}
		<div class="">
			<ScoreKeyboard {table} {game} />
		</div>
	{:else}
		<ActionBar title="Thua thì nhập đi" onClick={handleStartTyping} />
	{/if}

	{#if changingPlayer}
		<ChangePlayerModal
			open={changeModalOpen}
			playerName={changingPlayer.name}
			playerSource={changingPlayer.playerSource ?? 'typed'}
			existingNames={otherNames}
			onClose={() => { changeModalOpen = false; changingPlayer = null; }}
			onConfirm={handlePlayerChange}
		/>
	{/if}
{/if}
