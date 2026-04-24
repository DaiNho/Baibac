<script lang="ts">
	import ActionBar from '$/lib/components/ActionBar.svelte';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import { goto } from '$app/navigation';

	// Preset players with their avatars (registry = from preset list)
	let PRESET_PLAYERS = $state([
		{ id: 'nam', name: 'Nam', avatar: 'nam', playerSource: 'registry' as const },
		{ id: 'hungnhieu', name: 'Hưng nhiều', avatar: 'hungnhieu', playerSource: 'registry' as const },
		{ id: 'dungcung', name: 'Dũng cưng', avatar: 'dungcung', playerSource: 'registry' as const },
		{ id: 'dung', name: 'Dũng', avatar: 'dung', playerSource: 'registry' as const },
		{ id: 'vinh', name: 'Vinh', avatar: 'vinhxo', playerSource: 'registry' as const }
	]);

	let inputEl: HTMLInputElement | undefined = $state();
	let newPlayerInput = $state('');

	// Mode: 'type' or 'preset'
	let mode: 'type' | 'preset' = $state('type');

	// Typed players list
	let typedPlayers: string[] = $state([]);

	// Selected preset players
	let selectedPresets: string[] = $state([]);

	// Computed: all selected players
	const selectedPlayers = $derived([
		...typedPlayers.map(name => ({ name: name.toLowerCase(), playerSource: 'typed' as const })),
		...selectedPresets.map(name => {
			const preset = PRESET_PLAYERS.find(p => p.name === name);
			return { name: name.toLowerCase(), playerSource: 'registry' as const, avatar: preset?.avatar };
		})
	]);

	// Count display
	const playerCount = $derived(selectedPlayers.length);
	const canSubmit = $derived(playerCount >= 2 && playerCount <= 5);

	// Filtered presets for selection
	const filteredPresets = $derived(
		PRESET_PLAYERS.filter(p => !selectedPresets.includes(p.name))
	);

	// Add typed player
	function addTypedPlayer() {
		const name = newPlayerInput.trim();
		if (!name) return;
		if (typedPlayers.some(tp => tp.toLowerCase() === name.toLowerCase())) return;
		if (playerCount >= 5) return;
		typedPlayers = [...typedPlayers, name];
		newPlayerInput = '';
		inputEl?.focus();
	}

	function removeTypedPlayer(index: number) {
		typedPlayers = typedPlayers.filter((_, i) => i !== index);
	}

	function updateTypedPlayer(index: number, value: string) {
		typedPlayers = typedPlayers.map((p, i) => i === index ? value : p);
	}

	function addPresetPlayer(preset: typeof PRESET_PLAYERS[0]) {
		if (playerCount >= 5) return;
		if (selectedPresets.includes(preset.name)) return;
		selectedPresets = [...selectedPresets, preset.name];
	}

	function removePresetPlayer(name: string) {
		selectedPresets = selectedPresets.filter(n => n !== name);
	}

	function handleCreate() {
		if (!canSubmit) return;

		// Create playersWithAvatar
		const playersWithAvatar = selectedPlayers.map(p => {
			if (p.playerSource === 'registry') {
				return {
					name: p.name,
					avatar: p.avatar ?? 'a',
					playerSource: 'registry' as const
				};
			}
			// Typed players: empty avatar (will use funny avatar)
			return {
				name: p.name,
				avatar: '',
				playerSource: 'typed' as const
			};
		});

		const newTableId = (tablesStore.length + 1).toString();
		const newTable = {
			id: newTableId,
			createdAt: new Date().toISOString(),
			players: selectedPlayers.map(p => p.name),
			playersWithAvatar,
			games: []
		};

		tablesStore.push(newTable);
		goto(`/tables/${newTableId}/games/new`, { replaceState: true });
	}
</script>

