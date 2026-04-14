// import { test, expect, jest } from 'bun:test';
import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

import type {
	CSGORaw,
	DecoySmokeGrenade,
	Events,
	FragOrFireBombOrFlashbandGrenade,
	InfernoGrenade,
	KillEvent,
	PlayerExtension,
	PlayerRaw,
	TeamExtension
} from '../index';
import { CSGOGSI } from '../index.ts';
import type { Callback } from '../events';
import { createGSIPacket, createHurtPacket, createKillPacket } from './data/index.ts';
import { testCases } from './data/bombSites.ts';

const createGSIAndCallback = <K extends keyof Events>(eventName: K) => {
	const callback = mock.fn((() => {}) as Callback<K>);

	const GSI = new CSGOGSI();

	GSI.addListener(eventName, callback as unknown as Callback<K>);

	return { GSI, callback };
};

test('parser > create CSGOGSI object', () => {
	const GSI = new CSGOGSI();
	assert.ok(GSI);
});

test('parser > throw on bad data', () => {
	const dummyData = {
		allplayers: {},
		map: {},
		phase_countdowns: {}
	} as any;
	const GSI = new CSGOGSI();
	assert.throws(() => GSI.digest(dummyData));
});

test('parser > dont parse data in the menu', () => {
	const GSI = new CSGOGSI();

	const result1 = GSI.digest({ ...createGSIPacket(), allplayers: undefined });
	const result2 = GSI.digest({ ...createGSIPacket(), map: undefined });
	const result3 = GSI.digest({ ...createGSIPacket(), phase_countdowns: undefined });

	assert.equal(result1, null);
	assert.equal(result2, null);
	assert.equal(result3, null);
});

test('parser > dont break with no bomb data', () => {
	const GSI = new CSGOGSI();

	GSI.digest({ ...createGSIPacket(), bomb: undefined });
	const result = GSI.digest({ ...createGSIPacket(), bomb: undefined });

	assert.ok(result);
	assert.equal(result?.bomb, null);
});

test('parser > clear damage data on new map', () => {
	const GSI = new CSGOGSI();

	GSI.digest(createGSIPacket({ map: { name: 'de_mirage' } }));
	GSI.damage = [
		{ round: 1, players: [] },
		{ round: 2, players: [] }
	];

	GSI.digest(createGSIPacket({ map: { name: 'de_nuke' } }));

	assert.equal(GSI.damage.length, 1);
});

test('parser > remove all listeners from specific event', () => {
	const { GSI, callback } = createGSIAndCallback('data');

	GSI.removeAllListeners('data');

	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 0);
});

test('parser > remove specific listeners from specific event #1', () => {
	const { GSI, callback } = createGSIAndCallback('data');

	GSI.removeListener('data', callback);

	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 0);
});

test('parser > remove specific listeners from specific event #2', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlant');

	GSI.removeListener('bombPlant', callback);

	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	assert.equal(callback.mock.calls.length, 0);
});

test('parser > remove specific listeners from specific event #3', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.removeAllListeners('defuseStart');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));

	assert.equal(callback.mock.calls.length, 0);
});

test('parser > remove specific listeners fom specific event #4', () => {
	const callback = mock.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.removeListener('data', callback);

	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 0);
});

test('event listener > gets event names', () => {
	const callback = mock.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.on('mvp', callback);

	GSI.on('matchEnd', callback);

	GSI.on('roundEnd', callback);

	GSI.on('kill', callback);

	GSI.off('kill', callback);

	const eventNames = GSI.eventNames();

	assert(eventNames.includes('mvp'));
	assert(eventNames.includes('matchEnd'));
	assert(eventNames.includes('roundEnd'));
	assert.equal(eventNames.length, 3);
});

test('event listener > gets max listeners', () => {
	const getRandomArbitrary = (min: number, max: number) => {
		return Math.random() * (max - min) + min;
	};

	const newMax = getRandomArbitrary(1, 10000);

	const GSI = new CSGOGSI();

	GSI.setMaxListeners(newMax);

	assert.equal(GSI.getMaxListeners(), newMax);
});

test('event listener > gets listener count', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.on('defuseStart', callback);

	assert.equal(GSI.listenerCount('defuseStart'), 2);
	assert.equal(GSI.listenerCount('mvp'), 0);
});

test('event listener > gets descriptors', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.on('defuseStart', callback);

	assert.equal(GSI.rawListeners('defuseStart').length, 2);
	assert.equal(GSI.rawListeners('mvp').length, 0);
});

