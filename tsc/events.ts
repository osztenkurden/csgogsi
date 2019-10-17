import * as I from './interfaces';

export interface Events {
    data: (data: I.CSGO) => void,
    roundEnd: (team: I.Team) => void,
    /*timeoutStart: (team: any) => void,
    timeoutEnd: (team: any) => void,
    roundStart: (round: number) => void,
    intermissionStart: () => void,
    intermissionEnd: () => void,
    warmupStart: () => void,
    warmupEnd: () => void,
    freezetimeStart: () => void,
    freezetimeEnd: () => void,*/
    bombPlant: () => void,
    bombExplode: () => void,
    bombDefuse: () => void,
    
    
}