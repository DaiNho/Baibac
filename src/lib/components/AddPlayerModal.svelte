<script lang="ts">
	import { saveAvatar, getStoredAvatars, type StoredAvatar } from '$/lib/utils/avatarStorage';

	interface Props {
		open: boolean;
		onClose: () => void;
		onAdd: (name: string, avatarId: string) => void;
		existingPlayers: string[];
	}

	let { open, onClose, onAdd, existingPlayers }: Props = $props();

	let step: 'form' | 'camera' | 'select' = $state('form');
	let name = $state('');
	let capturedImage = $state<string | null>(null);
	let videoEl: HTMLVideoElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let stream: MediaStream | null = null;
	let useCustomAvatar = $state(false);
	let existingAvatars: StoredAvatar[] = $state([]);

	$effect(() => {
		if (open) {
			step = 'form';
			name = '';
			capturedImage = null;
			useCustomAvatar = false;
			existingAvatars = getStoredAvatars();
		} else {
			stopCamera();
		}
	});

	async function openCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
			if (videoEl) {
				videoEl.srcObject = stream;
			}
			step = 'camera';
		} catch (err) {
			alert('Không thể truy cập camera. Vui lòng cho phép truy cập camera.');
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
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

		capturedImage = canvasEl.toDataURL('image/jpeg', 0.8);
		stopCamera();
		step = 'form';
		useCustomAvatar = true;
	}

	function selectExistingAvatar(avatar: StoredAvatar) {
		capturedImage = avatar.dataUrl;
		useCustomAvatar = true;
	}

	function handleSubmit() {
		if (!name.trim()) return;

		// Check for duplicate name
		const normalizedName = name.trim().toLowerCase();
		if (existingPlayers.some((p) => p.toLowerCase() === normalizedName)) {
			alert('Tên người chơi đã tồn tại!');
			return;
		}

		let avatarId = '';
		if (useCustomAvatar && capturedImage) {
			avatarId = saveAvatar(name.trim(), capturedImage);
		}

		onAdd(name.trim(), avatarId);
		handleClose();
	}

	function handleClose() {
		stopCamera();
		onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={handleClose}>
		<div
			class="animate__animated animate__zoomIn w-full max-w-sm rounded-lg bg-card p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Thêm người chơi mới</h2>
				<button class="text-muted-foreground hover:text-foreground" onclick={handleClose}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
			</div>

			{#if step === 'form'}
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-4">
					<div>
						<label class="mb-1 block text-sm font-medium">Tên người chơi</label>
						<input
							type="text"
							bind:value={name}
							placeholder="Nhập tên..."
							class="w-full rounded border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium">Ảnh đại diện</label>

						{#if useCustomAvatar && capturedImage}
							<div class="flex flex-col items-center gap-2">
								<div class="relative">
									<img src={capturedImage} alt="Avatar" class="size-24 rounded-full object-cover" />
									<!-- Delete button -->
									<button
										type="button"
										class="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:scale-110"
										onclick={() => { useCustomAvatar = false; capturedImage = null; }}
										title="Xóa ảnh"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
									</button>
									<!-- Download button -->
									<a
										href={capturedImage}
										download={`avatar_${name || 'player'}.jpg`}
										title="Tải ảnh về"
										class="absolute -bottom-1 -left-1 flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow transition-transform hover:scale-110 active:scale-95"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
									</a>
								</div>
							</div>
						{:else}
							<div class="flex gap-2">
								<button
									type="button"
									class="flex flex-1 flex-col items-center gap-1 rounded border p-3 hover:bg-accent"
									onclick={openCamera}
								>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
									<span class="text-xs">Chụp ảnh</span>
								</button>
								{#if existingAvatars.length > 0}
									<button
										type="button"
										class="flex flex-1 flex-col items-center gap-1 rounded border p-3 hover:bg-accent"
										onclick={() => step = 'select'}
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
										<span class="text-xs">Chọn ảnh cũ</span>
									</button>
								{/if}
							</div>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full rounded bg-primary py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
						disabled={!name.trim()}
					>
						Thêm người chơi
					</button>
				</form>
			{:else if step === 'camera'}
				<div class="flex flex-col gap-4">
					<div class="relative overflow-hidden rounded-lg bg-black">
						<video bind:this={videoEl} autoplay playsinline class="w-full"></video>
					</div>
					<canvas bind:this={canvasEl} class="hidden"></canvas>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex-1 rounded bg-secondary py-2 font-medium hover:opacity-80"
							onclick={() => { stopCamera(); step = 'form'; }}
						>
							Hủy
						</button>
						<button
							type="button"
							class="flex-1 rounded bg-primary py-2 font-medium text-primary-foreground hover:opacity-90"
							onclick={capturePhoto}
						>
							Chụp
						</button>
					</div>
				</div>
			{:else if step === 'select'}
				<div class="flex flex-col gap-4">
					<div class="max-h-64 overflow-y-auto">
						<div class="grid grid-cols-4 gap-2">
							{#each existingAvatars as avatar}
								<button
									type="button"
									class="aspect-square overflow-hidden rounded border-2 border-transparent hover:border-primary"
									onclick={() => selectExistingAvatar(avatar)}
								>
									<img src={avatar.dataUrl} alt={avatar.name} class="size-full object-cover" />
								</button>
							{/each}
						</div>
					</div>
					<button
						type="button"
						class="w-full rounded bg-secondary py-2 font-medium hover:opacity-80"
						onclick={() => step = 'form'}
					>
						Quay lại
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
