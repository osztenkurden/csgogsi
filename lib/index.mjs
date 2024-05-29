// tsc/utils.ts
var parsePlayer = (basePlayer, steamid, team, extensions) => {
  const extension = extensions.find((player2) => player2.steamid === steamid);
  const player = {
    steamid,
    name: extension && extension.name || basePlayer.name,
    defaultName: basePlayer.name,
    clan: basePlayer.clan,
    observer_slot: basePlayer.observer_slot,
    stats: basePlayer.match_stats,
    weapons: Object.entries(basePlayer.weapons).map(([id, weapon]) => ({ ...weapon, id })),
    state: { ...basePlayer.state, smoked: basePlayer.state.smoked || 0, adr: 0 },
    position: basePlayer.position.split(", ").map((pos) => Number(pos)),
    forward: basePlayer.forward.split(", ").map((pos) => Number(pos)),
    team,
    avatar: extension && extension.avatar || null,
    country: extension && extension.country || null,
    realName: extension && extension.realName || null,
    extra: extension && extension.extra || {}
  };
  return player;
};
var mapSteamIDToPlayer = (players, teams, extensions) => (steamid) => parsePlayer(players[steamid], steamid, teams[players[steamid].team], extensions);
var parseTeam = (team, orientation, side, extension) => ({
  score: team.score,
  logo: extension && extension.logo || null,
  consecutive_round_losses: team.consecutive_round_losses,
  timeouts_remaining: team.timeouts_remaining,
  matches_won_this_series: extension && extension.map_score || team.matches_won_this_series,
  side,
  name: extension && extension.name || team.name || (side === "CT" ? "Counter-Terrorists" : "Terrorists"),
  country: extension && extension.country || null,
  id: extension && extension.id || null,
  orientation,
  extra: extension && extension.extra || {}
});
var getHalfFromRound = (round, regulationMR, mr) => {
  let currentRoundHalf = 1;
  if (round <= 2 * regulationMR) {
    currentRoundHalf = round <= regulationMR ? 1 : 2;
  } else {
    const roundInOT = (round - (2 * regulationMR + 1)) % (mr * 2) + 1;
    currentRoundHalf = roundInOT <= mr ? 1 : 2;
  }
  return currentRoundHalf;
};
var didTeamWinThatRound = (team, round, wonBy, currentRound, regulationMR, mr) => {
  const currentRoundHalf = getHalfFromRound(currentRound, regulationMR, mr);
  const roundToCheckHalf = getHalfFromRound(round, regulationMR, mr);
  return team.side === wonBy === (currentRoundHalf === roundToCheckHalf);
};
var parseGrenade = (grenade, id) => {
  if (grenade.type === "inferno") {
    return {
      ...grenade,
      id,
      flames: Object.entries(grenade.flames).map(([id2, position]) => ({
        id: id2,
        position: position.split(", ").map(parseFloat)
      })),
      lifetime: parseFloat(grenade.lifetime)
    };
  }
  if (grenade.type === "smoke" || grenade.type === "decoy") {
    return {
      ...grenade,
      id,
      velocity: grenade.velocity.split(", ").map(parseFloat),
      position: grenade.position.split(", ").map(parseFloat),
      lifetime: parseFloat(grenade.lifetime),
      effecttime: parseFloat(grenade.effecttime)
    };
  }
  return {
    type: grenade.type,
    owner: grenade.owner,
    id,
    velocity: grenade.velocity.split(", ").map(parseFloat),
    position: grenade.position.split(", ").map(parseFloat),
    lifetime: parseFloat(grenade.lifetime)
  };
};
var parseGrenades = (grenades) => {
  if (!grenades)
    return [];
  return Object.entries(grenades).map(([id, grenade]) => parseGrenade(grenade, id));
};
var getRoundWin = (mapRound, teams, roundWins, round, regulationMR, overtimeMR) => {
  let indexRound = round;
  if (mapRound > 2 * regulationMR) {
    const maxOvertimeRounds = 2 * overtimeMR * Math.floor((mapRound - (2 * regulationMR + 1)) / (2 * overtimeMR)) + 2 * regulationMR;
    if (round <= maxOvertimeRounds) {
      return null;
    }
    const roundInOT = (round - (2 * regulationMR + 1)) % (overtimeMR * 2) + 1;
    indexRound = roundInOT;
  }
  const roundOutcome = roundWins[indexRound];
  if (!roundOutcome)
    return null;
  const winSide = roundOutcome.substr(0, roundOutcome.indexOf("_")).toUpperCase();
  const result = {
    team: teams.ct,
    round,
    side: winSide,
    outcome: roundOutcome
  };
  if (didTeamWinThatRound(teams.ct, round, winSide, mapRound, regulationMR, overtimeMR)) {
    return result;
  }
  result.team = teams.t;
  return result;
};

