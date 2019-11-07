import * as I from './interfaces';
export interface Events {
    data: (data: I.CSGO) => void;
    roundEnd: (team: I.Score) => void;
    matchEnd: (score: I.Score) => void;
    kill: (kill: I.KillEvent) => void;
    bombPlant: (player: I.Player) => void;
    bombExplode: () => void;
    bombDefuse: (player: I.Player) => void;
}
