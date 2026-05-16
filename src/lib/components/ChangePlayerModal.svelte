<script lang="ts">
	import { presetPlayersStore, type PresetPlayer } from '$/lib/stores/presetPlayersStore.svelte';
	import { saveAvatar, getStoredAvatars, type StoredAvatar } from '$/lib/utils/avatarStorage';
	import { getAvatarDataUrl } from '$/lib/utils/avatarStorage';
	import { getFunnyAvatarUrl } from '$/lib/utils/funnyAvatar';

	interface Props {
		open: boolean;
		playerName: string;
		playerSource: 'registry' | 'typed';
		existingNames: string[]; // other players' names to avoid duplicates
		onClose: () => void;
		onConfirm: (result: { name: string; avatar: string; playerSource: 'registry' | 'typed' }) => void;
	}

	let { open, playerName, playerSource, existingNames, onClose, onConfirm }: Props = $props();

	// For typed mode: just edit the name
	let typedName = $state('');

	// For registry mode
	type RegistryStep = 'list' | 'add-form' | 'camera' | 'select-avatar';
	let registryStep = $state<RegistryStep>('list');
	let newName = $state('');
	let newCapturedImage = $state<string | null>(null);
	let useCustomAvatar = $state(false);
	let existingAvatars = $state<StoredAvatar[]>([]);
	let videoEl = $state<HTMLVideoElement | undefined>();
	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let stream: MediaStream | null = null;

	$effect(() => {
		if (open) {
			typedName = playerName;
			registryStep = 'list';
			newName = '';
			newCapturedImage = null;
			useCustomAvatar = false;
			existingAvatars = getStoredAvatars();
		} else {
			stopCamera();
		}
	});

	function getAvatarSrc(avatar: string): string {
		if (!avatar) return '';
		if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('blob:')) {
			return avatar;
		}
		if (avatar.startsWith('user_')) {
			return getAvatarDataUrl(avatar) ?? '';
		}
		return `/avatars/${avatar}.png`;
	}

	function getPresetAvatarSrc(p: PresetPlayer): string {
		if (!p.avatar) return getFunnyAvatarUrl(`${p.playerSource}_${p.name}`);
		return getAvatarSrc(p.avatar);
	}

	// ── Typed mode ──────────────────────────────────────────
	function confirmTyped() {
		const trimmed = typedName.trim();
		if (!trimmed) return;
		const lower = trimmed.toLowerCase();
		if (existingNames.some((n) => n.toLowerCase() === lower)) {
			alert('Tên này đã có người dùng rồi!');
			return;
		}
		onConfirm({ name: trimmed, avatar: '', playerSource: 'typed' });
		onClose();
	}

	// ── Registry mode: select from list ─────────────────────
	function selectPreset(p: PresetPlayer) {
		// Check dupe (exclude self)
		const lower = p.name.toLowerCase();
		if (existingNames.some((n) => n.toLowerCase() === lower)) {
			alert('Người này đã ở trong ván rồi!');
			return;
		}
		onConfirm({ name: p.name, avatar: p.avatar, playerSource: 'registry' });
		onClose();
	}

	// ── Registry mode: add new person ───────────────────────
	async function openCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
			if (videoEl) videoEl.srcObject = stream;
			registryStep = 'camera';
		} catch {
			alert('Không thể truy cập camera. Vui lòng cho phép truy cập camera.');
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
	}

	function capturePhoto() {
		if (!videoEl || !canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		canvasEl.width = videoEl.videoWidth;
		canvasEl.height = videoEl.videoHeight;
		ctx.drawImage(videoEl, 0, 0);
		newCapturedImage = canvasEl.toDataURL('image/jpeg', 0.8);
		stopCamera();
		registryStep = 'add-form';
		useCustomAvatar = true;
	}

	function selectExistingAvatar(avatar: StoredAvatar) {
		newCapturedImage = avatar.dataUrl;
		useCustomAvatar = true;
		registryStep = 'add-form';
	}

	function handleAddNew() {
		const trimmed = newName.trim();
		if (!trimmed) return;

		const lower = trimmed.toLowerCase();
		// Check dupe among existing players in game
		if (existingNames.some((n) => n.toLowerCase() === lower)) {
			alert('Người này đã ở trong ván rồi!');
			return;
		}

		let avatarId = '';
		if (useCustomAvatar && newCapturedImage) {
			avatarId = saveAvatar(trimmed, newCapturedImage);
		}

		// Also save to preset store if not already there
		if (!presetPlayersStore.some((p) => p.name.toLowerCase() === lower)) {
			presetPlayersStore.push({
				id: lower.replace(/\s+/g, '_') + '_' + Date.now(),
				name: trimmed,
				avatar: avatarId,
				playerSource: 'registry'
			});
		}

		onConfirm({ name: trimmed, avatar: avatarId, playerSource: 'registry' });
		onClose();
	}

	function handleClose() {
		stopCamera();
		onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onclick={handleClose}>
		<div
			class="animate__animated animate__zoomIn w-full max-w-sm rounded-xl bg-card shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-border/50">
				<div>
					<h2 class="text-base font-semibold text-card-foreground">
						{#if playerSource === 'typed'}
							✏️ Đổi tên người chơi
						{:else if registryStep === 'list'}
							👥 Chọn người thay thế
						{:else if registryStep === 'add-form'}
							➕ Thêm người mới
						{:else if registryStep === 'camera'}
							📷 Chụp ảnh
						{:else}
							🖼️ Chọn ảnh cũ
						{/if}
					</h2>
					<p class="text-xs text-muted-foreground mt-0.5">
						Đang thay: <span class="font-medium text-primary capitalize">{playerName}</span>
					</p>
				</div>
				<button
					type="button"
					class="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
					onclick={handleClose}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-5">

				{#if playerSource === 'typed'}
					<!-- ── Typed: just rename ── -->
					<div class="flex flex-col gap-4">
						<div>
							<label class="block text-sm font-medium mb-1.5 text-card-foreground">Tên mới</label>
							<input
								type="text"
								bind:value={typedName}
								placeholder="Nhập tên..."
								autofocus
								class="w-full rounded-lg border bg-input/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								onkeydown={(e) => e.key === 'Enter' && confirmTyped()}
							/>
						</div>
						<div class="flex gap-2">
							<button
								type="button"
								class="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
								onclick={handleClose}
							>Hủy</button>
							<button
								type="button"
								class="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
								disabled={!typedName.trim()}
								onclick={confirmTyped}
							>Xác nhận</button>
						</div>
					</div>

				{:else if registryStep === 'list'}
					<!-- ── Registry: pick from preset list ── -->
					<div class="flex flex-col gap-3">
						<!-- Preset list -->
						<div class="max-h-64 overflow-y-auto -mx-1 px-1">
							{#if presetPlayersStore.length === 0}
								<p class="text-center text-sm text-muted-foreground py-6">Chưa có ai trong danh sách</p>
							{:else}
								<div class="flex flex-col gap-1.5">
									{#each presetPlayersStore as preset}
										{@const isAlready = existingNames.some(n => n.toLowerCase() === preset.name.toLowerCase())}
										<button
											type="button"
											class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors border {isAlready ? 'opacity-40 cursor-not-allowed border-transparent bg-muted/30' : 'border-transparent hover:bg-accent hover:border-border/50 cursor-pointer'}"
											onclick={() => !isAlready && selectPreset(preset)}
											disabled={isAlready}
										>
											<img
												src={getPresetAvatarSrc(preset)}
												alt={preset.name}
												class="size-10 rounded-full object-cover shrink-0 border border-border/40"
											/>
											<div class="flex-1 min-w-0">
												<span class="block text-sm font-medium capitalize truncate">{preset.name}</span>
												{#if isAlready}
													<span class="text-xs text-muted-foreground">Đã trong ván</span>
												{/if}
											</div>
											{#if !isAlready}
												<svg class="size-4 text-muted-foreground shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Add new button -->
						<button
							type="button"
							class="flex items-center gap-2 justify-center rounded-lg border border-dashed border-primary/50 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
							onclick={() => { registryStep = 'add-form'; }}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
							Thêm người mới vào danh sách
						</button>
					</div>

				{:else if registryStep === 'add-form'}
					<!-- ── Registry: add new form ── -->
					<div class="flex flex-col gap-4">
						<div>
							<label class="block text-sm font-medium mb-1.5">Tên</label>
							<input
								type="text"
								bind:value={newName}
								placeholder="Nhập tên..."
								autofocus
								class="w-full rounded-lg border bg-input/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium mb-1.5">Ảnh đại diện</label>
							{#if useCustomAvatar && newCapturedImage}
								<div class="flex flex-col items-center gap-2">
									<div class="relative">
										<img src={newCapturedImage} alt="Avatar" class="size-20 rounded-full object-cover border-2 border-primary" />
										<button
											type="button"
											class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
											onclick={() => { useCustomAvatar = false; newCapturedImage = null; }}
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
										</button>
									</div>
								</div>
							{:else}
								<div class="flex gap-2">
									<button
										type="button"
										class="flex flex-1 flex-col items-center gap-1.5 rounded-lg border py-3 hover:bg-accent transition-colors text-xs"
										onclick={openCamera}
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
										Chụp ảnh
									</button>
									{#if existingAvatars.length > 0}
										<button
											type="button"
											class="flex flex-1 flex-col items-center gap-1.5 rounded-lg border py-3 hover:bg-accent transition-colors text-xs"
											onclick={() => registryStep = 'select-avatar'}
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
											Chọn ảnh cũ
										</button>
									{/if}
								</div>
							{/if}
						</div>

						<div class="flex gap-2">
							<button
								type="button"
								class="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
								onclick={() => { registryStep = 'list'; newName = ''; newCapturedImage = null; useCustomAvatar = false; }}
							>← Quay lại</button>
							<button
								type="button"
								class="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
								disabled={!newName.trim()}
								onclick={handleAddNew}
							>Thêm & chọn</button>
						</div>
					</div>

				{:else if registryStep === 'camera'}
					<!-- ── Camera view ── -->
					<div class="flex flex-col gap-3">
						<div class="relative overflow-hidden rounded-xl bg-black aspect-square">
							<video bind:this={videoEl} autoplay playsinline class="w-full h-full object-cover"></video>
						</div>
						<canvas bind:this={canvasEl} class="hidden"></canvas>
						<div class="flex gap-2">
							<button
								type="button"
								class="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-accent"
								onclick={() => { stopCamera(); registryStep = 'add-form'; }}
							>Hủy</button>
							<button
								type="button"
								class="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
								onclick={capturePhoto}
							>📷 Chụp</button>
						</div>
					</div>

				{:else if registryStep === 'select-avatar'}
					<!-- ── Select old avatar ── -->
					<div class="flex flex-col gap-3">
						<div class="max-h-56 overflow-y-auto">
							<div class="grid grid-cols-4 gap-2">
								{#each existingAvatars as avatar}
									<button
										type="button"
										class="aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-primary transition-colors"
										onclick={() => selectExistingAvatar(avatar)}
									>
										<img src={avatar.dataUrl} alt={avatar.name} class="size-full object-cover" />
									</button>
								{/each}
							</div>
						</div>
						<button
							type="button"
							class="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-accent"
							onclick={() => registryStep = 'add-form'}
						>← Quay lại</button>
					</div>
				{/if}

			</div>
		</div>
	</div>
{/if}