test('event listener > calls once listeners only once', () => {
	const callback = mock.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.once('defuseStart', callback);

	GSI.emit('defuseStart');
	GSI.emit('defuseStart');
	GSI.emit('defuseStart');

	assert.equal(callback.mock.calls.length, 1);
});

test('event listener > prepend listener', () => {
	let i = 0;
	const callbackOne = () => {
		if (i === 0) {
			i = 1;
		}
	};
	const callbackPrepended = () => {
		if (i === 0) {
			i = 2;
		}
	};
	const callback = mock.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.on('defuseStart', callbackOne);

	GSI.prependListener('defuseStart', callbackPrepended);
	GSI.prependListener('defuseStop', callback);

	GSI.emit('defuseStart');
	GSI.emit('defuseStop');

	assert.equal(i, 2);
	assert.equal(callback.mock.calls.length, 1);
});
test('event listener > prepend once listener', () => {
	let i = 0;
	const callbackOne = () => {
		if (i === 0) {
			i = 1;
		}
	};
	const callbackPrepended = () => {
		if (i === 0) {
			i = 2;
		}
	};
	const callback = mock.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.once('defuseStart', callbackOne);

	GSI.prependOnceListener('defuseStart', callbackPrepended);
	GSI.prependOnceListener('defuseStop', callback);

	GSI.emit('defuseStart');
	GSI.emit('defuseStop');

	assert.equal(i, 2);
	assert.equal(callback.mock.calls.length, 1);
});

test('data > assign teams in the first half, left to CT, right to T', () => {
	const left: TeamExtension = {
		id: 'idLeft',
		name: 'Left Team',
		country: 'Poland',
		logo: '',
		map_score: 1,
		extra: {}
	};

	const right: TeamExtension = {
		id: 'idRight',
		name: 'Right Team',
		country: 'Lithuania',
		logo: '',
		map_score: 1,
		extra: {}
	};

	const GSI = new CSGOGSI();

	GSI.teams = { left, right };

	assert.equal(GSI.digest(createGSIPacket())?.map?.team_ct.name, 'Left Team');
	assert.equal(GSI.digest(createGSIPacket())?.map?.team_t.name, 'Right Team');

	assert.equal(GSI.digest(createGSIPacket())?.map?.team_ct.orientation, 'left');
	assert.equal(GSI.digest(createGSIPacket())?.map?.team_t.orientation, 'right');
});

test('data > assign teams in the second half, left to T, right to CT', () => {
	const left: TeamExtension = {
		id: 'idLeft',
		name: 'Left Team',
		country: 'Poland',
		logo: '',
		map_score: 1,
		extra: {}
	};

	const right: TeamExtension = {
		id: 'idRight',
		name: 'Right Team',
		country: 'Lithuania',
		logo: '',
		map_score: 1,
		extra: {}
	};

	const GSI = new CSGOGSI();

	GSI.teams = { left, right };

	const mutatePlayer = (player: PlayerRaw) => {
		if (player.observer_slot !== undefined) {
			player.observer_slot = 9 - player.observer_slot;
		}
	};

	const mapGSI = (gsi: CSGORaw) => {
		const { allplayers } = gsi;
		if (allplayers) {
			Object.values(allplayers).forEach(mutatePlayer);
		}
		return gsi;
	};

	assert.equal(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.name, 'Right Team');
	assert.equal(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.name, 'Left Team');

	assert.equal(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.orientation, 'right');
	assert.equal(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.orientation, 'left');
});

test('data > rounds: proper parser in 1st half', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest(createGSIPacket({ map: { round: 3, team_ct: { score: 2 }, team_t: { score: 1 } } }));

	assert.ok(data);
	assert.notEqual(data, null);

	assert.equal(data?.map.rounds.length, 3);
	assert.equal(data?.map.rounds[0]?.round, 1);
	assert.equal(data?.map.rounds[1]?.side, 'CT');
	assert.equal(data?.map.rounds[2]?.team.side, 'T');
});

