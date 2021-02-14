import CSGOGSI, { CSGORaw, Events, PlayerExtension, PlayerRaw, TeamExtension } from '../tsc';
import { createGSIPacket, createKillPacket } from './data';
import { testCases } from './data/bombSites';

const createGSIAndCallback = <K extends keyof Events>(eventName: K) => {
	const callback = jest.fn(() => {});

	const GSI = new CSGOGSI();

	GSI.on(eventName, callback);

	return { GSI, callback };
};

test('parser > create CSGOGSI object', () => {
	const GSI = new CSGOGSI();
	expect(GSI).toBeDefined();
});

test('parser > throw on bad data', () => {
	const dummyData = {
		allplayers: {},
		map: {},
		phase_countdowns: {}
	} as any;
	const GSI = new CSGOGSI();
	expect(() => GSI.digest(dummyData)).toThrow();
});

test('parser > dont parse data in the menu', () => {
	const GSI = new CSGOGSI();

	const result1 = GSI.digest({ ...createGSIPacket(), allplayers: undefined });
	const result2 = GSI.digest({ ...createGSIPacket(), map: undefined });
	const result3 = GSI.digest({ ...createGSIPacket(), phase_countdowns: undefined });

	expect(result1).toBeNull();
	expect(result2).toBeNull();
	expect(result3).toBeNull();
});

test('parser > dont break with no bomb data', () => {
	const GSI = new CSGOGSI();

	GSI.digest({ ...createGSIPacket(), bomb: undefined });
	const result = GSI.digest({ ...createGSIPacket(), bomb: undefined });

	expect(result).toBeDefined();
	expect(result?.bomb).toBeNull();
});

test('parser > remove all listeners from specific event', () => {
	const { GSI, callback } = createGSIAndCallback('data');

	GSI.removeListeners('data');

	GSI.digest(createGSIPacket());

	expect(callback.mock.calls.length).toBe(0);
});

test('parser > remove specific listeners from specific event #1', () => {
	const { GSI, callback } = createGSIAndCallback('data');

	GSI.removeListener('data', callback);

	GSI.digest(createGSIPacket());

	expect(callback.mock.calls.length).toBe(0);
});

test('parser > remove specific listeners from specific event #2', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlant');

	GSI.removeListener('bombPlant', callback);

	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	expect(callback.mock.calls.length).toBe(0);
});

test('parser > remove specific listeners from specific event #3', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.removeListeners('defuseStart');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));

	expect(callback.mock.calls.length).toBe(0);
});

test('parser > remove specific listeners fom specific event #4', () => {
	const callback = jest.fn(() => {});
	const GSI = new CSGOGSI();

	GSI.removeListener('data', callback);

	GSI.digest(createGSIPacket());

	expect(callback.mock.calls.length).toBe(0);
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

	expect(GSI.digest(createGSIPacket())?.map?.team_ct.name).toBe('Left Team');
	expect(GSI.digest(createGSIPacket())?.map?.team_t.name).toBe('Right Team');

	expect(GSI.digest(createGSIPacket())?.map?.team_ct.orientation).toBe('left');
	expect(GSI.digest(createGSIPacket())?.map?.team_t.orientation).toBe('right');
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

	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.name).toBe('Right Team');
	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.name).toBe('Left Team');

	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.orientation).toBe('right');
	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.orientation).toBe('left');
});

test('data > player: dont assign observer if cant find', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest(createGSIPacket({ player: { steamid: 'gotvorincorrect' } }));

	expect(data).toBeDefined();
	expect(data).not.toBeNull();
	expect(data?.player).toBeNull();
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

	expect(data).toBeDefined();

	const target = data?.players.find(player => player.steamid === targetSteamID);

	expect(target).toBeDefined();
	expect(target?.avatar).toBe(extension.avatar);
	expect(target?.name).toBe(extension.name);
	expect(target?.realName).toBe(extension.realName);
	expect(target?.country).toBe(extension.country);
});

test('data > round: assign null if doesnt exist', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest({ ...createGSIPacket(), round: undefined });

	expect(data).toBeDefined();
	expect(data?.round).toBeNull();
});

test('data > bomb: assign null if doesnt exist', () => {
	const GSI = new CSGOGSI();

	const data = GSI.digest({ ...createGSIPacket(), bomb: undefined });

	expect(data).toBeDefined();
	expect(data?.bomb).toBeNull();
});

