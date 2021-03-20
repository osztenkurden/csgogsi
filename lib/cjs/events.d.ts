import * as I from './interfaces';

export interface Events {
	data: (data: I.CSGO) => void;
	roundEnd: (team: I.Score) => void;
	matchEnd: (score: I.Score) => void;
	kill: (kill: I.KillEvent) => void;
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
