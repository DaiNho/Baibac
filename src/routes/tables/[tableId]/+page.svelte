<script lang="ts">
	import ActionBar from '$/lib/components/ActionBar.svelte';
	import AddPlayerModal from '$/lib/components/AddPlayerModal.svelte';
	import GameItem from '$/lib/components/GameItem.svelte';
	import TotalMoney from '$/lib/components/TotalMoney.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import { untrack } from 'svelte';

	const tableId = $derived(page.params.tableId);
	const table = $derived(tablesStore.find((t) => t.id === tableId));
	let showAddPlayerModal = $state(false);

	$effect(() => {
		if (!table) {
			untrack(() => goto('/'));
		}
	});

	const totalRankings = $derived.by(() => {
		if (!table) return [];
		const totals: Record<string, number> = {};
		table.players.forEach((p) => (totals[p] = 0));

		table.games.forEach((game) => {
			game.rankings.forEach((r) => {
				if (totals[r.name] !== undefined) {
					totals[r.name] += parseInt(r.reward) || 0;
				}
			});
		});

		return Object.entries(totals)
			.map(([name, total]) => ({
				name,
				reward: total.toString()
			}))
			.sort((a, b) => parseInt(b.reward) - parseInt(a.reward));
	});

	function handleAddPlayer(name: string, avatarId: string) {
		if (!table) return;

		const normalizedName = name.toLowerCase();
		table.players.push(normalizedName);
		// Registry player = has custom avatar from 12A3 list
		table.playersWithAvatar.push({
			name: normalizedName,
			avatar: avatarId,
			playerSource: 'registry'
		});
	}

	// Get current players for modal
	const currentPlayers = $derived(table?.players ?? []);
</script>

{#if table}
	<TotalMoney items={totalRankings} />

	<ul class="flex flex-1 flex-col gap-4 overflow-auto">
		{#each table.games.toReversed() as game, i (game.id)}
			<div class="animate__animated animate__fadeIn" style:animation-delay={`${i * 100}ms`}>
				<GameItem
					id={game.id}
					title={game.title}
					rankings={game.rankings}
					createdAt={game.createdAt}
					roundsCount={game.board[0]?.length || 0}
				/>
			</div>
		{:else}
			<div class="animate__animated animate__fadeIn flex flex-1 flex-col items-center justify-center gap-3 py-14 text-center">
				<div class="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-3xl shadow-sm transition-transform hover:scale-110">
					🎲
				</div>
				<div class="flex flex-col gap-0.5">
					<p class="font-semibold text-card-foreground">Chưa có ván nào</p>
					<p class="text-sm text-muted-foreground">Nhấn nút bên dưới để bắt đầu ván đầu tiên!</p>
				</div>
			</div>
		{/each}
	</ul>

	<ActionBar title="Thêm bát thêm đũa" href={`/tables/${tableId}/games/new`} />

	<AddPlayerModal
		open={showAddPlayerModal}
		onClose={() => (showAddPlayerModal = false)}
		onAdd={handleAddPlayer}
		existingPlayers={currentPlayers}
	/>
{/if}
