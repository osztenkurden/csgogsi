![CI](https://img.shields.io/github/actions/workflow/status/osztenkurden/csgogsi/.github/workflows/main.yaml?branch=master)
![Dependencies](https://img.shields.io/librariesio/github/osztenkurden/csgogsi)
![Downloads](https://img.shields.io/npm/dm/csgogsi)
![Version](https://img.shields.io/npm/v/csgogsi)

# CS2 GSI Digest

## How does it work?

The GSI object takes raw request from CS:GO & CS2 GSI's system, parses this to more comfortable form and calls listeners on certain events. You need to configure GSI file and receiving end yourself.

## Installing

### For Node and React

`npm install csgogsi`

## Example #1

```javascript
import express from 'express';
import { CSGOGSI } from 'csgogsi';

const app = express();
const GSI = new CSGOGSI();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10Mb' }));

app.post('/', (req, res) => {
	GSI.digest(req.body);
	res.sendStatus(200);
});

GSI.on('roundEnd', score => {
	console.log(`Team ${score.winner.name} win!`);
});
GSI.on('bombPlant', player => {
	console.log(`${player.name} planted the bomb`);
});

app.listen(3000);
```

## Methods

| Method                                                                                       | Description                                      | Example                                                             | Returned objects       |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- | ---------------------- |
| `digest(GSIData)`                                                                            | Gets raw GSI data from CSGO and does magic       | `GSI.digest(req.body)`                                              | CSGO Parsed            |
| `digestMIRV(event: RawKill or RawHurt, eventType: "player_death" (default) or "player_hurt)` | Gets raw kill data from mirv pgl and does magic  | `GSI.digestMIRV(mirv)`                                              | KillEvent or HurtEvent |
| `on('event', callback)`                                                                      | Sets listener for given event (check them below) | `GSI.on('roundEnd', score => { console.log(score.winner.name); });` |                        |
| `static findSite(mapName, position)`                                                         | Tries to guess the bombsite of the position      |                                                                     | `A, B, null`           |

Beside that, CSGOGSI implements standard Event Emitter interfaces.

## MR system

CSGOGSI has two properties describing the MR system of the match. They are used to work out which team won a given round (`map.rounds`, where sides swap at every half) and when to emit the `overtime` event.

| Property       | Default | Description                                                                         |
| -------------- | ------- | ----------------------------------------------------------------------------------- |
| `regulationMR` | `12`    | Rounds per half in regulation - MR12 means the map is won at 13 rounds, OT at 12:12 |
| `overtimeMR`   | `3`     | Rounds per half in overtime                                                         |

If your server still runs the old MR15 system, set it before feeding any data in:

```javascript
const GSI = new CSGOGSI();

GSI.regulationMR = 15;
```

## Events

| Event                                             | Name                | Callback                  |
| ------------------------------------------------- | ------------------- | ------------------------- |
| Data incoming                                     | `data`              | (data: CSGO Parsed) => {} |
| End of the round                                  | `roundEnd`          | (score: Score) => {}      |
| End of the map                                    | `matchEnd`          | (score: Score) => {}      |
| Score tied at `regulationMR` (map goes to OT)     | `overtime`          | () => {}                  |
| Kill                                              | `kill`              | (kill: KillEvent) => {}   |
| Hurt                                              | `hurt`              | (hurt: HurtEvent) => {}   |
| Timeout start                                     | `timeoutStart`      | (team: Team) => {}        |
| Timeout end                                       | `timeoutEnd`        | () => {}                  |
| MVP of the round                                  | `mvp`               | (player: Player) => {}    |
| Warmup start                                      | `warmupStart`       | () => {}                  |
| Warmup end                                        | `warmupEnd`         | () => {}                  |
| Freezetime start                                  | `freezetimeStart`   | () => {}                  |
| Freezetime end                                    | `freezetimeEnd`     | () => {}                  |
| Intermission start                                | `intermissionStart` | () => {}                  |
| Intermission end                                  | `intermissionEnd`   | () => {}                  |
| Defuse started                                    | `defuseStart`       | (player: Player) => {}    |
| Defuse stopped (but not defused and not exploded) | `defuseStop`        | (player: Player) => {}    |
| Bomb plant started                                | `bombPlantStart`    | (player: Player) => {}    |
| Bomb planted                                      | `bombPlant`         | (player: Player) => {}    |
| Bomb exploded                                     | `bombExplode`       | () => {}                  |
| Bomb defused                                      | `bombDefuse`        | (player: Player) => {}    |

### Notes on some events

-   `overtime` is emitted together with `roundEnd`, on the round that ties the score at `regulationMR` (12:12 by default) without ending the map. It is not emitted when the map ends at that score instead - which is what happens when overtime is disabled on the server and the map ends in a draw.
-   `warmupStart` and `warmupEnd` follow `map.phase`. `warmupStart` is also emitted for the very first packet you feed in if the game is already in warmup at that point, while `warmupEnd` needs a previous packet to compare against, so it is never emitted for the first one.

## Objects

#### CSGO Parsed

| Property         | Type                       |
| ---------------- | -------------------------- |
| provider         | `Provider Object`          |
| map              | `Map Object`               |
| round            | `Round Object or null`     |
| player           | `Player Object or null`    |
| players          | `Array of Player's Object` |
| observer         | `Observer Object`          |
| bomb             | `Bomb Object`              |
| phase_countdowns | `Phase Object`             |

### Phase

| Property      | Type                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| phase         | (optional) `'freezetime', 'bomb', 'warmup', 'live', 'over', 'defuse', 'paused', 'timeout_ct'  or 'timeout_t'` |
| phase_ends_in | `number`                                                                                                      |
| timeout_team  | (optional) `Team object`                                                                                      |

### Observer

| Property   | Type                                |
| ---------- | ----------------------------------- |
| activity   | `'playing', 'textinput'  or 'menu'` |
| spectarget | `'free' or SteamID64`               |
| position   | `number[]`                          |
| forward    | `number[]`                          |

#### Team Extension

| Property  | Type             |
| --------- | ---------------- |
| id        | `string`         |
| name      | `string`         |
| country   | `string or null` |
| logo      | `string or null` |
| map_score | `number`         |

#### Player Extension

| Property | Type             |
| -------- | ---------------- |
| id       | `string`         |
| name     | `string`         |
| steramid | `string`         |
| realName | `string or null` |
| country  | `string or null` |
| avatar   | `string or null` |

#### Provider

| Property  | Type                                 |
| --------- | ------------------------------------ |
| name      | `'Counter-Strike: Global Offensive'` |
| appid     | 730                                  |
| version   | `number`                             |
| steamid   | `number`                             |
| timestamp | `number`                             |

#### Map

| Property                  | Type                                                 |
| ------------------------- | ---------------------------------------------------- |
| mode                      | `string`                                             |
| name                      | `string`                                             |
| phase                     | `"warmup" or "live" or "intermission" or "gameover"` |
| round                     | `number`                                             |
| team_ct                   | `Team Object`                                        |
| team_t                    | `Team Object`                                        |
| num_matches_to_win_series | `number`                                             |
| current_spectators        | `number`                                             |
| souvenirs_total           | `number`                                             |
| round_wins                | `Object with Round Outcome Object as values`         |
| rounds                    | `Array of RoundInfo objects`                         |

#### RoundInfo

| Property | Type                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| team     | `Team`                                                                                    |
| round    | `number`                                                                                  |
| side     | `Side`                                                                                    |
| outcome  | `'ct_win_elimination', 't_win_elimination', 'ct_win_time', 'ct_win_defuse', 't_win_bomb'` |

#### Round

| Property  | Type                                   |
| --------- | -------------------------------------- |
| phase     | `"freezetime" or "live" or "over"`     |
| bomb?     | `"planted" or "exploded" or "defused"` |
| win_team? | `Side Object`                          |

#### Player

| Property      | Type                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| steamid       | `string`                                                                                                                             |
| name          | `string`                                                                                                                             |
| observer_slot | `number`                                                                                                                             |
| team          | `Team Object`                                                                                                                        |
| stats         | `{kills, assists, deaths, mvps, score} all numbers`                                                                                  |
| state         | `{health, armor, helmet, defusekit?, flashed, smoked, burning, money, round_kills, round_killshs, round_totaldmg, equip_value, adr}` |
| position      | `Array of numbers`                                                                                                                   |
| forward       | `number`                                                                                                                             |
| avatar        | `string or null`                                                                                                                     |
| country       | `string or null`                                                                                                                     |
| realName      | `string or null`                                                                                                                     |

#### Bomb

| Property   | Type                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| state      | `"carried" or "planted" or "dropped" or "defused" or "defusing" or "planting" or "exploded"` |
| countdown? | `string`                                                                                     |
| player?    | `Player Object`                                                                              |
| position   | `number[]`                                                                                   |

#### Team

| Property                 | Type             |
| ------------------------ | ---------------- |
| score                    | `number`         |
| consecutive_round_losses | `number`         |
| timeouts_remaining       | `number`         |
| matches_won_this_series  | `string`         |
| name                     | `string`         |
| country                  | `string or null` |
| id                       | `string or null` |
| side                     | `Side Object`    |
| orientation              | `left or right`  |
| logo                     | `string`         |

#### Score

| Property | Type      |
| -------- | --------- |
| winner   | `Team`    |
| loser    | `Team`    |
| map      | `Map`     |
| mapEnd   | `boolean` |

#### Side

`"CT" or "T"`