test('data > bomb: undefined player if doesnt exist or not specified', () => {
	const GSI = new CSGOGSI();

	const gsiPacket = createGSIPacket();
	delete gsiPacket.bomb?.player;

	const playerNotSpecified = GSI.digest(gsiPacket);
	const playerDoesntExist = GSI.digest(createGSIPacket({ bomb: { player: 'notExistingPlayerId' } }));

	expect(playerNotSpecified).toBeDefined();
	expect(playerDoesntExist).toBeDefined();
	expect(playerNotSpecified?.bomb?.player).toBeUndefined();
	expect(playerNotSpecified?.bomb?.player).toBeUndefined();
});

test('event > bomb: plant started listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlantStart');

	GSI.digest(createGSIPacket());
	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > bomb: plant listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombPlant');

	GSI.digest(createGSIPacket({ bomb: { state: 'planting' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > bomb: exploded listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombExplode');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > bomb: defuse started listener', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStart');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test("event > bomb: defuse stopped (didn't explode) listener", () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > bomb: defuse stopped listener dont call on explode #1', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	expect(callback.mock.calls.length).toBe(0);
});

test('event > bomb: defuse stopped listener dont call on explode #2', () => {
	const { GSI, callback } = createGSIAndCallback('defuseStop');

	GSI.digest(createGSIPacket({ bomb: { state: 'planted' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'exploded' } }));

	expect(callback.mock.calls.length).toBe(0);
});

test('event > bomb: defused listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombDefuse');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defused' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > bomb: defused listener', () => {
	const { GSI, callback } = createGSIAndCallback('bombDefuse');

	GSI.digest(createGSIPacket({ bomb: { state: 'defusing' } }));
	GSI.digest(createGSIPacket({ bomb: { state: 'defused' } }));

	expect(callback.mock.calls.length).toBe(1);
});

test('event > round: ended listener, CT wins', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket({ map: { team_ct: { score: 14 } } }));
	GSI.digest(createGSIPacket({ map: { team_ct: { score: 15 } } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe('CT');
});

test('event > round: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 14 } } }));
	GSI.digest(createGSIPacket({ map: { team_t: { score: 15 } } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe('T');
});

test('event > match: ended listener, CT wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_ct: { score: 15 }, team_t: { score: 10 } } }));
	GSI.digest(createGSIPacket({ map: { team_ct: { score: 16 }, team_t: { score: 10 }, phase: 'gameover' } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe('CT');
});

test('event > match: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 15 }, team_ct: { score: 10 } } }));
	GSI.digest(createGSIPacket({ map: { team_t: { score: 16 }, team_ct: { score: 10 }, phase: 'gameover' } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe('T');
});

test('event > kill: ignore for non-existing player #1', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { userid: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(0);
	expect(response).toBeNull();
});

test('event > kill: ignore for non-existing player #2', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { attacker: { xuid: '' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(0);
	expect(response).toBeNull();
});

test('event > kill: ignore for lacking data', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket();

	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(0);
	expect(response).toBeNull();
});

test('event > kill: get correct victim', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { userid: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(1);
	expect(response?.victim.steamid).toBe('76561199031036917');
});

test('event > kill: get correct killer', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { attacker: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(1);
	expect(response?.killer.steamid).toBe('76561199031036917');
});

test('event > kill: get correct assister', () => {
	const { GSI, callback } = createGSIAndCallback('kill');
	const kill = createKillPacket({ keys: { assister: { xuid: '76561199031036917' } } });

	GSI.digest(createGSIPacket());
	const response = GSI.digestMIRV(kill);

	expect(callback.mock.calls.length).toBe(1);
	expect(response?.killer.steamid).toBe('76561199031036917');
});

for (const testCase of testCases) {
	test(`data > bomb: find the correct site (${testCase.map}, ${testCase.site})`, () => {
		const GSI = new CSGOGSI();

		expect(
			GSI.digest(
				createGSIPacket({
					map: { name: testCase.map },
					bomb: { state: 'planted', position: testCase.position }
				})
			)?.bomb?.site
		).toBe(testCase.site);
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

		expect(
			GSI.digest(
				createGSIPacket({
					map: { name: testCase.map },
					bomb: { state: 'planted', position: testCase.position }
				})
			)?.bomb?.site
		).toBeNull();
	}
});
