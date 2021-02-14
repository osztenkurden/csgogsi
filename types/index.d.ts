import { CSGO, CSGORaw, Events, KillEvent, PlayerExtension, RawKill, TeamExtension } from './interfaces';
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
	PlayerExtension,
	Orientation
} from './interfaces';
