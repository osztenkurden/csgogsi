type Side = 'CT' | 'T';
type RoundOutcome = 'ct_win_elimination' | 't_win_elimination' | 'ct_win_time' | 'ct_win_defuse' | 't_win_bomb';

type WeaponType =
	| 'Knife'
	| 'Pistol'
	| 'Grenade'
	| 'Rifle'
	| 'SniperRifle'
	| 'C4'
	| 'Submachine Gun'
	| 'Shotgun'
	| 'Machine Gun';

interface WeaponRaw {
	name: string;
	paintkit: string;
	type?: WeaponType;
	ammo_clip?: number;
	ammo_clip_max?: number;
	ammo_reserve?: number;
	state: 'active' | 'holstered';
}

interface TeamRaw {
	score: number;
	consecutive_round_losses: number;
	timeouts_remaining: number;
	matches_won_this_series: number;
	name?: string;
	flag?: string;
}

interface PlayerRaw {
	steamid?: string;
	name: string;
	clan?: string;
	observer_slot?: number;
	team: Side;
	match_stats: {
		kills: number;
		assists: number;
		deaths: number;
		mvps: number;
		score: number;
	};
	weapons: {
		[key: string]: WeaponRaw;
	};
	state: {
		health: number;
		armor: number;
		helmet: boolean;
		defusekit?: boolean;
		flashed: number;
		smoked?: number;
		burning: number;
		money: number;
		round_kills: number;
		round_killhs: number;
		round_totaldmg: number;
		equip_value: number;
	};
	position: string;
	forward: string;
}

interface PlayerObservedRaw {
	steamid: string;
	clan?: string;
	name: string;
	observer_slot?: number;
	team?: Side;
	activity: 'playing' | 'textinput' | 'menu';
	state: {
		health: number;
		armor: number;
		helmet: boolean;
		flashed: number;
		smoked: number;
		burning: number;
		money: number;
		round_kills: number;
		round_killhs: number;
		round_totaldmg: number;
		equip_value: number;
	};
	spectarget: 'free' | string;
	position: string;
	forward: string;
}

interface PlayersRaw {
	[key: string]: PlayerRaw;
}

interface Provider {
	name: 'Counter-Strike: Global Offensive';
	appid: 730;
	version: number;
	steamid: string;
	timestamp: number;
}

interface MapRaw {
	mode: 'competitive';
	name: string;
	phase: 'warmup' | 'live' | 'intermission' | 'gameover';
	round: number;
	team_ct: TeamRaw;
	team_t: TeamRaw;
	num_matches_to_win_series: number;
	current_spectators: number;
	souvenirs_total: number;
	round_wins: {
		[key: string]: RoundOutcome;
	};
}

interface RoundRaw {
	phase: 'freezetime' | 'live' | 'over';
	bomb?: 'planted' | 'exploded' | 'defused';
	win_team?: Side;
}

interface BombRaw {
	state: 'carried' | 'planted' | 'dropped' | 'defused' | 'defusing' | 'planting' | 'exploded';
	countdown?: string;
	player?: string;
	position: string;
}
interface PhaseRaw {
	phase?: 'freezetime' | 'bomb' | 'warmup' | 'live' | 'over' | 'defuse' | 'paused' | 'timeout_ct' | 'timeout_t';
	phase_ends_in: string;
}

interface GrenadeBaseRaw {
	owner: string;
	lifetime: string;
}

interface DecoySmokeGrenadeRaw extends GrenadeBaseRaw {
	position: string;
	velocity: string;
	type: 'decoy' | 'smoke';
	effecttime: string;
}

interface FragOrFireBombOrFlashbandGrenadeRaw extends GrenadeBaseRaw {
	position: string;
	type: 'frag' | 'firebomb' | 'flashbang';
	velocity: string;
}

interface InfernoGrenadeRaw extends GrenadeBaseRaw {
	type: 'inferno';
	flames: { [key: string]: string };
}

type GrenadeRaw = DecoySmokeGrenadeRaw | FragOrFireBombOrFlashbandGrenadeRaw | InfernoGrenadeRaw;

interface CSGORaw {
	provider: Provider;
	map?: MapRaw;
	round?: RoundRaw;
	player?: PlayerObservedRaw;
	allplayers?: PlayersRaw;
	bomb?: BombRaw;
	grenades?: {
		[key: string]: GrenadeRaw;
		/*{
            owner:number,
            position:string,
            velocity:string,
            lifetime:string,
            type:string,
            effecttime?:string
        }*/
	};
	previously?: any;
	phase_countdowns?: PhaseRaw;
	auth?: {
		token: string;
	};
}

