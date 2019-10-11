import * as I from './interfaces';

interface TeamExtension {
    id: string,
    name: string,
    country: string | null
}

export default class CSGOGSI {
    listeners: Map<string, Function[]>;
    teams: [TeamExtension?, TeamExtension?];
    last?: I.CSGO;
    constructor(){
        this.listeners = new Map();
        this.teams = [];
        /*this.on('data', _data => {
        });*/
    }

    setTeamOne(team: TeamExtension){
        this.teams[0] = team;
    }
    setTeamTwo(team: TeamExtension){
        this.teams[1] = team;
    }

    digest(raw: I.CSGORaw): I.CSGO{
        const ctOnLeft = Object.values(raw.allplayers).filter(({observer_slot, team}) => observer_slot !== undefined && observer_slot > 1 && observer_slot <=5 && team === "CT").length > 2;
        let ctExtension = null, tExtension = null;
        if(this.teams[0]){
            if(ctOnLeft) ctExtension = this.teams[0];
            else tExtension = this.teams[0];
        }
        if(this.teams[1]){
            if(ctOnLeft) tExtension = this.teams[1];
            else ctExtension = this.teams[1];
        }
        const teams = [raw.map.team_ct, raw.map.team_t];
        const teamCT: I.Team = {
            score: teams[0].score,
            consecutive_round_losses: teams[0].consecutive_round_losses,
            timeouts_remaining: teams[0].timeouts_remaining,
            matches_won_this_series: teams[0].matches_won_this_series,
            side: "CT",
            name: ctExtension && ctExtension.name || 'Counter-Terrorists',
            country: ctExtension && ctExtension.country || null,
            id: ctExtension && ctExtension.id || null,
        }
        const teamT: I.Team = {
            score: teams[1].score,
            consecutive_round_losses: teams[1].consecutive_round_losses,
            timeouts_remaining: teams[1].timeouts_remaining,
            matches_won_this_series: teams[1].matches_won_this_series,
            side: "T",
            name: tExtension && tExtension.name || 'Terrorists',
            country: tExtension && tExtension.country || null,
            id: tExtension && tExtension.id || null,
        }
        const players = this.parsePlayers(raw.allplayers, [teamCT, teamT]);
        const data: I.CSGO = {
            provider: raw.provider,
            round: {
                phase: raw.round.phase,
                bomb: raw.round.bomb,
                win_team: raw.round.win_team
            },
            player: this.parsePlayer(raw.player, '', raw.player.team === "CT" ? teamCT : teamT),
            players: players,
            bomb: {
                state: raw.bomb.state,
                countdown: raw.bomb.countdown,
                position: raw.bomb.position,
                player: raw.bomb.player ? players.filter(player => player.steamid === raw.bomb.player)[0] : undefined
            },
            grenades: raw.grenades,
            phase_countdowns: raw.phase_countdowns,
            auth: raw.auth,
            map: {
                mode: "competetive",
                name: raw.map.name,
                phase: raw.map.phase,
                round: raw.map.round,
                team_ct: teamCT,
                team_t: teamT,
                num_matches_to_win_series: raw.map.num_matches_to_win_series,
                current_spectators: raw.map.current_spectators,
                souvenirs_total: raw.map.souvenirs_total,
                round_wins: raw.map.round_wins
            }
        }
        if(!this.last){
            this.last = data;
            this.execute('data', data);
            return data;
        }
        const last = this.last;
        if((last.map.team_ct.score !== data.map.team_ct.score) !== (last.map.team_t.score !== data.map.team_t.score)){
            if(last.map.team_ct.score !== data.map.team_ct.score){
                this.execute('roundEnd', data.map.team_ct);
            } else {
                this.execute('roundEnd', data.map.team_t);
            }
        }
        if(last.bomb.state !== "planted" && data.bomb.state === "planted"){
            this.execute('bombPlant')
        } else if(last.bomb.state !== "exploded" && data.bomb.state === "exploded"){
            this.execute('bombExplode')
        }else if(last.bomb.state !== "defused" && data.bomb.state === "defused"){
            this.execute('bombDefuse')
        }
        this.execute('data', data);
        return data;
    }

    parsePlayers(players: I.PlayersRaw, teams: [I.Team, I.Team]){
        const parsed: I.Player[] = [];
        Object.keys(players).forEach(steamid => {
            //const team:
            parsed.push(this.parsePlayer(players[steamid], steamid, players[steamid].team === "CT" ? teams[0] : teams[1]));
        });
        return parsed;
    }

    parsePlayer(oldPlayer: I.PlayerRaw, steamid: string, team: I.Team){
        const player: I.Player = {
            steamid,
            name: oldPlayer.name,
            observer_slot: oldPlayer.observer_slot,
            activity: oldPlayer.activity,
            stats: oldPlayer.match_stats,
            weapons: oldPlayer.weapons,
            state: oldPlayer.state,
            spectarget: oldPlayer.spectarget,
            position: oldPlayer.position.split(", ").map(pos => Number(pos)),
            forward: oldPlayer.forward,
            team
        };

        return player;

    }

    execute<K extends keyof I.Events>(eventName: K, argument?: any){
        const listeners = this.listeners.get(eventName);
        if(!listeners) return false;
        listeners.forEach(callback => {
            if(callback) callback(argument);
        });
        return true;
    }

    on<K extends keyof I.Events>(eventName: K, listener: I.Events[K]){
        const listOfListeners = this.listeners.get(eventName) || [];

        listOfListeners.push(listener);
        this.listeners.set(eventName, listOfListeners);

        return true;
    }
    removeListener<K extends keyof I.Events>(eventName: K, listener: Function) {
        const listOfListeners = this.listeners.get(eventName);
        if(!listOfListeners) return false;
        this.listeners.set(eventName, listOfListeners.filter(callback => callback !== listener));
        return true;
    }
    removeListeners<K extends keyof I.Events>(eventName: K){
        this.listeners.set(eventName, []);
        return true;
    }

}