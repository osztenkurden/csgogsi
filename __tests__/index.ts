import CSGOGSI, { CSGORaw, Events, PlayerRaw, TeamExtension } from '../tsc';
import { createGSIPacket } from './data';

const createGSIAndCallback = <K extends keyof Events>(eventName: K) => {
	const callback = jest.fn(() => { });

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

/*
test('data > find correct bomb site', () => {
	const { GSI, callback } = createGSIAndCallback('data');

	GSI.removeListeners('data');
	
	GSI.digest(createGSIPacket());

	expect(callback.mock.calls.length).toBe(0);

});*/

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
	}

	const mapGSI = (gsi: CSGORaw) => {
		const { allplayers } = gsi;
		if (allplayers) {
			Object.values(allplayers).forEach(mutatePlayer);
		}
		return gsi;
	}

	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.name).toBe('Right Team');
	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.name).toBe('Left Team');

	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_ct.orientation).toBe('right');
	expect(GSI.digest(createGSIPacket({}, mapGSI))?.map?.team_t.orientation).toBe('left');
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
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe("CT");
});

test('event > round: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('roundEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 14 } } }));
	GSI.digest(createGSIPacket({ map: { team_t: { score: 15 } } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe("T");
});

test('event > match: ended listener, CT wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_ct: { score: 15 }, team_t: { score: 10 } } }));
	GSI.digest(createGSIPacket({ map: { team_ct: { score: 16 }, team_t: { score: 10 }, phase: "gameover" } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe("CT");
});

test('event > match: ended listener, T wins', () => {
	const { GSI, callback } = createGSIAndCallback('matchEnd');

	GSI.digest(createGSIPacket({ map: { team_t: { score: 15 }, team_ct: { score: 10 } } }));
	GSI.digest(createGSIPacket({ map: { team_t: { score: 16 }, team_ct: { score: 10 }, phase: "gameover" } }));

	expect(callback.mock.calls.length).toBe(1);
	expect((callback.mock.calls[0] as any)[0].winner.side).toBe("T");
});

test('data > bomb: find the correct site', () => {
	interface SiteTestCase {
		map: string;
		position: string;
		site: 'A' | 'B';
	}

	const testCases: SiteTestCase[] = [
		{ map: "de_mirage", site: 'A', position: "-273.56, -2156.22, -175.38" }
	]


	for (const testCase of testCases) {
		const GSI = new CSGOGSI();

		expect(GSI.digest(createGSIPacket({ map: { name: testCase.map }, bomb: { state: "planted", position: testCase.position } }))?.bomb?.site).toBe(testCase.site);
	}
});


test('data > bomb: return null on unknown map', () => {
	interface SiteTestCase {
		map: string;
		position: string;
		site: 'A' | 'B';
	}

	const testCases: SiteTestCase[] = [
		{ map: "de_mirage2", site: 'A', position: "-273.56, -2156.22, -175.38" },
		{ map: "de_dust22", site: 'A', position: "-273.56, -2156.22, -175.38" },
		{ map: "de_forestation", site: 'A', position: "-273.56, -2156.22, -175.38" },
		{ map: "de_office", site: 'A', position: "-273.56, -2156.22, -175.38" },
		{ map: "de_vertiso", site: 'A', position: "-273.56, -2156.22, -175.38" },
		{ map: "workshop/de_testing_3", site: 'A', position: "-273.56, -2156.22, -175.38" },
	]


	for (const testCase of testCases) {
		const GSI = new CSGOGSI();

		expect(GSI.digest(createGSIPacket({ map: { name: testCase.map }, bomb: { state: "planted", position: testCase.position } }))?.bomb?.site).toBeNull();
	}
});
