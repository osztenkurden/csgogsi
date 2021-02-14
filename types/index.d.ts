import {
	CSGO,
	CSGORaw,
	Events,
	KillEvent,
	Player,
	PlayerExtension,
	PlayerRaw,
	PlayersRaw,
	RawKill,
	Team,
	TeamExtension
} from './interfaces';
export default class CSGOGSI {
	listeners: Map<keyof Events, Events[keyof Events][]>;
	teams: {
		left?: TeamExtension;
		right?: TeamExtension;
	};
	players: PlayerExtension[];
	last?: CSGO;
	constructor();
	digest(raw: CSGORaw): CSGO | null;
	digestMIRV(raw: RawKill): KillEvent | null;
	parsePlayers(players: PlayersRaw, teams: [Team, Team]): Player[];
	parsePlayer(oldPlayer: PlayerRaw, steamid: string, team: Team): Player;
	execute<K extends keyof Events>(eventName: K, argument?: any): boolean;
	on<K extends keyof Events>(eventName: K, listener: Events[K]): boolean;
	removeListener<K extends keyof Events>(eventName: K, listener: Function): boolean;
	removeListeners<K extends keyof Events>(eventName: K): boolean;
	findSite(mapName: string, position: number[]): 'A' | 'B' | null;
}
export {
	CSGO,
	CSGORaw,
	Side,
	RoundOutcome,
	WeaponType,
	WeaponRaw,
	TeamRaw,
	PlayerRaw,
	PlayerObservedRaw,
	PlayersRaw,
	Provider,
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
	PlayerExtension
} from './interfaces';
