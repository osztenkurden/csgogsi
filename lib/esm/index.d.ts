import {
	CSGO,
	CSGORaw,
	Events,
	KillEvent,
	PlayerExtension,
	RawKill,
	Score,
	TeamExtension,
	Callback,
	EventNames,
	BaseEvents
} from './interfaces';
import { RawHurt } from './mirv';
import { DigestMirvType, HurtEvent } from './parsed';
import { mapSteamIDToPlayer, parseTeam, getHalfFromRound, didTeamWinThatRound } from './utils.js';
interface EventDescriptor {
	listener: Events[BaseEvents];
	once: boolean;
}
declare type RoundPlayerDamage = {
	steamid: string;
	damage: number;
};
declare type RoundDamage = {
	round: number;
	players: RoundPlayerDamage[];
};
declare class CSGOGSI {
	private descriptors;
	private maxListeners;
	teams: {
		left: TeamExtension | null;
		right: TeamExtension | null;
	};
	damage: RoundDamage[];
	players: PlayerExtension[];
	overtimeMR: number;
	regulationMR: number;
	last?: CSGO;
	current?: CSGO;
	constructor();
	eventNames: () => EventNames[];
	getMaxListeners: () => number;
	listenerCount: (eventName: EventNames) => number;
	listeners: (
		eventName: EventNames
	) => (
		| ((data: CSGORaw) => void)
		| ((data: CSGO) => void)
		| ((team: Score) => void)
		| ((score: Score) => void)
		| ((kill: KillEvent) => void)
		| ((kill: HurtEvent) => void)
		| ((team: any) => void)
		| (() => void)
		| ((player: import('./parsed').Player) => void)
		| (() => void)
		| (() => void)
		| (() => void)
		| (() => void)
		| ((player: import('./parsed').Player) => void)
		| ((player: import('./parsed').Player) => void)
		| ((player: import('./parsed').Player) => void)
		| ((player: import('./parsed').Player) => void)
		| (() => void)
		| ((player: import('./parsed').Player) => void)
		| (<K extends keyof Events>(eventName: K, listener: Events[K]) => void)
		| (<K_1 extends keyof Events>(eventName: K_1, listener: Events[K_1]) => void)
	)[];
	removeListener: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	off: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	addListener: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	on: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	once: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	prependListener: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	emit: (eventName: EventNames, arg?: any, arg2?: any) => boolean;
	prependOnceListener: <K extends EventNames>(eventName: K, listener: Callback<K>) => this;
	removeAllListeners: (eventName: EventNames) => this;
	setMaxListeners: (n: number) => this;
	rawListeners: (eventName: EventNames) => EventDescriptor[];
	digest: (raw: CSGORaw) => CSGO | null;
	digestMIRV: (raw: RawKill | RawHurt, eventType?: string) => DigestMirvType;
	static findSite(mapName: string, position: number[]): 'A' | 'B' | null;
}
export { CSGOGSI, mapSteamIDToPlayer, parseTeam, getHalfFromRound, didTeamWinThatRound, RoundDamage };
export {
	CSGO,
	CSGORaw,
	Side,
	RoundOutcome,
	WeaponType,
	Observer,
	RawHurt,
	WeaponRaw,
	TeamRaw,
	PlayerRaw,
	PlayerObservedRaw,
	PlayersRaw,
	Provider,
	HurtEvent,
	RoundWins,
	MapRaw,
	RoundRaw,
	BombRaw,
	PhaseRaw,
	Events,
	Team,
	Player,
	Bomb,
	Map,
	Round,
	Score,
	KillEvent,
	RawKill,
	TeamExtension,
	RoundInfo,
	PlayerExtension,
	Orientation,
	Grenade,
	GrenadeBaseRaw,
	GrenadeBase,
	DecoySmokeGrenade,
	DecoySmokeGrenadeRaw,
	InfernoGrenade,
	InfernoGrenadeRaw,
	FragOrFireBombOrFlashbandGrenade,
	FragOrFireBombOrFlashbandGrenadeRaw,
	Weapon,
	GrenadeRaw
} from './interfaces';
