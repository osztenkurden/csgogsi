# Integration guide

[← README](../README.md) · [API reference](api.md) · [Contributing](../CONTRIBUTING.md)

## Configure the game

Use the [example configuration](../examples/gamestate_integration_csgogsi.cfg) with the receiver in the README. Place it at:

```text
<CS2 installation>/game/csgo/cfg/gamestate_integration_csgogsi.cfg
```

The file must keep its `gamestate_integration_` prefix and `.cfg` extension. Restart the game after adding it. The example sends JSON to `http://127.0.0.1:3000/` and enables player, team, round, bomb, and grenade sections.

### Required data

The parser targets full spectator snapshots. All-player information is available while spectating rather than playing.

| Configuration component                                       | Parser use                                                          |
| :------------------------------------------------------------ | :------------------------------------------------------------------ |
| `provider`                                                    | Source identity and timestamp                                       |
| `map`, `map_round_wins`                                       | Scores, teams, and historical round outcomes                        |
| `round`                                                       | Winner and round-phase transitions                                  |
| `allplayers_id`, `allplayers_state`, `allplayers_match_stats` | Identity, health/economy/damage, scoreboard                         |
| `allplayers_weapons`, `allplayers_position`                   | Weapon arrays and position/forward parsing                          |
| `phase_countdowns`                                            | Required top-level section; timer, pause, timeout, and phase events |
| `player_id`, `player_position`                                | Observed player and observer coordinates                            |
| `bomb`, `allgrenades`                                         | Optional bomb and grenade parsing                                   |

Missing `allplayers`, `map`, or `phase_countdowns` causes `digest()` to return `null`. Passing those three checks does not guarantee the packet is valid: nested weapons and coordinate fields are assumed to exist. A TypeScript `GameStateRaw` annotation is not a runtime validator.

## Receiver behavior

Use one parser instance per feed and deliver snapshots in arrival order. A shared instance receiving two matches will compare unrelated players, scores, and phases. Incomplete/menu packets leave the previous state intact.

The README receiver is a local example. To receive from another machine, configure both the listener address and the game's URI. Authenticate requests before passing them to the parser: `auth` is copied into output without validation.

For example, add this block inside the configuration's outer braces:

```text
"auth"
{
    "token" "replace-with-your-token"
}
```

Then check the same token before calling `digest()` in your existing POST handler:

```javascript
const expectedToken = process.env.GSI_TOKEN;
if (!expectedToken) throw new Error('Set GSI_TOKEN before starting the receiver');

app.post('/', (req, res, next) => {
	if (req.body?.auth?.token !== expectedToken) {
		return res.sendStatus(403);
	}
	try {
		gsi.digest(req.body);
		res.sendStatus(200);
	} catch (error) {
		next(error);
	}
});
```

This replaces the README route. It assumes its `app`, `gsi`, and JSON middleware already exist. Strip `auth` before broadcasting snapshots to a UI or storing public recordings.

## Player and team metadata

Assign metadata before digestion. Entries apply again on each subsequent snapshot.

```typescript
import { CSGOGSI, type PlayerExtension, type TeamExtension } from 'csgogsi';

const gsi = new CSGOGSI();

const player: PlayerExtension = {
	id: 'player-1',
	steamid: '76561198000000000',
	name: 'Broadcast name',
	realName: 'Alex Example',
	country: 'PL',
	avatar: null,
	extra: { role: 'IGL' }
};

const team: TeamExtension = {
	id: 'team-1',
	name: 'Example Esports',
	country: 'PL',
	logo: null,
	map_score: 1,
	extra: { shortName: 'EX' }
};

gsi.players = [player];
gsi.teams.left = team;
```

- Players match by `steamid`. The extension's required `id` stores the application identifier; matching still uses `steamid`, and `id` is not copied onto parsed players.
- `defaultName` preserves the game name; `name` uses a nonempty override.
- Teams attach to inferred `left`/`right` orientation. They are not permanently attached to CT/T.
- `extra` is a string-valued dictionary. All extension fields are required, including `id` and `extra`.
- `map_score` overrides the raw series score, including `0`. Display names still use nonempty string overrides.

