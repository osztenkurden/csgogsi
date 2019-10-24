import * as I from './interfaces';

export interface Events {
    data: (data: I.CSGO) => void,
    roundEnd: (team: I.Team) => void,
    matchEnd: (score: I.FinalScore) => void,
    /*timeoutStart: (team: any) => void,
    timeoutEnd: (team: any) => void,
    roundStart: (round: number) => void,
    intermissionStart: () => void,
    intermissionEnd: () => void,
    warmupStart: () => void,
    warmupEnd: () => void,
    freezetimeStart: () => void,
    freezetimeEnd: () => void,*/
    bombPlant: (player: I.Player) => void,
    bombExplode: () => void,
    bombDefuse: (player: I.Player) => void,
    
    
}