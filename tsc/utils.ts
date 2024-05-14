import type {
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
import type { GrenadeRaw } from './csgo';
import type { Grenade } from './parsed';

const parsePlayer = (basePlayer: PlayerRaw, steamid: string, team: Team, extensions: PlayerExtension[]) => {
	const extension = extensions.find(player => player.steamid === steamid);
	const player: Player = {
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

export const mapSteamIDToPlayer =
	(players: PlayersRaw, teams: { CT: Team; T: Team }, extensions: PlayerExtension[]) => (steamid: string) =>
		parsePlayer(players[steamid]!, steamid, teams[players[steamid]!.team], extensions);

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
	name: (extension && extension.name) || team.name || (side === 'CT' ? 'Counter-Terrorists' : 'Terrorists'),
	country: (extension && extension.country) || null,
	id: (extension && extension.id) || null,
	orientation,
	extra: (extension && extension.extra) || {}
});

export const getHalfFromRound = (round: number, regulationMR: number, mr: number) => {
	let currentRoundHalf = 1;
	if (round <= 2 * regulationMR) {
		currentRoundHalf = round <= regulationMR ? 1 : 2;
	} else {
		const roundInOT = ((round - (2 * regulationMR + 1)) % (mr * 2)) + 1;
		currentRoundHalf = roundInOT <= mr ? 1 : 2;
	}
	return currentRoundHalf;
};

export const didTeamWinThatRound = (
	team: Team,
	round: number,
	wonBy: Side,
	currentRound: number,
	regulationMR: number,
	mr: number
) => {
	// czy round i currentRound są w tej samej połowie === (czy team jest === wonBy)
	const currentRoundHalf = getHalfFromRound(currentRound, regulationMR, mr);
	const roundToCheckHalf = getHalfFromRound(round, regulationMR, mr);

	return (team.side === wonBy) === (currentRoundHalf === roundToCheckHalf);
};

const parseGrenade = (grenade: GrenadeRaw, id: string): Grenade => {
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

export const parseGrenades = (grenades?: { [key: string]: GrenadeRaw }): Grenade[] => {
	if (!grenades) return [];

	return Object.entries(grenades).map(([id, grenade]) => parseGrenade(grenade, id));
};

export const getRoundWin = (
	mapRound: number,
	teams: { ct: Team; t: Team },
	roundWins: RoundWins,
	round: number,
	regulationMR: number,
	overtimeMR: number
) => {
	let indexRound = round;
	if (mapRound > 2 * regulationMR) {
		const maxOvertimeRounds =
			2 * overtimeMR * Math.floor((mapRound - (2 * regulationMR + 1)) / (2 * overtimeMR)) + 2 * regulationMR;
		if (round <= maxOvertimeRounds) {
			return null;
		}
		const roundInOT = ((round - (2 * regulationMR + 1)) % (overtimeMR * 2)) + 1;
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

	if (didTeamWinThatRound(teams.ct, round, winSide, mapRound, regulationMR, overtimeMR)) {
		return result;
	}

	result.team = teams.t;

	return result;
};
