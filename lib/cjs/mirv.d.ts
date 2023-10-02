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

export interface RawHurt {
	name: 'player_hurt';
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
		health: number;
		armor: number;
		weapon: string;
		dmg_health: number;
		dmg_armor: number;
		hitgroup: number;
	};
}
