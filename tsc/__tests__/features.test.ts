import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CSGOGSI, normalizeMapName, parseTeam } from '../index.ts';
import type { CSGORaw, Phase, Player, PlayerExtension, TeamExtension } from '../index';
import { createGSIPacket } from './data/index.ts';

test('emitter > multiple once listeners are each removed after one call', () => {
	const gsi = new CSGOGSI();
	const calls: string[] = [];
	gsi.once('warmupStart', () => calls.push('first'));
	gsi.once('warmupStart', () => calls.push('second'));
	gsi.emit('warmupStart');
	assert.equal(gsi.listenerCount('warmupStart'), 0);
	assert.equal(gsi.emit('warmupStart'), false);
	assert.deepEqual(calls, ['first', 'second']);
});

test('emitter > mixed prepended, once and persistent listeners preserve order', () => {
	const gsi = new CSGOGSI();
	const calls: string[] = [];
	gsi.on('warmupStart', () => calls.push('persistent'));
	gsi.once('warmupStart', () => calls.push('once'));
	gsi.prependOnceListener('warmupStart', () => calls.push('prepended'));
	gsi.emit('warmupStart');
	gsi.emit('warmupStart');
	assert.deepEqual(calls, ['prepended', 'persistent', 'once', 'persistent']);
});

test('emitter > new listeners wait for the next dispatch', () => {
	const gsi = new CSGOGSI();
	const calls: string[] = [];
	gsi.once('warmupStart', () => {
		calls.push('first');
		gsi.on('warmupStart', () => calls.push('new'));
	});
	gsi.once('warmupStart', () => calls.push('second'));
	gsi.emit('warmupStart');
	assert.deepEqual(calls, ['first', 'second']);
	gsi.emit('warmupStart');
	assert.deepEqual(calls, ['first', 'second', 'new']);
});

test('emitter > off removes one duplicate registration and rawListeners returns functions', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	const listener = () => calls++;
	gsi.on('warmupStart', listener);
	gsi.on('warmupStart', listener);
	gsi.off('warmupStart', listener);
	assert.deepEqual(gsi.rawListeners('warmupStart'), [listener]);
	gsi.emit('warmupStart');
	assert.equal(calls, 1);
});

test('emitter > repeated once registration of the same function is consumed', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	const listener = () => calls++;
	gsi.once('warmupStart', listener);
	gsi.once('warmupStart', listener);
	gsi.emit('warmupStart');
	gsi.emit('warmupStart');
	assert.equal(calls, 2);
	assert.equal(gsi.listenerCount('warmupStart'), 0);
});

test('emitter > single once listener is removed before recursive emission', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	gsi.once('warmupStart', () => {
		calls++;
		assert.equal(gsi.emit('warmupStart'), false);
	});
	gsi.emit('warmupStart');
	assert.equal(calls, 1);
});

test('emitter > lifecycle notifications cover once registration and consumption', () => {
	const gsi = new CSGOGSI();
	const added: string[] = [];
	const removed: string[] = [];
	gsi.on('newListener', name => added.push(name));
	gsi.on('removeListener', name => removed.push(name));
	const listener = () => {};
	gsi.once('warmupStart', listener);
	gsi.emit('warmupStart');
	gsi.off('warmupStart', listener);
	assert.ok(added.includes('warmupStart'));
	assert.deepEqual(removed, ['warmupStart']);
});

test('emitter > removeAllListeners without a name clears every event', () => {
	const gsi = new CSGOGSI();
	gsi.on('warmupStart', () => {});
	gsi.on('warmupEnd', () => {});
	gsi.removeAllListeners();
	assert.deepEqual(gsi.eventNames(), []);
});

test('team > zero series score overrides raw score, absent extension retains it', () => {
	const raw = createGSIPacket().map!.team_ct;
	raw.matches_won_this_series = 2;
	const extension: TeamExtension = {
		id: 'team',
		name: 'Team',
		country: null,
		logo: null,
		map_score: 0,
		extra: {}
	};
	assert.equal(parseTeam(raw, 'left', 'CT', extension).matches_won_this_series, 0);
	assert.equal(parseTeam(raw, 'left', 'CT', { ...extension, map_score: 1 }).matches_won_this_series, 1);
	assert.equal(parseTeam(raw, 'left', 'CT', null).matches_won_this_series, 2);
	const gsi = new CSGOGSI();
	gsi.teams.left = extension;
	assert.equal(gsi.digest(createGSIPacket({ map: { team_ct: raw } }))?.map.team_ct.matches_won_this_series, 0);
});

