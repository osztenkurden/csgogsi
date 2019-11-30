import * as I from './interfaces';

export interface TeamExtension {
    id: string,
    name: string,
    country: string | null,
    logo: string | null,
    map_score: number
}

export interface PlayerExtension {
    id: string,
    name: string,
    steamid: string,
    realName: string | null,
    country: string | null,
    avatar: string | null
}

export * from './interfaces';

export * from './parsed';

export default class CSGOGSI {
    listeners: Map<string, Function[]>;
    teams: [TeamExtension?, TeamExtension?];
    players: PlayerExtension[];
    last?: I.CSGO;
    constructor(){
        this.listeners = new Map();
        this.teams = [];
        this.players = [];
        /*this.on('data', _data => {
        });*/
    }

    setTeamOne(team: TeamExtension){
        this.teams[0] = team;
    }
    setTeamTwo(team: TeamExtension){
        this.teams[1] = team;
    }

    loadPlayers(players: PlayerExtension[]){
        this.players = players;
    }

    digest(raw: I.CSGORaw): I.CSGO | null{
        if(!raw.allplayers || !raw.map || !raw.phase_countdowns){
            return null;
        }
        
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
        const bomb = raw.bomb;
        const teams = [raw.map.team_ct, raw.map.team_t];
        const teamCT: I.Team = {
            score: teams[0].score,
            logo: ctExtension && ctExtension.logo || null,
            consecutive_round_losses: teams[0].consecutive_round_losses,
            timeouts_remaining: teams[0].timeouts_remaining,
            matches_won_this_series: ctExtension && ctExtension.map_score || teams[0].matches_won_this_series,
            side: "CT",
            name: ctExtension && ctExtension.name || 'Counter-Terrorists',
            country: ctExtension && ctExtension.country || null,
            id: ctExtension && ctExtension.id || null,
            orientation: ctOnLeft ? 'left':'right'
        }
        const teamT: I.Team = {
            score: teams[1].score,
            logo: tExtension && tExtension.logo || null,
            consecutive_round_losses: teams[1].consecutive_round_losses,
            timeouts_remaining: teams[1].timeouts_remaining,
            matches_won_this_series: tExtension && tExtension.map_score || teams[1].matches_won_this_series,
            side: "T",
            name: tExtension && tExtension.name || 'Terrorists',
            country: tExtension && tExtension.country || null,
            id: tExtension && tExtension.id || null,
            orientation: !ctOnLeft ? 'left':'right'
        }
        const players = this.parsePlayers(raw.allplayers, [teamCT, teamT]);
        const observed = players.filter(player => player.steamid === raw.player.steamid)[0] || null;
        const data: I.CSGO = {
            provider: raw.provider,
            round: raw.round ? {
                phase: raw.round.phase,
                bomb: raw.round.bomb,
                win_team: raw.round.win_team
            } : null,
            player: observed,
            players: players,
            bomb: raw.bomb ? {
                state: raw.bomb.state,
                countdown: raw.bomb.countdown,
                position: raw.bomb.position,
                player: bomb ? players.filter(player => player.steamid === bomb.player)[0] : undefined
            } : null,
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

        // Round end
        if((last.map.team_ct.score !== data.map.team_ct.score) !== (last.map.team_t.score !== data.map.team_t.score)){
            if(last.map.team_ct.score !== data.map.team_ct.score){
                const round: I.Score = {
                    winner: data.map.team_ct,
                    loser: data.map.team_t,
                    map: data.map,
                    mapEnd: false
                }
                this.execute('roundEnd', round);
            } else {
                const round: I.Score = {
                    winner: data.map.team_t,
                    loser: data.map.team_ct,
                    map: data.map,
                    mapEnd: false
                }
                this.execute('roundEnd', round);
            }
        }
        //Bomb actions
        if(last.bomb && data.bomb){
            if(last.bomb.state !== "planted" && data.bomb.state === "planted"){
                this.execute('bombPlant', last.bomb.player)
            } else if(last.bomb.state !== "exploded" && data.bomb.state === "exploded"){
                this.execute('bombExplode')
            }else if(last.bomb.state !== "defused" && data.bomb.state === "defused"){
                this.execute('bombDefuse', last.bomb.player)
            } else if(last.bomb.state !== "defusing" && data.bomb.state === "defusing"){
                this.execute('defuseStart', data.bomb.player);
            } else if(last.bomb.state === "defusing" && data.bomb.state !== "defusing"){
                this.execute("defuseStop", last.bomb.player);
            }
        }

        // Match end
        if(data.map.phase === "gameover" && last.map.phase !== "gameover"){
            const winner = data.map.team_ct.score > data.map.team_t.score ? data.map.team_ct : data.map.team_t;
            const loser = data.map.team_ct.score > data.map.team_t.score ? data.map.team_t : data.map.team_ct;

            const final: I.Score = {
                winner,
                loser,
                map: data.map,
                mapEnd: true
            };

            this.execute('matchEnd', final);
        }
        this.last = data;
        this.execute('data', data);
        return data;
    }

    digestMIRV(raw: I.RawKill): I.KillEvent | null{
        if(!this.last){
            return null;
        }
        const data = raw.keys;
        const killer = this.last.players.filter(player => player.steamid === data.attacker.xuid)[0];
        const victim = this.last.players.filter(player => player.steamid === data.userid.xuid)[0];
        const assister = this.last.players.filter(player => player.steamid === data.assister.xuid && data.assister.xuid !== '0')[0];
        if(!killer || !victim){
            return null;
        }
        const kill: I.KillEvent = {
            killer,
            victim,
            assister: assister || null,
            flashed: data.assistedflash,
            headshot: data.headshot,
            weapon: data.weapon,
            wallbang: data.penetrated > 0
        }
        this.execute("kill", kill);
        return kill;
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
        const extension = this.players.filter(player => player.steamid === steamid)[0];
        const player: I.Player = {
            steamid,
            name: extension && extension.name ||oldPlayer.name,
            observer_slot: oldPlayer.observer_slot,
            activity: oldPlayer.activity,
            stats: oldPlayer.match_stats,
            weapons: oldPlayer.weapons,
            state: oldPlayer.state,
            spectarget: oldPlayer.spectarget,
            position: oldPlayer.position.split(", ").map(pos => Number(pos)),
            forward: oldPlayer.forward,
            team,
            avatar: extension && extension.avatar || null,
            country: extension && extension.country || null,
            realName: extension && extension.realName || null,
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