import CSGOGSI from '../tsc';

import * as PLANTING from './data/planting';

test('creates CSGOGSI object', () => {
	const GSI = new CSGOGSI();
	expect(GSI).toBeDefined();
});

test('throws on bad data', () => {
	const dummyData = {
		allplayers: {},
		map: {},
		phase_countdowns: {}
	} as any;
	const GSI = new CSGOGSI();
	expect(() => GSI.digest(dummyData)).toThrow();
});

test('calls plant start listeners', () => {
	const onPlant = jest.fn(() => {});

	const GSI = new CSGOGSI();

	GSI.on('bombPlantStart', onPlant);

	GSI.digest(PLANTING.start);
	GSI.digest(PLANTING.end);

	expect(onPlant.mock.calls.length).toBe(1);
});
