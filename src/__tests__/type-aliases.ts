import type * as GSI from '../index';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

// Legacy imports must retain exactly the same payload types as the new names.
export type DeprecatedAliases = [
	Assert<Equal<GSI.Score, GSI.RoundEndEvent>>,
	Assert<Equal<GSI.CSGO, GSI.GameState>>,
	Assert<Equal<GSI.CSGORaw, GSI.GameStateRaw>>,
	Assert<Equal<GSI.Phase, GSI.PhaseCountdown>>,
	Assert<Equal<GSI.PhaseRaw, GSI.PhaseCountdownRaw>>,
	Assert<Equal<GSI.Map, GSI.MapState>>,
	Assert<Equal<GSI.Round, GSI.RoundState>>,
	Assert<Equal<GSI.RoundInfo, GSI.RoundResult>>,
	Assert<Equal<GSI.RawKill, GSI.KillEventRaw>>,
	Assert<Equal<GSI.RawHurt, GSI.HurtEventRaw>>,
	Assert<Equal<GSI.DigestMirvType, GSI.MirvDigestResult>>,
	Assert<Equal<GSI.FragOrFireBombOrFlashbandGrenade, GSI.FragOrFireBombOrFlashbangGrenade>>,
	Assert<Equal<GSI.FragOrFireBombOrFlashbandGrenadeRaw, GSI.FragOrFireBombOrFlashbangGrenadeRaw>>
];

export type PublicPayloads = [
	Assert<Equal<ReturnType<GSI.CSGOGSI['digest']>, GSI.GameState | null>>,
	Assert<Equal<Parameters<GSI.CSGOGSI['digest']>[0], GSI.GameStateRaw>>,
	Assert<Equal<Parameters<GSI.Events['roundEnd']>[0], GSI.RoundEndEvent>>,
	Assert<Equal<Parameters<GSI.Events['matchEnd']>[0], GSI.RoundEndEvent>>,
	Assert<Equal<ReturnType<GSI.CSGOGSI['digestMIRV']>, GSI.MirvDigestResult>>
];
