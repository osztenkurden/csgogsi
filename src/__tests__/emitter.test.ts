import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { CSGOGSI } from '../index.ts';

type EmitterUnderTest = {
	on(event: string, listener: (...args: any[]) => void): unknown;
	once(event: string, listener: (...args: any[]) => void): unknown;
	emit(event: string): boolean;
	listenerCount(event: string): number;
	eventNames(): (string | symbol)[];
	removeAllListeners(): unknown;
};

for (const arity of [0, 1, 2, 3, 6, 20, 100]) {
	test(`emitter > recursive once dispatch with ${arity} arguments`, () => {
		const gsi = new CSGOGSI();
		const calls: string[] = [];
		const emit = () => gsi.emit('custom', ...Array.from({ length: arity }, (_, i) => i));
		gsi.once('custom', () => {
			calls.push('a');
			emit();
		});
		gsi.once('custom', () => calls.push('b'));
		emit();
		assert.deepEqual(calls, ['a', 'b']);
		assert.equal(gsi.listenerCount('custom'), 0);
	});
	for (const count of [1, 3]) {
		test(`emitter > preserves arity and descriptor context for ${count} listeners, ${arity} arguments`, () => {
			const gsi = new CSGOGSI();
			const calls: unknown[][] = [];
			for (let i = 0; i < count; i++)
				gsi.on('custom', function listener(this: { fn: Function; once: boolean; fired: boolean }) {
					assert.equal(this.fn, listener);
					assert.equal(this.once, false);
					assert.equal(this.fired, false);
					calls.push(Array.from(arguments));
				});
			const args = Array.from({ length: arity }, (_, i) => (i === 0 ? undefined : { index: i }));
			gsi.emit('custom', ...args);
			assert.deepEqual(
				calls,
				Array.from({ length: count }, () => args)
			);
		});
	}
}

test('emitter > duplicate once registrations survive recursive removal by identity', () => {
	function observe(emitter: EmitterUnderTest) {
		const calls: string[] = [];
		let recursed = false;
		function listener() {
			calls.push('same');
			if (!recursed) {
				recursed = true;
				emitter.emit('custom');
			}
		}
		emitter.once('custom', listener);
		emitter.once('custom', () => calls.push('middle'));
		emitter.once('custom', listener);
		emitter.emit('custom');
		return { calls, count: emitter.listenerCount('custom') };
	}
	assert.deepEqual(observe(new CSGOGSI()), observe(new EventEmitter()));
});

test('emitter > recursive removal observer cannot consume once twice', () => {
	const gsi = new CSGOGSI();
	const calls: string[] = [];
	gsi.on('removeListener', name => {
		if (String(name) === 'custom') gsi.emit('custom');
	});
	gsi.once('custom', () => calls.push('a'));
	gsi.once('custom', () => calls.push('b'));
	gsi.emit('custom');
	assert.deepEqual(calls, ['b', 'a']);
	assert.equal(gsi.listenerCount('custom'), 0);
});

test('emitter > bulk removal keeps observers until last, including multiple observers', () => {
	function observe(emitter: EmitterUnderTest) {
		const calls: string[] = [];
		emitter.on('removeListener', name => calls.push(`a:${String(name)}:${emitter.listenerCount(name)}`));
		emitter.on('removeListener', name => calls.push(`b:${String(name)}:${emitter.listenerCount(name)}`));
		emitter.on('custom', () => {});
		emitter.on('custom', () => {});
		emitter.on('other', () => {});
		emitter.removeAllListeners();
		assert.deepEqual(emitter.eventNames(), []);
		return calls;
	}
	assert.deepEqual(observe(new CSGOGSI()), observe(new EventEmitter()));
});

test('emitter > removed once listener still runs in the captured dispatch', () => {
	const gsi = new CSGOGSI();
	const calls: string[] = [];
	const once = () => calls.push('once');
	gsi.on('custom', () => {
		gsi.off('custom', once);
		calls.push('persistent');
	});
	gsi.once('custom', once);
	gsi.emit('custom');
	assert.deepEqual(calls, ['persistent', 'once']);
});

function checkEmitTypes(gsi: CSGOGSI) {
	// Custom events accept any number of payload arguments.
	gsi.emit('custom', 1, 2, 3);
	// @ts-expect-error Known events retain their declared argument types.
	gsi.emit('roundStart', 1);
}
void checkEmitTypes;
