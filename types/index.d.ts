import { CSGO, CSGORaw, Events, KillEvent, PlayerExtension, RawKill, TeamExtension } from './interfaces';
declare class CSGOGSI {
	listeners: Map<keyof Events, Events[keyof Events][]>;
	teams: {
		left: TeamExtension | null;
		right: TeamExtension | null;
	};
	players: PlayerExtension[];
	last?: CSGO;
	constructor();
	digest(raw: CSGORaw): CSGO | null;
	digestMIRV(raw: RawKill): KillEvent | null;
	on<K extends keyof Events>(eventName: K, listener: Events[K]): boolean;
	removeListener<K extends keyof Events>(eventName: K, listener: Events[K]): boolean;
	removeListeners<K extends keyof Events>(eventName: K): boolean;
	private execute;
	static findSite(mapName: string, position: number[]): 'A' | 'B' | null;
}
export { CSGOGSI };
export {
	CSGO,
	CSGORaw,
	Side,
	RoundOutcome,
	WeaponType,
	Observer,
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
