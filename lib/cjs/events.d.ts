import * as I from './interfaces';

export interface Events {
	raw: (data: I.CSGORaw) => void;
	data: (data: I.CSGO) => void;
	roundEnd: (team: I.Score) => void;
	matchEnd: (score: I.Score) => void;
	kill: (kill: I.KillEvent) => void;
	hurt: (kill: I.HurtEvent) => void;
	timeoutStart: (team: any) => void;
	timeoutEnd: () => void;
	/*roundStart: (round: number) => void,
    warmupStart: () => void,
    warmupEnd: () => void,*/
	mvp: (player: I.Player) => void;
	freezetimeStart: () => void;
	freezetimeEnd: () => void;
	intermissionStart: () => void;
	intermissionEnd: () => void;
	defuseStart: (player: I.Player) => void;
	defuseStop: (player: I.Player) => void;
	bombPlantStart: (player: I.Player) => void;
	bombPlant: (player: I.Player) => void;
	bombExplode: () => void;
	bombDefuse: (player: I.Player) => void;
	newListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
	removeListener: <K extends keyof Events>(eventName: K, listener: Events[K]) => void;
}

export type AnyEventName<T> = T | (string & {});

export type BaseEvents = keyof Events;

export type EventNames = AnyEventName<BaseEvents>;

export type EmptyListener = () => void;

export type Callback<K> = K extends BaseEvents ? Events[K] | EmptyListener : EmptyListener;
