import { createLocalStore } from '$/lib/utils/localStore.svelte';

export interface PresetPlayer {
	id: string;
	name: string;
	avatar: string;
	playerSource: 'registry' | 'typed';
	isDefault?: boolean;
}

const defaultPresets: PresetPlayer[] = [
	{ id: 'nam', name: 'Nam', avatar: 'nam', playerSource: 'registry', isDefault: true },
	{ id: 'hungnhieu', name: 'Hưng nhiều', avatar: 'hungnhieu', playerSource: 'registry', isDefault: true },
	{ id: 'dungcung', name: 'Dũng cưng', avatar: 'dungcung', playerSource: 'registry', isDefault: true },
	{ id: 'dung', name: 'Dũng', avatar: 'dung', playerSource: 'registry', isDefault: true },
	{ id: 'vinh', name: 'Vinh', avatar: 'vinhxo', playerSource: 'registry', isDefault: true }
];

const localPresets = createLocalStore<PresetPlayer[]>('samlog_preset_players', defaultPresets);

export const presetPlayersStore = localPresets.value;
