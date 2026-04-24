<script lang="ts">
	import type { ITotalMoney } from '../types/ITotalMoney';
	import { getRewardDisplay } from '../utils/getRewardDisplay';

	interface Props {
		items: ITotalMoney[];
	}

	let { items }: Props = $props();
</script>

<div class="grid grid-flow-col auto-cols-fr gap-2">
	{#each items as item}
		{@const rewardDisplay = getRewardDisplay(item.reward)}
		<div class="flex flex-col items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 p-2 text-sm shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
			<span class="w-full truncate text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
				{item.name}
			</span>
			<div class="mt-1 flex w-full items-center justify-center rounded-lg bg-card py-1.5 shadow-inner">
				<span class={[rewardDisplay.textColor, 'text-base font-black']}>
					{rewardDisplay.text}
				</span>
			</div>
		</div>
	{/each}
</div>
