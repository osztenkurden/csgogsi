# CSGOGSI API — Code Analysis & Improvement Proposal

> Analysis of [`osztenkurden/csgogsi`](https://github.com/osztenkurden/csgogsi) v4.1.0
> A TypeScript/Node.js library for parsing CS2 Game State Integration (GSI) data

---

## 1. Overview of the Existing API

`csgogsi` is a well-structured TypeScript library that wraps Valve's GSI HTTP endpoint. At its core it:

-   Accepts raw JSON from CS2's GSI system via `digest(data)`
-   Normalizes and enriches the data (team metadata, player enrichment, round history)
-   Emits high-level events (`roundEnd`, `bombPlant`, `kill`, `mvp`, etc.) via a custom EventEmitter implementation (not based on Node.js `EventEmitter` — the class implements the interface from scratch using an internal `Map<EventNames, EventDescriptor[]>`, making it browser-compatible)
-   Provides a secondary `digestMIRV()` path for MIRV PGL kill/hurt data

The library is lean (~66 kB total across ESM + CJS + declarations), has 100% test coverage, and is completely dependency-free at runtime (zero production dependencies).

---

## 2. Strengths

-   **TypeScript-first** — all parsed objects are fully typed, including generic typed event callbacks (`on<K>()` with `Callback<K>` resolution), making HUD development in strict TS projects ergonomic.
-   **Event-driven design** — mirrors how CS2 GSI actually works (stateful diffs), so listeners are the natural abstraction. Delta detection compares `this.last` to `this.current` each tick.
-   **Browser-compatible** — does not depend on Node.js `EventEmitter`; the class implements the full EventEmitter interface from scratch using an internal `Map`, so it works in browser environments.
-   **Round history reconstruction** — `map.rounds` with configurable `regulationMR` (default 15) and `overtimeMR` (default 3) is genuinely useful and rarely done by competing libraries.
-   **Rich data normalization** — all string coordinates parsed to `number[]`, countdowns to `number`, grenades fully typed with subtypes (smoke, decoy, frag, firebomb, flashbang, inferno), and ADR calculated from historical per-round damage tracking.
-   **MIRV integration** — `digestMIRV()` is a smart addition for esports production setups that use MIRV PGL alongside standard GSI.
-   **Static `findSite()`** — guesses bombsite from a 3D coordinate across 10 maps; handles workshop map prefixes.
-   **Ecosystem packages** — `csgogsi-socket`, `csgogsi-generator`, and `dota2gsi` show intentional, composable design.

---

## 3. Issues & Code Smells

### 3.1 ~~Raw JSON Pre-Processing Leaks into Consumer Code~~ (Partially Resolved)

> **Update:** The current README (v4.1.0) no longer shows the regex workaround. The example now simply does `GSI.digest(req.body)` with Express's JSON body parser. However, `digest()` still only accepts `CSGORaw` (a typed object), not a raw string. If consumers encounter CS2/CS:GO payloads with integer SteamIDs in `player`/`owner` fields, they must still handle normalization themselves before passing to `digest()`. Accepting a `string | CSGORaw` parameter and internalizing the regex fix could still be a quality-of-life improvement, but the README no longer actively promotes the workaround pattern.

**Remaining improvement opportunity:**

```typescript
// Accept string input and normalize internally
digest(rawData: string | CSGORaw): CSGO | null {
  const data = typeof rawData === 'string' ? CSGOGSI.normalizeRaw(rawData) : rawData;
  // ... rest of parsing
}
```

---

### 3.2 ~~No Authentication Support~~ (Partially Resolved — Auth Passthrough Exists)

> **Update:** The library **does** pass through the `auth` field. Both `CSGORaw` and the parsed `CSGO` type include `auth?: { token: string }`. The raw `auth` object is forwarded as-is in `digest()` (`auth: raw.auth`), so consumers can already access `data.auth?.token` in their `data` event handler. What is _missing_ is built-in **validation** — the library does not reject or filter payloads based on an expected token.

**Remaining improvement opportunity — built-in token validation:**

```typescript
const GSI = new CSGOGSI({ authToken: 'mySecretToken' });
// or per-team:
const GSI = new CSGOGSI({ authTokens: ['team1_token', 'team2_token'] });

GSI.on('authFailure', (token: string) => {
	/* log / reject */
});
```

---

### 3.3 Bomb Countdown Is an Estimate

> **Correction:** The `Bomb.countdown` field is **not** a raw string in the parsed output — the library already converts it to a `number` via `parseFloat(bomb.countdown)` during `digest()`. The raw `BombRaw.countdown` is a string, but the parsed `Bomb.countdown` is `number | undefined`. However, the core issue remains: the value can become stale between GSI heartbeats, and there is no interpolation or tick event.

**Proposed addition:**

```typescript
// Emits every ~100ms while bomb is planted, with corrected remaining time
GSI.on('bombTimerTick', (remaining: number) => {
	console.log(`${remaining.toFixed(1)}s remaining`);
});
```

Implementation would use a `setInterval` started on `bombPlant` and cleared on `bombDefuse`/`bombExplode`, seeded from the first countdown value.

---

### 3.4 `findSite()` is Fragile and Not Extensible

`CSGOGSI.findSite(mapName, position)` returns `A`, `B`, or `null`. It currently supports 10 maps (`de_mirage`, `de_cache`, `de_overpass`, `de_nuke`, `de_dust2`, `de_inferno`, `de_vertigo`, `de_train`, `de_ancient`, `de_anubis`) using single-axis threshold checks (e.g., `position[1] < -600` for Mirage site A). It also handles workshop map prefixes by stripping the path. However, there is no way to extend it with custom maps, no indication of confidence, and it is a `static` method — meaning the GSI instance has no state to improve the guess over time.

**Proposed improvement:**

```typescript
// Allow registering custom site geometries
GSI.registerSite('de_custom', 'A', { min: [-200, 100, -300], max: [400, 600, 200] });
GSI.registerSite('de_custom', 'B', { min: [1000, -200, -300], max: [1600, 400, 200] });

// Returns confidence alongside the guess
const result = GSI.findSite('de_dust2', [512, 256, 64]);
// => { site: 'A', confidence: 0.87 }
```

---

### 3.5 No `playerKill` / `playerDeath` Distinction Without MIRV

There is no `kill` or `hurt` event from standard GSI data — these events are **exclusively** emitted by `digestMIRV()`, which requires a separate MIRV PGL integration. Without MIRV, the only death-related signal available is comparing player `state.health` or `stats.kills`/`stats.deaths` between successive `data` events. The library does detect MVP changes (via `stats.mvps` delta), but applies no similar delta logic for kills/deaths. This is a significant gap for standard (non-MIRV) deployments.

---

### 3.6 Missing `defuseStop` Motivation

`defuseStop` fires when defusing stops without completion, but the callback signature `(player: Player) => {}` doesn't clarify _why_ it stopped (death vs. interruption). Adding a `reason` field would let overlays display contextual messaging.

---

### 3.7 No CS2 (Counter-Strike 2) Support or Migration Path

The library targets CS:GO (appid 730). CS2 (appid 730, different build) has a largely compatible GSI format but with schema differences (e.g., the `grenades` structure changed). There is no version detection or adapter layer.

---

## 4. Proposed New Features

### 4.1 Player State Delta Events

Currently, state changes must be polled via the `data` event. Granular player-state change events would dramatically simplify overlay logic.

```typescript
// Fires when a specific player's health changes
GSI.on('playerHealthChange', (player: Player, prev: number, next: number) => {});

// Fires when any player's armor, kit, or money changes
GSI.on('playerStateChange', (player: Player, changed: Partial<PlayerState>) => {});

// Fires when a player picks up, drops, or switches a weapon
GSI.on('playerWeaponChange', (player: Player, event: WeaponChangeEvent) => {});
```

---

### 4.2 Grenade Tracking Events

> **Correction:** The library **does** parse grenades. The `grenades` field from the raw GSI payload is fully parsed into a typed `Grenade[]` array (with subtypes `DecoySmokeGrenade`, `FragOrFireBombOrFlashbandGrenade`, `InfernoGrenade`) and included in every `CSGO` parsed object. String coordinates are converted to `number[]`, string lifetimes/effecttimes to `number`, and inferno flame maps to `{id, position}[]` arrays. What is missing is **lifecycle events** — no events are emitted when grenades appear, detonate, or expire.

```typescript
GSI.on('grenadeThrown', (player: Player, grenade: Grenade) => {});
GSI.on('grenadeDetonated', (grenade: Grenade) => {});
GSI.on('grenadeExpired', (grenade: Grenade) => {}); // decoy / smoke fade
```

---

### 4.3 Economy Analysis Helpers

Round economy is a critical broadcast element. The library already exposes player `money` and `equip_value` but provides no derived economy classification.

```typescript
// Derived from per-player equip_value and team loss bonus
GSI.on('economyUpdate', (team: Team, economy: EconomyState) => {});

interface EconomyState {
	type: 'full-buy' | 'force-buy' | 'eco' | 'half-buy';
	averageEquipValue: number;
	totalEquipValue: number;
	lossBonus: number; // CS:GO consecutive loss bonus value
}
```

---

### 4.4 Match Timeline / Replay API

Overlay developers often need to replay or audit recent game events (e.g., a "round recap" widget). A built-in event log with configurable retention would enable this.

```typescript
// Note: CSGOGSI constructor currently takes no arguments —
// this would require adding an options parameter
const GSI = new CSGOGSI({ historySize: 200 });

// Query past events
const lastRound = GSI.history.getLastRound();
const kills = GSI.history.getKills({ round: 12, side: 'CT' });
const timeline = GSI.history.export(); // full JSON

// 'replayEvent' fires for each stored event when replaying
GSI.replay(timeline);
```

---

### 4.5 Middleware Pipeline

Allow raw GSI data to be transformed before it reaches the event engine—useful for injecting player metadata from external sources (e.g., HLTV, Steam profiles).

```typescript
GSI.use(async (data, next) => {
	// Enrich players with Steam avatar URLs
	for (const player of data.players) {
		player.avatar = await fetchSteamAvatar(player.steamid);
	}
	return next(data);
});
```

---

### 4.6 Observing & Spectator Utilities

The `Observer` object exposes the spectated SteamID but provides no convenience API for HUDs that need to react to observer switches.

```typescript
GSI.on('observerSwitch', (prev: Player | null, next: Player | null) => {});
GSI.on('observerModeChange', (mode: 'free' | 'player') => {});

// Get the currently observed player with enriched data
const observed = GSI.getObservedPlayer();
```

---

### 4.7 CS2 Compatibility Layer

A shim/adapter that normalizes CS2 GSI payloads to the existing schema, gated behind a constructor flag:

```typescript
const GSI = new CSGOGSI({ game: 'cs2' }); // or 'csgo' (default)
// Internally applies CS2→CSGO schema normalization before parsing
```

---

### 4.8 ~~Typed `on()` Overloads (Improved TypeScript DX)~~ — ALREADY IMPLEMENTED

> **Update:** This is fully implemented in the current codebase. The `Events` interface in `tsc/events.d.ts` maps all 20+ event names to their exact typed callback signatures (e.g., `bombPlant: (player: Player) => void`, `roundEnd: (team: Score) => void`, `kill: (kill: KillEvent) => void`). The `on()` method uses TypeScript generics — `on<K extends EventNames>(eventName: K, listener: Callback<K>)` — where `Callback<K>` resolves to `Events[K] | EmptyListener` for known event names. This gives full auto-complete and type-safe callbacks. The same applies to `once()`, `off()`, `prependListener()`, and `prependOnceListener()`.
>
> No action needed.

---

### 4.9 Built-in Express / HTTP Adapter

Moving the boilerplate server setup into an optional export would reduce setup friction:

```typescript
import { CSGOGSI, createGSIServer } from 'csgogsi';

const GSI = new CSGOGSI();
const server = createGSIServer(GSI, { port: 3000, authToken: 'secret' });
server.start();

GSI.on('roundEnd', score => console.log(score.winner.name));
```

This would not add Express as a required dependency—it could accept any compatible HTTP handler or ship with a bare `http` module implementation.

---

### 4.10 `off()` and `once()` Documentation

The library states it "implements standard Event Emitter interfaces" but the README documents only `on()`. The full EventEmitter API is implemented (`on`, `once`, `off`, `addListener`, `removeListener`, `removeAllListeners`, `prependListener`, `prependOnceListener`, `emit`, `eventNames`, `getMaxListeners`, `setMaxListeners`, `listenerCount`, `listeners`, `rawListeners`) and fully tested (116 test cases), but none of these except `on()` appear in the README. Explicit examples of `off()` and `once()` would reduce confusion for HUD developers who manage lifecycle carefully. Additionally, the `bombPlantStop` event is implemented in code and typed in `events.d.ts` but missing from the README's Events table.

---

## 5. Prioritized Roadmap

| Priority  | Item                                      | Complexity | Impact                                                                                 |
| --------- | ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| ~~Done~~  | ~~Typed `on()` overloads (§4.8)~~         | ~~Medium~~ | ~~High~~ — already implemented                                                         |
| 🔴 High   | Internalize raw JSON normalization (§3.1) | Low        | Medium — README no longer promotes the workaround, but string input support would help |
| 🔴 High   | Auth token validation (§3.2)              | Low        | High — auth passthrough exists, validation missing                                     |
| 🟡 Medium | Player state delta events (§4.1)          | Medium     | High — eliminates most manual diffing                                                  |
| 🟡 Medium | Grenade lifecycle events (§4.2)           | Medium     | High — parsing exists, events missing                                                  |
| 🟡 Medium | Observer switch events (§4.6)             | Low        | Medium — common HUD requirement                                                        |
| 🟡 Medium | CS2 compatibility layer (§4.7)            | High       | High — future-proofs the library                                                       |
| 🟢 Low    | Economy analysis helpers (§4.3)           | Medium     | Medium — useful for broadcast overlays                                                 |
| 🟢 Low    | Match timeline / replay (§4.4)            | High       | Medium — niche but powerful                                                            |
| 🟢 Low    | Middleware pipeline (§4.5)                | Medium     | Medium — enables external enrichment                                                   |
| 🟢 Low    | Built-in HTTP adapter (§4.9)              | Low        | Medium — lowers barrier to entry                                                       |
| 🟢 Low    | `findSite()` extensibility (§3.4)         | Medium     | Low-Medium — helps custom map developers                                               |

---

## 6. Example: Improved API Surface (Proposed)

> **Note:** Some items below already work today (marked with ✅). Others are proposed additions.

```typescript
import { CSGOGSI, createGSIServer } from 'csgogsi'; // createGSIServer: proposed

const GSI = new CSGOGSI();
// ✅ Typed callbacks already work today:
GSI.on('bombPlant', player => {
	// player is typed as Player (not any)
	console.log(`${player.name} planted on ${CSGOGSI.findSite('de_mirage', player.position)}`);
});

// ✅ Auth token is already available in parsed output:
GSI.on('data', data => {
	if (data.auth?.token !== 'expected_secret') return; // manual validation
});

// ✅ Grenades are already parsed:
GSI.on('data', data => {
	data.grenades.forEach(g => console.log(g.type, g.lifetime));
});

// Proposed — new events (not yet implemented):
GSI.on('playerHealthChange', (player, prev, next) => {
	if (next === 0) console.log(`${player.name} died`);
});

GSI.on('observerSwitch', (prev, next) => {
	console.log(`Spectator moved from ${prev?.name} to ${next?.name}`);
});
```

---

## 7. Conclusion

`csgogsi` is a mature, well-tested foundation. Several concerns from the initial analysis have been addressed or were inaccurate: typed event overloads are already fully implemented via generics, auth tokens are passed through (though not validated), the bomb countdown is already parsed to `number`, grenades are fully parsed into typed arrays, and the README no longer promotes the raw JSON regex workaround. The remaining gaps are in **event granularity** (no player state deltas, no grenade lifecycle events, no economy helpers, no kill/death detection without MIRV) and **extensibility** (no auth validation, no middleware pipeline, no observer switch events, no custom map support for `findSite()`). Addressing auth validation and grenade/observer events would have the highest impact for new adopters and production broadcast tooling.

---

_Analysis prepared March 2026 · Updated against csgogsi v4.1.0 source code_
