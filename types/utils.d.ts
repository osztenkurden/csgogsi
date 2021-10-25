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
export declare const getRoundWin: (
	mapRound: number,
	teams: {
		ct: Team;
		t: Team;
	},
	roundWins: RoundWins,
	round: number,
	mr: number
) => RoundInfo | null;
