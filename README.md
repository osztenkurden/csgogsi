<div align="center">

# CS2 GSI Digest

**Turn Counter-Strike game state into typed snapshots and match events.**

[![npm version](https://img.shields.io/npm/v/csgogsi?color=cb6b26)](https://www.npmjs.com/package/csgogsi)
[![CI](https://github.com/osztenkurden/csgogsi/actions/workflows/main.yaml/badge.svg)](https://github.com/osztenkurden/csgogsi/actions/workflows/main.yaml)
[![Downloads](https://img.shields.io/npm/dm/csgogsi)](https://www.npmjs.com/package/csgogsi)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Quick start](#quick-start) · [API reference](docs/api.md) · [Integration guide](docs/integration.md) · [Changelog](CHANGELOG.md)

</div>

`csgogsi` parses CS:GO / CS2 Game State Integration (GSI) payloads for spectator HUDs, broadcast overlays, and match tooling. Feed it game snapshots; receive normalized players, teams, weapons, grenades, and events such as `roundEnd`, `bombPlant`, and `phaseChange`.

| Game state                         | Match context                          | Integration                        |
| :--------------------------------- | :------------------------------------- | :--------------------------------- |
| Numeric positions and countdowns   | Round history with side swaps          | Round and observer events          |
| Player, weapon, and grenade arrays | MR12 by default; configurable overtime | Player and team metadata overrides |
| Bomb carrier and estimated site    | Accumulated damage and ADR             | Custom bombsite resolvers          |

```text
CS2 spectator ── HTTP JSON ──► your receiver ── digest() ──► snapshots + events
```

> **Before you start:** the parser needs `allplayers`, `map`, and `phase_countdowns`. Use a spectator/observer feed with the required data enabled. The package supplies the parser; your application supplies the HTTP receiver and game configuration.

## Quick start

### 1. Install

Requires **Node.js 22.12.0 or newer**. Version 5 is **ESM-only** and includes TypeScript declarations.

```sh
npm install csgogsi express
```

Express is used only by this example. The library itself has no declared runtime dependencies.

### 2. Receive game state

Save as `server.ts`:

```javascript
import express from 'express';
import { CSGOGSI } from 'csgogsi';

const app = express();
const gsi = new CSGOGSI();

app.use(express.json({ limit: '1mb' }));

gsi.on('data', data => {
	const { team_ct: ct, team_t: t } = data.map;
	console.log(`${ct.name} ${ct.score} : ${t.score} ${t.name}`);
});

gsi.on('roundEnd', ({ winner }) => {
	console.log(`${winner.name} won the round`);
});

gsi.on('bombPlant', player => {
	console.log(`${player?.name ?? 'Unknown player'} planted the bomb`);
});

app.post('/', (req, res, next) => {
	try {
		// null means the payload lacks the required spectator sections.
		gsi.digest(req.body);
		res.sendStatus(200);
	} catch (error) {
		next(error);
	}
});

app.listen(3000, '127.0.0.1', () => {
	console.log('GSI receiver: http://127.0.0.1:3000/');
});
```

```sh
node server.ts
```

### 3. Connect the game

Copy [gamestate_integration_csgogsi.cfg](examples/gamestate_integration_csgogsi.cfg) into your CS2 installation's `game/csgo/cfg` directory, then restart the game and spectate a match. Its receiver URL matches the example above.

See the [integration guide](docs/integration.md) for data requirements, authentication, browser applications, and troubleshooting.

## Work with parsed data

```typescript
import { CSGOGSI, type CSGORaw } from 'csgogsi';

const gsi = new CSGOGSI();

function receive(raw: CSGORaw) {
	const data = gsi.digest(raw);
	if (!data) return;

	for (const player of data.players) {
		const activeWeapon = player.weapons.find(weapon => weapon.state === 'active');
		console.log(player.name, player.state.health, activeWeapon?.name);
	}

	console.log(data.bomb?.site); // 'A', 'B', null, or undefined when there is no bomb
}
```

Callbacks are synchronous. Treat snapshots as read-only: the parser retains object references for its next comparison. Use one instance per game feed.

## Configure your match

```javascript
const gsi = new CSGOGSI();

gsi.regulationMR = 12; // Rounds per regulation half; default 12
gsi.overtimeMR = 3; // Rounds per overtime half; default 3

// For an MR15 match, set regulationMR = 15 before the first digest.
```

These values control round-history attribution and overtime detection; they do not configure the game server. See [metadata overrides](docs/integration.md#player-and-team-metadata).

## Drive your overlay

```javascript
gsi.on('roundStart', () => console.log(`Round ${gsi.current.map.round + 1} is live`));
gsi.on('observerTargetChange', (from, to) => {
	console.log(`${from?.name ?? 'Free camera'} → ${to?.name ?? 'Free camera'}`);
});
```

Use [custom bombsite resolvers](docs/integration.md#custom-bombsites-and-map-names) for new maps or your own site boundaries. Built-in map lookup accepts workshop paths, either slash direction, and `.bsp` / `.vpk` names.

## Documentation

| Read                                     | What you will find                                            |
| :--------------------------------------- | :------------------------------------------------------------ |
| [API reference](docs/api.md)             | Methods, state, all events, parsed types, and runtime caveats |
| [Integration guide](docs/integration.md) | GSI setup, metadata, UI integration, and troubleshooting      |
| [Contributing](CONTRIBUTING.md)          | Local checks, repository layout, and release workflow         |
| [Changelog](CHANGELOG.md)                | Released changes and migration history                        |

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

See [Contributing](CONTRIBUTING.md) for runtime details and checks before opening a PR.

## License

[MIT](LICENSE)
