import { createLocalStore } from '$/lib/utils/localStore.svelte';

export interface PresetPlayer {
	id: string;
	name: string;
	avatar: string;
	playerSource: 'registry' | 'typed';
}

const defaultPresets: PresetPlayer[] = [
	{ id: 'nam', name: 'Nam', avatar: 'nam', playerSource: 'registry' },
	{ id: 'hungnhieu', name: 'Hưng nhiều', avatar: 'hungnhieu', playerSource: 'registry' },
	{ id: 'dungcung', name: 'Dũng cưng', avatar: 'dungcung', playerSource: 'registry' },
	{ id: 'dung', name: 'Dũng', avatar: 'dung', playerSource: 'registry' },
	{ id: 'vinh', name: 'Vinh', avatar: 'vinhxo', playerSource: 'registry' }
];

const localPresets = createLocalStore<PresetPlayer[]>('samlog_preset_players', defaultPresets);

export const presetPlayersStore = localPresets.value;
