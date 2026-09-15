/**
 * Event emitter derived from eventemitter3 (https://github.com/primus/eventemitter3),
 * Copyright (c) 2014 Arnout Kazemier, MIT License; see ACKNOWLEDGEMENTS.
 *
 * The storage layout and `emit` dispatch follow eventemitter3 closely: a bare
 * record or an array per event, a null-prototype table with a live count,
 * and copy-on-remove so `emit`
 * never clones the listener array. Deliberate differences for Node compatibility:
 * `newListener`/`removeListener` meta-events (also when a `once` listener fires),
 * prepend variants, and removal of only the most recently added duplicate.
 * Dispatch uses rest/spread and direct calls with the listener record as receiver.
 * Dropped: listener contexts, the legacy `~` key prefix, and max-listener warnings.
 */

/** Any function; `...args: any` (not `any[]`) accepts tuple-typed listeners without casts. */
type Listener = (...args: any) => void;
type EventName = string | symbol;
/** Event name to listener argument tuple; a mapped constraint so interfaces qualify. */
type EventMap<T> = { [K in keyof T]: any[] };

export type EmitterMetaEvents = {
	newListener: [eventName: EventName, listener: Listener];
	removeListener: [eventName: EventName, listener: Listener];
};

/** One registered listener (the eventemitter3 `EE` record, without `context`). */
class EE {
	readonly fn: Listener;
	readonly once: boolean;
	fired = false;

	constructor(fn: Listener, once: boolean) {
		this.fn = fn;
		this.once = once;
	}
}

/** A single record is stored bare; two or more are stored as an array. */
type Stored = EE | EE[];

/** Event table without `Object.prototype` members, so any event name is safe. */
type Events = Record<PropertyKey, Stored | undefined>;
const createEvents = (): Events => Object.create(null) as Events;

export class TypedEventEmitter<T extends EventMap<T>> {
	private _events: Events = createEvents();
	private _eventsCount = 0;

	private _addListener(event: PropertyKey, fn: Listener, once: boolean, prepend: boolean): this {
		if (typeof fn !== 'function') throw new TypeError('The listener must be a function');
		if (this._events.newListener) this.emit('newListener', event as EventName, fn);

		const listener = new EE(fn, once);
		const stored = this._events[event];
		if (!stored) {
			this._events[event] = listener;
			this._eventsCount++;
		} else if (!(stored as EE).fn) {
			// Appending in place is safe: `emit` iterates over a cached length.
			if (prepend) this._events[event] = [listener].concat(stored as EE[]);
			else (stored as EE[]).push(listener);
		} else {
			this._events[event] = prepend ? [listener, stored as EE] : [stored as EE, listener];
		}
		return this;
	}

	private _clearEvent(event: PropertyKey): void {
		if (--this._eventsCount === 0) this._events = createEvents();
		else delete this._events[event];
	}

	/** Names with at least one listener. */
	eventNames(): (keyof T)[] {
		if (this._eventsCount === 0) return [];
		return Reflect.ownKeys(this._events) as (keyof T)[];
	}

	listeners<K extends keyof T>(event: K): ((...args: T[K]) => void)[] {
		const handlers = this._events[event];
		if (!handlers) return [];
		if ((handlers as EE).fn) return [(handlers as EE).fn];

		const list = handlers as EE[];
		const result = new Array<Listener>(list.length);
		for (let i = 0; i < list.length; i++) result[i] = list[i]!.fn;
		return result;
	}

	/** `once` listeners are stored unwrapped, so this matches {@link listeners}. */
	rawListeners<K extends keyof T>(event: K): ((...args: T[K]) => void)[] {
		return this.listeners(event);
	}

	listenerCount(event: PropertyKey): number {
		const listeners = this._events[event];
		if (!listeners) return 0;
		if ((listeners as EE).fn) return 1;
		return (listeners as EE[]).length;
	}

