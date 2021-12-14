import { CSGO, CSGORaw, Events, KillEvent, PlayerExtension, RawKill, Score, TeamExtension } from './interfaces';
import { RawHurt } from './mirv';
import { DigestMirvType, HurtEvent } from './parsed';
import { mapSteamIDToPlayer, parseTeam, getHalfFromRound, didTeamWinThatRound } from './utils.js';
declare type EventNames = keyof Events;
interface EventDescriptor {
	listener: Events[EventNames];
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
	MR: number;
	last?: CSGO;
	current?: CSGO;
	constructor();
	eventNames: () => (keyof Events)[];
	getMaxListeners: () => number;
	listenerCount: (eventName: EventNames) => number;
	listeners: (
		eventName: EventNames
	) => (
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
	removeListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	off: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	addListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	on: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	once: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	prependListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	emit: (eventName: EventNames, arg?: any, arg2?: any) => boolean;
	prependOnceListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => this;
	removeAllListeners: (eventName: EventNames) => this;
	setMaxListeners: (n: number) => this;
	rawListeners: (eventName: EventNames) => EventDescriptor[];
	digest(raw: CSGORaw): CSGO | null;
	digestMIRV(raw: RawKill | RawHurt, eventType?: string): DigestMirvType;
	static findSite(mapName: string, position: number[]): 'A' | 'B' | null;
}
export { CSGOGSI, mapSteamIDToPlayer, parseTeam, getHalfFromRound, didTeamWinThatRound };
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
	Orientation
} from './interfaces';