test('data > rounds: proper parser in 2nd half', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest(
		createGSIPacket({
			map: {
				round: 23,
				team_ct: { score: 12 },
				team_t: { score: 11 },
				round_wins: {
					'1': 't_win_elimination',
					'2': 't_win_bomb',
					'3': 't_win_elimination',
					'4': 't_win_elimination',
					'5': 't_win_bomb',
					'6': 'ct_win_elimination',
					'7': 'ct_win_elimination',
					'8': 't_win_elimination',
					'9': 't_win_bomb',
					'10': 'ct_win_elimination',
					'11': 'ct_win_elimination',
					'12': 't_win_elimination',
					'13': 'ct_win_elimination',
					'14': 'ct_win_elimination',
					'15': 't_win_elimination',
					'16': 'ct_win_elimination',
					'17': 't_win_bomb',
					'18': 'ct_win_defuse',
					'19': 't_win_bomb',
					'20': 't_win_elimination',
					'21': 't_win_elimination',
					'22': 't_win_bomb',
					'23': 't_win_elimination'
				}
			}
		})
	);

	assert.ok(data);
	assert.notEqual(data, null);

	assert.equal(data?.map.rounds.length, 23);
	assert.notEqual(data?.map.rounds[0]?.side, data?.map.rounds[0]?.team.side);
	assert.notEqual(data?.map.rounds[5]?.side, data?.map.rounds[5]?.team.side);
	assert.notEqual(data?.map.rounds[10]?.side, data?.map.rounds[10]?.team.side);
	assert.equal(data?.map.rounds[18]?.side, data?.map.rounds[18]?.team.side);
	assert.equal(data?.map.rounds[20]?.side, data?.map.rounds[20]?.team.side);
	assert.equal(data?.map.rounds[21]?.side, data?.map.rounds[21]?.team.side);
});

test('data > rounds: parser doesnt throw on wrong round wins list', () => {
	const GSI = new CSGOGSI();

	const dataPacker = createGSIPacket({
		map: {
			round: 23,
			team_ct: { score: 12 },
			team_t: { score: 11 },
			round_wins: {
				'1': 't_win_elimination',
				'2': 't_win_bomb',
				'3': 't_win_elimination',
				'4': 't_win_elimination',
				'5': 't_win_bomb'
			}
		}
	});
	assert.doesNotThrow(() => GSI.digest(dataPacker));
});

test('data > rounds: parser correctly gets just ended round', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest(
		createGSIPacket({
			map: {
				round: 4,
				team_ct: { score: 2 },
				team_t: { score: 2 },
				round_wins: {
					'1': 't_win_elimination',
					'2': 't_win_bomb',
					'3': 't_win_elimination',
					'4': 't_win_elimination'
				}
			},
			round: { phase: 'over' }
		})
	);

	assert.equal(data?.map.rounds.length, 4);
	assert.equal(data?.map.rounds[3]?.side, 'T');
	assert.equal(data?.map.rounds[3]?.round, 4);
	assert.equal(data?.map.rounds[3]?.outcome, 't_win_elimination');
});

test('data > player: dont assign observer if cant find', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest(createGSIPacket({ player: { steamid: 'gotvorincorrect' } }));

	assert.ok(data);
	assert.notEqual(data, null);
	assert.equal(data?.player, null);
});

test('data > player: assign extension', () => {
	const targetSteamID = '76561199031036917';
	const extension: PlayerExtension = {
		id: 'randomId',
		steamid: targetSteamID,
		name: '0sh10',
		realName: 'Hubert Walczak',
		country: 'PL',
		avatar: 'avatarUrl',
		extra: {}
	};
	const GSI = new CSGOGSI();

	GSI.players.push(extension);

	const data = GSI.digest(createGSIPacket());

	assert.ok(data);

	const target = data?.players.find(player => player.steamid === targetSteamID);

	assert.ok(target);
	assert.equal(target?.avatar, extension.avatar);
	assert.equal(target?.name, extension.name);
	assert.equal(target?.realName, extension.realName);
	assert.equal(target?.country, extension.country);
});

test('data > round: assign null if doesnt exist', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest({ ...createGSIPacket(), round: undefined });

	assert.ok(data);
	assert.equal(data?.round, null);
});

test('data > bomb: assign null if doesnt exist', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest({ ...createGSIPacket(), bomb: undefined });

	assert.ok(data);
	assert.equal(data?.bomb, null);
});

test('data > bomb: undefined player if doesnt exist or not specified', () => {
	const GSI = new CSGOGSI();

	const gsiPacket = createGSIPacket();
	delete gsiPacket.bomb?.player;

	const playerNotSpecified = GSI.digest(gsiPacket);
	const playerDoesntExist = GSI.digest(createGSIPacket({ bomb: { player: 'notExistingPlayerId' } }));

	assert.ok(playerNotSpecified);
	assert.ok(playerDoesntExist);
	assert.equal(playerNotSpecified?.bomb?.player, undefined);
	assert.equal(playerNotSpecified?.bomb?.player, undefined);
});

