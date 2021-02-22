export * from './csgo';
export * from './events';
export * from './parsed';
export * from './mirv';

export interface TeamExtension {
	id: string;
	name: string;
	country: string | null;
	logo: string | null;
	map_score: number;
	extra: Record<string, string>;
}

export interface PlayerExtension {
	id: string;
	name: string;
	steamid: string;
	realName: string | null;
	country: string | null;
	avatar: string | null;
	extra: Record<string, string>;
}
