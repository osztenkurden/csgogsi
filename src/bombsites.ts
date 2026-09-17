export type Bombsite = 'A' | 'B';

/** Return null when a position does not belong to a known site. */
export type BombsiteResolver = (position: readonly number[]) => Bombsite | null;

export interface CSGOGSIOptions {
	bombsiteResolvers?: Record<string, BombsiteResolver>;
}

/** Canonical lookup key; the original map name in parsed snapshots is preserved. */
export const normalizeMapName = (mapName: string): string =>
	mapName
		.replace(/\\/g, '/')
		.split('/')
		.pop()!
		.replace(/\.(?:bsp|vpk)$/i, '')
		.toLowerCase();

const mapReference: Record<string, BombsiteResolver> = {
	de_mirage: position => (position[1]! < -600 ? 'A' : 'B'),
	de_cache: position => (position[1]! > 0 ? 'A' : 'B'),
	de_overpass: position => (position[2]! > 400 ? 'A' : 'B'),
	de_nuke: position => (position[2]! > -500 ? 'A' : 'B'),
	de_dust2: position => (position[0]! > -500 ? 'A' : 'B'),
	de_inferno: position => (position[0]! > 1400 ? 'A' : 'B'),
	de_vertigo: position => (position[0]! > -1400 ? 'A' : 'B'),
	de_train: position => (position[1]! > -450 ? 'A' : 'B'),
	de_ancient: position => (position[0]! < -500 ? 'A' : 'B'),
	de_anubis: position => (position[0]! > 0 ? 'A' : 'B')
};

export const findBombsite = (mapName: string, position: readonly number[]): Bombsite | null =>
	Object.hasOwn(mapReference, mapName) ? mapReference[mapName]!(position) : null;
