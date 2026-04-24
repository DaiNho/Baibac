import { browser } from '$app/environment';

const AVATARS_KEY = 'samlog_avatars';

export interface StoredAvatar {
	id: string;
	dataUrl: string;
	name: string;
	createdAt: string;
}

export function getStoredAvatars(): StoredAvatar[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem(AVATARS_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
}

export function saveAvatar(name: string, dataUrl: string): string {
	if (!browser) return '';
	const avatars = getStoredAvatars();
	const id = `user_${Date.now()}`;
	const newAvatar: StoredAvatar = {
		id,
		dataUrl,
		name,
		createdAt: new Date().toISOString()
	};
	avatars.push(newAvatar);
	localStorage.setItem(AVATARS_KEY, JSON.stringify(avatars));
	return id;
}

export function getAvatarByName(name: string): StoredAvatar | undefined {
	return getStoredAvatars().find((a) => a.name.toLowerCase() === name.toLowerCase());
}

export function getAvatarDataUrl(id: string): string | undefined {
	return getStoredAvatars().find((a) => a.id === id)?.dataUrl;
}