test('data > timeout: doesnt crash on lack of phase', () => {
	const GSI = new CSGOGSI();

	GSI.digest({ ...createGSIPacket(), phase_countdowns: { phase_ends_in: '120' } });
	const result2 = GSI.digest({ ...createGSIPacket(), phase_countdowns: { phase_ends_in: '120' } });

	assert.ok(result2);
});

test('event > intermission: start', () => {
	const { GSI, callback } = createGSIAndCallback('intermissionStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ map: { phase: 'intermission' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > intermission: end', () => {
	const { GSI, callback } = createGSIAndCallback('intermissionEnd');

	GSI.digest(createGSIPacket({ map: { phase: 'intermission' } }));
	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 1);
});

test('event > freezetime: start', () => {
	const { GSI, callback } = createGSIAndCallback('freezetimeStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'freezetime' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > freezetime: end', () => {
	const { GSI, callback } = createGSIAndCallback('freezetimeEnd');

	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'freezetime' } }));
	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 1);
});

test('event > timeout: start (CT)', () => {
	const { GSI, callback } = createGSIAndCallback('timeoutStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'timeout_ct' } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.side, 'CT');
});

test('event > timeout: start (T)', () => {
	const { GSI, callback } = createGSIAndCallback('timeoutStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'timeout_t' } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.side, 'T');
});

test('event > timeout: end', () => {
	const { GSI, callback } = createGSIAndCallback('timeoutEnd');

	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'timeout_t' } }));
	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 1);
});

test('event > timeout: end #2', () => {
	const { GSI, callback } = createGSIAndCallback('timeoutEnd');

	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'timeout_ct' } }));
	GSI.digest(createGSIPacket());

	assert.equal(callback.mock.calls.length, 1);
});

test('event > timeout: continue', () => {
	const { GSI, callback } = createGSIAndCallback('timeoutStart');

	GSI.digest({ ...createGSIPacket(), phase_countdowns: { phase_ends_in: '120' } });
	GSI.digest(createGSIPacket({ phase_countdowns: { phase: 'timeout_ct' } }));

	assert.equal(callback.mock.calls.length, 0);
});

test('event > bomb: plant started listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlantStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: plant listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlant');

	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: stop listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlantStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'carried' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: exploded listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombExplode');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: exploded listener, empty bomb packet', () => {
	const { GSI, callback } = createGSIAndCallback('bombExplode');
	const initial = createGSIPacket();
	initial.bomb = undefined;
	GSI.digest(initial);
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: defuse started listener', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test("event > bomb: defuse stopped (didn't explode) listener", () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: defuse stopped listener dont call on explode #1', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	assert.equal(callback.mock.calls.length, 0);
});

test('event > bomb: defuse stopped listener dont call on explode #2', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	assert.equal(callback.mock.calls.length, 0);
});

test('event > bomb: defused listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombDefuse');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defused' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > bomb: defused listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombDefuse');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defused' } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > round: ended listener, CT wins', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ round: { win_team: 'CT' } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'CT');
});

test('event > round: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ round: { win_team: 'T' } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'T');
});

test('event > round: ended listener, score validness', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 14 } } }));
	GSI.digest(createGSIPacket({ round: { win_team: 'T' }, map: { team_t: { score: 14 } } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'T');
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.score, 15);
});

test('event > round: ended listener, score validness #2', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 14 } } }));
	GSI.digest(createGSIPacket({ round: { win_team: 'T' }, map: { team_t: { score: 15 } } }));

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'T');
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.score, 15);
});