test('player > extension matches by steamid with an application id', () => {
	const extension: PlayerExtension = {
		id: 'player-1',
		steamid: '76561199031036917',
		name: 'Override',
		realName: null,
		country: null,
		avatar: null,
		extra: {}
	};
	const gsi = new CSGOGSI();
	gsi.players = [extension];
	const result = gsi.digest(createGSIPacket());
	assert.equal(result?.players.find(player => player.steamid === extension.steamid)?.name, 'Override');
});

test('roundStart > emits no arguments with current round state available', () => {
	const gsi = new CSGOGSI();
	const rounds: number[] = [];
	gsi.on('roundStart', (...args) => {
		assert.deepEqual(args, []);
		rounds.push(gsi.current!.map.round + 1);
		assert.equal(gsi.current?.round?.phase, 'live');
		assert.equal(gsi.last?.round?.phase, 'freezetime');
	});
	for (const round of [0, 12, 24, 27, 30]) {
		gsi.digest(createGSIPacket({ map: { round }, round: { phase: 'freezetime' } }));
		gsi.digest(createGSIPacket({ map: { round }, round: { phase: 'live' } }));
		gsi.digest(createGSIPacket({ map: { round }, round: { phase: 'live' } }));
	}
	assert.deepEqual(rounds, [1, 13, 25, 28, 31]);
});

test('roundStart > does not infer a start from the first live packet or a pause', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	gsi.on('roundStart', () => calls++);
	gsi.digest(createGSIPacket());
	gsi.digest(createGSIPacket({ phase_countdowns: { phase: 'paused' } }));
	gsi.digest(createGSIPacket({ phase_countdowns: { phase: 'live' } }));
	assert.equal(calls, 0);
});

test('roundStart > ignores warmup, missing round state, and cross-map comparisons', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	gsi.on('roundStart', () => calls++);
	gsi.digest(createGSIPacket({ map: { phase: 'warmup' }, round: { phase: 'freezetime' } }));
	gsi.digest(createGSIPacket({ map: { phase: 'warmup' }, round: { phase: 'live' } }));
	gsi.digest({ ...createGSIPacket(), round: undefined });
	gsi.digest(createGSIPacket());
	gsi.digest(createGSIPacket({ round: { phase: 'freezetime' } }));
	gsi.digest(createGSIPacket({ map: { name: 'de_nuke' } }));
	assert.equal(calls, 0);
});

test('observerTargetChange > carries previous/current players and free-camera transitions', () => {
	const gsi = new CSGOGSI();
	const changes: [Player | null, Player | null][] = [];
	gsi.on('observerTargetChange', (from, to) => changes.push([from, to]));
	const first = '76561199031036917';
	const second = '76561198238326438';
	const packet = (steamid: string) => createGSIPacket({ player: { steamid } });
	gsi.digest(packet(first));
	gsi.digest(packet(second));
	gsi.digest(packet(second));
	gsi.digest(packet('observer-camera'));
	gsi.digest(packet(first));
	assert.deepEqual(
		changes.map(([from, to]) => [from?.steamid ?? null, to?.steamid ?? null]),
		[
			[first, second],
			[second, null],
			[null, first]
		]
	);
});

test('observerTargetChange > no event for first/missing target or a new map', () => {
	const gsi = new CSGOGSI();
	let calls = 0;
	gsi.on('observerTargetChange', () => calls++);
	gsi.digest({ ...createGSIPacket(), player: undefined });
	gsi.digest({ ...createGSIPacket(), player: undefined });
	gsi.digest(createGSIPacket({ map: { name: 'de_nuke' } }));
	assert.equal(calls, 0);
});

