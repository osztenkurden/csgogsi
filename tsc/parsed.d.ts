import * as I from './interfaces';

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

export interface Player {
	steamid: string;
	name: string;
	observer_slot?: number;
	team: Team;
	stats: {
		kills: number;
		assists: number;
		deaths: number;
		mvps: number;
		score: number;
	};
	weapons: {
		[key: string]: I.WeaponRaw;
	};
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
	};
	position: number[];
	forward: number[];
	avatar: string | null;
	country: string | null;
	realName: string | null;
	extra: Record<string, string>;
}
export interface Bomb {
	state: 'carried' | 'planted' | 'dropped' | 'defused' | 'defusing' | 'planting' | 'exploded';
	countdown?: string;
	player?: Player;
	site: 'A' | 'B' | null;
	position: string;
}

export interface Map {
	mode: string;
	name: string;
	phase: 'warmup' | 'live' | 'intermission' | 'gameover';
	round: number;
	team_ct: Team;
	team_t: Team;
	num_matches_to_win_series: number;
	current_spectators: number;
	souvenirs_total: number;
	round_wins: {
		[key: string]: I.RoundOutcome;
	};
}

export interface Round {
	phase: 'freezetime' | 'live' | 'over';
	bomb?: 'planted' | 'exploded' | 'defused';
	win_team?: I.Side;
}

export interface Observer {
	activity: 'playing' | 'textinput' | 'menu';
	spectarget: 'free' | string;
	position: number[];
	forward: number[];
}

export interface CSGO {
	provider: I.Provider;
	map: Map;
	round: Round | null;
	observer: Observer;
	player: Player | null;
	players: Player[];
	bomb: Bomb | null;
	grenades?: {
		[key: string]: any;
	};
	previously?: any;
	phase_countdowns: I.PhaseRaw;
	auth?: {
		token: string;
	};
}
export interface Score {
	winner: I.Team;
	loser: I.Team;
	map: Map;
	mapEnd: boolean;
}

export interface KillEvent {
	killer: Player;
	victim: Player;
	assister: Player | null;
	flashed: boolean;
	headshot: boolean;
	weapon: string;
	wallbang: boolean;
	attackerblind: boolean;
	thrusmoke: boolean;
	noscope: boolean;
}
