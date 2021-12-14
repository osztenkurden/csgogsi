import {
	PlayerRaw,
	Team,
	PlayerExtension,
	Player,
	PlayersRaw,
	Side,
	Orientation,
	TeamExtension,
	TeamRaw,
	RoundInfo,
	RoundWins
} from '.';

const parsePlayer = (basePlayer: PlayerRaw, steamid: string, team: Team, extensions: PlayerExtension[]) => {
	const extension = extensions.find(player => player.steamid === steamid);
	const player: Player = {
		steamid,
		name: (extension && extension.name) || basePlayer.name,
		defaultName: basePlayer.name,
		clan: basePlayer.clan,
		observer_slot: basePlayer.observer_slot,
		stats: basePlayer.match_stats,
		weapons: basePlayer.weapons,
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

export const mapSteamIDToPlayer = (
	players: PlayersRaw,
	teams: { CT: Team; T: Team },
	extensions: PlayerExtension[]
) => (steamid: string) => parsePlayer(players[steamid], steamid, teams[players[steamid].team], extensions);

export const parseTeam = (
	team: TeamRaw,
	orientation: Orientation,
	side: Side,
	extension: TeamExtension | null
): Team => ({
	score: team.score,
	logo: (extension && extension.logo) || null,
	consecutive_round_losses: team.consecutive_round_losses,
	timeouts_remaining: team.timeouts_remaining,
	matches_won_this_series: (extension && extension.map_score) || team.matches_won_this_series,
	side,
	name: (extension && extension.name) || (side === 'CT' ? 'Counter-Terrorists' : 'Terrorists'),
	country: (extension && extension.country) || null,
	id: (extension && extension.id) || null,
	orientation,
	extra: (extension && extension.extra) || {}
});

export const getHalfFromRound = (round: number, mr: number) => {
	let currentRoundHalf = 1;
	if (round <= 30) {
		currentRoundHalf = round <= 15 ? 1 : 2;
	} else {
		const roundInOT = ((round - 31) % (mr * 2)) + 1;
		currentRoundHalf = roundInOT <= mr ? 1 : 2;
	}
	return currentRoundHalf;
};

export const didTeamWinThatRound = (team: Team, round: number, wonBy: Side, currentRound: number, mr: number) => {
	// czy round i currentRound są w tej samej połowie === (czy team jest === wonBy)
	const currentRoundHalf = getHalfFromRound(currentRound, mr);
	const roundToCheckHalf = getHalfFromRound(round, mr);

	return (team.side === wonBy) === (currentRoundHalf === roundToCheckHalf);
};

export const getRoundWin = (
	mapRound: number,
	teams: { ct: Team; t: Team },
	roundWins: RoundWins,
	round: number,
	mr: number
) => {
	let indexRound = round;
	if (mapRound > 30) {
		const maxOvertimeRounds = 6 * Math.floor((mapRound - 31) / 6) + 30;
		if (round <= maxOvertimeRounds) {
			return null;
		}
		const roundInOT = ((round - 31) % (mr * 2)) + 1;
		indexRound = roundInOT;
	}
	const roundOutcome = roundWins[indexRound];
	if (!roundOutcome) return null;

	const winSide = roundOutcome.substr(0, roundOutcome.indexOf('_')).toUpperCase() as Side;

	const result: RoundInfo = {
		team: teams.ct,
		round,
		side: winSide,
		outcome: roundOutcome
	};

	if (didTeamWinThatRound(teams.ct, round, winSide, mapRound, mr)) {
		return result;
	}

	result.team = teams.t;

	return result;
};