interface Events {
	raw: (data: CSGORaw) => void;
	data: (data: CSGO) => void;
	roundEnd: (team: Score) => void;
	matchEnd: (score: Score) => void;
	kill: (kill: KillEvent) => void;
	hurt: (kill: HurtEvent) => void;
	timeoutStart: (team: any) => void;
	timeoutEnd: () => void;
	/*roundStart: (round: number) => void,
    warmupStart: () => void,
    warmupEnd: () => void,*/
	mvp: (player: Player) => void;
	freezetimeStart: () => void;
	freezetimeEnd: () => void;
	intermissionStart: () => void;
	intermissionEnd: () => void;
	defuseStart: (player: Player) => void;
	defuseStop: (player: Player) => void;
	bombPlantStart: (player: Player) => void;
	bombPlant: (player: Player) => void;
	bombExplode: () => void;
	bombDefuse: (player: Player) => void;
	newListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
	removeListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
}

type AnyEventName<T> = T | (string & {});

type BaseEvents = keyof Events;

type EventNames = AnyEventName<BaseEvents>;

type EmptyListener = () => void;

type Callback<K> = K extends BaseEvents ? Events[K] | EmptyListener : EmptyListener;

interface RawKill {
	name: 'player_death';
	clientTime: number;
	keys: {
		userid: {
			value: number;
			xuid: string;
		};
		attacker: {
			value: number;
			xuid: string;
		};
		assister: {
			value: number;
			xuid: string;
		};
		assistedflash: boolean;
		weapon: string;
		weapon_itemid: string;
		weapon_fauxitemid: string;
		weapon_originalowner_xuid: string;
		headshot: boolean;
		dominated: number;
		revenge: number;
		wipe: number;
		attackerblind: boolean;
		thrusmoke: boolean;
		noscope: boolean;
		penetrated: number;
		noreplay: boolean;
		attackerinair: boolean;
	};
}

interface RawHurt {
	name: 'player_hurt';
	clientTime: number;
	keys: {
		userid: {
			value: number;
			xuid: string;
		};
		attacker: {
			value: number;
			xuid: string;
		};
		health: number;
		armor: number;
		weapon: string;
		dmg_health: number;
		dmg_armor: number;
		hitgroup: number;
	};
}

interface TeamExtension {
	id: string;
	name: string;
	country: string | null;
	logo: string | null;
	map_score: number;
	extra: Record<string, string>;
}

interface PlayerExtension {
	id: string;
	name: string;
	steamid: string;
	realName: string | null;
	country: string | null;
	avatar: string | null;
	extra: Record<string, string>;
}

type Orientation = 'left' | 'right';

interface Team {
	logo: string | null;
	score: number;
	consecutive_round_losses: number;
	timeouts_remaining: number;
	matches_won_this_series: number;
	side: Side;
	name: string;
	country: string | null;
	id: string | null;
	orientation: Orientation;
	extra: Record<string, string>;
}

interface RoundInfo {
	team: Team;
	round: number;
	side: Side;
	outcome: RoundOutcome;
}
interface Weapon {
	name: string;
	paintkit: string;
	type?: WeaponType;
	ammo_clip?: number;
	ammo_clip_max?: number;
	ammo_reserve?: number;
	state: 'active' | 'holstered';
	id: string;
}

interface Player {
	steamid: string;
	name: string;
	defaultName: string;
	clan?: string;
	observer_slot?: number;
	team: Team;
	stats: {
		kills: number;
		assists: number;
		deaths: number;
		mvps: number;
		score: number;
	};
	weapons: Weapon[];
	state: {
		health: number;
		armor: number;
		helmet: boolean;
		defusekit?: boolean;
		flashed: number;
		smoked: number;
		burning: number;
		money: number;
		round_kills: number;
		round_killhs: number;
		round_totaldmg: number;
		equip_value: number;
		adr: number;
	};
	position: number[];
	forward: number[];
	avatar: string | null;
	country: string | null;
	realName: string | null;
	extra: Record<string, string>;
}

type RoundWins = {
	[key: string]: RoundOutcome;
};
interface Bomb {
	state: 'carried' | 'planted' | 'dropped' | 'defused' | 'defusing' | 'planting' | 'exploded';
	countdown?: number;
	player?: Player;
	site: 'A' | 'B' | null;
	position: number[];
}

interface Map {
	mode: string;
	name: string;
	phase: 'warmup' | 'live' | 'intermission' | 'gameover';
	round: number;
	team_ct: Team;
	team_t: Team;
	num_matches_to_win_series: number;
	current_spectators: number;
	souvenirs_total: number;
	round_wins: RoundWins;
	rounds: RoundInfo[];
}

interface Round {
	phase: 'freezetime' | 'live' | 'over';
	bomb?: 'planted' | 'exploded' | 'defused';
	win_team?: Side;
}

interface Observer {
	activity?: 'playing' | 'textinput' | 'menu';
	spectarget?: 'free' | (string & {});
	position?: number[];
	forward?: number[];
}