<div class="flex flex-1 flex-col gap-4 overflow-auto rounded border bg-card p-4">
	<div class="animate__animated animate__fadeIn flex flex-col items-center gap-1">
		<h1 class="text-lg font-medium text-card-foreground">Thêm bàn thêm ghế</h1>
		<p class="text-sm text-muted-foreground">Người không chơi là người thắng</p>
	</div>

	<!-- Player Count Badge -->
	<div class="mt-4 flex items-center justify-center gap-2">
		<span class="text-sm text-muted-foreground">Số người chơi:</span>
		<div class="flex items-center gap-1">
			{#each Array(5) as _, i}
				<div
					class="size-8 rounded-full border-2 transition-all {i < playerCount ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-muted/30 text-muted-foreground'}"
				>
					<span class="flex h-full items-center justify-center text-xs font-medium">{i + 1}</span>
				</div>
			{/each}
		</div>
		<span class="text-sm font-medium {canSubmit ? 'text-green-600' : 'text-red-500'}">
			({playerCount}/5)
		</span>
	</div>

	<!-- Mode Toggle -->
	<div class="mt-4 flex rounded-lg border bg-muted/30 p-1">
		<button
			type="button"
			onclick={() => mode = 'type'}
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all {mode === 'type' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
		>
			✏️ Tự nhập tên
		</button>
		<button
			type="button"
			onclick={() => mode = 'preset'}
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all {mode === 'preset' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
		>
			📋 Chọn từ 12A3
		</button>
	</div>

	<!-- Type Mode -->
	{#if mode === 'type'}
		<div class="mt-4 flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">Nhập tên từng người chơi:</p>

			<!-- Add input -->
			<div class="flex items-center gap-2">
				<input
					bind:this={inputEl}
					bind:value={newPlayerInput}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addTypedPlayer();
						}
					}}
					autocomplete="off"
					autocapitalize="words"
					spellcheck="false"
					placeholder="Nhập tên và nhấn dấu +..."
					type="text"
					class="flex-1 rounded border bg-input/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<button
					type="button"
					onclick={addTypedPlayer}
					disabled={playerCount >= 5 || !newPlayerInput.trim()}
					class="flex h-9 w-9 items-center justify-center rounded border bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
				</button>
			</div>

			<!-- Typed players list -->
			{#if typedPlayers.length > 0}
				<div class="flex flex-col gap-2">
					{#each typedPlayers as name, i}
						<div
							class="animate__animated animate__fadeIn flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-2"
						>
							<span class="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">#{i + 1}</span>
							<span class="flex-1 text-sm font-medium capitalize text-primary">{name}</span>
							<span class="text-xs text-muted-foreground">✏️</span>
							<button
								type="button"
								onclick={() => removeTypedPlayer(i)}
								class="text-muted-foreground hover:text-red-500"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted/50 py-6 text-center">
					<p class="text-sm text-muted-foreground">Chưa có ai được thêm</p>
					<p class="text-xs text-muted-foreground">Nhập tên và nhấn dấu +</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Preset Mode -->
	{#if mode === 'preset'}
		<div class="mt-4 flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">Chọn người chơi từ danh sách 12A3:</p>

			<!-- Preset players grid -->
			{#if filteredPresets.length > 0}
				<div class="grid grid-cols-2 gap-2">
					{#each filteredPresets as preset}
						<button
							type="button"
							onclick={() => addPresetPlayer(preset)}
							class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted"
						>
							<img
								src={`/avatars/${preset.avatar}.png`}
								alt={preset.name}
								class="size-10 rounded-full object-cover"
							/>
							<span class="flex-1 text-sm font-medium capitalize text-card-foreground">{preset.name}</span>
							<span class="text-primary">+</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted/50 py-6 text-center">
					<p class="text-sm text-muted-foreground">Đã chọn hết người chơi!</p>
				</div>
			{/if}

			<!-- Selected presets list -->
			{#if selectedPresets.length > 0}
				<div class="flex flex-col gap-2">
					{#each selectedPresets as name, i}
						{@const preset = PRESET_PLAYERS.find(p => p.name === name)}
						<div
							class="animate__animated animate__fadeIn flex items-center gap-2 rounded-lg border bg-primary/10 p-2"
						>
							<span class="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">#{i + 1}</span>
							<img
								src={`/avatars/${preset?.avatar}.png`}
								alt={name}
								class="size-7 rounded-full object-cover"
							/>
							<span class="flex-1 text-sm font-medium capitalize text-card-foreground">{name}</span>
							<span class="text-xs text-green-600">📷</span>
							<button
								type="button"
								onclick={() => removePresetPlayer(name)}
								class="text-muted-foreground hover:text-red-500"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Selected Players Summary -->
	{#if playerCount > 0}
		<div class="mt-4 rounded-lg border bg-muted/20 p-3">
			<p class="mb-2 text-xs font-medium text-muted-foreground">Danh sách người chơi ({playerCount}):</p>
			<div class="flex flex-wrap gap-2">
				{#each selectedPlayers as player, i}
					<div class="flex items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-xs">
						<span class="font-medium capitalize">{player.name}</span>
						{#if player.playerSource === 'typed'}
							<span class="text-[10px] text-muted-foreground">✏️</span>
						{:else}
							<span class="text-[10px] text-green-600">📷</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Helper Text -->
	<div class="mt-4 flex flex-col gap-1 px-1">
		<p class="text-xs text-muted-foreground">
			• Tối thiểu 2 người, tối đa 5 người
		</p>
		<p class="text-xs text-muted-foreground">
			• 📷 = người có ảnh (từ 12A3), ✏️ = nhập tay
		</p>
	</div>
</div>

<ActionBar
	title={canSubmit ? 'Oke la' : (playerCount === 0 ? 'Chưa chọn ai' : playerCount === 1 ? 'Cần thêm 1 người' : `Cần ${2 - playerCount > 0 ? 2 - playerCount : 0} người nữa`)}
	onClick={handleCreate}
	disabled={!canSubmit}
/>
