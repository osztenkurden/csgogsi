import type * as I from './interfaces';

export interface Events {
	raw: (data: I.GameStateRaw) => void;
	data: (data: I.GameState) => void;
	roundStart: () => void;
	observerTargetChange: (from: I.Player | null, to: I.Player | null) => void;
	roundEnd: (event: I.RoundEndEvent) => void;
	mapEnd: (event: I.RoundEndEvent) => void;
	/** @deprecated Use mapEnd instead; this event represents a map ending, not a series. */
	matchEnd: (event: I.RoundEndEvent) => void;
	overtime: () => void;
	kill: (kill: I.KillEvent) => void;
	hurt: (event: I.HurtEvent) => void;
	phaseChange: (from: NonNullable<I.PhaseCountdown['phase']>, to: NonNullable<I.PhaseCountdown['phase']>) => void;
	timeoutStart: (team: I.Team) => void;
	timeoutEnd: () => void;
	pauseStart: () => void;
	pauseEnd: () => void;
	warmupStart: () => void;
	warmupEnd: () => void;
	mvp: (player: I.Player) => void;
	freezetimeStart: () => void;
	freezetimeEnd: () => void;
	intermissionStart: () => void;
	intermissionEnd: () => void;
	defuseStart: (player: I.Player | undefined) => void;
	defuseStop: (player: I.Player | undefined) => void;
	bombPlantStart: (player: I.Player | undefined) => void;
	bombPlantStop: (player: I.Player | undefined) => void;
	bombPlant: (player: I.Player | undefined) => void;
	bombExplode: () => void;
	bombDefuse: (player: I.Player | undefined) => void;
	newListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
	removeListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
}

export type AnyEventName<T> = T | (string & {});

export type BaseEvents = keyof Events;

export type EventNames = AnyEventName<BaseEvents>;

export type EmptyListener = () => void;

export type Callback<K, M extends { [P in keyof M]: (...args: any) => any } = Events> =
	(M extends unknown ? (K extends keyof M ? M[K] | EmptyListener : EmptyListener) : never) | EmptyListener;