interface GrenadeBase {
	id: string;
	owner: string;
	lifetime: number;
}

interface DecoySmokeGrenade extends GrenadeBase {
	position: number[];
	velocity: number[];
	type: 'decoy' | 'smoke';
	effecttime: number;
}

interface FragOrFireBombOrFlashbandGrenade extends GrenadeBase {
	position: number[];
	type: 'frag' | 'firebomb' | 'flashbang';
	velocity: number[];
}

interface InfernoGrenade extends GrenadeBase {
	type: 'inferno';
	flames: { id: string; position: number[] }[];
}

type Grenade = DecoySmokeGrenade | FragOrFireBombOrFlashbandGrenade | InfernoGrenade;

interface Phase {
	phase?: 'freezetime' | 'bomb' | 'warmup' | 'live' | 'over' | 'defuse' | 'paused' | 'timeout_ct' | 'timeout_t';
	phase_ends_in: number;
}
interface CSGO {
	provider: Provider;
	map: Map;
	round: Round | null;
	observer: Observer;
	player: Player | null;
	players: Player[];
	bomb: Bomb | null;
	grenades: Grenade[];
	previously?: any;
	phase_countdowns: Phase;
	auth?: {
		token: string;
	};
}
interface Score {
	winner: Team;
	loser: Team;
	map: Map;
	mapEnd: boolean;
}

interface KillEvent {
	killer: Player | null;
	victim: Player;
	assister: Player | null;
	flashed: boolean;
	headshot: boolean;
	weapon: string;
	wallbang: boolean;
	attackerblind: boolean;
	thrusmoke: boolean;
	noscope: boolean;
	attackerinair: boolean;
}

interface HurtEvent {
	attacker: Player;
	victim: Player;
	health: number;
	armor: number;
	weapon: string;
	dmg_health: number;
	dmg_armor: number;
	hitgroup: number;
}

//export type DigestMirvType = ((kill: RawKill, eventType: 'player_death') => KillEvent | null) | ((hurt: RawHurt, eventType: 'player_hurt') => HurtEvent | null)
type DigestMirvType = KillEvent | HurtEvent | null;

declare const mapSteamIDToPlayer: (players: PlayersRaw, teams: {
    CT: Team;
    T: Team;
}, extensions: PlayerExtension[]) => (steamid: string) => Player;
declare const parseTeam: (team: TeamRaw, orientation: Orientation, side: Side, extension: TeamExtension | null) => Team;
declare const getHalfFromRound: (round: number, regulationMR: number, mr: number) => number;
declare const didTeamWinThatRound: (team: Team, round: number, wonBy: Side, currentRound: number, regulationMR: number, mr: number) => boolean;

interface EventDescriptor {
    listener: Events[BaseEvents];
    once: boolean;
}
type RoundPlayerDamage = {
    steamid: string;
    damage: number;
};
type RoundDamage = {
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
    listeners: (eventName: EventNames) => (((data: CSGORaw) => void) | ((data: CSGO) => void) | ((team: Score) => void) | ((score: Score) => void) | ((kill: KillEvent) => void) | ((kill: HurtEvent) => void) | ((team: any) => void) | (() => void) | ((player: Player) => void) | (() => void) | (() => void) | (() => void) | (() => void) | ((player: Player) => void) | ((player: Player) => void) | ((player: Player) => void) | ((player: Player) => void) | (() => void) | ((player: Player) => void) | (<K extends keyof Events>(eventName: K, listener: Events[K]) => void) | (<K_1 extends keyof Events>(eventName: K_1, listener: Events[K_1]) => void))[];
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
    static findSite(mapName: string, position: number[]): "A" | "B" | null;
}

export { type Bomb, type BombRaw, type CSGO, CSGOGSI, type CSGORaw, type DecoySmokeGrenade, type DecoySmokeGrenadeRaw, type Events, type FragOrFireBombOrFlashbandGrenade, type FragOrFireBombOrFlashbandGrenadeRaw, type Grenade, type GrenadeBase, type GrenadeBaseRaw, type GrenadeRaw, type HurtEvent, type InfernoGrenade, type InfernoGrenadeRaw, type KillEvent, type Map, type MapRaw, type Observer, type Orientation, type PhaseRaw, type Player, type PlayerExtension, type PlayerObservedRaw, type PlayerRaw, type PlayersRaw, type Provider, type RawHurt, type RawKill, type Round, type RoundDamage, type RoundInfo, type RoundOutcome, type RoundRaw, type RoundWins, type Score, type Side, type Team, type TeamExtension, type TeamRaw, type Weapon, type WeaponRaw, type WeaponType, didTeamWinThatRound, getHalfFromRound, mapSteamIDToPlayer, parseTeam };
