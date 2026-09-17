import type * as I from './interfaces';

export type Orientation = 'left' | 'right';

export interface Team {
	logo: string | null;
	score: number;
	consecutive_round_losses: number;
	timeouts_remaining: number;
	matches_won_this_series: number;
	side: I.Side;
	name: string;
	country: string | null;
	id: string | null;
	orientation: Orientation;
	extra: Record<string, string>;
}

export interface RoundResult {
	team: Team;
	round: number;
	side: I.Side;
	outcome: I.RoundOutcome;
}
export interface Weapon {
	name: string;
	paintkit: string;
	type?: I.WeaponType;
	ammo_clip?: number;
	ammo_clip_max?: number;
	ammo_reserve?: number;
	state: 'active' | 'holstered' | 'reloading';
	id: string;
}

export interface Player {
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

export type RoundWins = {
	[key: string]: I.RoundOutcome;
};
export interface Bomb {
	state: 'carried' | 'planted' | 'dropped' | 'defused' | 'defusing' | 'planting' | 'exploded';
	countdown?: number;
	player?: Player;
	site: 'A' | 'B' | null;
	position: number[];
}

export interface MapState {
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
	rounds: I.RoundResult[];
}

export interface RoundState {
	phase: 'freezetime' | 'live' | 'over';
	bomb?: 'planted' | 'exploded' | 'defused';
	win_team?: I.Side;
}

export interface Observer {
	activity?: 'playing' | 'textinput' | 'menu';
	spectarget?: 'free' | (string & {});
	position?: number[];
	forward?: number[];
}

export interface GrenadeBase {
	id: string;
	owner: string;
	lifetime: number;
}

export interface DecoySmokeGrenade extends GrenadeBase {
	position: number[];
	velocity: number[];
	type: 'decoy' | 'smoke';
	effecttime: number;
}

export interface FragOrFireBombOrFlashbangGrenade extends GrenadeBase {
	position: number[];
	type: 'frag' | 'firebomb' | 'flashbang';
	velocity: number[];
}

export interface InfernoGrenade extends GrenadeBase {
	type: 'inferno';
	flames: { id: string; position: number[] }[];
}

export type Grenade = DecoySmokeGrenade | FragOrFireBombOrFlashbangGrenade | InfernoGrenade;

export interface PhaseCountdown {
	phase?: 'freezetime' | 'bomb' | 'warmup' | 'live' | 'over' | 'defuse' | 'paused' | 'timeout_ct' | 'timeout_t';
	phase_ends_in: number;
	timeout_team?: Team;
}
export interface GameState {
	provider: I.Provider;
	map: MapState;
	round: RoundState | null;
	observer: Observer;
	player: Player | null;
	players: Player[];
	bomb: Bomb | null;
	grenades: Grenade[];
	previously?: any;
	phase_countdowns: I.PhaseCountdown;
	auth?: {
		token: string;
	};
}
export interface RoundEndEvent {
	winner: I.Team;
	loser: I.Team;
	map: MapState;
	mapEnd: boolean;
}

export interface KillEvent {
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

export interface HurtEvent {
	attacker: Player;
	victim: Player;
	health: number;
	armor: number;
	weapon: string;
	dmg_health: number;
	dmg_armor: number;
	hitgroup: number;
}

export type MirvDigestResult = KillEvent | HurtEvent | null;

/** @deprecated Use RoundEndEvent instead. */
export type Score = RoundEndEvent;

/** @deprecated Use GameState instead. */
export type CSGO = GameState;

/** @deprecated Use PhaseCountdown instead. */
export type Phase = PhaseCountdown;

/** @deprecated Use MapState instead. */
export type Map = MapState;

/** @deprecated Use RoundState instead. */
export type Round = RoundState;

/** @deprecated Use RoundResult instead. */
export type RoundInfo = RoundResult;

/** @deprecated Use MirvDigestResult instead. */
export type DigestMirvType = MirvDigestResult;

/** @deprecated Use FragOrFireBombOrFlashbangGrenade instead. */
export type FragOrFireBombOrFlashbandGrenade = FragOrFireBombOrFlashbangGrenade;
