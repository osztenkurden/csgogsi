import * as I from './interfaces';
export interface Events {
    data: (data: I.CSGORaw) => void;
    roundEnd: (team: I.Team) => void;
    bombPlant: () => void;
    bombExplode: () => void;
    bombDefuse: () => void;
}
