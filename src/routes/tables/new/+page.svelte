<script lang="ts">
	import ActionBar from '$/lib/components/ActionBar.svelte';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';

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

	// === ADD PLAYER MODAL ===
	let showAddModal = $state(false);
	let modalName = $state('');
	let modalAvatarUrl = $state('');
	let cameraStream: MediaStream | null = $state(null);
	let videoEl: HTMLVideoElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let fileInputEl: HTMLInputElement | undefined = $state();
	let cameraError = $state('');

	async function openCamera() {
		cameraError = '';
		try {
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user' },
				audio: false
			});
			await tick(); // Wait for videoEl to be rendered by Svelte
			if (videoEl) {
				videoEl.srcObject = cameraStream;
				videoEl.play();
			}
		} catch {
			cameraError = 'Không thể truy cập camera. Hãy cho phép truy cập camera.';
		}
	}

	function stopCamera() {
		cameraStream?.getTracks().forEach((t) => t.stop());
		cameraStream = null;
	}

	function capturePhoto() {
		if (!videoEl || !canvasEl) return;
		canvasEl.width = videoEl.videoWidth;
		canvasEl.height = videoEl.videoHeight;
		canvasEl.getContext('2d')?.drawImage(videoEl, 0, 0);
		modalAvatarUrl = canvasEl.toDataURL('image/jpeg', 0.8);
		stopCamera();
	}

	function handleFileUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			modalAvatarUrl = ev.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function openAddModal() {
		modalName = '';
		modalAvatarUrl = '';
		cameraError = '';
		showAddModal = true;
	}

	function closeAddModal() {
		stopCamera();
		showAddModal = false;
	}

	function confirmAddPlayer() {
		const name = modalName.trim();
		if (!name) return;
		if (PRESET_PLAYERS.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
		const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
		PRESET_PLAYERS = [
			...PRESET_PLAYERS,
			{
				id,
				name,
				avatar: modalAvatarUrl || '',
				playerSource: 'registry' as const
			}
		];
		closeAddModal();
	}

	// Computed: all selected players
	const selectedPlayers = $derived([
		...typedPlayers.map((name) => ({ name: name.toLowerCase(), playerSource: 'typed' as const })),
		...selectedPresets.map((name) => {
			const preset = PRESET_PLAYERS.find((p) => p.name === name);
			return {
				name: name.toLowerCase(),
				playerSource: 'registry' as const,
				avatar: preset?.avatar
			};
		})
	]);

	// Count display
	const playerCount = $derived(selectedPlayers.length);
	const canSubmit = $derived(playerCount >= 2 && playerCount <= 5);

	// Filtered presets for selection
	const filteredPresets = $derived(PRESET_PLAYERS.filter((p) => !selectedPresets.includes(p.name)));

	// Add typed player
	function addTypedPlayer() {
		const name = newPlayerInput.trim();
		if (!name) return;
		if (typedPlayers.some((tp) => tp.toLowerCase() === name.toLowerCase())) return;
		if (playerCount >= 5) return;
		typedPlayers = [...typedPlayers, name];
		newPlayerInput = '';
		inputEl?.focus();
	}

	function removeTypedPlayer(index: number) {
		typedPlayers = typedPlayers.filter((_, i) => i !== index);
	}

	function addPresetPlayer(preset: (typeof PRESET_PLAYERS)[0]) {
		if (playerCount >= 5) return;
		if (selectedPresets.includes(preset.name)) return;
		selectedPresets = [...selectedPresets, preset.name];
	}

	function removePresetPlayer(name: string) {
		selectedPresets = selectedPresets.filter((n) => n !== name);
	}

	function handleCreate() {
		if (!canSubmit) return;

		const playersWithAvatar = selectedPlayers.map((p) => {
			if (p.playerSource === 'registry') {
				return {
					name: p.name,
					avatar: p.avatar ?? 'a',
					playerSource: 'registry' as const
				};
			}
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
			players: selectedPlayers.map((p) => p.name),
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
					class="size-8 rounded-full border-2 transition-all {i < playerCount
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-muted bg-muted/30 text-muted-foreground'}"
				>
					<span class="flex h-full items-center justify-center text-xs font-medium">{i + 1}</span>
				</div>
			{/each}
		</div>
		<span class="text-sm font-medium {canSubmit ? 'text-green-600' : 'text-red-500'}">
			({playerCount}/5)
		</span>
	</div>

	<!-- Mode Selection Cards -->
	<div class="mt-4">
		<p class="mb-2 text-xs font-medium text-muted-foreground">Cách thêm người chơi:</p>
		<div class="grid grid-cols-2 gap-3">
			<button
				type="button"
				onclick={() => (mode = 'type')}
				class="flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-all {mode ===
				'type'
					? 'border-primary bg-primary/10 shadow-sm'
					: 'border-muted bg-card hover:border-primary/50'}"
			>
				<span class="text-2xl">✏️</span>
				<span class="text-sm font-semibold {mode === 'type' ? 'text-primary' : 'text-foreground'}"
					>Tự nhập tên</span
				>
				<span class="text-[10px] text-muted-foreground">Thêm thủ công từng người</span>
			</button>
			<button
				type="button"
				onclick={() => (mode = 'preset')}
				class="flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-all {mode ===
				'preset'
					? 'border-primary bg-primary/10 shadow-sm'
					: 'border-muted bg-card hover:border-primary/50'}"
			>
				<span class="text-2xl">👥</span>
				<span class="text-sm font-semibold {mode === 'preset' ? 'text-primary' : 'text-foreground'}"
					>Danh sách 12A3</span
				>
				<span class="text-[10px] text-muted-foreground">Chọn từ danh sách có sẵn</span>
			</button>
		</div>
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
					class="flex-1 rounded border bg-input/40 px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
				/>
				<button
					type="button"
					onclick={addTypedPlayer}
					disabled={playerCount >= 5 || !newPlayerInput.trim()}
					aria-label="Thêm người chơi"
					class="flex h-9 w-9 items-center justify-center rounded border bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
					>
				</button>
			</div>

			<!-- Typed players list -->
			{#if typedPlayers.length > 0}
				<div class="flex flex-col gap-2">
					{#each typedPlayers as name, i}
						<div
							class="animate__animated animate__fadeIn flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-2"
						>
							<span
								class="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
								>#{i + 1}</span
							>
							<span class="flex-1 text-sm font-medium text-primary capitalize">{name}</span>
							<button
								type="button"
								onclick={() => removeTypedPlayer(i)}
								aria-label="Xóa {name}"
								class="text-muted-foreground hover:text-red-500"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
								>
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted/50 py-6 text-center"
				>
					<p class="text-sm text-muted-foreground">Chưa có ai được thêm</p>
					<p class="text-xs text-muted-foreground">Nhập tên và nhấn dấu +</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Preset Mode -->
	{#if mode === 'preset'}
		<div class="mt-4 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<p class="text-xs text-muted-foreground">Chọn người chơi từ danh sách 12A3:</p>
				<!-- NÚT THÊM NGƯỜI CHƠI MỚI -->
				<button
					type="button"
					onclick={openAddModal}
					aria-label="Thêm người chơi mới"
					class="flex items-center gap-1.5 rounded-lg border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
					>
					Thêm nghiện
				</button>
			</div>

			<!-- Preset players grid -->
			{#if filteredPresets.length > 0}
				<div class="grid grid-cols-2 gap-2">
					{#each filteredPresets as preset}
						<button
							type="button"
							onclick={() => addPresetPlayer(preset)}
							class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted"
						>
							{#if preset.avatar && (preset.avatar.startsWith('data:') || preset.avatar.startsWith('http'))}
								<img
									src={preset.avatar}
									alt={preset.name}
									class="size-10 rounded-full object-cover"
								/>
							{:else if preset.avatar}
								<img
									src={`/avatars/${preset.avatar}.png`}
									alt={preset.name}
									class="size-10 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary"
								>
									{preset.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="flex-1 text-sm font-medium text-card-foreground capitalize"
								>{preset.name}</span
							>
							<span class="text-primary">+</span>
						</button>
					{/each}
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted/50 py-6 text-center"
				>
					<p class="text-sm text-muted-foreground">Đã chọn hết người chơi!</p>
				</div>
			{/if}

			<!-- Selected presets list -->
			{#if selectedPresets.length > 0}
				<div class="flex flex-col gap-2">
					{#each selectedPresets as name, i}
						{@const preset = PRESET_PLAYERS.find((p) => p.name === name)}
						<div
							class="animate__animated animate__fadeIn flex items-center gap-2 rounded-lg border bg-primary/10 p-2"
						>
							<span
								class="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
								>#{i + 1}</span
							>
							{#if preset?.avatar && (preset.avatar.startsWith('data:') || preset.avatar.startsWith('http'))}
								<img src={preset.avatar} alt={name} class="size-7 rounded-full object-cover" />
							{:else if preset?.avatar}
								<img
									src={`/avatars/${preset.avatar}.png`}
									alt={name}
									class="size-7 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary"
								>
									{name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="flex-1 text-sm font-medium text-card-foreground capitalize">{name}</span>
							<button
								type="button"
								onclick={() => removePresetPlayer(name)}
								aria-label="Xóa {name}"
								class="text-muted-foreground hover:text-red-500"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
								>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Selected Players Summary -->
	{#if playerCount > 0}
		<div class="mt-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
			<div class="mb-3 flex items-center justify-between">
				<p class="text-xs font-bold text-primary">
					Đội hình ra sân ({playerCount}/5)
				</p>
				{#if playerCount === 5}
					<span
						class="animate__animated animate__bounceIn rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-600"
						>ĐỦ TAY! 🔥</span
					>
				{/if}
			</div>
			<div class="flex flex-wrap gap-4">
				{#each selectedPlayers as player}
					<div class="animate__animated animate__zoomIn flex flex-col items-center gap-1">
						<div
							class="relative flex size-12 items-center justify-center rounded-full border-2 border-primary bg-card shadow-sm transition-transform hover:scale-110"
						>
							{#if player.playerSource === 'registry' && player.avatar}
								{#if player.avatar.startsWith('data:') || player.avatar.startsWith('http')}
									<img
										src={player.avatar}
										alt={player.name}
										class="size-full rounded-full object-cover"
									/>
								{:else}
									<img
										src={`/avatars/${player.avatar}.png`}
										alt={player.name}
										class="size-full rounded-full object-cover"
									/>
								{/if}
							{:else}
								<span class="text-lg font-bold text-primary"
									>{player.name.charAt(0).toUpperCase()}</span
								>
							{/if}
						</div>
						<span
							class="max-w-[64px] truncate text-center text-xs font-bold text-card-foreground capitalize"
							>{player.name}</span
						>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Helper Text -->
	<div class="mt-4 flex flex-col gap-1 px-1">
		<p class="text-xs text-muted-foreground">• Tối thiểu 2 người, tối đa 5 người</p>
	</div>
</div>

<ActionBar
	title={canSubmit
		? 'Oke la'
		: playerCount === 0
			? 'Chưa chọn ai'
			: playerCount === 1
				? 'Cần thêm 1 người'
				: `Cần ${2 - playerCount > 0 ? 2 - playerCount : 0} người nữa`}
	onClick={handleCreate}
	disabled={!canSubmit}
/>

<!-- ===== ADD PLAYER MODAL ===== -->
{#if showAddModal}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
		onclick={closeAddModal}
		aria-hidden="true"
	></div>

	<!-- Modal sheet — single page -->
	<div
		class="animate__animated animate__slideInUp fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-card p-5 shadow-2xl"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-semibold text-card-foreground">Thêm người chơi mới</h2>
			<button
				type="button"
				onclick={closeAddModal}
				aria-label="Đóng"
				class="flex size-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
				>
			</button>
		</div>

		<!-- Avatar preview + name input -->
		<div class="mb-4 flex items-center gap-4">
			<!-- Avatar circle -->
			<div class="relative shrink-0">
				{#if modalAvatarUrl}
					<img
						src={modalAvatarUrl}
						alt="Avatar"
						class="size-16 rounded-full border-2 border-primary object-cover"
					/>
					<button
						type="button"
						onclick={() => {
							modalAvatarUrl = '';
							stopCamera();
							if (fileInputEl) fileInputEl.value = '';
						}}
						aria-label="Xóa ảnh"
						class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
						>
					</button>
					<!-- Download Button -->
					<a
						href={modalAvatarUrl}
						download={`avatar_${modalName || 'player'}.jpg`}
						aria-label="Tải ảnh về"
						title="Tải ảnh về"
						class="absolute -bottom-1 -left-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-white shadow transition-transform hover:scale-110 active:scale-95"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
					</a>
				{:else}
					<div
						class="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted bg-muted/20 text-2xl"
					>
						👤
					</div>
				{/if}
			</div>
			<!-- Name input -->
			<input
				bind:value={modalName}
				type="text"
				placeholder="Nhập tên người chơi..."
				autocapitalize="words"
				autocomplete="off"
				class="flex-1 rounded-lg border bg-input/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
			/>
		</div>

		<!-- Camera live view (only when streaming) -->
		{#if cameraStream && !modalAvatarUrl}
			<div class="mb-4 flex flex-col items-center gap-3">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					bind:this={videoEl}
					class="w-full rounded-xl object-cover"
					style="max-height: 200px;"
					playsinline
				></video>
				<canvas bind:this={canvasEl} class="hidden"></canvas>
				<button
					type="button"
					onclick={capturePhoto}
					aria-label="Chụp ảnh"
					class="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"
						/><circle cx="12" cy="13" r="3" /></svg
					>
				</button>
			</div>
		{/if}

		<!-- Camera error -->
		{#if cameraError}
			<div
				class="mb-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-500"
			>
				{cameraError}
			</div>
		{/if}

		<!-- Upload / Camera buttons side by side -->
		{#if !cameraStream || modalAvatarUrl}
			<div class="mb-4 flex gap-2">
				<button
					type="button"
					onclick={() => fileInputEl?.click()}
					class="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-primary transition-all hover:bg-primary/5 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
							points="17 8 12 3 7 8"
						/><line x1="12" x2="12" y1="3" y2="15" /></svg
					>
					<span class="text-xs font-medium">Tải ảnh</span>
				</button>
				<button
					type="button"
					onclick={() => {
						stopCamera();
						openCamera();
					}}
					class="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-primary transition-all hover:bg-primary/5 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"
						/><circle cx="12" cy="13" r="3" /></svg
					>
					<span class="text-xs font-medium">Chụp ảnh</span>
				</button>
			</div>
		{/if}

		<input
			bind:this={fileInputEl}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={handleFileUpload}
		/>

		<!-- Confirm button -->
		<button
			type="button"
			onclick={confirmAddPlayer}
			disabled={!modalName.trim()}
			class="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Thêm nghiện
		</button>
	</div>
{/if}
