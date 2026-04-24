export interface IGameItem {
	id: string;
	title: string;
	rankings: { name: string; total: number; reward: string; avatar: string; playerSource: 'registry' | 'typed' }[];
	roundsCount: number;
	createdAt: string;
}
