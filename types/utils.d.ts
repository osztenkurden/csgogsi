import {
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
export declare const mapSteamIDToPlayer: (
	players: PlayersRaw,
	teams: {
		CT: Team;
		T: Team;
	},
	extensions: PlayerExtension[]
) => (steamid: string) => Player;
export declare const parseTeam: (
	team: TeamRaw,
	orientation: Orientation,
	side: Side,
	extension: TeamExtension | null
) => Team;
export declare const getHalfFromRound: (round: number, regulationMR: number, mr: number) => number;
export declare const didTeamWinThatRound: (
	team: Team,
	round: number,
	wonBy: Side,
	currentRound: number,
	regulationMR: number,
	mr: number
) => boolean;
export declare const getRoundWin: (
	mapRound: number,
	teams: {
		ct: Team;
		t: Team;
	},
	roundWins: RoundWins,
	round: number,
	regulationMR: number,
	overtimeMR: number
) => RoundInfo | null;