	/** Dispatches typed payload arguments with the listener record as the receiver. */
	emit<K extends keyof T>(event: K, ...args: T[K]): boolean;
	emit<K extends keyof EmitterMetaEvents>(event: K, ...args: EmitterMetaEvents[K]): boolean;
	emit(event: PropertyKey, ...args: unknown[]): boolean {
		const stored = this._events[event];
		if (!stored) return false;
		if ((stored as EE).fn) {
			const listener = stored as EE;
			if (!listener.once || this._consumeOnce(event, listener)) listener.fn(...args);
		} else {
			// Capture the initial length; removal replaces the array.
			const listeners = stored as EE[];
			for (let i = 0, length = listeners.length; i < length; i++) {
				const listener = listeners[i]!;
				if (!listener.once || this._consumeOnce(event, listener)) listener.fn(...args);
			}
		}
		return true;
	}

	private _consumeOnce(event: PropertyKey, listener: EE): boolean {
		if (listener.fired) return false;
		// Mark before removal: removeListener observers may emit recursively too.
		listener.fired = true;
		this._removeListener(event, listener.fn, listener);
		return true;
	}

	on<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		return this._addListener(event, fn, false, false);
	}

	addListener<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		return this._addListener(event, fn, false, false);
	}

	once<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		return this._addListener(event, fn, true, false);
	}

	prependListener<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		return this._addListener(event, fn, false, true);
	}

	prependOnceListener<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		return this._addListener(event, fn, true, true);
	}

	/**
	 * Remove the most recently added listener matching `fn` (Node semantics;
	 * eventemitter3 removes every match). An internal target removes the exact
	 * registration consumed by `emit`, including duplicate functions.
	 */
	private _removeListener(event: PropertyKey, fn: Listener, target?: EE): void {
		// Node throws here too; eventemitter3 instead clears the event. Use removeAllListeners for that.
		if (typeof fn !== 'function') throw new TypeError('The listener must be a function');
		const stored = this._events[event];
		if (!stored) return;

		let removed: EE | undefined;
		if ((stored as EE).fn) {
			const listener = stored as EE;
			if (listener.fn === fn && (!target || listener === target)) {
				this._clearEvent(event);
				removed = listener;
			}
		} else {
			const listeners = stored as EE[];
			for (let i = listeners.length - 1; i >= 0; i--) {
				const listener = listeners[i]!;
				if (listener.fn !== fn || (target && listener !== target)) continue;
				// Rebuild rather than splice, so an in-flight `emit` keeps its array intact.
				const events = listeners.slice(0, i).concat(listeners.slice(i + 1));
				this._events[event] = events.length === 1 ? events[0] : events;
				removed = listener;
				break;
			}
		}

		if (removed && this._events.removeListener) {
			this.emit('removeListener', event as EventName, removed.fn);
		}
	}

	removeListener<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		this._removeListener(event, fn);
		return this;
	}

	off<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		this._removeListener(event, fn);
		return this;
	}

	/** Remove all listeners, or those of `event`; reports each via `removeListener`. */
	removeAllListeners(event?: keyof T): this {
		if (!this._events.removeListener) {
			if (event === undefined) {
				this._events = createEvents();
				this._eventsCount = 0;
			} else if (this._events[event]) {
				this._clearEvent(event);
			}
			return this;
		}

		if (event === undefined) {
			for (const name of this.eventNames()) {
				if (name !== 'removeListener') this.removeAllListeners(name);
			}
			// Keep observers until every other event has been processed.
			this.removeAllListeners('removeListener' as keyof T);
			return this;
		}
		const stored = this._events[event];
		if (!stored) return this;
		const listeners = (stored as EE).fn ? [stored as EE] : (stored as EE[]);
		for (let i = listeners.length - 1; i >= 0; i--) {
			const listener = listeners[i]!;
			this._removeListener(event, listener.fn, listener);
		}
		return this;
	}
}
