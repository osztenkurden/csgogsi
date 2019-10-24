import * as I from './interfaces';
export interface Events {
    data: (data: I.CSGO) => void;
    roundEnd: (team: I.Team) => void;
    matchEnd: (score: I.FinalScore) => void;
    bombPlant: (player: I.Player) => void;
    bombExplode: () => void;
    bombDefuse: (player: I.Player) => void;
}
