import { CSGO, CSGORaw, Events, KillEvent, PlayerExtension, RawKill, Score, TeamExtension } from './interfaces';
import { mapSteamIDToPlayer, parseTeam } from './utils';

export default class CSGOGSI {
	listeners: Map<keyof Events, Events[keyof Events][]>;
	teams: {
		left: TeamExtension | null;
		right: TeamExtension | null;
	};
	players: PlayerExtension[];
	last?: CSGO;
	constructor() {
		this.listeners = new Map();
		this.teams = {
			left: null,
			right: null
		};
		this.players = [];
	}

	digest(raw: CSGORaw): CSGO | null {
		if (!raw.allplayers || !raw.map || !raw.phase_countdowns) {
			return null;
		}

		const isCTLeft =
			Object.values(raw.allplayers).filter(
				({ observer_slot, team }) =>
					observer_slot !== undefined && observer_slot > 1 && observer_slot <= 5 && team === 'CT'
			).length > 2;

		const bomb = raw.bomb;

		const teamCT = parseTeam(
			raw.map.team_ct,
			isCTLeft ? 'left' : 'right',
			'CT',
			isCTLeft ? this.teams.left : this.teams.right
		);
		const teamT = parseTeam(
			raw.map.team_t,
			isCTLeft ? 'right' : 'left',
			'T',
			isCTLeft ? this.teams.right : this.teams.left
		);

		const playerMapper = mapSteamIDToPlayer(raw.allplayers, { CT: teamCT, T: teamT }, this.players);

		const players = Object.keys(raw.allplayers).map(playerMapper);
		const observed = players.find(player => player.steamid === raw.player.steamid) || null;

		const data: CSGO = {
			provider: raw.provider,
			round: raw.round
				? {
						phase: raw.round.phase,
						bomb: raw.round.bomb,
						win_team: raw.round.win_team
				  }
				: null,
			player: observed,
			players: players,
			bomb: bomb
				? {
						state: bomb.state,
						countdown: bomb.countdown,
						position: bomb.position,
						player: players.find(player => player.steamid === bomb.player) || undefined,
						site:
							bomb.state === 'planted' ||
							bomb.state === 'defused' ||
							bomb.state === 'defusing' ||
							bomb.state === 'planting'
								? CSGOGSI.findSite(raw.map.name, bomb.position.split(', ').map(Number))
								: null
				  }
				: null,
			grenades: raw.grenades,
			phase_countdowns: raw.phase_countdowns,
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
				round_wins: raw.map.round_wins
			}
		};
		if (!this.last) {
			this.last = data;
			this.execute('data', data);
			return data;
		}
		const last = this.last;

		// Round end
		const didCTScoreChanged = last.map.team_ct.score !== data.map.team_ct.score;
		const didTScoreChanged = last.map.team_t.score !== data.map.team_t.score;
		if (didCTScoreChanged !== didTScoreChanged) {
			const winner = didCTScoreChanged ? data.map.team_ct : data.map.team_t;
			const loser = didCTScoreChanged ? data.map.team_t : data.map.team_ct;

			const roundScore: Score = {
				winner,
				loser,
				map: data.map,
				mapEnd: false
			};
			this.execute('roundEnd', roundScore);
		}
		//Bomb actions
		if (last.bomb && data.bomb) {
			if (last.bomb.state === 'planting' && data.bomb.state === 'planted') {
				this.execute('bombPlant', last.bomb.player);
			} else if (last.bomb.state !== 'exploded' && data.bomb.state === 'exploded') {
				this.execute('bombExplode');
			} else if (last.bomb.state !== 'defused' && data.bomb.state === 'defused') {
				this.execute('bombDefuse', last.bomb.player);
			} else if (last.bomb.state !== 'defusing' && data.bomb.state === 'defusing') {
				this.execute('defuseStart', data.bomb.player);
			} else if (last.bomb.state === 'defusing' && data.bomb.state !== 'defusing') {
				this.execute('defuseStop', last.bomb.player);
			} else if (last.bomb.state !== 'planting' && data.bomb.state === 'planting') {
				this.execute('bombPlantStart', last.bomb.player);
			}
		}

		if (data.map.phase === 'intermission' && last.map.phase !== 'intermission') {
			this.execute('intermissionStart');
		} else if (data.map.phase !== 'intermission' && last.map.phase === 'intermission') {
			this.execute('intermissionEnd');
		}

