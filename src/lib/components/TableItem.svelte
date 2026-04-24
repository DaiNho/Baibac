<script lang="ts">
	import { DicesIcon, ListTreeIcon, UsersIcon } from '@lucide/svelte';
	import type { ITableItem } from '$/lib/types/ITableItem';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import ConfirmModal from './ConfirmModal.svelte';

	const { id, createdAt, playersText, gamesCount, roundsCount }: ITableItem = $props();

	let showDeleteModal = $state(false);

	function openDeleteModal() {
		showDeleteModal = true;
	}

	function confirmDelete() {
		const index = tablesStore.findIndex((t) => t.id === id);
		if (index !== -1) {
			tablesStore.splice(index, 1);
		}
	}

	function cancelDelete() {
		// just close modal
	}
</script>

<li class="flex flex-col gap-1">
	<p class="text-xs text-muted-foreground">{new Date(createdAt).toLocaleString('vi-VN')}</p>

	<div class="relative overflow-hidden rounded border bg-card p-4">
		<button
			type="button"
			class="absolute right-3 top-3 flex size-8 items-center justify-center rounded text-red-500 hover:bg-red-50 z-10"
			onclick={openDeleteModal}
			title="Xóa bàn chơi"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
		</button>

		<a href={`tables/${id}`} class="flex items-center gap-4">
			<div class="flex size-12 items-center justify-center rounded bg-muted text-card-foreground">
				<UsersIcon />
			</div>

			<div class="flex flex-col gap-2">
				<p class="line-clamp-1 pr-8 text-sm font-medium text-card-foreground">{playersText}</p>

				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<p class="flex items-center gap-1">
						<DicesIcon class="size-4" />
						<span>{gamesCount} ván</span>
					</p>
					<div class="h-4 w-px bg-border"></div>
					<p class="flex items-center gap-1">
						<ListTreeIcon class="size-4" />
						<span>{roundsCount} vòng</span>
					</p>
				</div>
			</div>
		</a>
	</div>
</li>

<ConfirmModal
	open={showDeleteModal}
	title="Xóa bàn chơi"
	message={`Bạn có chắc muốn xóa bàn chơi "${playersText}" không? Tất cả ván chơi trong bàn sẽ bị xóa.`}
	confirmText="Xóa"
	cancelText="Hủy"
	variant="danger"
	onconfirm={confirmDelete}
	oncancel={cancelDelete}
/>
