![Statements](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)
![CI](https://img.shields.io/github/workflow/status/osztenkurden/csgogsi/CI)
![Dependencies](https://img.shields.io/david/osztenkurden/csgogsi)
![Downloads](https://img.shields.io/npm/dm/csgogsi)
![Version](https://img.shields.io/npm/v/csgogsi)
# CS:GO GSI Digest

## How does it work?
The GSI object takes raw request from CS:GO GSI's system, parses this to more comfortable form and calls listeners on certain events. You need to configure GSI file and receiving end yourself.

## Installing
### For Node and React
```npm install csgogsi```

## Example #1
```javascript
import express from 'express';
import { CSGOGSI } from 'csgogsi';

const app = express();
const GSI = new CSGOGSI();

app.use(express.urlencoded({extended:true}));
app.use(express.raw({limit:'10Mb', type: 'application/json' }));

app.post('/', (req, res) => {
    const text = req.body.toString().replace(/"(player|owner)":([ ]*)([0-9]+)/gm, '"$1": "$3"').replace(/(player|owner):([ ]*)([0-9]+)/gm, '"$1": "$3"');
    const data = JSON.parse(text);
    GSI.digest(data);
    res.sendStatus(200);
});

GSI.on('roundEnd', team => {
    console.log(`Team  ${team.name} win!`);
});
GSI.on('bombPlant', player => {
    console.log(`${player.name} planted the bomb`);
});

app.listen(3000);
```

## Methods

|Method|Description|Example|Returned objects|
|---|---|---|---|
|`digest(GSIData)`|Gets raw GSI data from CSGO and does magic|`GSI.digest(req.body)`|CSGO Parsed|
|`digestMIRV(RawKill)`|Gets raw kill data from mirv pgl and does magic|`GSI.digestMIRV(mirv)`|KillEvent|
|`on('event', callback)`|Sets listener for given event (check them below)|`GSI.on('roundEnd', team => console.log(team.name));`||
|`static findSite(mapName, position)`|Tries to guess the bombsite of the position||`A, B, null`|

Beside that, CSGOGSI implements standard Event Emitter interfaces.

## Events

|Event|Name|Callback|
|---|---|---|
|Data incoming|`data`|(data: CSGO Parsed) => {}|
|End of the round|`roundEnd`|(score: Score) => {}|
|End of the map|`matchEnd`|(score: Score) => {}|
|Kill|`kill`|(kill: KillEvent) => {}|
|Timeout start|`timeoutStart`|(team: Team) => {}|
|Timeout end|`timeoutEnd`|() => {}|
|MVP of the round|`mvp`|(player: Player) => {}|
|Freezetime start|`freezetimeStart`|() => {}|
|Freezetime end|`freezetimeEnd`|() => {}|
|Intermission start|`intermissionStart`|() => {}|
|Intermission end|`intermissionEnd`|() => {}|
|Defuse started|`defuseStart`|(player: Player) => {}|
|Defuse stopped (but not defused and not exploded)|`defuseStop`|(player: Player) => {}|
|Bomb plant started|`bombPlantStart`|(player: Player) => {}|
|Bomb planted|`bombPlant`|(player: Player) => {}|
|Bomb exploded|`bombExplode`|() => {}|
|Bomb defused|`bombDefuse`|(player: Player) => {}|

## Objects
#### CSGO Parsed

|Property|Type|
|---|---|
|provider|`Provider Object`|
|map|`Map Object`|
|round|`Round Object or null`|
|player|`Player Object or null`|
|players|`Array of Player's Object`|
|observer|`Observer Object`|
|bomb|`Bomb Object`|
|phase_countdowns|`The same as in raw GSI`|


### Observer

|Property|Type|
|---|---|
|activity|`'playing', 'textinput'  or 'menu'`|
|spectarget|`'free' or SteamID64`|
|position|`number[]`|
|forward|`number[]`|

#### Team Extension

|Property|Type|
|---|---|
|id|`string`|
|name|`string`|
|country|`string or null`|
|logo|`string or null`|
|map_score|`number`|

#### Player Extension

|Property|Type|
|---|---|
|id|`string`|
|name|`string`|
|steramid|`string`|
|realName|`string or null`|
|country|`string or null`|
|avatar|`string or null`|


#### Provider

|Property|Type|
|---|---|
|name|`'Counter-Strike: Global Offensive'`|
|appid|730|
|version|`number`|
|steamid|`number`|
|timestamp|`number`|

#### Map

|Property|Type|
|---|---|
|mode|`string`|
|name|`string`|
|phase|`"warmup" or "live" or "intermission" or "gameover"`|
|round|`number`|
|team_ct|`Team Object`|
|team_t|`Team Object`|
|num_matches_to_win_series|`number`|
|current_spectators|`number`|
|souvenirs_total|`number`|
|round_wins|`Object with Round Outcome Object as values`|

#### Round

|Property|Type|
|---|---|
|phase|`"freezetime" or "live" or "over"`|
|bomb?|`"planted" or "exploded" or "defused"`|
|win_team?|`Side Object`|

#### Player

|Property|Type|
|---|---|
|steamid|`string`|
|name|`string`|
|observer_slot|`number`|
|team|`Team Object`|
|stats|`{kills, assists, deaths, mvps, score} all numbers`|
|state|`{health, armor, helmet, defusekit?, flashed, smoked, burning, money, round_kills, round_killshs, round_totaldmg, equip_value}`|
|position|`Array of numbers`|
|forward|`number`|
|avatar|`string or null`|
|country|`string or null`|
|realName|`string or null`|

#### Bomb

|Property|Type|
|---|---|
|state|`"carried" or "planted" or "dropped" or "defused" or "defusing" or "planting" or "exploded"`|
|countdown?|`string`|
|player?|`Player Object`|
|position|`string`|

#### Team

|Property|Type|
|---|---|
|score|`number`|
|consecutive_round_losses|`number`|
|timeouts_remaining|`number`|
|matches_won_this_series|`string`|
|name|`string`|
|country|`string or null`|
|id|`string or null`|
|side|`Side Object`|
|orientation|`left or right`|
|logo|`string`|

#### Score

|Property|Type|
|---|---|
|winner|`Team`|
|loser|`Team`|
|map|`Map`|
|mapEnd|`boolean`|

#### Side
`"CT" or "T"`
