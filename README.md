# CS:GO GSI Digest

## How does it work?
The GSI object takes raw request from CS:GO GSI's system, parses this to more comfortable form and calls listeners on certain events. You need to configure GSI file and receiving end yourself.

## Installing
### For Node and React
```npm install csgogsi```

### For Browser

There is index.js in dist.browser on github page that you just need to include in your webpage.

## Example #1
```javascript
import express from 'express';
import CSGOGSI from 'csgogsi';

const app = express();
const GSI = new CSGOGSI();

app.use(express.urlencoded({extended:true}));
app.use(express.raw({limit:'10Mb', type: 'application/json' }));

app.use('/')
    .post((req, res) => {
        const text = req.body.toString().replace(/"(player|owner)":([ ]*)([0-9]+)/gm, '"$1": "$3"').replace(/(player|owner):([ ]*)([0-9]+)/gm, '"$1": "$3"');
        const data = JSON.parse(data);
        GSI.digest(data);
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
|`setTeamOne(team: TeamExtension)`|Set additional info about team in memory|`GSI.setTeamOne({})`||
|`setTeamTwo(team: TeamExtension)`|As above|As above||
|`digest(GSIData)`|Gets raw GSI data from CSGO and does magic|`GSI.digest(req.body)`|CSGO Parsed|
|`on('event', callback)`|Sets listener for given event (check them below)|`GSI.on('roundEnd', team => console.log(team.name));`||
|`removeListeners('event')`|Remove all listeners for given event|`GSI.removeListeners('bombExplode')`||
|`loadPlayers(players: PlayerExtension[])`|Loads custom data about players|||

## Events

|Event|Name|Callback|
|---|---|---|
|Data incoming|`data`|(data: CSGO Parsed) => {}|
|End of the round|`roundEnd`|(score: Score) => {}|
|Bomb planted|`bombPlant`|(player: Player) => {}|
|Bomb defused|`bombDefuse`|(player: Player) => {}|
|Bomb exploded|`bombExplode`|() => {}|
|Defuse started|`defuseStart`|(player: Player) => {}|
|Defuse stopped (but not defused and not exploded)|`defuseStop`|(player: Player) => {}|
|End of the map|`matchEnd`|(score: Score) => {}|

## Objects
#### CSGO Parsed

|Property|Type|
|---|---|
|provider|`Provider Object`|
|map|`Map Object`|
|round|`Round Object or null`|
|player|`Player Object or null`|
|players|`Array of Player's Object`|
|bomb|`Bomb Object`|
|phase_countdowns|`The same as in raw GSI`|

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
|phase|`"warmup" | "live" | "intermission" | "gameover"`|
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
|phase|`"freezetime" | "live" | "over"`|
|bomb?|`"planted"|"exploded"|"defused"`|
|win_team?|`Side Object`|

#### Player

|Property|Type|
|---|---|
|steamid|`string`|
|name|`string`|
|observer_slot|`number`|
|team|`Team Object`|
|activity|`string`|
|stats|`{kills, assists, deaths, mvps, score} all numbers`|
|state|`{health, armor, helmet, defusekit?, flashed, smoked, burning, money, round_kills, round_killshs, round_totaldmg, equip_value}`|
|spectarget?|`string`|
|position|`Array of numbers`|
|forward|`number`|
|avatar|`string or null`|
|country|`string or null`|
|realName|`string or null`|

#### Bomb

|Property|Type|
|---|---|
|state|`"carried" | "planted" | "dropped" | "defused" | "defusing" | "planting" | "exploded"`|
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
|country|`string | null`|
|id|`string | null`|
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
