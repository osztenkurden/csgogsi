import * as I from './interfaces';

export interface Events {
	raw: (data: I.CSGORaw) => void;
	data: (data: I.CSGO) => void;
	roundStart: () => void;
	observerTargetChange: (from: I.Player | null, to: I.Player | null) => void;
	roundEnd: (team: I.Score) => void;
	matchEnd: (score: I.Score) => void;
	overtime: () => void;
	kill: (kill: I.KillEvent) => void;
	hurt: (kill: I.HurtEvent) => void;
	phaseChange: (from: NonNullable<I.Phase['phase']>, to: NonNullable<I.Phase['phase']>) => void;
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

export type Callback<K> = K extends BaseEvents ? Events[K] | EmptyListener : EmptyListener;
