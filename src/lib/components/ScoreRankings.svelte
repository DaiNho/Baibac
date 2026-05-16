<script lang="ts">
	import type { IScoreRankings } from '../types/IScoreRankings';
	import { getRankStyle } from '../utils/getRankStyle';
	import { flip } from 'svelte/animate';
	import { CrownIcon } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { getAvatarDataUrl } from '../utils/avatarStorage';
	import { getFunnyAvatarUrl, svgToDataUrl } from '../utils/funnyAvatar';

	interface Props {
		items: IScoreRankings[];
		onPlayerClick?: (item: IScoreRankings) => void;
	}

	let { items, onPlayerClick }: Props = $props();

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

	// Reactive state to hold loaded funny avatar URLs
	let funnyAvatars = $state<Record<string, string>>({});

	$effect(() => {
		// Load funny avatars for typed players and registry players without custom avatar
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
		// Registry player WITH custom avatar → use that avatar
		if (item.playerSource !== 'typed' && item.avatar) {
			return getAvatarSrc(item.avatar);
		}
		// Typed player OR registry player without avatar → use funny avatar
		const cacheKey = `${item.playerSource ?? 'registry'}:${item.name}`;
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

	const taunts = [
		'😅 Suýt rồi...',
		'🫠 Chảy luôn',
		'😭 Thôi xong',
		'🤡 Hề ghê',
		'🗑️ Bỏ đi bạn'
	];

	function getTaunt(i: number) {
		return taunts[Math.min(i, taunts.length - 1)];
	}

	// Speech bubble taunts from top 3 targeting rank 4 & 5 by name
	let bubbleIndex = $state(0);
	let activeBubble = $state<'rank1' | 'rank2' | 'rank3' | 'rank4' | 'rank5' | null>(null);

	const bubbleRanks: Array<'rank1' | 'rank2' | 'rank3' | 'rank4' | 'rank5'> = ['rank1', 'rank2', 'rank3', 'rank4', 'rank5'];

	$effect(() => {
		const show = () => {
			bubbleIndex = Math.floor(Math.random() * 5);
			activeBubble = bubbleRanks[Math.floor(Math.random() * bubbleRanks.length)];
			setTimeout(() => { activeBubble = null; }, 3000);
		};

		// show first one after short delay
		const init = setTimeout(show, 1000);

		const interval = setInterval(show, 5000);

		return () => {
			clearInterval(interval);
			clearTimeout(init);
		};
	});

	const bubbles = $derived.by(() => {
		const name1 = items[0]?.name ?? 'top 1';
		const name2 = items[1]?.name ?? 'top 2';
		const name4 = items[3]?.name ?? 'mấy bạn';
		const name5 = items[4]?.name ?? name4;
		return {
    rank1: [
        `${name4} ơi, về nhà đi! 😂`,
        `${name4} chơi thế này à? 🤣`,
        `Top 1 mãi mãi, ${name4} cút thôi 👑`,
        `${name5} với ${name4} cùng tệ nhỉ 🫠`,
        `Thua mãi không chán à ${name4}? 💀`,
    ],
    rank2: [
        `${name4} học đi rồi chơi tiếp 😜`,
        `${name5} ơi, hạng 2 còn hơn mày đó nha 😏`,
        `${name4} nonnn nắm`,
        `Cùng cà khịa ${name4} với! 👀`,
        `${name5} bao giờ lên được hạng 2? 🤔`,
    ],
    rank3: [
        `Ít nhất tao hơn ${name4} 🥉`,
        `${name4} nhìn lên đây học hỏi đi! 😁`,
        `${name5} thua cả hạng 3 lun 💀`,
        `Cố lên ${name4}, chắc không lên được đâu 🤭`,
        `Hạng 3 > ${name4} mãi mãi 🥳`,
    ],
    rank4: [
        `${name1} ơi cho tui xin 1 điểm đi 🥺`,
        `${name2} ơi dạy tui với... 😢`,
        `${name1} làm ơn đừng bỏ tui lại 🙏`,
        `${name2} giỏi quá, tui phục lắm 😭`,
        `${name1} thương tui với, tui còn cần học 😿`,
    ],
    rank5: [
        `${name1} ơi, kéo emem lên với 😭`,
        `${name2} cho tui theo với, emem xin đó 🙏`,
        `${name1} đừng để tui hạng 5 mãi 😩`,
        `Tui thề sẽ cố gắng... ${name2} tin emem đi 🤧`,
        `${name1} với ${name2} giỏi quá, emem chịu thua 😔`,
    ],
};
	});

	const projectileEmojis = ['🧱', '👡', '🥿', '👞', '🪨'];
	function getEmoji(i: number) {
		return projectileEmojis[i % projectileEmojis.length];
	}

	// Element refs
	let containerEl: HTMLElement | undefined = $state();
	let rank1IconEl: HTMLElement | undefined = $state();
	let rank4IconEl: HTMLElement | undefined = $state();
	let rank5IconEl: HTMLElement | undefined = $state();

	const listRowRefs = new Map<string, HTMLElement>();
	let listRowMountCount = $state(0);

	function listRowAction(node: HTMLElement, name: string) {
		listRowRefs.set(name, node);
		listRowMountCount++;
		return {
			destroy() {
				listRowRefs.delete(name);
			},
			update(n: string) {
				listRowRefs.delete(name);
				listRowRefs.set(n, node);
				name = n;
			}
		};
	}

	interface Throw {
		x: number;
		y: number;
		tx: number;
		ty: number;
		emoji: string;
		delay: number;
		dur: number;
	}

	let throws: Throw[] = $state([]);

	$effect(() => {
		// track all reactive sources
		void items;
		void rank1IconEl;
		void rank4IconEl;
		void rank5IconEl;
		void listRowMountCount;

		tick().then(() => {
			if (!containerEl || !rank1IconEl) {
				throws = [];
				return;
			}
			const cRect = containerEl.getBoundingClientRect();
			const r1Rect = rank1IconEl.getBoundingClientRect();
			const ox = r1Rect.left + r1Rect.width / 2 - cRect.left;
			const oy = r1Rect.top + r1Rect.height / 2 - cRect.top;

			const result: Throw[] = [];

			const targets: Array<{ el: HTMLElement; count: number; eOff: number }> = [];
			if (rank4IconEl) targets.push({ el: rank4IconEl, count: 2, eOff: 0 });
			if (rank5IconEl) targets.push({ el: rank5IconEl, count: 3, eOff: 1 });
			items.slice(5).forEach((item) => {
				const el = listRowRefs.get(item.name);
				if (el) targets.push({ el, count: 3, eOff: 2 });
			});

			targets.forEach(({ el, count, eOff }, ti) => {
				const tRect = el.getBoundingClientRect();
				const tx = tRect.left + tRect.width / 2 - cRect.left - ox;
				const ty = tRect.top + tRect.height / 2 - cRect.top - oy;
				for (let pi = 0; pi < count; pi++) {
					result.push({
						x: ox,
						y: oy,
						tx,
						ty,
						emoji: getEmoji(eOff + pi),
					delay: pi * 1.4,
					dur: 2 + ti * 0.2 + pi * 0.2
					});
				}
			});

			throws = result;
		});
	});
</script>

<div bind:this={containerEl} class="relative flex flex-col gap-1 rounded border bg-card p-1.5 pt-2 text-xs">
	<!-- Projectiles flying from rank 1 to each loser -->
	{#each throws as t}
		<span
			class="projectile-throw pointer-events-none absolute z-10 text-[10px]"
			style="left: {t.x}px; top: {t.y}px; --tx: {t.tx}px; --ty: {t.ty}px; animation-delay: {t.delay}s; animation-duration: {t.dur}s"
		>{t.emoji}</span>
	{/each}

	<!-- Podium top 5 - avatars only without podium bars -->
	{#if items.length > 0}
		<div class="flex items-end justify-center gap-2">
			{#each items.slice(0, 5) as item, i (item.name)}
				<div
					class="relative flex flex-1 flex-col items-center"
					animate:flip={{ duration: 600, easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }}
				>
					{#if i === 1}
						{#if activeBubble === 'rank2' && items[3]}
							<div class="speech-bubble speech-bubble--lime">{bubbles.rank2[bubbleIndex]}</div>
						{/if}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img src={getAvatarForItem(item)} alt={item.name} class="size-16 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span class="mt-0.5 truncate max-w-16 text-xs font-medium capitalize text-muted-foreground {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
						<span class="text-sm font-bold text-lime-500">{item.total}</span>
					{:else if i === 0}
						<CrownIcon class="size-4 text-yellow-400" />
						{#if activeBubble === 'rank1' && items[3]}
							<div class="speech-bubble speech-bubble--green">{bubbles.rank1[bubbleIndex]}</div>
						{/if}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img bind:this={rank1IconEl} src={getAvatarForItem(item)} alt={item.name} class="throw-1 size-16 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span class="mt-0.5 truncate max-w-16 text-xs font-medium capitalize text-muted-foreground {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
						<span class="text-sm font-bold text-green-500">{item.total}</span>
					{:else if i === 2}
						{#if activeBubble === 'rank3' && items[3]}
							<div class="speech-bubble speech-bubble--yellow">{bubbles.rank3[bubbleIndex]}</div>
						{/if}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img src={getAvatarForItem(item)} alt={item.name} class="size-16 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span class="mt-0.5 truncate max-w-16 text-xs font-medium capitalize text-muted-foreground {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
						<span class="text-sm font-bold text-yellow-500">{item.total}</span>
					{:else if i === 3}
						{#if activeBubble === 'rank4'}
							<div class="speech-bubble speech-bubble--orange">{bubbles.rank4[bubbleIndex]}</div>
						{/if}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img bind:this={rank4IconEl} src={getAvatarForItem(item)} alt={item.name} class="loser-wobble size-16 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span class="mt-0.5 truncate max-w-16 text-xs font-medium capitalize text-muted-foreground {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
						<span class="text-sm font-bold text-orange-400">{item.total}</span>
					{:else if i === 4}
						{#if activeBubble === 'rank5'}
							<div class="speech-bubble speech-bubble--red">{bubbles.rank5[bubbleIndex]}</div>
						{/if}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<img bind:this={rank5IconEl} src={getAvatarForItem(item)} alt={item.name} class="loser-wobble size-16 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span class="mt-0.5 truncate max-w-16 text-xs font-medium capitalize text-muted-foreground {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
						<span class="text-sm font-bold text-red-400">{item.total}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Remaining players (6th and below) -->
	{#each items.slice(5) as item, i (item.name)}
		{@const { bgColor, borderColor, textColor } = getRankStyle(i + 5)}
		{@const isLast = i === items.slice(5).length - 1}
		<div
			use:listRowAction={item.name}
			class={[
				'animate__animated animate__fadeIn flex items-center gap-2 rounded border px-2 py-1 transition-colors',
				bgColor,
				borderColor,
				textColor,
				isLast ? 'loser-wobble' : ''
			]}
			animate:flip={{ duration: 500 }}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img src={getAvatarForItem(item)} alt={item.name} class="size-8 shrink-0 rounded-full object-cover {onPlayerClick ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}" onclick={() => onPlayerClick?.(item)} />
			<span class="w-4 shrink-0 text-center font-semibold">{i + 6}</span>
			<span class="flex-1 line-clamp-1 capitalize font-medium {onPlayerClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}" onclick={() => onPlayerClick?.(item)}>{item.name}</span>
			{#if isLast}
				<span class="animate-pulse text-[10px] text-red-400">💀 Bèo nhất bàn!</span>
			{:else}
				<span class="text-[10px] opacity-60">{getTaunt(i)}</span>
			{/if}
			<span class="shrink-0 font-bold">{item.total}</span>
		</div>
	{/each}
</div>

<style>
	@keyframes wobble-loser {
		0%, 100% { transform: translateX(0) rotate(0deg); }
		20% { transform: translateX(-3px) rotate(-1.5deg); }
		40% { transform: translateX(3px) rotate(1.5deg); }
		60% { transform: translateX(-2px) rotate(-1deg); }
		80% { transform: translateX(2px) rotate(1deg); }
	}

	/* Projectile starts at rank 1 icon (ox, oy) and flies to target (ox+tx, oy+ty) */
	@keyframes throw-to-target {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(0deg) scale(1.5);
		}
		55% {
			opacity: 1;
			transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(320deg) scale(1);
		}
		80% {
			opacity: 0.35;
			transform: translate(calc(-50% + var(--tx) + 4px), calc(-50% + var(--ty) + 3px)) rotate(370deg) scale(0.8);
		}
		100% {
			opacity: 0;
			transform: translate(calc(-50% + var(--tx) + 7px), calc(-50% + var(--ty) + 6px)) rotate(410deg) scale(0.5);
		}
	}

	@keyframes throw-1 {
		0%, 70%, 100% { transform: rotate(0deg); }
		20% { transform: rotate(-28deg) translateY(-2px); }
		40% { transform: rotate(12deg); }
	}

	.loser-wobble {
		animation: wobble-loser 1.8s ease-in-out infinite;
	}

	.projectile-throw {
		animation: throw-to-target ease-out infinite;
	}

	.throw-1 {
		animation: throw-1 2s ease-in-out infinite;
		display: inline-block;
	}

	/* Speech bubble */
	.speech-bubble {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		white-space: normal;
		width: max-content;
		max-width: 110px;
		text-align: center;
		line-height: 1.25;
		border-radius: 6px;
		padding: 4px 6px;
		font-size: 11px;
		z-index: 20;
		pointer-events: none;
		animation: bubble-pop 0.3s ease-out;
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 50%;
		transform: translateX(-50%);
		border-width: 5px 4px 0;
		border-style: solid;
	}

	.speech-bubble--green {
		background: #16a34a;
		color: white;
	}
	.speech-bubble--green::after { border-color: #16a34a transparent transparent; }

	.speech-bubble--lime {
		background: #65a30d;
		color: white;
	}
	.speech-bubble--lime::after { border-color: #65a30d transparent transparent; }

	.speech-bubble--yellow {
		background: #ca8a04;
		color: white;
	}
	.speech-bubble--yellow::after { border-color: #ca8a04 transparent transparent; }

	.speech-bubble--orange {
		background: #ea580c;
		color: white;
	}
	.speech-bubble--orange::after { border-color: #ea580c transparent transparent; }

	.speech-bubble--red {
		background: #dc2626;
		color: white;
	}
	.speech-bubble--red::after { border-color: #dc2626 transparent transparent; }

	@keyframes bubble-pop {
		0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
		70% { transform: translateX(-50%) scale(1.05); opacity: 1; }
		100% { transform: translateX(-50%) scale(1); opacity: 1; }
	}
</style>
