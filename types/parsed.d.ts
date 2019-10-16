import * as I from './interfaces';
export interface Team {
    score: number;
    consecutive_round_losses: number;
    timeouts_remaining: number;
    matches_won_this_series: number;
    side: I.Side;
    name: string;
    country: string | null;
    id: string | null;
}
export interface Player {
    steamid: string;
    name: string;
    observer_slot?: number;
    team: Team;
    activity?: string;
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
    spectarget?: string;
    position: number[];
    forward: number;
}
export interface Bomb {
    state: "carried" | "planted" | "dropped" | "defused" | "defusing" | "planting" | "exploded";
    countdown?: string;
    player?: Player;
    position: string;
}
export interface Map {
    mode: string;
    name: string;
    phase: "warmup" | "live" | "intermission" | "gameover";
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
    phase: "freezetime" | "live" | "over";
    bomb?: "planted" | "exploded" | "defused";
    win_team?: I.Side;
}
export interface CSGO {
    provider: I.Provider;
    map: Map;
    round: Round;
    player: Player | null;
    players: Player[];
    bomb: Bomb;
    grenades: {
        [key: string]: any;
    };
    previously?: any;
    phase_countdowns: I.PhaseRaw;
    auth?: {
        token: string;
    };
}
