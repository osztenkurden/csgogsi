"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoundWin = exports.parseGrenades = exports.didTeamWinThatRound = exports.getHalfFromRound = exports.parseTeam = exports.mapSteamIDToPlayer = void 0;
const parsePlayer = (basePlayer, steamid, team, extensions) => {
    const extension = extensions.find(player => player.steamid === steamid);
    const player = {
        steamid,
        name: (extension && extension.name) || basePlayer.name,
        defaultName: basePlayer.name,
        clan: basePlayer.clan,
        observer_slot: basePlayer.observer_slot,
        stats: basePlayer.match_stats,
        weapons: Object.entries(basePlayer.weapons).map(([id, weapon]) => ({ ...weapon, id })),
        state: { ...basePlayer.state, smoked: basePlayer.state.smoked || 0, adr: 0 },
        position: basePlayer.position.split(', ').map(pos => Number(pos)),
        forward: basePlayer.forward.split(', ').map(pos => Number(pos)),
        team,
        avatar: (extension && extension.avatar) || null,
        country: (extension && extension.country) || null,
        realName: (extension && extension.realName) || null,
        extra: (extension && extension.extra) || {}
    };
    return player;
};
const mapSteamIDToPlayer = (players, teams, extensions) => (steamid) => parsePlayer(players[steamid], steamid, teams[players[steamid].team], extensions);
exports.mapSteamIDToPlayer = mapSteamIDToPlayer;
const parseTeam = (team, orientation, side, extension) => ({
    score: team.score,
    logo: (extension && extension.logo) || null,
    consecutive_round_losses: team.consecutive_round_losses,
    timeouts_remaining: team.timeouts_remaining,
    matches_won_this_series: (extension && extension.map_score) || team.matches_won_this_series,
    side,
    name: (extension && extension.name) || team.name || (side === 'CT' ? 'Counter-Terrorists' : 'Terrorists'),
    country: (extension && extension.country) || null,
    id: (extension && extension.id) || null,
    orientation,
    extra: (extension && extension.extra) || {}
});
exports.parseTeam = parseTeam;
const getHalfFromRound = (round, regulationMR, mr) => {
    let currentRoundHalf = 1;
    if (round <= 2 * regulationMR) {
        currentRoundHalf = round <= regulationMR ? 1 : 2;
    }
    else {
        const roundInOT = ((round - (2 * regulationMR + 1)) % (mr * 2)) + 1;
        currentRoundHalf = roundInOT <= mr ? 1 : 2;
    }
    return currentRoundHalf;
};
exports.getHalfFromRound = getHalfFromRound;
const didTeamWinThatRound = (team, round, wonBy, currentRound, regulationMR, mr) => {
    // czy round i currentRound są w tej samej połowie === (czy team jest === wonBy)
    const currentRoundHalf = (0, exports.getHalfFromRound)(currentRound, regulationMR, mr);
    const roundToCheckHalf = (0, exports.getHalfFromRound)(round, regulationMR, mr);
    return (team.side === wonBy) === (currentRoundHalf === roundToCheckHalf);
};
exports.didTeamWinThatRound = didTeamWinThatRound;
const parseGrenade = (grenade, id) => {
    if (grenade.type === 'inferno') {
        return {
            ...grenade,
            id,
            flames: Object.entries(grenade.flames).map(([id, position]) => ({
                id,
                position: position.split(', ').map(parseFloat)
            })),
            lifetime: parseFloat(grenade.lifetime)
        };
    }
    if (grenade.type === 'smoke' || grenade.type === 'decoy') {
        return {
            ...grenade,
            id,
            velocity: grenade.velocity.split(', ').map(parseFloat),
            position: grenade.position.split(', ').map(parseFloat),
            lifetime: parseFloat(grenade.lifetime),
            effecttime: parseFloat(grenade.effecttime)
        };
    }
    return {
        type: grenade.type,
        owner: grenade.owner,
        id,
        velocity: grenade.velocity.split(', ').map(parseFloat),
        position: grenade.position.split(', ').map(parseFloat),
        lifetime: parseFloat(grenade.lifetime)
    };
};
const parseGrenades = (grenades) => {
    if (!grenades)
        return [];
    return Object.entries(grenades).map(([id, grenade]) => parseGrenade(grenade, id));
};
exports.parseGrenades = parseGrenades;
const getRoundWin = (mapRound, teams, roundWins, round, regulationMR, overtimeMR) => {
    let indexRound = round;
    if (mapRound > 2 * regulationMR) {
        const maxOvertimeRounds = 2 * overtimeMR * Math.floor((mapRound - (2 * regulationMR + 1)) / (2 * overtimeMR)) + 2 * regulationMR;
        if (round <= maxOvertimeRounds) {
            return null;
        }
        const roundInOT = ((round - (2 * regulationMR + 1)) % (overtimeMR * 2)) + 1;
        indexRound = roundInOT;
    }
    const roundOutcome = roundWins[indexRound];
    if (!roundOutcome)
        return null;
    const winSide = roundOutcome.substr(0, roundOutcome.indexOf('_')).toUpperCase();
    const result = {
        team: teams.ct,
        round,
        side: winSide,
        outcome: roundOutcome
    };
    if ((0, exports.didTeamWinThatRound)(teams.ct, round, winSide, mapRound, regulationMR, overtimeMR)) {
        return result;
    }
    result.team = teams.t;
    return result;
};
exports.getRoundWin = getRoundWin;