// tsc/index.ts
var CSGOGSI = class _CSGOGSI {
  descriptors;
  maxListeners;
  teams;
  damage;
  players;
  overtimeMR;
  regulationMR;
  last;
  current;
  constructor() {
    this.descriptors = /* @__PURE__ */ new Map();
    this.teams = {
      left: null,
      right: null
    };
    this.maxListeners = 10;
    this.players = [];
    this.overtimeMR = 3;
    this.regulationMR = 15;
    this.damage = [];
  }
  eventNames = () => {
    const listeners = this.descriptors.entries();
    const nonEmptyEvents = [];
    for (const entry of listeners) {
      if (entry[1] && entry[1].length > 0) {
        nonEmptyEvents.push(entry[0]);
      }
    }
    return nonEmptyEvents;
  };
  getMaxListeners = () => this.maxListeners;
  listenerCount = (eventName) => {
    const listeners = this.listeners(eventName);
    return listeners.length;
  };
  listeners = (eventName) => {
    const descriptors = this.descriptors.get(eventName) || [];
    return descriptors.map((descriptor) => descriptor.listener);
  };
  removeListener = (eventName, listener) => {
    return this.off(eventName, listener);
  };
  off = (eventName, listener) => {
    const descriptors = this.descriptors.get(eventName) || [];
    this.descriptors.set(
      eventName,
      descriptors.filter((descriptor) => descriptor.listener !== listener)
    );
    this.emit("removeListener", eventName, listener);
    return this;
  };
  addListener = (eventName, listener) => {
    return this.on(eventName, listener);
  };
  on = (eventName, listener) => {
    this.emit("newListener", eventName, listener);
    const listOfListeners = [...this.descriptors.get(eventName) || []];
    listOfListeners.push({ listener, once: false });
    this.descriptors.set(eventName, listOfListeners);
    return this;
  };
  once = (eventName, listener) => {
    const listOfListeners = [...this.descriptors.get(eventName) || []];
    listOfListeners.push({ listener, once: true });
    this.descriptors.set(eventName, listOfListeners);
    return this;
  };
  prependListener = (eventName, listener) => {
    const listOfListeners = [...this.descriptors.get(eventName) || []];
    listOfListeners.unshift({ listener, once: false });
    this.descriptors.set(eventName, listOfListeners);
    return this;
  };
  emit = (eventName, arg, arg2) => {
    const listeners = this.descriptors.get(eventName);
    if (!listeners || listeners.length === 0)
      return false;
    listeners.forEach((listener) => {
      if (listener.once) {
        this.descriptors.set(
          eventName,
          listeners.filter((listenerInArray) => listenerInArray !== listener)
        );
      }
      listener.listener(arg, arg2);
    });
    return true;
  };
  prependOnceListener = (eventName, listener) => {
    const listOfListeners = [...this.descriptors.get(eventName) || []];
    listOfListeners.unshift({ listener, once: true });
    this.descriptors.set(eventName, listOfListeners);
    return this;
  };
  removeAllListeners = (eventName) => {
    this.descriptors.set(eventName, []);
    return this;
  };
  setMaxListeners = (n) => {
    this.maxListeners = n;
    return this;
  };
  rawListeners = (eventName) => {
    return this.descriptors.get(eventName) || [];
  };
  digest = (raw) => {
    if (!raw.allplayers || !raw.map || !raw.phase_countdowns) {
      return null;
    }
    this.emit("raw", raw);
    let isCTLeft = true;
    const examplePlayerT = Object.values(raw.allplayers).find(
      ({ observer_slot, team }) => observer_slot !== void 0 && team === "T"
    );
    const examplePlayerCT = Object.values(raw.allplayers).find(
      ({ observer_slot, team }) => observer_slot !== void 0 && team === "CT"
    );
    if (examplePlayerCT && examplePlayerCT.observer_slot !== void 0 && examplePlayerT && examplePlayerT.observer_slot !== void 0) {
      if ((examplePlayerCT.observer_slot || 10) > (examplePlayerT.observer_slot || 10)) {
        isCTLeft = false;
      }
    }
    const bomb = raw.bomb;
    const teamCT = parseTeam(
      raw.map.team_ct,
      isCTLeft ? "left" : "right",
      "CT",
      isCTLeft ? this.teams.left : this.teams.right
    );
    const teamT = parseTeam(
      raw.map.team_t,
      isCTLeft ? "right" : "left",
      "T",
      isCTLeft ? this.teams.right : this.teams.left
    );
    const playerMapper = mapSteamIDToPlayer(raw.allplayers, { CT: teamCT, T: teamT }, this.players);
    const players = Object.keys(raw.allplayers).map(playerMapper);
    const observed = players.find((player) => raw.player && player.steamid === raw.player.steamid) || null;
    const observer = {
      activity: raw.player?.activity,
      spectarget: raw.player?.spectarget,
      position: raw.player?.position.split(", ").map((n) => Number(n)),
      forward: raw.player?.forward.split(", ").map((n) => Number(n))
    };
    const rounds = [];
    if (raw.round && raw.map && raw.map.round_wins) {
      let currentRound = raw.map.round + 1;
      if (raw.round && raw.round.phase === "over") {
        currentRound = raw.map.round;
      }
      for (let i = 1; i <= currentRound; i++) {
        const result = getRoundWin(
          currentRound,
          { ct: teamCT, t: teamT },
          raw.map.round_wins,
          i,
          this.regulationMR,
          this.overtimeMR
        );
        if (!result)
          continue;
        rounds.push(result);
      }
    }
    if (this.last && this.last.map.name !== raw.map.name) {
      this.damage = [];
    }
    let currentRoundForDamage = raw.map.round + 1;
    if (raw.round && raw.round.phase === "over") {
      currentRoundForDamage = raw.map.round;
    }
    let currentRoundDamage = this.damage.find((damage) => damage.round === currentRoundForDamage);
    if (!currentRoundDamage) {
      currentRoundDamage = {
        round: currentRoundForDamage,
        players: []
      };
      this.damage.push(currentRoundDamage);
    }
    if (raw.map.round === 0 && raw.phase_countdowns.phase === "freezetime" || raw.phase_countdowns.phase === "warmup") {
      this.damage = [];
    }
    currentRoundDamage.players = players.map((player) => ({
      steamid: player.steamid,
      damage: player.state.round_totaldmg
    }));
    for (const player of players) {
      const { current, damage } = this;
      if (!current)
        continue;
      const damageForRound = damage.filter((damageEntry) => damageEntry.round < currentRoundForDamage);
      if (damageForRound.length === 0)
        continue;
      const damageEntries = damageForRound.map((damageEntry) => {
        const playerDamageEntry = damageEntry.players.find(
          (playerDamage) => playerDamage.steamid === player.steamid
        );
        return playerDamageEntry ? playerDamageEntry.damage : 0;
      });
      const adr = damageEntries.reduce((a, b) => a + b, 0) / (raw.map.round || 1);
      player.state.adr = Math.floor(adr);
    }
    const data = {
      provider: raw.provider,
      observer,
      round: raw.round ? {
        phase: raw.round.phase,
        bomb: raw.round.bomb,
        win_team: raw.round.win_team
      } : null,
      player: observed,
      players,
      bomb: bomb ? {
        state: bomb.state,
        countdown: bomb.countdown ? parseFloat(bomb.countdown) : void 0,
        position: bomb.position.split(", ").map((pos) => parseFloat(pos)),
        player: players.find((player) => player.steamid === bomb.player) || void 0,
        site: bomb.state === "planted" || bomb.state === "defused" || bomb.state === "defusing" || bomb.state === "planting" ? _CSGOGSI.findSite(
          raw.map.name,
          bomb.position.split(", ").map((n) => parseFloat(n))
        ) : null
      } : null,
      grenades: parseGrenades(raw.grenades),
      phase_countdowns: {
        phase: raw.phase_countdowns.phase,
        phase_ends_in: parseFloat(raw.phase_countdowns.phase_ends_in)
      },
      auth: raw.auth,
      map: {
        mode: raw.map.mode,
        name: raw.map.name,
        phase: raw.map.phase,
        round: raw.map.round,
        team_ct: teamCT,
        team_t: teamT,
        num_matches_to_win_series: raw.map.num_matches_to_win_series,
        current_spectators: raw.map.current_spectators,
        souvenirs_total: raw.map.souvenirs_total,
        round_wins: raw.map.round_wins,
        rounds
      }
    };
    this.current = data;
    if (!this.last) {
      this.last = data;
      this.emit("data", data);
      return data;
    }
    const last = this.last;
    if (last.round && data.round && data.round.win_team && !last.round.win_team) {
      const winner = data.round.win_team === "CT" ? data.map.team_ct : data.map.team_t;
      const loser = data.round.win_team === "CT" ? data.map.team_t : data.map.team_ct;
      const oldWinner = data.round.win_team === "CT" ? last.map.team_ct : last.map.team_t;
      if (winner.score === oldWinner.score) {
        winner.score += 1;
      }
      const roundScore = {
        winner,
        loser,
        map: data.map,
        mapEnd: data.map.phase === "gameover"
      };
      this.emit("roundEnd", roundScore);
      if (roundScore.mapEnd && last.map.phase !== "gameover") {
        this.emit("matchEnd", roundScore);
      }
    }
    if (last.bomb && data.bomb) {
      if (last.bomb.state === "planting" && data.bomb.state === "planted") {
        this.emit("bombPlant", last.bomb.player);
      } else if (last.bomb.state !== "exploded" && data.bomb.state === "exploded") {
        this.emit("bombExplode");
      } else if (last.bomb.state !== "defused" && data.bomb.state === "defused") {
        this.emit("bombDefuse", last.bomb.player);
      } else if (last.bomb.state !== "defusing" && data.bomb.state === "defusing") {
        this.emit("defuseStart", data.bomb.player);
      } else if (last.bomb.state === "defusing" && data.bomb.state !== "defusing") {
        this.emit("defuseStop", last.bomb.player);
      } else if (last.bomb.state !== "planting" && data.bomb.state === "planting") {
        this.emit("bombPlantStart", last.bomb.player);
      }
    } else if (!last.bomb && data.bomb && data.bomb.state === "exploded") {
      this.emit("bombExplode");
    }
    if (data.map.phase === "intermission" && last.map.phase !== "intermission") {
      this.emit("intermissionStart");
    } else if (data.map.phase !== "intermission" && last.map.phase === "intermission") {
      this.emit("intermissionEnd");
    }
    const { phase } = data.phase_countdowns;
    if (phase === "freezetime" && last.phase_countdowns.phase !== "freezetime") {
      this.emit("freezetimeStart");
    } else if (phase !== "freezetime" && last.phase_countdowns.phase === "freezetime") {
      this.emit("freezetimeEnd");
    }
    if (phase && last.phase_countdowns.phase) {
      if (phase.startsWith("timeout") && !last.phase_countdowns.phase.startsWith("timeout")) {
        const team = phase === "timeout_ct" ? teamCT : teamT;
        this.emit("timeoutStart", team);
      } else if (last.phase_countdowns.phase.startsWith("timeout") && !phase.startsWith("timeout")) {
        this.emit("timeoutEnd");
      }
    }
    const mvp = data.players.find((player) => {
      const previousData = last.players.find((previousPlayer) => previousPlayer.steamid === player.steamid);
      if (!previousData)
        return false;
      if (player.stats.mvps > previousData.stats.mvps)
        return true;
      return false;
    }) || null;
    if (mvp) {
      this.emit("mvp", mvp);
    }
    this.emit("data", data);
    this.last = data;
    return data;
  };
  digestMIRV = (raw, eventType = "player_death") => {
    if (eventType === "player_death") {
      const rawKill = raw;
      if (!this.last) {
        return null;
      }
      const data2 = rawKill.keys;
      const killer = this.last.players.find((player) => player.steamid === data2.attacker.xuid);
      const victim2 = this.last.players.find((player) => player.steamid === data2.userid.xuid);
      const assister = this.last.players.find(
        (player) => player.steamid === data2.assister.xuid && data2.assister.xuid !== "0"
      );
      if (!victim2) {
        return null;
      }
      const kill2 = {
        killer: killer || (data2.weapon === "trigger_hurt" || data2.weapon === "worldspawn" ? victim2 : null),
        victim: victim2,
        assister: assister || null,
        flashed: data2.assistedflash,
        headshot: data2.headshot,
        weapon: data2.weapon,
        wallbang: data2.penetrated > 0,
        attackerblind: data2.attackerblind,
        thrusmoke: data2.thrusmoke,
        noscope: data2.noscope,
        attackerinair: data2.attackerinair
      };
      this.emit("kill", kill2);
      return kill2;
    }
    const rawHurt = raw;
    if (!this.last) {
      return null;
    }
    const data = rawHurt.keys;
    const attacker = this.last.players.find((player) => player.steamid === data.attacker.xuid);
    const victim = this.last.players.find((player) => player.steamid === data.userid.xuid);
    if (!attacker || !victim) {
      return null;
    }
    const kill = {
      attacker,
      victim,
      health: data.health,
      armor: data.armor,
      weapon: data.weapon,
      dmg_health: data.dmg_health,
      dmg_armor: data.dmg_armor,
      hitgroup: data.hitgroup
    };
    this.emit("hurt", kill);
    return kill;
  };
  static findSite(mapName, position) {
    const realMapName = mapName.substr(mapName.lastIndexOf("/") + 1);
    const mapReference = {
      de_mirage: (position2) => position2[1] < -600 ? "A" : "B",
      de_cache: (position2) => position2[1] > 0 ? "A" : "B",
      de_overpass: (position2) => position2[2] > 400 ? "A" : "B",
      de_nuke: (position2) => position2[2] > -500 ? "A" : "B",
      de_dust2: (position2) => position2[0] > -500 ? "A" : "B",
      de_inferno: (position2) => position2[0] > 1400 ? "A" : "B",
      de_vertigo: (position2) => position2[0] > -1400 ? "A" : "B",
      de_train: (position2) => position2[1] > -450 ? "A" : "B",
      de_ancient: (position2) => position2[0] < -500 ? "A" : "B",
      de_anubis: (position2) => position2[0] > 0 ? "A" : "B"
    };
    if (realMapName in mapReference) {
      return mapReference[realMapName](position);
    }
    return null;
  }
};
export {
  CSGOGSI,
  didTeamWinThatRound,
  getHalfFromRound,
  mapSteamIDToPlayer,
  parseTeam
};