test('event > round: mvp listener', () => {
	const { GSI, callback } = createGSIAndCallback('mvp');

	GSI.digest(createGSIPacket({ allplayers: { '76561199031036917': { match_stats: { mvps: 5 } } } }));
	GSI.digest(createGSIPacket({ allplayers: { '76561199031036917': { match_stats: { mvps: 6 } } } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > round: mvp listener #2', () => {
	const { GSI, callback } = createGSIAndCallback('mvp');

	const packet = createGSIPacket({ allplayers: { '76561198238326438': { match_stats: { mvps: 5 } } } });

	if (packet.allplayers) {
		delete packet.allplayers['76561199031036917'];
	}

	GSI.digest(packet);
	GSI.digest(createGSIPacket({ allplayers: { '76561198238326438': { match_stats: { mvps: 6 } } } }));

	assert.equal(callback.mock.calls.length, 1);
});

test('event > match: ended listener, CT wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_ct: { score: 15 }, team_t: { score: 10 }, phase: 'live' } }));
	GSI.digest(
		createGSIPacket({
			map: { team_ct: { score: 16 }, team_t: { score: 10 }, phase: 'gameover' },
			round: { win_team: 'CT' }
		})
	);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'CT');
});

test('event > match: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 15 }, team_ct: { score: 10 }, phase: 'live' } }));
	GSI.digest(
		createGSIPacket({
			map: { team_t: { score: 16 }, team_ct: { score: 10 }, phase: 'gameover' },
			round: { win_team: 'T' }
		})
	);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(callback.mock.calls[0]?.arguments[0]?.winner.side, 'T');
});

