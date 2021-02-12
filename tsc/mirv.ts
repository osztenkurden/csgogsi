export interface RawKill {
	name: 'player_death';
	clientTime: number;
	keys: {
		userid: {
			value: number;
			xuid: string;
		};
		attacker: {
			value: number;
			xuid: string;
		};
		assister: {
			value: number;
			xuid: string;
		};
		assistedflash: boolean;
		weapon: string;
		weapon_itemid: string;
		weapon_fauxitemid: string;
		weapon_originalowner_xuid: string;
		headshot: boolean;
		dominated: number;
		revenge: number;
		wipe: number;
		attackerblind: boolean;
		thrusmoke: boolean;
		noscope: boolean;
		penetrated: number;
		noreplay: boolean;
	};
}
