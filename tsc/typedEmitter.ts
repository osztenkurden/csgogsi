/**
 * Event emitter derived from eventemitter3 (https://github.com/primus/eventemitter3),
 * Copyright (c) 2014 Arnout Kazemier, MIT License; see ACKNOWLEDGEMENTS.
 *
 * The storage layout and `emit` dispatch follow eventemitter3 closely: a bare
 * record or an array per event, a null-prototype table with a live count, fixed
 * positional parameters instead of rest arguments, and copy-on-remove so `emit`
 * never clones the listener array. Deliberate differences for Node compatibility:
 * `newListener`/`removeListener` meta-events (also when a `once` listener fires),
 * prepend variants, and removal of only the most recently added duplicate.
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

	/**
	 * Calls each listener registered for `event`; returns whether any existed.
	 * Positional parameters and `arguments.length` follow eventemitter3; the trailing
	 * rest parameter only exists so the typed overloads are assignable (engines elide it).
	 */
	emit<K extends keyof T>(event: K, ...args: T[K]): boolean;
	emit<K extends keyof EmitterMetaEvents>(event: K, ...args: EmitterMetaEvents[K]): boolean;
	emit(
		event: PropertyKey,
		a1?: unknown,
		a2?: unknown,
		a3?: unknown,
		a4?: unknown,
		a5?: unknown,
		..._rest: unknown[]
	): boolean {
		const stored = this._events[event];
		if (!stored) return false;

		const len = arguments.length;
		let args: unknown[] | undefined;

		if ((stored as EE).fn) {
			const listener = stored as EE;
			if (listener.once) this._removeListener(event, listener.fn, true);

			switch (len) {
				case 1:
					return (listener.fn.call(this), true);
				case 2:
					return (listener.fn.call(this, a1), true);
				case 3:
					return (listener.fn.call(this, a1, a2), true);
				case 4:
					return (listener.fn.call(this, a1, a2, a3), true);
				case 5:
					return (listener.fn.call(this, a1, a2, a3, a4), true);
				case 6:
					return (listener.fn.call(this, a1, a2, a3, a4, a5), true);
			}

			args = new Array(len - 1);
			for (let i = 1; i < len; i++) args[i - 1] = arguments[i];
			listener.fn.apply(this, args);
		} else {
			// Removal replaces the array rather than mutating it, so iterating the
			// captured reference stays correct while listeners remove themselves.
			const listeners = stored as EE[];
			const length = listeners.length;

			for (let i = 0; i < length; i++) {
				const listener = listeners[i]!;
				if (listener.once) this._removeListener(event, listener.fn, true);

				switch (len) {
					case 1:
						listener.fn.call(this);
						break;
					case 2:
						listener.fn.call(this, a1);
						break;
					case 3:
						listener.fn.call(this, a1, a2);
						break;
					case 4:
						listener.fn.call(this, a1, a2, a3);
						break;
					default:
						if (!args) {
							args = new Array(len - 1);
							for (let j = 1; j < len; j++) args[j - 1] = arguments[j];
						}
						listener.fn.apply(this, args);
				}
			}
		}

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
	 * eventemitter3 removes every match). `once` restricts matches to one-time
	 * listeners, as when `emit` consumes one.
	 */
	private _removeListener(event: PropertyKey, fn: Listener, once: boolean): void {
		// Node throws here too; eventemitter3 instead clears the event. Use removeAllListeners for that.
		if (typeof fn !== 'function') throw new TypeError('The listener must be a function');
		const stored = this._events[event];
		if (!stored) return;

		let removed: EE | undefined;
		if ((stored as EE).fn) {
			const listener = stored as EE;
			if (listener.fn === fn && (!once || listener.once)) {
				this._clearEvent(event);
				removed = listener;
			}
		} else {
			const listeners = stored as EE[];
			for (let i = listeners.length - 1; i >= 0; i--) {
				const listener = listeners[i]!;
				if (listener.fn !== fn || (once && !listener.once)) continue;
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
		this._removeListener(event, fn, false);
		return this;
	}

	off<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
		this._removeListener(event, fn, false);
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

		const names: PropertyKey[] = event === undefined ? this.eventNames() : [event];
		for (const name of names) {
			const stored = this._events[name];
			if (!stored) continue;
			this._clearEvent(name);
			const listeners = (stored as EE).fn ? [stored as EE] : (stored as EE[]);
			for (let i = listeners.length - 1; i >= 0; i--) {
				this.emit('removeListener', name as EventName, listeners[i]!.fn);
			}
		}
		return this;
	}
}