test('event > hurt: ignore for non-existing player #1', () => {
	const { GSI, callback } = createGSIAndCallback('hurt');
	const hurt = createHurtPacket({ keys: { userid: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	GSI.digestMIRV(hurt, 'player_hurt');

	assert.equal(callback.mock.calls.length, 0);
});

test('event > hurt: ignore for non-existing player #2', () => {
	const { GSI, callback } = createGSIAndCallback('hurt');
	const hurt = createHurtPacket({ keys: { attacker: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	GSI.digestMIRV(hurt, 'player_hurt');

	assert.equal(callback.mock.calls.length, 0);
});

test('event > hurt: ignore for lacking data', () => {
	const { GSI, callback } = createGSIAndCallback('hurt');
	const hurt = createHurtPacket();

	const response = GSI.digestMIRV(hurt, 'player_hurt');

	assert.equal(callback.mock.calls.length, 0);
	assert.equal(response, null);
});

test('event > hurt: get correct victim', () => {
	const { GSI, callback } = createGSIAndCallback('hurt');
	const hurt = createHurtPacket({ keys: { userid: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(hurt, 'player_hurt');

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(response?.victim.steamid, '76561199031036917');
});

test('event > kill: get correct attacker', () => {
	const { GSI, callback } = createGSIAndCallback('hurt');
	const hurt = createHurtPacket({ keys: { attacker: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(hurt, 'player_hurt');

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(
		response && 'attacker' in response && response?.attacker && response?.attacker.steamid,
		'76561199031036917'
	);
});

test('event > kill: ignore for non-existing player #1', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { userid: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 0);
	assert.equal(response, null);
});

test('event > kill: ignore for non-existing player #2', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { attacker: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal((response as KillEvent).killer, null);
});

test('event > kill: ignore for lacking data', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket();

	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 0);
	assert.equal(response, null);
});

test('event > kill: get correct victim', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { userid: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(response?.victim.steamid, '76561199031036917');
});

test('event > kill: get correct killer', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { attacker: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(response && 'killer' in response && response?.killer && response?.killer.steamid, '76561199031036917');
});

test('event > kill: get correct assister', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { assister: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	assert.equal(callback.mock.calls.length, 1);
	assert.equal(response && 'killer' in response && response?.killer && response?.killer.steamid, '76561199031036917');
});

for (const testCase of testCases) {
	test(`data > bomb: find the correct site (${testCase.map}, ${testCase.site})`, () => {
		const GSI = new CSGOGSI();

		assert.equal(
			GSI.digest(
				createGSIPacket({
					map: { name: testCase.map },
					bomb: { state: 'planted', position: testCase.position }
				})
			)?.bomb?.site,
			testCase.site
		);
	});
}

test('data > bomb: return null on unknown map', () => {
	interface SiteTestCase {
		map: string;
		position: string;
		site: 'A' | 'B';
	}

	const testCases: SiteTestCase[] = [
		{ map: 'de_mirage2', site: 'A', position: '-273.56, -2156.22, -175.38' },
		{ map: 'de_dust22', site: 'A', position: '-273.56, -2156.22, -175.38' },
		{ map: 'de_forestation', site: 'A', position: '-273.56, -2156.22, -175.38' },
		{ map: 'de_office', site: 'A', position: '-273.56, -2156.22, -175.38' },
		{ map: 'de_vertiso', site: 'A', position: '-273.56, -2156.22, -175.38' },
		{ map: 'workshop/de_testing_3', site: 'A', position: '-273.56, -2156.22, -175.38' }
	];

	for (const testCase of testCases) {
		const GSI = new CSGOGSI();

		assert.equal(
			GSI.digest(
				createGSIPacket({
					map: { name: testCase.map },
					bomb: { state: 'planted', position: testCase.position }
				})
			)?.bomb?.site,
			null
		);
	}
});

test('data > damage: clear after first round starts', () => {
	const GSI = new CSGOGSI();

	const packet = createGSIPacket({
		map: {
			round: 0
		},
		phase_countdowns: {
			phase: 'freezetime'
		},
		allplayers: {
			'76561199031036917': {
				state: {
					round_totaldmg: 100
				}
			}
		}
	});
	GSI.digest(packet);
	const result = GSI.digest(packet);

	const player = result?.players.find(pl => pl.steamid === '76561199031036917');

	assert.notEqual(player, null);
	assert.equal(GSI.damage.length, 0);
});

test('data > damage: clear on warmup', () => {
	const GSI = new CSGOGSI();

	const packet = createGSIPacket({
		map: {
			round: 0
		},
		phase_countdowns: {
			phase: 'warmup'
		},
		allplayers: {
			'76561199031036917': {
				state: {
					round_totaldmg: 100
				}
			}
		}
	});
	GSI.digest(packet);
	const result = GSI.digest(packet);

	const player = result?.players.find(pl => pl.steamid === '76561199031036917');

	assert.notEqual(player, null);
	assert.equal(GSI.damage.length, 0);
});

test('data > adr', () => {
	const GSI = new CSGOGSI();
	const roundOne = createGSIPacket({
		map: {
			round: 0
		},
		allplayers: {
			'76561199031036917': {
				state: {
					round_totaldmg: 100
				}
			}
		}
	});
	const roundTwo = createGSIPacket({
		map: {
			round: 1
		},
		allplayers: {
			'76561199031036917': {
				state: {
					round_totaldmg: 50
				}
			}
		}
	});
	const roundThree = createGSIPacket({
		map: {
			round: 2
		},
		allplayers: {
			'76561199031036917': {
				state: {
					round_totaldmg: 120
				}
			}
		}
	});
	GSI.digest(roundOne);
	GSI.digest(roundTwo);
	//GSI.digest(roundThree);
	const result = GSI.digest(roundThree);
	//console.log(GSI.damage.map(dmg => ({ round: dmg.round, amount: dmg.players.find(pl => pl.steamid === '76561199031036917')})))

	const player = result?.players.find(pl => pl.steamid === '76561199031036917');

	assert.notEqual(player, null);
	assert.equal(player?.state.adr, 75);
});

test('data > grenades > flashbang', () => {
	const GSI = new CSGOGSI();

	const result = GSI.digest(createGSIPacket());

	//console.log(GSI.damage.map(dmg => ({ round: dmg.round, amount: dmg.players.find(pl => pl.steamid === '76561199031036917')})))

	const flash = result?.grenades.find(g => g.type === 'flashbang');

	assert.notEqual(flash, undefined);
	assert.equal((flash as FragOrFireBombOrFlashbandGrenade).position.length, 3);
	assert.equal((flash as FragOrFireBombOrFlashbandGrenade).velocity.length, 3);
});

test('data > grenades > inferno', () => {
	const GSI = new CSGOGSI();

	const result = GSI.digest(createGSIPacket());

	//console.log(GSI.damage.map(dmg => ({ round: dmg.round, amount: dmg.players.find(pl => pl.steamid === '76561199031036917')})))

	const flash = result?.grenades.find(g => g.type === 'inferno');

	assert.notEqual(flash, undefined);
	assert.ok((flash as InfernoGrenade).lifetime);
	assert.equal((flash as InfernoGrenade).flames.length, 1);
});

test('data > grenades > smoke', () => {
	const GSI = new CSGOGSI();

	const result = GSI.digest(createGSIPacket());

	//console.log(GSI.damage.map(dmg => ({ round: dmg.round, amount: dmg.players.find(pl => pl.steamid === '76561199031036917')})))

	const flash = result?.grenades.find(g => g.type === 'smoke');

	assert.notEqual(flash, undefined);
	assert.ok((flash as DecoySmokeGrenade).lifetime);
	assert.ok((flash as DecoySmokeGrenade).effecttime);
});

test('data > grenades > none', () => {
	const GSI = new CSGOGSI();

	const result = GSI.digest(createGSIPacket({ grenades: null as any }));

	assert.equal(result?.grenades.length, 0);
});
