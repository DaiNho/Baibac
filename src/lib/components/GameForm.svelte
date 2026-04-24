<script lang="ts">
	import { getRewardDisplay } from '$/lib/utils/getRewardDisplay';
	import { getRankStyle } from '$/lib/utils/getRankStyle';
	import type { IGameForm } from '../types/IGameForm';
	import type { Table } from '$/lib/stores/tablesStore.svelte';

	interface SelectedPlayer {
		name: string;
		playerSource: 'registry' | 'typed';
	}

	type Props = {
		title: IGameForm['title'];
		rewards: IGameForm['rewards'];
		onchange: (data: IGameForm) => void;
		onsubmit?: () => void;
		table: Table | undefined;
		selectedPlayers: SelectedPlayer[];
		onselectedplayerschange: (players: SelectedPlayer[]) => void;
	};

	const { title, rewards, onchange, onsubmit, table, selectedPlayers, onselectedplayerschange }: Props = $props();

	function updateTitle(value: string) {
		onchange({ title: value, rewards });
	}

	function updateReward(index: number, value: string) {
		const newRewards = [...rewards];
		newRewards[index] = value;
		onchange({ title, rewards: newRewards });
	}

	function togglePlayer(name: string, playerSource: 'registry' | 'typed') {
		const exists = selectedPlayers.find(p => p.name === name && p.playerSource === playerSource);
		if (exists) {
			if (selectedPlayers.length > 1) {
				onselectedplayerschange(selectedPlayers.filter(p => !(p.name === name && p.playerSource === playerSource)));
			}
		} else {
			onselectedplayerschange([...selectedPlayers, { name, playerSource }]);
		}
	}

	function removePlayer(index: number) {
		if (selectedPlayers.length > 1) {
			onselectedplayerschange(selectedPlayers.filter((_, i) => i !== index));
		}
	}

	function handleKeydown(e: KeyboardEvent, index: number) {
		if (e.key !== 'Enter') return;
		console.log(index, rewards.length - 1);
		if (index === rewards.length - 1) {
			e.preventDefault();
			onsubmit?.();
		}
	}

	function getDisplayName(player: SelectedPlayer) {
		if (player.playerSource === 'typed') {
			return player.name + ' ✏️';
		}
		return player.name;
	}
</script>

<form
	class="flex flex-1 flex-col gap-4 overflow-auto rounded border bg-card p-4"
	onsubmit={(e) => {
		e.preventDefault();
		onsubmit?.();
	}}
>
	<!-- Header -->
	<div class="animate__animated animate__fadeIn flex flex-col items-center gap-1">
		<h1 class="text-lg font-medium text-card-foreground">Thêm bát thêm đũa</h1>
		<p class="text-sm text-muted-foreground">Người không chơi là người thắng</p>
	</div>

	<!-- Title -->
	<div class="animate__animated animate__fadeIn2 mt-4 flex flex-col gap-2">
		<label for="title" class="text-sm text-card-foreground"> Kèo gì đây các dân chơi? </label>
		<input
			value={title}
			oninput={(e) => updateTitle(e.currentTarget.value)}
			autocomplete="off"
			autocapitalize="sentences"
			spellcheck="false"
			id="title"
			type="text"
			class="h-9 rounded border bg-input/40 px-3 py-1 text-sm placeholder:text-muted-foreground"
		/>
	</div>

	<!-- Player Selection -->
	{#if table && table.players.length > 1}
		
	{/if}

	<!-- Typed Players -->
	{#if selectedPlayers.some(p => p.playerSource === 'typed')}
		
	{/if}

	<!-- Rewards -->
	<ol class="animate__animated animate__fadeIn flex flex-col gap-2">
		{#each selectedPlayers as sp, index}
			{@const rank = index}
			{@const rankStyle = getRankStyle(rank)}
			{@const rewardDisplay = getRewardDisplay(sp.name)}
			{@const isTyped = sp.playerSource === 'typed'}

			<li
				class="animate__animated animate__fadeIn flex items-center gap-2"
				style:animation-delay={`${index * 100}ms`}
			>
				<label
					for="rank-{rank}"
					class={[
						'flex size-9 items-center justify-center rounded border',
						rankStyle.bgColor,
						rankStyle.textColor,
						rankStyle.borderColor
					]}
				>
					#{rank + 1}
				</label>

					{#if isTyped}
					<input
						value={sp.name}
						oninput={(e) => {
							const updated = [...selectedPlayers];
							updated[index] = { ...updated[index], name: e.currentTarget.value };
							onselectedplayerschange(updated);
						}}
						onkeydown={(e) => handleKeydown(e, index)}
						autocomplete="off"
						autocapitalize="sentences"
						spellcheck="false"
						id="rank-{rank}"
						type="text"
						placeholder="Tên người chơi..."
						class={[
							'flex-1 rounded border px-2 text-sm placeholder:text-muted-foreground',
							rankStyle.bgColor,
							rankStyle.borderColor,
							rewardDisplay.textColor
						]}
					/>
				{:else}
					<div
						class="flex flex-1 items-center gap-2 rounded border px-2 text-sm {rankStyle.bgColor} {rankStyle.borderColor}"
					>
						<span class={rewardDisplay.textColor}>{getDisplayName(sp)}</span>
						<button
							type="button"
							class="ml-auto text-muted-foreground hover:text-foreground"
							onclick={() => removePlayer(index)}
						>
							✕
						</button>
					</div>
				{/if}

				<input
					value={rewards[index] ?? ''}
					oninput={(e) => updateReward(index, e.currentTarget.value)}
					onkeydown={(e) => handleKeydown(e, index)}
					autocomplete="off"
					type="text"
					placeholder="..."
					class={[
						'w-24 rounded border px-2 text-sm placeholder:text-muted-foreground',
						rankStyle.bgColor,
						rankStyle.borderColor,
						rewardDisplay.textColor
					]}
				/>
			</li>
		{/each}
	</ol>

	<!-- Add typed player button -->
	{#if table && table.players.length > 0}
		<button
			type="button"
			class="flex items-center justify-center gap-2 rounded border border-dashed border-primary/50 py-2 text-sm text-primary hover:bg-primary/10"
			onclick={() => {
				onselectedplayerschange([...selectedPlayers, { name: `Khách ${selectedPlayers.filter(p => p.playerSource === 'typed').length + 1}`, playerSource: 'typed' }]);
			}}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
			Thêm người nhập tên
		</button>
	{/if}

	<!-- Hint -->
	<div class="animate__animated animate__fadeIn flex flex-col gap-1 px-1">
		<ul class="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
			<li>• Nhập số dương cho người thắng/được thêm tiền (+100, +50)</li>
			<li>• Nhập số âm cho người thua/phải trả tiền (-100, -200)</li>
			<li>• Có thể nhập nội dung (Trả tiền nước, Mua trà sữa...)</li>
			<li>• Có thể để trống các trường</li>
		</ul>
	</div>
</form>
