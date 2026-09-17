import { CSGOGSI } from '../index.ts';
import type { Events } from '../index.ts';
import { TypedEventEmitter, type ArgumentEvents } from '../typedEmitter.ts';
import type { Callback as EmitterCallback } from '../events';

type EmptyListener = () => void;
type Callback<K> = K extends keyof Events ? Events[K] | EmptyListener : EmptyListener;

// Compile-time regression: the unchanged cs2-react-hud hook uses this signature.
export function subscribe<K extends keyof Events>(gsi: CSGOGSI, event: K, callback: Callback<K>) {
	gsi.on(event, callback);
	gsi.addListener(event, callback);
	gsi.once(event, callback);
	gsi.prependListener(event, callback);
	gsi.prependOnceListener(event, callback);
	gsi.removeListener(event, callback);
	return () => gsi.off(event, callback);
}

export function checkListenerTypes(gsi: CSGOGSI) {
	gsi.on('data', data => {
		data.players.map(player => player.steamid);
	});
	gsi.on('roundStart', () => {});
	gsi.on('observerTargetChange', (from, to) => {
		from?.steamid;
		to?.steamid;
	});
	gsi.on('customEvent', (value: number) => {});
	// @ts-expect-error Known event payloads must remain checked.
	gsi.on('data', (value: number) => {});
	// @ts-expect-error Removal must also check known event payloads.
	gsi.off('data', (value: number) => {});
}

interface TestArguments {
	message: [text: string, count: number];
	done: [];
}

export function checkGenericCallback(emitter: TypedEventEmitter<TestArguments>) {
	const listener: EmitterCallback<'message', ArgumentEvents<TestArguments>> = (text, count) => {
		text.toUpperCase();
		count.toFixed();
	};
	emitter.on('message', listener);
	emitter.off('message', listener);
	// @ts-expect-error A closed event map must still reject unknown events.
	emitter.on('unknown', () => {});
	// @ts-expect-error Tuple payload types must remain checked.
	emitter.on('message', (text: number) => {});
}

interface ReplacementEvents {
	data: (value: number) => void;
}

export function checkCallbackMaps() {
	const defaultCallback: EmitterCallback<'data'> = data => {
		data.players;
	};
	const replacementCallback: EmitterCallback<'data', ReplacementEvents> = value => {
		value.toFixed();
	};
	const unionCallback: EmitterCallback<'message', ReplacementEvents | ArgumentEvents<TestArguments>> = (
		text,
		count
	) => {
		text.toUpperCase();
		count.toFixed();
	};
	// @ts-expect-error The supplied map replaces the default Events map.
	const invalidReplacement: EmitterCallback<'data', ReplacementEvents> = defaultCallback;
	return { defaultCallback, replacementCallback, unionCallback, invalidReplacement };
}
