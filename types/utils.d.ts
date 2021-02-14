import { Team, PlayerExtension, Player, PlayersRaw, Side, Orientation, TeamExtension, TeamRaw } from '.';
export declare const mapSteamIDToPlayer: (
	players: PlayersRaw,
	teams: {
		CT: Team;
		T: Team;
	},
	extensions: PlayerExtension[]
) => (steamid: string, _i: number, steamids: string[]) => Player;
export declare const parseTeam: (
	team: TeamRaw,
	orientation: Orientation,
	side: Side,
	extension: TeamExtension | null
) => Team;
