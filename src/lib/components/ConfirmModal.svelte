<script lang="ts">
	interface Props {
		open: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'default';
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open,
		title = 'Xác nhận',
		message,
		confirmText = 'Xóa',
		cancelText = 'Hủy',
		variant = 'danger',
		onconfirm,
		oncancel
	}: Props = $props();

	function handleConfirm() {
		onconfirm();
		open = false;
	}

	function handleCancel() {
		oncancel();
		open = false;
	}

	function handleBackdropClick() {
		handleCancel();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={handleBackdropClick}
	>
		<div
			class="animate__animated animate__zoomIn animate__faster w-full max-w-sm rounded-xl bg-card p-6 shadow-2xl"
		style="--animate-duration: 0.15s"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-2 flex items-center justify-center">
				{#if variant === 'danger'}
					<div class="flex size-14 items-center justify-center rounded-full bg-red-100">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
					</div>
				{:else if variant === 'warning'}
					<div class="flex size-14 items-center justify-center rounded-full bg-yellow-100">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
					</div>
				{:else}
					<div class="flex size-14 items-center justify-center rounded-full bg-primary/10">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
					</div>
				{/if}
			</div>

			<h2 class="mb-1 text-center text-lg font-semibold text-card-foreground">{title}</h2>
			<p class="mb-6 text-center text-sm text-muted-foreground">{message}</p>

			<div class="flex gap-3">
				<button
					type="button"
					class="flex-1 rounded-lg border bg-card py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
					onclick={handleCancel}
				>
					{cancelText}
				</button>
				<button
					type="button"
					class="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors {variant === 'danger'
						? 'bg-red-600 hover:bg-red-700'
						: variant === 'warning'
							? 'bg-yellow-600 hover:bg-yellow-700'
							: 'bg-primary hover:opacity-90'}"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
