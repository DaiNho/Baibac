<script lang="ts">
	import type { ITotalMoney } from '../types/ITotalMoney';
	import { getRewardDisplay } from '../utils/getRewardDisplay';

	interface Props {
		items: ITotalMoney[];
	}

	let { items }: Props = $props();
</script>