test('map names > normalize workshop paths, separators, case and compiled extensions', () => {
	for (const name of ['de_mirage', 'workshop/123/de_mirage', 'maps\\DE_MIRAGE.bsp', 'DE_MIRAGE.VPK']) {
		assert.equal(normalizeMapName(name), 'de_mirage');
		assert.equal(CSGOGSI.findSite(name, [0, -1000, 0]), 'A');
	}
	assert.equal(CSGOGSI.findSite('constructor', [0, 0, 0]), null);
	assert.equal(CSGOGSI.findSite('__proto__', [0, 0, 0]), null);
});

test('bombsites > configured resolvers work in digest and are isolated per instance', () => {
	const gsi = new CSGOGSI({ bombsiteResolvers: { 'maps/DE_CUSTOM.bsp': ([x]) => (x! > 0 ? 'A' : 'B') } });
	const packet = createGSIPacket({
		map: { name: 'workshop/123/de_custom' },
		bomb: { state: 'planted', position: '1, 2, 3' }
	});
	assert.equal(gsi.digest(packet)?.bomb?.site, 'A');
	assert.equal(gsi.current?.map.name, 'workshop/123/de_custom');
	assert.equal(gsi.findSite('de_custom', [-1, 2, 3]), 'B');
	assert.equal(new CSGOGSI().findSite('de_custom', [1, 2, 3]), null);
	assert.equal(CSGOGSI.findSite('de_custom', [1, 2, 3]), null);
});

test('bombsites > override null is authoritative and removing it restores defaults', () => {
	const gsi = new CSGOGSI();
	assert.equal(
		gsi.setBombsiteResolver('DE_MIRAGE.bsp', () => null),
		gsi
	);
	assert.equal(gsi.findSite('workshop/123/de_mirage', [0, -1000, 0]), null);
	assert.equal(CSGOGSI.findSite('de_mirage', [0, -1000, 0]), 'A');
	gsi.removeBombsiteResolver('workshop/123/DE_MIRAGE');
	assert.equal(gsi.findSite('de_mirage', [0, -1000, 0]), 'A');
});

test('bombsites > active site states use overrides while carried/dropped/exploded do not', () => {
	const gsi = new CSGOGSI({ bombsiteResolvers: { de_mirage: () => 'B' } });
	for (const state of ['planting', 'planted', 'defusing', 'defused'] as const) {
		assert.equal(gsi.digest(createGSIPacket({ bomb: { state } }))?.bomb?.site, 'B');
	}
	for (const state of ['carried', 'dropped', 'exploded'] as const) {
		assert.equal(gsi.digest(createGSIPacket({ bomb: { state } }))?.bomb?.site, null);
	}
});

test('map names > equivalent names preserve damage history and round transitions', () => {
	const gsi = new CSGOGSI();
	const rounds: number[] = [];
	gsi.on('roundStart', () => rounds.push(gsi.current!.map.round + 1));
	gsi.digest(createGSIPacket({ map: { name: 'workshop/123/de_mirage', round: 1 }, round: { phase: 'freezetime' } }));
	gsi.digest(createGSIPacket({ map: { name: 'maps\\DE_MIRAGE.bsp', round: 2 } }));
	assert.equal(gsi.damage.length, 2);
	assert.deepEqual(rounds, [3]);
});

// Compile-only assertions also exercise the package's exported declarations during typecheck.
function publicTypes(gsi: CSGOGSI, raw: CSGORaw) {
	const phase: Phase = { phase: 'live', phase_ends_in: 10 };
	gsi.on('roundStart', () => gsi.current?.map.round);
	gsi.on('observerTargetChange', (from, to) => [from?.steamid, to?.steamid]);
	gsi.emit('raw', raw);
	gsi.emit('roundStart');
	// @ts-expect-error roundStart has no payload.
	gsi.emit('roundStart', 1);
	// @ts-expect-error roundStart callbacks cannot require a round argument.
	gsi.on('roundStart', (round: number) => {});
	// @ts-expect-error PlayerExtension requires an application id.
	const player: PlayerExtension = {
		steamid: '1',
		name: 'Player',
		realName: null,
		country: null,
		avatar: null,
		extra: {}
	};
	return phase;
}
