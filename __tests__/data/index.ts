import { CSGORaw, RawKill } from '../../tsc';
import { O } from 'ts-toolbelt';
import merge from 'lodash.merge';

type OptionalCSGORaw = O.Optional<CSGORaw, keyof CSGORaw, 'deep'>;
type OptionalKillRaw = O.Optional<RawKill, keyof RawKill, 'deep'>;

export const createGSIPacket = (options: OptionalCSGORaw = {}, mutate?: (CSGO: CSGORaw) => CSGORaw) => {
	const base: CSGORaw = {
		provider: {
			name: 'Counter-Strike: Global Offensive',
			appid: 730,
			version: 13761,
			steamid: '76561199031036917',
			timestamp: 1596015818
		},
		map: {
			mode: 'competitive',
			name: 'workshop/2126169449/de_mirage',
			phase: 'live',
			round: 9,
			team_ct: {
				score: 4,
				consecutive_round_losses: 2,
				timeouts_remaining: 1,
				matches_won_this_series: 0
			},
			team_t: {
				score: 5,
				consecutive_round_losses: 2,
				timeouts_remaining: 1,
				matches_won_this_series: 0
			},
			num_matches_to_win_series: 0,
			current_spectators: 0,
			souvenirs_total: 0,
			round_wins: {
				'1': 'ct_win_elimination',
				'2': 'ct_win_elimination',
				'3': 't_win_bomb',
				'4': 't_win_elimination',
				'5': 't_win_bomb',
				'6': 't_win_elimination',
				'7': 't_win_bomb',
				'8': 'ct_win_elimination',
				'9': 'ct_win_elimination'
			}
		},
		round: {
			phase: 'live'
		},
		player: {
			steamid: '76561198895440632',
			clan: 'LETUCHIY',
			name: 'Epistaxis',
			observer_slot: 0,
			team: 'T',
			activity: 'playing',
			state: {
				health: 100,
				armor: 100,
				helmet: true,
				flashed: 0,
				smoked: 0,
				burning: 0,
				money: 2650,
				round_kills: 2,
				round_killhs: 1,
				round_totaldmg: 121,
				equip_value: 4400
			},
			spectarget: '76561198895440632',
			position: '-243.02, -2167.67, -171.24',
			forward: '-0.43, 0.90, -0.03'
		},
		allplayers: {
			'76561199031036917': {
				name: 'Muminek',
				observer_slot: 1,
				team: 'CT',
				state: {
					health: 39,
					armor: 85,
					helmet: true,
					defusekit: true,
					flashed: 0,
					burning: 0,
					money: 3350,
					round_kills: 2,
					round_killhs: 2,
					round_totaldmg: 173,
					equip_value: 5700
				},
				match_stats: {
					kills: 11,
					assists: 2,
					deaths: 6,
					mvps: 3,
					score: 24
				},
				weapons: {
					weapon_0: {
						name: 'weapon_knife',
						paintkit: 'default',
						type: 'Knife',
						state: 'holstered'
					},
					weapon_1: {
						name: 'weapon_usp_silencer',
						paintkit: 'default',
						type: 'Pistol',
						ammo_clip: 12,
						ammo_clip_max: 12,
						ammo_reserve: 23,
						state: 'holstered'
					},
					weapon_2: {
						name: 'weapon_m4a1_silencer',
						paintkit: 'default',
						type: 'Rifle',
						ammo_clip: 25,
						ammo_clip_max: 25,
						ammo_reserve: 54,
						state: 'active'
					},
					weapon_3: {
						name: 'weapon_hegrenade',
						paintkit: 'default',
						type: 'Grenade',
						ammo_reserve: 1,
						state: 'holstered'
					},
					weapon_4: {
						name: 'weapon_flashbang',
						paintkit: 'default',
						type: 'Grenade',
						ammo_reserve: 2,
						state: 'holstered'
					}
				},
				position: '611.26, -1523.23, -263.97',
				forward: '-0.98, -0.16, 0.13'
			},
			'76561198238326438': {
				clan: 'Hentai!･',
				name: 'Malina',
				observer_slot: 6,
				team: 'T',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 1050,
					round_kills: 0,
					round_killhs: 0,
					round_totaldmg: 26,
					equip_value: 5400
				},
				match_stats: {
					kills: 14,
					assists: 0,
					deaths: 7,
					mvps: 2,
					score: 29
				},
				weapons: {},
				position: '94.10, -2294.70, -39.97',
				forward: '-0.40, 0.92, -0.03'
			},
			'76561199049962334': {
				name: 'Pesukarhu',
				observer_slot: 2,
				team: 'CT',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 3850,
					round_kills: 0,
					round_killhs: 0,
					round_totaldmg: 22,
					equip_value: 6000
				},
				match_stats: {
					kills: 8,
					assists: 1,
					deaths: 8,
					mvps: 1,
					score: 17
				},
				weapons: {},
				position: '-974.50, 127.35, -367.97',
				forward: '0.47, -0.88, -0.02'
			},
			'76561198957882448': {
				clan: "I'm luck",
				name: '♧♛𝐋𝔼Ǻ𝕄♛♧',
				observer_slot: 7,
				team: 'T',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 150,
					round_kills: 0,
					round_killhs: 0,
					round_totaldmg: 0,
					equip_value: 3800
				},
				match_stats: {
					kills: 3,
					assists: 1,
					deaths: 7,
					mvps: 1,
					score: 11
				},
				weapons: {},
				position: '-961.45, -758.15, -263.97',
				forward: '-0.40, 0.92, -0.03'
			},
			'76561198981246981': {
				name: "♥Pleakly'a♥",
				observer_slot: 3,
				team: 'CT',
				state: {
					health: 98,
					armor: 100,
					helmet: true,
					defusekit: true,
					flashed: 0,
					burning: 0,
					money: 5050,
					round_kills: 0,
					round_killhs: 0,
					round_totaldmg: 0,
					equip_value: 5200
				},
				match_stats: {
					kills: 4,
					assists: 2,
					deaths: 7,
					mvps: 0,
					score: 10
				},
				weapons: {
					weapon_0: {
						name: 'weapon_knife',
						paintkit: 'default',
						type: 'Knife',
						state: 'holstered'
					},
					weapon_1: {
						name: 'weapon_hkp2000',
						paintkit: 'default',
						type: 'Pistol',
						ammo_clip: 13,
						ammo_clip_max: 13,
						ammo_reserve: 52,
						state: 'holstered'
					},
					weapon_2: {
						name: 'weapon_ak47',
						paintkit: 'cu_ak47_mastery',
						type: 'Rifle',
						ammo_clip: 30,
						ammo_clip_max: 30,
						ammo_reserve: 90,
						state: 'active'
					},
					weapon_3: {
						name: 'weapon_incgrenade',
						paintkit: 'default',
						type: 'Grenade',
						ammo_reserve: 1,
						state: 'holstered'
					},
					weapon_4: {
						name: 'weapon_hegrenade',
						paintkit: 'default',
						type: 'Grenade',
						ammo_reserve: 1,
						state: 'holstered'
					}
				},
				position: '-710.11, -1366.65, -167.97',
				forward: '0.46, -0.89, -0.02'
			},
			'76561199009937732': {
				name: 'mONESY',
				observer_slot: 8,
				team: 'T',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 450,
					round_kills: 1,
					round_killhs: 1,
					round_totaldmg: 161,
					equip_value: 4850
				},
				match_stats: {
					kills: 7,
					assists: 0,
					deaths: 8,
					mvps: 0,
					score: 15
				},
				weapons: {},
				position: '-716.91, -788.97, -263.97',
				forward: '-0.40, 0.92, -0.03'
			},
			'76561198913793779': {
				clan: 'DMITR1VPEEK',
				name: '☁ dmitr1v',
				observer_slot: 9,
				team: 'T',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 5250,
					round_kills: 0,
					round_killhs: 0,
					round_totaldmg: 53,
					equip_value: 5100
				},
				match_stats: {
					kills: 2,
					assists: 2,
					deaths: 6,
					mvps: 2,
					score: 15
				},
				weapons: {},
				position: '-158.88, -1613.92, -167.97',
				forward: '-0.77, 0.63, -0.03'
			},
			'76561198895440632': {
				clan: 'LETUCHIY',
				name: 'Epistaxis',
				observer_slot: 0,
				team: 'T',
				state: {
					health: 100,
					armor: 100,
					helmet: true,
					flashed: 0,
					burning: 0,
					money: 2650,
					round_kills: 2,
					round_killhs: 1,
					round_totaldmg: 121,
					equip_value: 4400
				},
				match_stats: {
					kills: 7,
					assists: 1,
					deaths: 6,
					mvps: 0,
					score: 19
				},
				weapons: {
					weapon_0: {
						name: 'weapon_knife_t',
						paintkit: 'default',
						type: 'Knife',
						state: 'holstered'
					},
					weapon_1: {
						name: 'weapon_glock',
						paintkit: 'aq_glock18_flames_blue',
						type: 'Pistol',
						ammo_clip: 20,
						ammo_clip_max: 20,
						ammo_reserve: 120,
						state: 'holstered'
					},
					weapon_2: {
						name: 'weapon_ak47',
						paintkit: 'cu_ak47_mastery',
						type: 'Rifle',
						ammo_clip: 30,
						ammo_clip_max: 30,
						ammo_reserve: 67,
						state: 'holstered'
					},
					weapon_3: {
						name: 'weapon_hegrenade',
						paintkit: 'default',
						type: 'Grenade',
						ammo_reserve: 1,
						state: 'holstered'
					},
					weapon_4: {
						name: 'weapon_c4',
						paintkit: 'default',
						type: 'C4',
						state: 'active'
					},
					weapon_5: {
						name: 'weapon_taser',
						paintkit: 'default',
						ammo_clip: 1,
						ammo_clip_max: 1,
						ammo_reserve: 0,
						state: 'holstered'
					}
				},
				position: '-243.02, -2167.67, -171.24',
				forward: '-0.43, 0.90, -0.03'
			},
			'76561198983814358': {
				name: 'mic yok',
				observer_slot: 4,
				team: 'CT',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 6500,
					round_kills: 1,
					round_killhs: 0,
					round_totaldmg: 100,
					equip_value: 7750
				},
				match_stats: {
					kills: 6,
					assists: 0,
					deaths: 6,
					mvps: 0,
					score: 12
				},
				weapons: {},
				position: '-494.78, -1549.67, -39.97',
				forward: '0.46, -0.89, -0.02'
			},
			'76561198878695406': {
				name: '0shi ♡',
				observer_slot: 5,
				team: 'CT',
				state: {
					health: 0,
					armor: 0,
					helmet: false,
					flashed: 0,
					burning: 0,
					money: 2800,
					round_kills: 1,
					round_killhs: 0,
					round_totaldmg: 100,
					equip_value: 5800
				},
				match_stats: {
					kills: 4,
					assists: 1,
					deaths: 7,
					mvps: 0,
					score: 9
				},
				weapons: {},
				position: '-114.03, -2224.50, -167.97',
				forward: '-0.97, -0.22, 0.12'
			}
		},
		phase_countdowns: {
			phase: 'live',
			phase_ends_in: '69.1'
		},
		grenades: {},
		bomb: {
			state: 'carried',
			position: '-243.02, -2167.67, -171.24',
			player: '76561198895440632'
		},
		previously: {
			player: {
				position: '-271.42, -2155.65, -173.57',
				forward: '-0.52, 0.85, -0.02'
			},
			allplayers: {
				'76561199031036917': {
					position: '599.75, -1544.05, -263.97',
					forward: '-0.98, -0.14, 0.13'
				},
				'76561198981246981': {
					position: '-717.89, -1389.83, -167.97',
					forward: '0.48, -0.88, -0.02'
				},
				'76561198913793779': {
					forward: '-0.40, 0.92, -0.03'
				},
				'76561198895440632': {
					position: '-271.42, -2155.65, -173.57',
					forward: '-0.52, 0.85, -0.02'
				},
				'76561198878695406': {
					forward: '-0.98, -0.15, 0.13'
				}
			},
			bomb: {
				position: '-271.42, -2155.65, -173.57'
			}
		}
	};

	const gsi: CSGORaw = merge(base, options);
	if (typeof mutate === 'function') {
		return mutate(gsi);
	}
	return gsi;
};

export const createKillPacket = (options: OptionalKillRaw = {}) => {
	const base = {
		name: 'player_death',
		clientTime: 123456,
		keys: {
			userid: {
				value: 0,
				xuid: '76561198238326438'
			},
			attacker: {
				value: 0,
				xuid: '76561199031036917'
			},
			assister: {
				value: 0,
				xuid: 'string'
			},
			assistedflash: false,
			weapon: 'string',
			weapon_itemid: 'string',
			weapon_fauxitemid: 'string',
			weapon_originalowner_xuid: 'string',
			headshot: false,
			dominated: 0,
			revenge: 0,
			wipe: 0,
			attackerblind: false,
			thrusmoke: false,
			noscope: false,
			penetrated: false,
			noreplay: false
		}
	};
	const kill: RawKill = merge(base, options);

	return kill;
};
