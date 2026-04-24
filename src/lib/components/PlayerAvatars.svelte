<script lang="ts">
	import type { IScoreRankings } from '../types/IScoreRankings';
	import { getAvatarDataUrl } from '../utils/avatarStorage';
	import { getFunnyAvatarUrl, svgToDataUrl } from '../utils/funnyAvatar';

	interface Props {
		items: IScoreRankings[];
	}

	let { items }: Props = $props();

	// Cache for funny avatars: key = `${playerSource}:${name}` to avoid name collisions
	const funnyAvatarCache = new Map<string, string>();

	async function getFunnyAvatarDataUrl(name: string, playerSource: string): Promise<string> {
		const cacheKey = `${playerSource}:${name}`;
		if (funnyAvatarCache.has(cacheKey)) {
			return funnyAvatarCache.get(cacheKey)!;
		}
		const svgUrl = getFunnyAvatarUrl(`${playerSource}_${name}`);
		try {
			const pngUrl = await svgToDataUrl(svgUrl);
			funnyAvatarCache.set(cacheKey, pngUrl);
			return pngUrl;
		} catch {
			return svgUrl;
		}
	}

	let funnyAvatars = $state<Record<string, string>>({});

	$effect(() => {
		items.forEach(async (item) => {
			const cacheKey = `${item.playerSource ?? 'registry'}:${item.name}`;
			// Only generate funny avatar if: typed player OR registry player with no custom avatar
			const needsFunnyAvatar = item.playerSource === 'typed' || !item.avatar;
			if (needsFunnyAvatar && !funnyAvatars[cacheKey]) {
				const url = await getFunnyAvatarDataUrl(item.name, item.playerSource ?? 'registry');
				funnyAvatars = { ...funnyAvatars, [cacheKey]: url };
			}
		});
	});

	function getAvatarForItem(item: IScoreRankings): string {
		const cacheKey = `${item.playerSource ?? 'registry'}:${item.name}`;
		// Registry player WITH custom avatar → use that avatar
		if (item.playerSource !== 'typed' && item.avatar) {
			return getAvatarSrc(item.avatar);
		}
		// Typed player OR registry player without avatar → use funny avatar
		return funnyAvatars[cacheKey] ?? getFunnyAvatarUrl(`${item.playerSource ?? 'registry'}_${item.name}`);
	}

	function getAvatarSrc(avatar: string) {
		if (!avatar) return '';
		if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('blob:')) {
			return avatar;
		}
		if (avatar.startsWith('user_')) {
			return getAvatarDataUrl(avatar) ?? '';
		}
		return `/avatars/${avatar}.png`;
	}
</script>

<div class="flex items-center justify-center gap-4 overflow-x-auto rounded border bg-card p-4">
	{#each items as item, i}
		{@const rank = i + 1}
		<div class="flex flex-col items-center gap-1">
			<div class="relative flex flex-col items-center">
				<img
					src={getAvatarForItem(item)}
					alt={item.name}
					class="size-16 rounded-full border-2 object-cover {rank === 1
						? 'border-yellow-400'
						: rank === 2
							? 'border-slate-300'
							: rank === 3
								? 'border-amber-600'
								: 'border-muted'}"
				/>
				<span
					class="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full text-xs font-bold {rank ===
					1
						? 'bg-yellow-400 text-black'
						: rank === 2
							? 'bg-slate-300 text-black'
							: rank === 3
								? 'bg-amber-600 text-white'
								: 'bg-muted'}"
				>
					{rank}
				</span>
			</div>
			<span class="w-full max-w-16 truncate text-center text-xs font-medium capitalize break-words">{item.name}</span>
		</div>
	{/each}
</div>