		const { phase } = data.phase_countdowns;

		if (phase === 'freezetime' && last.phase_countdowns.phase !== 'freezetime') {
			this.execute('freezetimeStart');
		} else if (phase !== 'freezetime' && last.phase_countdowns.phase === 'freezetime') {
			this.execute('freezetimeEnd');
		}

		if (phase && last.phase_countdowns.phase) {
			if (phase.startsWith('timeout') && !last.phase_countdowns.phase.startsWith('timeout')) {
				const team = phase === 'timeout_ct' ? teamCT : teamT;

				this.execute('timeoutStart', team);
			} else if (last.phase_countdowns.phase.startsWith('timeout') && !phase.startsWith('timeout')) {
				this.execute('timeoutEnd');
			}
		}

		// Match end
		if (data.map.phase === 'gameover' && last.map.phase !== 'gameover') {
			const winner = data.map.team_ct.score > data.map.team_t.score ? data.map.team_ct : data.map.team_t;
			const loser = data.map.team_ct.score > data.map.team_t.score ? data.map.team_t : data.map.team_ct;

			const final: Score = {
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

	digestMIRV(raw: RawKill) {
		if (!this.last) {
			return null;
		}
		const data = raw.keys;
		const killer = this.last.players.find(player => player.steamid === data.attacker.xuid);
		const victim = this.last.players.find(player => player.steamid === data.userid.xuid);
		const assister = this.last.players.find(
			player => player.steamid === data.assister.xuid && data.assister.xuid !== '0'
		);
		if (!killer || !victim) {
			return null;
		}
		const kill: KillEvent = {
			killer,
			victim,
			assister: assister || null,
			flashed: data.assistedflash,
			headshot: data.headshot,
			weapon: data.weapon,
			wallbang: data.penetrated > 0,
			attackerblind: data.attackerblind,
			thrusmoke: data.thrusmoke,
			noscope: data.noscope
		};
		this.execute('kill', kill);
		return kill;
	}

	on<K extends keyof Events>(eventName: K, listener: Events[K]) {
		const listOfListeners = this.listeners.get(eventName) || [];

		listOfListeners.push(listener);
		this.listeners.set(eventName, listOfListeners);

		return true;
	}
	removeListener<K extends keyof Events>(eventName: K, listener: Events[K]) {
		const listOfListeners = this.listeners.get(eventName) || [];
		this.listeners.set(
			eventName,
			listOfListeners.filter(callback => callback !== listener)
		);
		return true;
	}
	removeListeners<K extends keyof Events>(eventName: K) {
		this.listeners.set(eventName, []);
		return true;
	}

	private execute<K extends keyof Events>(eventName: K, argument?: any) {
		const listeners = this.listeners.get(eventName);
		if (!listeners) return false;
		listeners.forEach(callback => {
			callback(argument);
		});
		return true;
	}

	static findSite(mapName: string, position: number[]) {
		const mapReference: { [mapName: string]: (position: number[]) => 'A' | 'B' } = {
			de_mirage: position => (position[1] < -600 ? 'A' : 'B'),
			de_cache: position => (position[1] > 0 ? 'A' : 'B'),
			de_overpass: position => (position[2] > 400 ? 'A' : 'B'),
			de_nuke: position => (position[2] > -500 ? 'A' : 'B'),
			de_dust2: position => (position[0] > -500 ? 'A' : 'B'),
			de_inferno: position => (position[0] > 1400 ? 'A' : 'B'),
			de_vertigo: position => (position[0] > -1400 ? 'A' : 'B'),
			de_train: position => (position[1] > -450 ? 'A' : 'B')
		};
		if (mapName in mapReference) {
			return mapReference[mapName](position);
		}
		return null;
	}
}

export {
	CSGO,
	CSGORaw,
	Side,
	RoundOutcome,
	WeaponType,
	WeaponRaw,
	TeamRaw,
	PlayerRaw,
	PlayerObservedRaw,
	PlayersRaw,
	Provider,
	MapRaw,
	RoundRaw,
	BombRaw,
	PhaseRaw,
	Events,
	Team,
	Player,
	Bomb,
	Map,
	Round,
	Score,
	KillEvent,
	RawKill,
	TeamExtension,
	PlayerExtension,
	Orientation
} from './interfaces';
