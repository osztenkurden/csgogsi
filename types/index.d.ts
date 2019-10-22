import * as I from './interfaces';
export interface TeamExtension {
    id: string;
    name: string;
    country: string | null;
    logo: string | null;
    map_score: number;
}
export interface PlayerExtension {
    id: string;
    name: string;
    steamid: string;
    realName: string | null;
    country: string | null;
    avatar: string | null;
}
export * from './interfaces';
export * from './parsed';
export default class CSGOGSI {
    listeners: Map<string, Function[]>;
    teams: [TeamExtension?, TeamExtension?];
    players: PlayerExtension[];
    last?: I.CSGO;
    constructor();
    setTeamOne(team: TeamExtension): void;
    setTeamTwo(team: TeamExtension): void;
    loadPlayers(players: PlayerExtension[]): void;
    digest(raw: I.CSGORaw): I.CSGO | null;
    parsePlayers(players: I.PlayersRaw, teams: [I.Team, I.Team]): I.Player[];
    parsePlayer(oldPlayer: I.PlayerRaw, steamid: string, team: I.Team): I.Player;
    execute<K extends keyof I.Events>(eventName: K, argument?: any): boolean;
    on<K extends keyof I.Events>(eventName: K, listener: I.Events[K]): boolean;
    removeListener<K extends keyof I.Events>(eventName: K, listener: Function): boolean;
    removeListeners<K extends keyof I.Events>(eventName: K): boolean;
}
