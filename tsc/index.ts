import {
	CSGO,
	CSGORaw,
	Events,
	KillEvent,
	Observer,
	PlayerExtension,
	RawKill,
	Score,
	TeamExtension
} from './interfaces';
import { mapSteamIDToPlayer, parseTeam } from './utils.js';

type EventNames = keyof Events;
interface EventDescriptor {
	listener: Events[EventNames];
	once: boolean;
}
class CSGOGSI {
	private descriptors: Map<EventNames, EventDescriptor[]>;
	private maxListeners: number;
	teams: {
		left: TeamExtension | null;
		right: TeamExtension | null;
	};
	players: PlayerExtension[];
	last?: CSGO;
	constructor() {
		this.descriptors = new Map();
		this.teams = {
			left: null,
			right: null
		};
		this.maxListeners = 10;
		this.players = [];
	}
	eventNames = () => {
		const listeners = this.descriptors.entries();
		const nonEmptyEvents: EventNames[] = [];

		for (const entry of listeners) {
			if (entry[1] && entry[1].length > 0) {
				nonEmptyEvents.push(entry[0]);
			}
		}

		return nonEmptyEvents;
	};
	getMaxListeners = () => this.maxListeners;

	listenerCount = (eventName: EventNames) => {
		const listeners = this.listeners(eventName);
		return listeners.length;
	};

	listeners = (eventName: EventNames) => {
		const descriptors = this.descriptors.get(eventName) || [];
		return descriptors.map(descriptor => descriptor.listener);
	};

	removeListener = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		return this.off(eventName, listener);
	};

	off = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		const descriptors = this.descriptors.get(eventName) || [];

		this.descriptors.set(
			eventName,
			descriptors.filter(descriptor => descriptor.listener !== listener)
		);
		this.emit('removeListener', eventName, listener);
		return this;
	};

	addListener = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		return this.on(eventName, listener);
	};

	on = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		this.emit('newListener', eventName, listener);
		const listOfListeners = [...(this.descriptors.get(eventName) || [])];

		listOfListeners.push({ listener, once: false });
		this.descriptors.set(eventName, listOfListeners);

		return this;
	};

	once = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		const listOfListeners = [...(this.descriptors.get(eventName) || [])];

		listOfListeners.push({ listener, once: true });
		this.descriptors.set(eventName, listOfListeners);

		return this;
	};

	prependListener = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		const listOfListeners = [...(this.descriptors.get(eventName) || [])];

		listOfListeners.unshift({ listener, once: false });
		this.descriptors.set(eventName, listOfListeners);

		return this;
	};

	emit = (eventName: EventNames, arg?: any, arg2?: any) => {
		const listeners = this.descriptors.get(eventName);
		if (!listeners || listeners.length === 0) return false;

		listeners.forEach(listener => {
			if (listener.once) {
				this.descriptors.set(
					eventName,
					listeners.filter(listenerInArray => listenerInArray !== listener)
				);
			}
			listener.listener(arg, arg2);
		});
		return true;
	};

	prependOnceListener = <K extends EventNames>(eventName: K, listener: Events[K]) => {
		const listOfListeners = [...(this.descriptors.get(eventName) || [])];

		listOfListeners.unshift({ listener, once: true });
		this.descriptors.set(eventName, listOfListeners);

		return this;
	};

	removeAllListeners = (eventName: EventNames) => {
		this.descriptors.set(eventName, []);
		return this;
	};

	setMaxListeners = (n: number) => {
		this.maxListeners = n;
		return this;
	};

	rawListeners = (eventName: EventNames) => {
		return this.descriptors.get(eventName) || [];
	};

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

		const observer: Observer = {
			activity: raw.player.activity,
			spectarget: raw.player.spectarget,
			position: raw.player.position.split(', ').map(n => Number(n)),
			forward: raw.player.forward.split(', ').map(n => Number(n))
		};

		const data: CSGO = {
			provider: raw.provider,
			observer,
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
								? CSGOGSI.findSite(
										raw.map.name,
										bomb.position.split(', ').map(n => Number(n))
								  )
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
			this.emit('data', data);
			return data;
		}
		const last = this.last;

		// Round end
		if (last.round && data.round && data.round.win_team && !last.round.win_team) {
			const winner = data.round.win_team === 'CT' ? data.map.team_ct : data.map.team_t;
			const loser = data.round.win_team === 'CT' ? data.map.team_t : data.map.team_ct;

			const oldWinner = data.round.win_team === 'CT' ? last.map.team_ct : last.map.team_t;

			if (winner.score === oldWinner.score) {
				winner.score += 1;
			}

			const roundScore: Score = {
				winner,
				loser,
				map: data.map,
				mapEnd: data.map.phase === 'gameover'
			};
			this.emit('roundEnd', roundScore);

			// Match end
			if (roundScore.mapEnd && last.map.phase !== 'gameover') {
				this.emit('matchEnd', roundScore);
			}
		}

		//Bomb actions
		if (last.bomb && data.bomb) {
			if (last.bomb.state === 'planting' && data.bomb.state === 'planted') {
				this.emit('bombPlant', last.bomb.player);
			} else if (last.bomb.state !== 'exploded' && data.bomb.state === 'exploded') {
				this.emit('bombExplode');
			} else if (last.bomb.state !== 'defused' && data.bomb.state === 'defused') {
				this.emit('bombDefuse', last.bomb.player);
			} else if (last.bomb.state !== 'defusing' && data.bomb.state === 'defusing') {
				this.emit('defuseStart', data.bomb.player);
			} else if (last.bomb.state === 'defusing' && data.bomb.state !== 'defusing') {
				this.emit('defuseStop', last.bomb.player);
			} else if (last.bomb.state !== 'planting' && data.bomb.state === 'planting') {
				this.emit('bombPlantStart', last.bomb.player);
			}
		}

		// Intermission (between halfs)
		if (data.map.phase === 'intermission' && last.map.phase !== 'intermission') {
			this.emit('intermissionStart');
		} else if (data.map.phase !== 'intermission' && last.map.phase === 'intermission') {
			this.emit('intermissionEnd');
		}

		const { phase } = data.phase_countdowns;

		// Freezetime (between round end & start)
		if (phase === 'freezetime' && last.phase_countdowns.phase !== 'freezetime') {
			this.emit('freezetimeStart');
		} else if (phase !== 'freezetime' && last.phase_countdowns.phase === 'freezetime') {
			this.emit('freezetimeEnd');
		}

		// Timeouts
		if (phase && last.phase_countdowns.phase) {
			if (phase.startsWith('timeout') && !last.phase_countdowns.phase.startsWith('timeout')) {
				const team = phase === 'timeout_ct' ? teamCT : teamT;

				this.emit('timeoutStart', team);
			} else if (last.phase_countdowns.phase.startsWith('timeout') && !phase.startsWith('timeout')) {
				this.emit('timeoutEnd');
			}
		}

		const mvp =
			data.players.find(player => {
				const previousData = last.players.find(previousPlayer => previousPlayer.steamid === player.steamid);
				if (!previousData) return false;
				if (player.stats.mvps > previousData.stats.mvps) return true;
				return false;
			}) || null;

		if (mvp) {
			this.emit('mvp', mvp);
		}
		this.emit('data', data);
		this.last = data;
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
		this.emit('kill', kill);
		return kill;
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

export { CSGOGSI, mapSteamIDToPlayer, parseTeam };

export {
	CSGO,
	CSGORaw,
	Side,
	RoundOutcome,
	WeaponType,
	Observer,
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
