import {
	CSGO,
	CSGORaw,
	Events,
	KillEvent,
	Player,
	PlayerExtension,
	PlayerRaw,
	PlayersRaw,
	RawKill,
	Score,
	Team,
	TeamExtension
} from './interfaces';

export default class CSGOGSI {
	listeners: Map<keyof Events, Events[keyof Events][]>;
	teams: {
		left?: TeamExtension;
		right?: TeamExtension;
	};
	players: PlayerExtension[];
	last?: CSGO;
	constructor() {
		this.listeners = new Map();
		this.teams = {};
		this.players = [];
		/*this.on('data', _data => {
		});*/
	}

	digest(raw: CSGORaw): CSGO | null {
		if (!raw.allplayers || !raw.map || !raw.phase_countdowns) {
			return null;
		}

		const ctOnLeft =
			Object.values(raw.allplayers).filter(
				({ observer_slot, team }) =>
					observer_slot !== undefined && observer_slot > 1 && observer_slot <= 5 && team === 'CT'
			).length > 2;
		let ctExtension = null,
			tExtension = null;
		if (this.teams.left) {
			if (ctOnLeft) ctExtension = this.teams.left;
			else tExtension = this.teams.left;
		}
		if (this.teams.right) {
			if (ctOnLeft) tExtension = this.teams.right;
			else ctExtension = this.teams.right;
		}
		const bomb = raw.bomb;
		const teams = [raw.map.team_ct, raw.map.team_t];
		const teamCT: Team = {
			score: teams[0].score,
			logo: (ctExtension && ctExtension.logo) || null,
			consecutive_round_losses: teams[0].consecutive_round_losses,
			timeouts_remaining: teams[0].timeouts_remaining,
			matches_won_this_series: (ctExtension && ctExtension.map_score) || teams[0].matches_won_this_series,
			side: 'CT',
			name: (ctExtension && ctExtension.name) || 'Counter-Terrorists',
			country: (ctExtension && ctExtension.country) || null,
			id: (ctExtension && ctExtension.id) || null,
			orientation: ctOnLeft ? 'left' : 'right',
			extra: (ctExtension && ctExtension.extra) || {}
		};
		const teamT: Team = {
			score: teams[1].score,
			logo: (tExtension && tExtension.logo) || null,
			consecutive_round_losses: teams[1].consecutive_round_losses,
			timeouts_remaining: teams[1].timeouts_remaining,
			matches_won_this_series: (tExtension && tExtension.map_score) || teams[1].matches_won_this_series,
			side: 'T',
			name: (tExtension && tExtension.name) || 'Terrorists',
			country: (tExtension && tExtension.country) || null,
			id: (tExtension && tExtension.id) || null,
			orientation: !ctOnLeft ? 'left' : 'right',
			extra: (tExtension && tExtension.extra) || {}
		};

		const players = this.parsePlayers(raw.allplayers, [teamCT, teamT]);
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
								? this.findSite(raw.map.name, bomb.position.split(', ').map(Number))
								: null
				  }
				: null,
			grenades: raw.grenades,
			phase_countdowns: raw.phase_countdowns,
			auth: raw.auth,
			map: {
				mode: 'competitive',
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

	digestMIRV(raw: RawKill): KillEvent | null {
		if (!this.last) {
			return null;
		}
		const data = raw.keys;
		const killer = this.last.players.filter(player => player.steamid === data.attacker.xuid)[0];
		const victim = this.last.players.filter(player => player.steamid === data.userid.xuid)[0];
		const assister = this.last.players.filter(
			player => player.steamid === data.assister.xuid && data.assister.xuid !== '0'
		)[0];
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

	parsePlayers(players: PlayersRaw, teams: [Team, Team]) {
		const parsed: Player[] = [];
		Object.keys(players).forEach(steamid => {
			//const team:
			parsed.push(
				this.parsePlayer(players[steamid], steamid, players[steamid].team === 'CT' ? teams[0] : teams[1])
			);
		});
		return parsed;
	}

	parsePlayer(oldPlayer: PlayerRaw, steamid: string, team: Team) {
		const extension = this.players.filter(player => player.steamid === steamid)[0];
		const player: Player = {
			steamid,
			name: (extension && extension.name) || oldPlayer.name,
			observer_slot: oldPlayer.observer_slot,
			activity: oldPlayer.activity,
			stats: oldPlayer.match_stats,
			weapons: oldPlayer.weapons,
			state: { ...oldPlayer.state, smoked: oldPlayer.state.smoked || 0 },
			spectarget: oldPlayer.spectarget,
			position: oldPlayer.position.split(', ').map(pos => Number(pos)),
			forward: oldPlayer.forward.split(', ').map(pos => Number(pos)),
			team,
			avatar: (extension && extension.avatar) || null,
			country: (extension && extension.country) || null,
			realName: (extension && extension.realName) || null,
			extra: (extension && extension.extra) || null
		};

		return player;
	}

	execute<K extends keyof Events>(eventName: K, argument?: any) {
		const listeners = this.listeners.get(eventName);
		if (!listeners) return false;
		listeners.forEach(callback => {
			callback(argument);
		});
		return true;
	}

	on<K extends keyof Events>(eventName: K, listener: Events[K]) {
		const listOfListeners = this.listeners.get(eventName) || [];

		listOfListeners.push(listener);
		this.listeners.set(eventName, listOfListeners);

		return true;
	}
	removeListener<K extends keyof Events>(eventName: K, listener: Function) {
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
	findSite(mapName: string, position: number[]) {
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
	PlayerExtension
} from './interfaces';
