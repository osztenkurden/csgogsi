export declare type Side = "CT" | "T";
export declare type RoundOutcome = "ct_win_elimination" | "t_win_elimination" | "ct_win_time" | "ct_win_defuse";
export interface WeaponRaw {
    name: string;
    paintkit: string;
    type: "Knife" | "Pistol" | "Grenade" | "Rifle" | "SniperRifle" | "C4";
    ammo_clip?: number;
    ammo_clip_max?: number;
    ammo_reserve?: number;
    state: "active" | "holstered";
}
export interface TeamRaw {
    score: number;
    consecutive_round_losses: number;
    timeouts_remaining: number;
    matches_won_this_series: number;
    name?: string;
    flag?: string;
}
export interface PlayerRaw {
    steamid?: string;
    name: string;
    clan?: string;
    observer_slot?: number;
    team: Side;
    activity?: string;
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
        smoked: number;
        burning: number;
        money: number;
        round_kills: number;
        round_killhs: number;
        round_totaldmg: number;
        equip_value: number;
    };
    spectarget?: string;
    position: string;
    forward: number;
}
export interface PlayersRaw {
    [key: string]: PlayerRaw;
}
export interface Provider {
    name: "Counter-Strike: Global Offensive";
    appid: 730;
    version: number;
    steamid: string;
    timestamp: number;
}
export interface MapRaw {
    mode: "competetive";
    name: string;
    phase: "warmup" | "live" | "intermission" | "gameover";
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
export interface RoundRaw {
    phase: "freezetime" | "live" | "over";
    bomb?: "planted" | "exploded" | "defused";
    win_team?: Side;
}
export interface BombRaw {
    state: "carried" | "planted" | "dropped" | "defused" | "defusing" | "planting";
    countdown?: string;
    player?: string;
    position: string;
}
export interface PhaseRaw {
    phase?: 'freezetime' | 'bomb' | 'warmup' | 'live' | 'over' | 'defuse' | 'paused' | 'timeout_ct' | 'timeout_t';
    phase_ends_in: string;
}
export interface CSGORaw {
    provider: Provider;
    map?: MapRaw;
    round?: RoundRaw;
    player: PlayerRaw;
    allplayers?: PlayersRaw;
    bomb?: BombRaw;
    grenades?: {
        [key: string]: any;
    };
    previously?: any;
    phase_countdowns?: PhaseRaw;
    auth?: {
        token: string;
    };
}