## Round and observer events

```javascript
gsi.on('roundStart', () => {
	console.log(`Round ${gsi.current.map.round + 1} is live`);
});

gsi.on('observerTargetChange', (from, to) => {
	console.log(`${from?.name ?? 'Free camera'} → ${to?.name ?? 'Free camera'}`);
});
```

`roundStart` has no arguments. Read the round from `gsi.current.map.round`; add one for its display number. An initial live snapshot establishes the comparison baseline without emitting a round start. Observer changes compare resolved player Steam IDs, including transitions to and from a free camera (`null`). Both events require a preceding snapshot on the same normalized map.

## Custom bombsites and map names

Provide a resolver per map to support a custom layout or replace a built-in threshold:

```typescript
import { CSGOGSI, normalizeMapName, type BombsiteResolver } from 'csgogsi';

const customSite: BombsiteResolver = ([x, y]) => {
	if (x! > 100 && y! > 100) return 'A';
	if (x! < -100 && y! < -100) return 'B';
	return null; // Outside either site; do not fall back to a built-in threshold.
};

const gsi = new CSGOGSI({
	bombsiteResolvers: { de_custom: customSite }
});

console.log(gsi.findSite('workshop/123/de_custom', [200, 200, 0])); // 'A'
console.log(normalizeMapName('maps/DE_MIRAGE.bsp')); // 'de_mirage'

gsi.setBombsiteResolver('de_mirage', () => 'B');
gsi.removeBombsiteResolver('de_mirage'); // Restore the built-in resolver.
```

Lookup keys ignore path prefixes, slash direction, letter case, and `.bsp` / `.vpk` extensions. The same normalization is used for damage-history map comparisons and the new round/observer events. Parsed `map.name` retains the original game value.

Instance resolvers affect `gsi.findSite()` and subsequent parsed `bomb.site` values. They do not change other instances or the static `CSGOGSI.findSite()` helper. Bomb states that do not normally have a site estimate still return `null`.

## Browser and React applications

A browser UI needs an application receiver for the game's HTTP POSTs. A straightforward arrangement is to digest on the server and forward parsed snapshots using your chosen transport:

```text
Game → HTTP receiver → CSGOGSI → WebSocket / SSE → UI state → overlay
```

Forward only the data the UI needs, excluding `auth`. Keep one persistent parser for a feed if you instead send raw snapshots to a client-side bundle; recreating it on every render loses transition history. This repository's CI covers Node, so browser bundling needs verification in your application.

When subscribing from a component or service, keep a stable callback reference and remove it on cleanup:

```javascript
const handleData = data => console.log(data.map.name);
gsi.on('data', handleData);

// When the component/service is disposed:
gsi.off('data', handleData);
```

Callbacks run synchronously. Schedule expensive rendering or storage outside the callback and handle failures in your application. Do not mutate received snapshots or call `digest()` recursively from a listener.

## Troubleshooting

| Symptom                                        | Check                                                                                                                     |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| No HTTP requests                               | Confirm the configuration path, filename, restart, URI, and running receiver                                              |
| `digest()` returns `null`                      | Inspect incoming JSON for `allplayers`, `map`, `phase_countdowns`; use a spectator feed                                   |
| `raw` listener sees nothing                    | The three required sections are checked before `raw`; log requests at the receiver                                        |
| Parsing throws on `.split` or `Object.entries` | Confirm player position/forward and weapons fields are enabled and present                                                |
| Bomb callback has no player                    | The Steam ID may be absent/unresolved; use `player?.name`                                                                 |
| `bomb.site` is `null`                          | Check supported map names and bomb state; built-in site detection is heuristic; register a custom resolver for other maps |
| No initial phase event                         | Most transitions need two accepted snapshots; warmup start is the exception                                               |
| Incorrect historical sides                     | Set MR values before ingestion and inspect observer-slot orientation                                                      |
| ADR too low after connecting mid-map           | Damage before connection is unavailable; ADR is based on observed history                                                 |

For bug reports, include a minimal **sequence** of input packets, configuration values, expected events, and actual events. Remove authentication tokens and unnecessary player metadata before sharing.
