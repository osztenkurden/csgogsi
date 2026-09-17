# API reference

[← README](../README.md) · [Integration guide](integration.md)

This reference describes the current source, including changes since 5.3.0. Full declarations: [raw GSI](../tsc/csgo.d.ts), [parsed data](../tsc/parsed.d.ts), [events](../tsc/events.d.ts), and [extensions](../tsc/interfaces.d.ts).

## Contents

- [Methods](#methods)
- [Instance state](#instance-state)
- [Events](#events)
- [Parsed objects](#parsed-objects)
- [Utility exports](#utility-exports)

## Methods

### `new CSGOGSI(options?: CSGOGSIOptions)`

Creates an independent parser. Optional `bombsiteResolvers` supplies per-map overrides; calling the constructor without arguments retains all defaults. Register listeners and set match rules or metadata before feeding data.

### `digest(raw: GameStateRaw): GameState | null`

Parses a snapshot, updates instance state, synchronously emits inferred events, and returns the parsed snapshot.

- Returns `null` if `allplayers`, `map`, or `phase_countdowns` is absent. This path does not emit events or update state.
- Assumes nested fields used by the parser are present. Malformed input can throw; this is not runtime schema validation.
- Emits `raw` after the initial section check, before parsing and assigning `current`.
- Assigns `current` before gameplay events. During callbacks, `last` still holds the preceding accepted snapshot.
- Emits `data` after gameplay events, then assigns `last = data`. After a successful return, `last` and `current` refer to the same snapshot.
- Does not merge `previously`, reorder packets, deduplicate timestamps, or isolate listener exceptions.

On the first accepted packet, only `raw`, `data`, and (if already in warmup) `warmupStart` are emitted. Other game transitions need a preceding accepted snapshot.

> Treat input and output objects as read-only. Some nested fields, including player statistics, provider data, and round wins, retain input references. Mutating a snapshot can affect later comparisons. A listener that throws interrupts `digest()` before `last` is committed.

### Deprecated legacy ingestion

`digestMIRV(raw, eventType = 'player_death')` is deprecated. It converts legacy kill/hurt input into `kill` / `hurt` events and is retained for compatibility.

### `CSGOGSI.findSite(mapName, position): 'A' | 'B' | null`

Estimates the bombsite using a coordinate threshold. Accepts `number[]` positions. Map names use `normalizeMapName`: the final path segment, lowercase, with an optional `.bsp` or `.vpk` suffix removed; both slash styles work.

```javascript
CSGOGSI.findSite('de_mirage', [0, -1000, 0]); // 'A'
CSGOGSI.findSite('workshop/123/de_mirage', [0, -1000, 0]); // 'A'
CSGOGSI.findSite('de_unknown', [0, 0, 0]); // null
```

Supported keys: `de_mirage`, `de_cache`, `de_overpass`, `de_nuke`, `de_dust2`, `de_inferno`, `de_vertigo`, `de_train`, `de_ancient`, `de_anubis`. These are coordinate heuristics. Use an instance override for custom geometry or maps.

### Instance bombsite lookup

| Method                                       | Behavior                                                        |
| :------------------------------------------- | :-------------------------------------------------------------- |
| `gsi.findSite(mapName, position)`            | Use an instance override, otherwise the built-in resolver       |
| `gsi.setBombsiteResolver(mapName, resolver)` | Register/replace an override; returns `this`                    |
| `gsi.removeBombsiteResolver(mapName)`        | Remove the override and restore built-in lookup; returns `this` |

A `BombsiteResolver` accepts a read-only position array and returns `'A' | 'B' | null`. Returning `null` is authoritative and does not fall back to the built-in resolver. Overrides apply to subsequent `digest()` calls and affect only that instance; `CSGOGSI.findSite()` always uses built-ins. See [custom bombsite examples](integration.md#custom-bombsites-and-map-names).

### Listener methods

The class inherits a typed emitter. Listener calls are synchronous. Ordinary function callbacks receive their internal listener descriptor as `this`; use a closure or an explicitly bound callback to access the parser.

| Method                                                   | Returns          | Purpose                                                                |
| :------------------------------------------------------- | :--------------- | :--------------------------------------------------------------------- |
| `on(name, callback)` / `addListener(name, callback)`     | `this`           | Append a listener                                                      |
| `once(name, callback)`                                   | `this`           | Register a listener for one invocation                                 |
| `prependListener(name, callback)`                        | `this`           | Place a listener first                                                 |
| `prependOnceListener(name, callback)`                    | `this`           | Place a once listener first                                            |
| `off(name, callback)` / `removeListener(name, callback)` | `this`           | Remove one matching registration, searching from the end               |
| `removeAllListeners(name?)`                              | `this`           | Clear one event, or all events when omitted                            |
| `emit(name, ...args)`                               | `boolean`        | Dispatch typed payload arguments; report whether listeners existed |
| `eventNames()`                                           | Event-name array | Names with listeners                                                   |
| `listeners(name)` / `rawListeners(name)`                 | Callback array   | Registered functions, including unwrapped once callbacks               |
| `listenerCount(name)`                                    | `number`         | Number of registrations                                                |

All registration methods emit `newListener` before adding a listener. Actual removals emit `removeListener`, including once consumption and bulk removal. Removing a nonexistent listener emits nothing. Listeners added during a dispatch wait until a later dispatch; removals leave the current dispatch's captured list intact.

`emit` forwards all supplied payload arguments and preserves their count when invoking callbacks. Arrow and explicitly bound callbacks retain their own `this`. Once registrations run at most once even when a callback emits recursively. Bulk removal keeps `removeListener` observers until the other events have been processed.

**Migration from 5.3.0:** `off` removes one duplicate registration per call; `rawListeners` returns callbacks instead of internal descriptors; meta-events cover all registration/removal paths. All instance methods, including `digest`, are prototype methods: bind them when passing them as detached callbacks (for example, `gsi.digest.bind(gsi)`). Max-listener accessors have been removed.

## Instance state

| Property       | Default                       | Meaning                                                      |
| :------------- | :---------------------------- | :----------------------------------------------------------- |
| `regulationMR` | `12`                          | Rounds per regulation half                                   |
| `overtimeMR`   | `3`                           | Rounds per overtime half                                     |
| `teams`        | `{ left: null, right: null }` | Metadata by screen orientation                               |
| `players`      | `[]`                          | Metadata matched by `steamid`                                |
| `damage`       | `[]`                          | `RoundDamage[]`: `{ round, players: [{ steamid, damage }] }` |
| `current`      | `undefined`                   | Snapshot being dispatched, then most recently accepted       |
| `last`         | `undefined`                   | Comparison snapshot, updated at the end of `digest()`        |

Set MR values before the first packet. They affect history and overtime events, not server rules. There is no explicit `reset()` API; create a new instance when switching unrelated feeds.

## Events

Names are case-sensitive. These tables describe runtime payloads; bomb-player arguments are typed as `Player | undefined`.

### Data and scoring

| Event      | Callback arguments | Trigger                                                                      |
| :--------- | :----------------- | :--------------------------------------------------------------------------- |
| `raw`      | `raw: GameStateRaw`     | Payload passes the three-section check                                       |
| `data`     | `data: GameState`       | Snapshot parsed and gameplay events dispatched                               |
| `roundEnd` | `event: RoundEndEvent`     | `round.win_team` appears after a round without it                            |
| `mapEnd` | `event: RoundEndEvent`     | Detected round end also enters `map.phase = 'gameover'`                      |
| `matchEnd` (deprecated) | `event: RoundEndEvent` | Same trigger and payload object as `mapEnd` |
| `overtime` | None               | Detected round end ties both teams at `regulationMR`, without ending the map |
| `mvp`      | `player: Player`   | First player found whose MVP count increased                                 |

`roundEnd` increments the winner's parsed score when the raw score has not yet increased. This affects the returned map and later `data` callback. `mapEnd` denotes a map ending, not an entire best-of series. The deprecated `matchEnd` event fires first with the same payload object for compatibility. Subscribe to one name to avoid handling the same map end twice.

`overtime` reports entry at the regulation tie, not every subsequent overtime. It is suppressed for a map ending in a draw at that score.

### Round starts and observer targets

| Event                  | Callback arguments                         | Trigger                                                   |
| :--------------------- | :----------------------------------------- | :-------------------------------------------------------- |
| `roundStart`           | None                                       | A known non-live round becomes live while the map is live |
| `observerTargetChange` | `from: Player \| null, to: Player \| null` | The resolved observed player's Steam ID changes           |

`roundStart` has no arguments; read `gsi.current.map.round + 1` for the one-based round number, including overtime. A pause/resume within a live round does not start another round. Observer callbacks receive the previous and current resolved player; `null` represents a free camera or a target absent from the player list. Two unresolved targets do not produce a change.

Neither event fires on the first accepted packet or across different normalized map names. Missing prior round state does not infer a round start. Repeated snapshots of the same live round/target do not repeat these events. Both are dispatched before `data`, with `current` already assigned.

### Phases and breaks

| Event                                   | Callback arguments                                         | Trigger                                                         |
| :-------------------------------------- | :--------------------------------------------------------- | :-------------------------------------------------------------- |
| `phaseChange`                           | `from, to: NonNullable<GameState['phase_countdowns']['phase']>` | Countdown phase changes between two known values                |
| `warmupStart` / `warmupEnd`             | None                                                       | Enter/leave map phase `warmup`                                  |
| `intermissionStart` / `intermissionEnd` | None                                                       | Enter/leave map phase `intermission`                            |
| `freezetimeStart` / `freezetimeEnd`     | None                                                       | Enter/leave countdown phase `freezetime`                        |
| `pauseStart` / `pauseEnd`               | None                                                       | Enter/leave countdown phase `paused`; both values must be known |
| `timeoutStart`                          | `team: Team`                                               | Enter a timeout from a known non-timeout phase                  |
| `timeoutEnd`                            | None                                                       | Leave a timeout for a known non-timeout phase                   |

Warmup start also fires on the first accepted warmup packet. Warmup end never fires on the first packet. Direct `timeout_ct` → `timeout_t` emits `phaseChange`, but neither timeout event. Unlike pauses, freezetime transitions do not require both phase values to be known.

### Bomb actions

| Event            | Callback arguments                             | Trigger                                                    |
| :--------------- | :--------------------------------------------- | :--------------------------------------------------------- |
| `bombPlantStart` | Previous bomb's `player`, possibly `undefined` | Enter `planting` from another bomb state                   |
| `bombPlantStop`  | Previous bomb's `player`, possibly `undefined` | Leave `planting`, except for `planted` or `defusing`       |
| `bombPlant`      | Previous bomb's `player`, possibly `undefined` | `planting` or `carried` → `planted`                        |
| `bombExplode`    | None                                           | Enter `exploded`, including from a snapshot without a bomb |
| `bombDefuse`     | Previous bomb's `player`, possibly `undefined` | Enter `defused`                                            |
| `defuseStart`    | Current bomb's `player`, possibly `undefined`  | Enter `defusing`                                           |
| `defuseStop`     | Previous bomb's `player`, possibly `undefined` | Leave `defusing`, except for `defused` or `exploded`       |

Except for the explosion case, both snapshots must contain a bomb. Skipped intermediate states may prevent events. The main checks form an ordered `if`/`else if` chain; unusual transitions can select an earlier action instead of a later one.

### Listener lifecycle

`newListener` and `removeListener` receive `(eventName, listener)`. See [listener methods](#listener-methods) for registration-path differences.

## Parsed objects

### `GameState` — the snapshot

| Field              | Type                         | Notes                                                  |
| :----------------- | :--------------------------- | :----------------------------------------------------- |
| `provider`         | `Provider`                   | Original object; Steam ID is a string                  |
| `map`              | `MapState`                        | Teams, scores, and reconstructed history               |
| `round`            | `RoundState \| null`              | Current round, when available                          |
| `player`           | `Player \| null`             | Observed player matched against `allplayers`           |
| `players`          | `Player[]`                   | Parsed `allplayers` entries                            |
| `observer`         | `Observer`                   | Optional activity, spectarget, position, and forward   |
| `bomb`             | `Bomb \| null`               | Bomb, when available                                   |
| `grenades`         | `Grenade[]`                  | Empty if no grenade section exists                     |
| `phase_countdowns` | `GameState['phase_countdowns']`   | Optional phase, numeric seconds, optional timeout team |
| `auth`             | Optional `{ token: string }` | Copied through; not validated                          |

`previously` exists in the declaration but is not populated by `digest()`. `Provider.name` is declared as the legacy literal `'Counter-Strike: Global Offensive'`; the parser copies the provider without runtime name validation. Other provider fields are `appid: 730`, numeric `version` and `timestamp`, and `steamid: string`.

### Players and weapons

| Field                           | Type / behavior                                             |
| :------------------------------ | :---------------------------------------------------------- |
| `steamid`                       | String from the `allplayers` key                            |
| `name`, `defaultName`           | Display name with optional override, and original game name |
| `clan`, `observer_slot`         | Optional string and number                                  |
| `team`                          | Parsed `Team` reference                                     |
| `stats`                         | Numeric `kills`, `assists`, `deaths`, `mvps`, `score`       |
| `state`                         | Original state, default `smoked: 0`, calculated `adr`       |
| `weapons`                       | `Weapon[]`; original dictionary keys become `id`            |
| `position`, `forward`           | `number[]`, from comma-space-separated strings              |
| `avatar`, `country`, `realName` | `string \| null`, from metadata                             |
| `extra`                         | `Record<string, string>`, defaults to `{}`                  |

State includes numeric `health`, `armor`, `flashed`, `smoked`, `burning`, `money`, `round_kills`, `round_killhs`, `round_totaldmg`, `equip_value`, `adr`; boolean `helmet`; and optional boolean `defusekit`. The declaration's exact spelling is `round_killhs`.

ADR is floored average damage from observed earlier rounds, divided by `raw.map.round || 1`. It starts at zero and cannot recover damage before the parser connected. Damage history clears on map-name changes, warmup countdowns, or round-zero freezetime.

`Weapon` has `id`, `name`, `paintkit`, `state` (`active`, `holstered`, `reloading`), optional `type`, and optional numeric `ammo_clip`, `ammo_clip_max`, `ammo_reserve`. `WeaponType` covers Knife, Pistol, Grenade, Rifle, SniperRifle, C4, Submachine Gun, Shotgun, and Machine Gun.

### Teams, map, and rounds

`Team` contains numeric `score`, `consecutive_round_losses`, `timeouts_remaining`, `matches_won_this_series`; `name`; `side: 'CT' | 'T'`; `orientation: 'left' | 'right'`; nullable `logo`, `country`, `id`; and `extra: Record<string, string>`.

Left/right is inferred by comparing one nonzero observer slot from each side. CT defaults to left if that comparison cannot be made. Extensions attach to orientation, not a fixed side or stable roster identity.

`MapState` contains `mode`, `name`, `phase` (`warmup`, `live`, `intermission`, `gameover`), `round`, `team_ct`, `team_t`, numeric `num_matches_to_win_series`, `current_spectators`, `souvenirs_total`, raw `round_wins`, and parsed `rounds: RoundResult[]`.

Each `RoundResult` has a one-based `round`, winning `side` at the time, `outcome`, and `team` resolved to a current team object using half lengths. Missing outcomes are skipped rather than reconstructed from scores. Outcomes are `ct_win_elimination`, `t_win_elimination`, `ct_win_time`, `ct_win_defuse`, or `t_win_bomb`.

`RoundState` has `phase: 'freezetime' | 'live' | 'over'`, optional `bomb: 'planted' | 'exploded' | 'defused'`, and optional `win_team: 'CT' | 'T'`.

`RoundEndEvent` contains `winner: Team`, `loser: Team`, `map: MapState`, and `mapEnd: boolean`.

### Bomb, observer, and countdowns

- **Bomb:** state (`carried`, `planted`, `dropped`, `defused`, `defusing`, `planting`, `exploded`), `position: number[]`, optional numeric `countdown`, optional resolved `player`, and `site: 'A' | 'B' | null`. Site estimation runs only for planting, planted, defusing, or defused states.
- **Observer:** optional `activity: 'playing' | 'textinput' | 'menu'`, `spectarget` (`'free'` or Steam ID string), and numeric-array `position` / `forward`.
- **Countdowns:** optional `phase`, numeric `phase_ends_in`, optional `timeout_team`. Phases: `freezetime`, `bomb`, `warmup`, `live`, `over`, `defuse`, `paused`, `timeout_ct`, `timeout_t`.

### Grenades

All variants have `id`, `owner: string`, and numeric `lifetime`. The owner remains an identifier, not a resolved `Player`.

| `type`                          | Additional fields                                          |
| :------------------------------ | :--------------------------------------------------------- |
| `smoke`, `decoy`                | Numeric-array `position`, `velocity`; numeric `effecttime` |
| `frag`, `firebomb`, `flashbang` | Numeric-array `position`, `velocity`                       |
| `inferno`                       | `flames: { id: string; position: number[] }[]`             |

## Utility exports

| Export                                                                    | Purpose                                                            |
| :------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| `mapSteamIDToPlayer(players, teams, extensions)`                          | Returns a `(steamid) => Player` mapper; key must exist             |
| `parseTeam(team, orientation, side, extension)`                           | Converts a team and applies metadata                               |
| `getHalfFromRound(round, regulationMR, mr)`                               | Returns `1` or `2` within regulation or the current overtime block |
| `didTeamWinThatRound(team, round, wonBy, currentRound, regulationMR, mr)` | Resolves historical ownership from sides and half numbers          |

`RoundDamage`, `PhaseCountdown`, `Bombsite`, `BombsiteResolver`, `CSGOGSIOptions`, and the domain types listed in the [root exports](../tsc/index.ts) are available as types. `normalizeMapName(mapName)` is also exported as a runtime helper. `Callback` and `EventNames` remain internal declaration helpers. `parseGrenades` and `getRoundWin` are internal utilities, not root exports.

### Deprecated type names

The older names remain available as deprecated aliases with the same payload shapes. They will be removed in the next major version. New code should use:

| Deprecated name | Replacement |
| :--- | :--- |
| `Score` | `RoundEndEvent` |
| `CSGO` | `GameState` |
| `CSGORaw` | `GameStateRaw` |
| `Phase` | `PhaseCountdown` |
| `PhaseRaw` | `PhaseCountdownRaw` |
| `Map` | `MapState` |
| `Round` | `RoundState` |
| `RoundInfo` | `RoundResult` |
| `RawKill` | `KillEventRaw` |
| `RawHurt` | `HurtEventRaw` |
| `DigestMirvType` | `MirvDigestResult` |
| `FragOrFireBombOrFlashbandGrenade` | `FragOrFireBombOrFlashbangGrenade` |
| `FragOrFireBombOrFlashbandGrenadeRaw` | `FragOrFireBombOrFlashbangGrenadeRaw` |
