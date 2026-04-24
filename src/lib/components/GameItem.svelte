<script lang="ts">
	import { CopyIcon, DicesIcon, ListTreeIcon, PenIcon } from '@lucide/svelte';
	import { getRewardDisplay } from '../utils/getRewardDisplay';
	import type { IGameItem } from '../types/IGameItem';
	import { getRankStyle } from '../utils/getRankStyle';
	import { tablesStore } from '$/lib/stores/tablesStore.svelte';
	import { page } from '$app/state';
	import { getAvatarDataUrl } from '../utils/avatarStorage';
	import { getFunnyAvatarUrl } from '../utils/funnyAvatar';
	import ConfirmModal from './ConfirmModal.svelte';

	function getAvatarSrc(avatar: string) {
		if (!avatar) return '';
		if (avatar.startsWith('user_')) {
			return getAvatarDataUrl(avatar) ?? '';
		}
		return `/avatars/${avatar}.png`;
	}

	function getAvatarForRanking(player: IGameItem['rankings'][0]): string {
		// Registry player WITH custom avatar → use that avatar
		if (player.playerSource !== 'typed' && player.avatar) {
			return getAvatarSrc(player.avatar);
		}
		// Typed player OR registry player without avatar → use funny avatar
		return getFunnyAvatarUrl(`${player.playerSource ?? 'registry'}_${player.name}`);
	}

	let { id, title, rankings, roundsCount, createdAt }: IGameItem = $props();

	const tableId = $derived(page.params.tableId);
	const table = $derived(tablesStore.find((t) => t.id === tableId));

	let showDeleteModal = $state(false);

	function openDeleteModal() {
		showDeleteModal = true;
	}

	function confirmDelete() {
		if (table) {
			const index = table.games.findIndex((g) => g.id === id);
			if (index !== -1) {
				table.games.splice(index, 1);
			}
		}
	}

	function cancelDelete() {
		// just close modal
	}
</script>

<li class="relative flex flex-col gap-0 rounded border bg-card text-sm">
	<!-- Header row: click to view game, edit/copy/delete buttons -->
	<div class="flex items-center justify-between gap-2 p-4">
		<a
			href={`/tables/${tableId}/games/${id}`}
			class="flex flex-1 items-center gap-2 font-medium text-card-foreground"
		>
			<div class="flex size-8 items-center justify-center rounded bg-muted">
				<DicesIcon class="size-4" />
			</div>
			<h2 class="line-clamp-1">{title}</h2>
		</a>

		<div class="flex items-center gap-1">
			<a
				href={`/tables/${tableId}/games/${id}/edit`}
				class="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-yellow-50 hover:text-yellow-600"
				title="Sửa"
			>
				<PenIcon class="size-4" />
			</a>
			<a
				href={`/tables/${tableId}/games/${id}/copy`}
				class="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-blue-50 hover:text-blue-600"
				title="Chép"
			>
				<CopyIcon class="size-4" />
			</a>
			<button
				type="button"
				class="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-500"
				onclick={openDeleteModal}
				title="Xóa"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
			</button>
		</div>
	</div>

	<!-- Rankings -->
	<a href={`/tables/${tableId}/games/${id}`} class="flex flex-col gap-2 px-4 pb-2">
		<ol class="flex flex-col gap-2">
			{#each rankings as player, i}
				{@const rewardDisplay = getRewardDisplay(player.reward)}
				{@const rankStyle = getRankStyle(i)}

				<li
					class="flex h-14 gap-3 {rankStyle.bgColor} {rankStyle.textColor} {rankStyle.borderColor} animate__animated animate__fadeIn items-center rounded border px-3"
					style:animation-delay={`${i * 100}ms`}
				>
					<span class="flex size-8 items-center justify-center rounded-full bg-black/20 text-sm font-bold">
						#{i + 1}
					</span>

					{#if player.avatar || player.playerSource === 'typed'}
						<img
							src={getAvatarForRanking(player)}
							alt={player.name}
							class="size-10 rounded-full object-cover"
						/>
					{/if}

					<span class="flex-1 truncate capitalize">{player.name}</span>

					<span class="flex flex-col items-end">
						<span class="text-sm font-bold">{player.total}</span>
						<span class="text-xs {rewardDisplay.textColor} {rewardDisplay.textSize}">
							{rewardDisplay.text}
						</span>
					</span>
				</li>
			{/each}
		</ol>
	</a>

	<hr />

	<!-- Footer -->
	<a href={`/tables/${tableId}/games/${id}`} class="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
		<p class="flex items-center gap-1">
			<ListTreeIcon class="size-4" />
			<span>{roundsCount} vòng</span>
		</p>
		<p class="text-xs">{new Date(createdAt).toLocaleString('vi-VN')}</p>
	</a>
</li>

<ConfirmModal
	open={showDeleteModal}
	title="Xóa ván chơi"
	message={`Bạn có chắc muốn xóa ván "${title}" không?`}
	confirmText="Xóa"
	cancelText="Hủy"
	variant="danger"
	onconfirm={confirmDelete}
	oncancel={cancelDelete}
/>
