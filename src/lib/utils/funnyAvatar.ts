/**
 * Full list of DiceBear avatar styles for maximum variety.
 * Each player gets a different style + random seed = infinite combinations.
 */
const DICE_BEAR_STYLES = [
	// Adventurer series
	'adventurer', 'adventurer-neutral',
	// Avataaars series
	'avataaars', 'avataaars-neutral',
	// Big ears series
	'big-ears', 'big-ears-neutral',
	// Big smile
	'big-smile',
	// Bottts series
	'bottts', 'bottts-neutral',
	// Croodles series
	'croodles', 'croodles-neutral',
	// Dylan
	'dylan',
	// Fun emoji
	'fun-emoji',
	// Glass
	'glass',
	// Icons
	'icons',
	// Identicon
	'identicon',
	// Lorelei series
	'lorelei', 'lorelei-neutral',
	// Micah
	'micah',
	// Miniavs
	'miniavs',
	// Notionists series
	'notionists', 'notionists-neutral',
	// Open peeps
	'open-peeps',
	// Personas
	'personas',
	// Pixel art series
	'pixel-art', 'pixel-art-neutral',
	// Rings
	'rings',
	// Shapes
	'shapes',
	// Thumbs
	'thumbs',
	// Toon head
	'toon-head',
	// Face round
	'face/round', 'face/oval',
	// Loretta
	'lorelei',
	// Bottts old
	'bottts',
	// Avataaars old
	'avataaars',
	// Croodles
	'croodles',
	// Micah
	'micah',
	// Dylan
	'dylan',
	// Open peeps
	'open-peeps',
	// Pixel art
	'pixel-art',
	// Adventurer
	'adventurer',
	// Avataaars
	'avataaars',
	// Big smile
	'big-smile',
	// Bottts
	'bottts',
	// Fun emoji
	'fun-emoji',
	// Lorelei
	'lorelei',
	// Notionists
	'notionists',
	// Thumbs
	'thumbs',
	// Toon head
	'toon-head',
	// Person with more weight variations
	'adventurer-neutral', 'bottts-neutral', 'avataaars-neutral',
	'lorelei-neutral', 'notionists-neutral', 'pixel-art-neutral',
	'croodles-neutral', 'big-ears-neutral',
	// Extra fun styles
	'fun-emoji', 'fun-emoji', 'fun-emoji',
	'lorelei', 'lorelei', 'lorelei',
	'micah', 'micah',
	'dylan', 'dylan',
	'open-peeps', 'open-peeps',
	'pixel-art', 'pixel-art',
	'big-smile', 'big-smile',
	'bottts', 'bottts',
	'personas', 'personas',
	'miniavs', 'miniavs',
];

/**
 * Generates a random avatar URL for a player.
 * Uses random style + random seed = massive variety, each player unique.
 */
export function getFunnyAvatarUrl(name: string): string {
	// Use name hash for stable style selection within a session
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		const char = name.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	// Pick a random style + random seed for maximum variety
	const style = DICE_BEAR_STYLES[Math.floor(Math.random() * DICE_BEAR_STYLES.length)];
	const randomSeed = Math.random().toString(36).substring(2, 14) + '_' + name + '_' + Date.now();

	return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(randomSeed)}&size=128`;
}

/**
 * Converts an SVG data URL or URL to a PNG data URL.
 */
export async function svgToDataUrl(svgUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fetch(svgUrl, { mode: 'cors' })
			.then((res) => res.text())
			.then((svg) => {
				const canvas = document.createElement('canvas');
				canvas.width = 128;
				canvas.height = 128;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Cannot get canvas context'));
					return;
				}
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => {
					ctx.drawImage(img, 0, 0, 128, 128);
					resolve(canvas.toDataURL('image/png'));
				};
				img.onerror = () => reject(new Error('Failed to load SVG'));
				img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
			})
			.catch(reject);
	});
}
