var CSGOGSI = /** @class */ (function () {
    function CSGOGSI() {
        this.listeners = new Map();
        this.teams = [];
        this.players = [];
        /*this.on('data', _data => {
        });*/
    }
    CSGOGSI.prototype.setTeamOne = function (team) {
        this.teams[0] = team;
    };
    CSGOGSI.prototype.setTeamTwo = function (team) {
        this.teams[1] = team;
    };
    CSGOGSI.prototype.loadPlayers = function (players) {
        this.players = players;
    };
    CSGOGSI.prototype.digest = function (raw) {
        if (!raw.allplayers || !raw.map || !raw.phase_countdowns) {
            return null;
        }
        var ctOnLeft = Object.values(raw.allplayers).filter(function (_a) {
            var observer_slot = _a.observer_slot, team = _a.team;
            return observer_slot !== undefined && observer_slot > 1 && observer_slot <= 5 && team === "CT";
        }).length > 2;
        var ctExtension = null, tExtension = null;
        if (this.teams[0]) {
            if (ctOnLeft)
                ctExtension = this.teams[0];
            else
                tExtension = this.teams[0];
        }
        if (this.teams[1]) {
            if (ctOnLeft)
                tExtension = this.teams[1];
            else
                ctExtension = this.teams[1];
        }
        var bomb = raw.bomb;
        var teams = [raw.map.team_ct, raw.map.team_t];
        var teamCT = {
            score: teams[0].score,
            logo: ctExtension && ctExtension.logo || null,
            consecutive_round_losses: teams[0].consecutive_round_losses,
            timeouts_remaining: teams[0].timeouts_remaining,
            matches_won_this_series: ctExtension && ctExtension.map_score || teams[0].matches_won_this_series,
            side: "CT",
            name: ctExtension && ctExtension.name || 'Counter-Terrorists',
            country: ctExtension && ctExtension.country || null,
            id: ctExtension && ctExtension.id || null,
            orientation: ctOnLeft ? 'left' : 'right'
        };
        var teamT = {
            score: teams[1].score,
            logo: tExtension && tExtension.logo || null,
            consecutive_round_losses: teams[1].consecutive_round_losses,
            timeouts_remaining: teams[1].timeouts_remaining,
            matches_won_this_series: tExtension && tExtension.map_score || teams[1].matches_won_this_series,
            side: "T",
            name: tExtension && tExtension.name || 'Terrorists',
            country: tExtension && tExtension.country || null,
            id: tExtension && tExtension.id || null,
            orientation: !ctOnLeft ? 'left' : 'right'
        };
        var players = this.parsePlayers(raw.allplayers, [teamCT, teamT]);
        var observed = players.filter(function (player) { return player.steamid === raw.player.steamid; })[0] || null;
        var data = {
            provider: raw.provider,
            round: raw.round ? {
                phase: raw.round.phase,
                bomb: raw.round.bomb,
                win_team: raw.round.win_team
            } : null,
            player: observed,
            players: players,
            bomb: bomb ? {
                state: bomb.state,
                countdown: bomb.countdown,
                position: bomb.position,
                player: bomb ? players.filter(function (player) { return player.steamid === bomb.player; })[0] : undefined,
                site: bomb.state === "planted" || bomb.state === "defused" || bomb.state === "defusing" || bomb.state === "planting" ? this.findSite(raw.map.name, bomb.position.split(", ").map(Number)) : undefined
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
        };
        if (!this.last) {
            this.last = data;
            this.execute('data', data);
            return data;
        }
        var last = this.last;
        // Round end
        if ((last.map.team_ct.score !== data.map.team_ct.score) !== (last.map.team_t.score !== data.map.team_t.score)) {
            if (last.map.team_ct.score !== data.map.team_ct.score) {
                var round = {
                    winner: data.map.team_ct,
                    loser: data.map.team_t,
                    map: data.map,
                    mapEnd: false
                };
                this.execute('roundEnd', round);
            }
            else {
                var round = {
                    winner: data.map.team_t,
                    loser: data.map.team_ct,
                    map: data.map,
                    mapEnd: false
                };
                this.execute('roundEnd', round);
            }
        }
        //Bomb actions
        if (last.bomb && data.bomb) {
            if (last.bomb.state === "planting" && data.bomb.state === "planted") {
                this.execute('bombPlant', last.bomb.player);
            }
            else if (last.bomb.state !== "exploded" && data.bomb.state === "exploded") {
                this.execute('bombExplode');
            }
            else if (last.bomb.state !== "defused" && data.bomb.state === "defused") {
                this.execute('bombDefuse', last.bomb.player);
            }
            else if (last.bomb.state !== "defusing" && data.bomb.state === "defusing") {
                this.execute('defuseStart', data.bomb.player);
            }
            else if (last.bomb.state === "defusing" && data.bomb.state !== "defusing") {
                this.execute("defuseStop", last.bomb.player);
            }
            else if (last.bomb.state !== "planting" && data.bomb.state === "planting") {
                this.execute("bombPlantStart", last.bomb.player);
            }
        }
        // Match end
        if (data.map.phase === "gameover" && last.map.phase !== "gameover") {
            var winner = data.map.team_ct.score > data.map.team_t.score ? data.map.team_ct : data.map.team_t;
            var loser = data.map.team_ct.score > data.map.team_t.score ? data.map.team_t : data.map.team_ct;
            var final = {
                winner: winner,
                loser: loser,
                map: data.map,
                mapEnd: true
            };
            this.execute('matchEnd', final);
        }
        this.last = data;
        this.execute('data', data);
        return data;
    };
    CSGOGSI.prototype.digestMIRV = function (raw) {
        if (!this.last) {
            return null;
        }
        var data = raw.keys;
        var killer = this.last.players.filter(function (player) { return player.steamid === data.attacker.xuid; })[0];
        var victim = this.last.players.filter(function (player) { return player.steamid === data.userid.xuid; })[0];
        var assister = this.last.players.filter(function (player) { return player.steamid === data.assister.xuid && data.assister.xuid !== '0'; })[0];
        if (!killer || !victim) {
            return null;
        }
        var kill = {
            killer: killer,
            victim: victim,
            assister: assister || null,
            flashed: data.assistedflash,
            headshot: data.headshot,
            weapon: data.weapon,
            wallbang: data.penetrated > 0,
            attackerblind: data.attackerblind,
            thrusmoke: data.thrusmoke,
            noscope: data.noscope
        };
        this.execute("kill", kill);
        return kill;
    };
    CSGOGSI.prototype.parsePlayers = function (players, teams) {
        var _this = this;
        var parsed = [];
        Object.keys(players).forEach(function (steamid) {
            //const team:
            parsed.push(_this.parsePlayer(players[steamid], steamid, players[steamid].team === "CT" ? teams[0] : teams[1]));
        });
        return parsed;
    };
    CSGOGSI.prototype.parsePlayer = function (oldPlayer, steamid, team) {
        var extension = this.players.filter(function (player) { return player.steamid === steamid; })[0];
        var player = {
            steamid: steamid,
            name: extension && extension.name || oldPlayer.name,
            observer_slot: oldPlayer.observer_slot,
            activity: oldPlayer.activity,
            stats: oldPlayer.match_stats,
            weapons: oldPlayer.weapons,
            state: oldPlayer.state,
            spectarget: oldPlayer.spectarget,
            position: oldPlayer.position.split(", ").map(function (pos) { return Number(pos); }),
            forward: oldPlayer.forward.split(", ").map(function (pos) { return Number(pos); }),
            team: team,
            avatar: extension && extension.avatar || null,
            country: extension && extension.country || null,
            realName: extension && extension.realName || null,
        };
        return player;
    };
    CSGOGSI.prototype.execute = function (eventName, argument) {
        var listeners = this.listeners.get(eventName);
        if (!listeners)
            return false;
        listeners.forEach(function (callback) {
            if (callback)
                callback(argument);
        });
        return true;
    };
    CSGOGSI.prototype.on = function (eventName, listener) {
        var listOfListeners = this.listeners.get(eventName) || [];
        listOfListeners.push(listener);
        this.listeners.set(eventName, listOfListeners);
        return true;
    };
    CSGOGSI.prototype.removeListener = function (eventName, listener) {
        var listOfListeners = this.listeners.get(eventName);
        if (!listOfListeners)
            return false;
        this.listeners.set(eventName, listOfListeners.filter(function (callback) { return callback !== listener; }));
        return true;
    };
    CSGOGSI.prototype.removeListeners = function (eventName) {
        this.listeners.set(eventName, []);
        return true;
    };
    CSGOGSI.prototype.findSite = function (mapName, position) {
        var mapReference = {
            de_mirage: function (position) { return position[1] < 1500 ? 'A' : 'B'; },
            de_cache: function (position) { return position[1] > 0 ? 'A' : 'B'; },
            de_overpass: function (position) { return position[2] > 400 ? 'A' : 'B'; },
            de_nuke: function (position) { return position[2] > -500 ? 'A' : 'B'; },
            de_dust2: function (position) { return position[0] > -500 ? 'A' : 'B'; },
            de_inferno: function (position) { return position[0] > 1400 ? 'A' : 'B'; },
            de_vertigo: function (position) { return position[1] < 1400 ? 'A' : 'B'; },
            de_train: function (position) { return position[1] > -450 ? 'A' : 'B'; },
        };
        if (mapName in mapReference) {
            return mapReference[mapName](position);
        }
        return;
    };
    return CSGOGSI;
}());
