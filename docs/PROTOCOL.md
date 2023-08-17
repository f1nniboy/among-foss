# Among FOSS • Protocol
Among FOSS uses an IRC-like protocol for communcation. Packets are kept simple, so that even tools such as `nc` can be used to play the game. All packet names & sub-commands are case-insensitive, e.g. `rOOm creATE` and `ROOM CREATE` both work.

## Initial authentication
When connecting to the server, clients must set a nickname using `NICK ...` within the inactivity time frame, or they will be kicked.
Nicknames must be between **2-32 characters** long, may only contain `_`, `.`, and `-` as special characters and cannot contain spaces.

```
<- SERVER <VERSION> <ROOM COUNT> <CLIENT COUNT>
-> NICK player1
<- ROOM CREATE ...
...
<- ROOM
```

As soon as clients join, they will receive various `ROOM CREATE` packets and a single `ROOM` packets at the end.
This list is also sent whenever the client leaves a lobby. All of these packets contain information about public game lobbies.

`ROOM CREATE <NICK> <CODE> <MAP> <GAME RUNNING?> <CONNECTED CLIENTS> <MAX CLIENTS>`
*e.g.* `ROOM CREATE player1 LBYGWN SKELD 0 1 10`

If no public game lobbies are available, you will simply receive an empty `ROOM` packet.

## Room changes
Whenever a room starts/stops playing, changes player count or changes its settings, a `ROOM UPDATE` packet will be sent to reflect those changes.

e.g.
```
# Changing player count
-> ROOM JOIN ...
<- ROOM UPDATE ok CHRDYJ SKELD 0 1 10

# Changing the map
-> ROOM SET map MIRA_HQ
<- ROOM UPDATE ok CHRDYJ MIRA_HQ 0 1 10

# Changing the maximum player count
-> ROOM SET max 15
<- ROOM UPDATE ok CHRDYJ MIRA_HQ 0 1 15

# Starting the game
-> START
<- ROOM UPDATE ok CHRDYJ MIRA_HQ 1 1 15

# Finishing the game
<- ROOM UPDATE ok CHRDYJ MIRA_HQ 0 1 15

# Deleting the room
-> ROOM LEAVE
<- ROOM DELETE ok CHRDYJ MIRA_HQ 0 1 15
```

## Time-out
By default, clients are kicked after **180 seconds** of inactivity, AKA sending no packets within that time frame. Clients may periodically send `PING` packets to not get kicked.
```
-> PING [Client unix time, in milliseconds]
<- PONG [Elapsed time since client unix time]
```
It's recommended for clients to implement the `PING` packet, to avoid unexpected disconnects from the server. The `PONG` packet reply contains the latency of one roundtrip (client -> server -> client), if the Unix timestamp was provided.

## Creating a room
```
-> ROOM CREATE [PUBLIC|PRIVATE]
<- ROOM JOIN <NICK> <CODE> <MAP> <GAME RUNNING?> <CONNECTED CLIENTS> <MAX CLIENTS>
<- PLAYERS
```
Clients can create game lobbies AKA rooms using `ROOM CREATE`.

## Configuring the game
**Changing the map**: `ROOM SET map [SKELD|MIRA_HQ]`
**Changing the player limit**: `ROOM SET max [5-20]`

These settings may be configured in the lobby, by the game host.

## Room joins & leaves
**Client joins the room**:
`<- JOIN <name>`

**Client leaves the room**:
`<- PART <name>`

## Starting the game as the host
```
-> START

<- MAP NAME MIRA_HQ
<- MAP LOCATIONS CAFETERIA:GREENHOUSE,MEDBAY,ADMIN ADMIN:CAFETERIA,GREENHOUSE,OFFICE GREENHOUSE:CAFETERIA,ADMIN REACTOR:LABORATORY OFFICE:ADMIN LAUNCHPAD:MEDBAY MEDBAY:LAUNCHPAD,CAFETERIA COMMUNICATIONS:OFFICE LABORATORY:REACTOR
<- MAP TASKS WIRING:CAFETERIA,ADMIN FIX_WIRING:GREENHOUSE ASSEMBLE_ARTIFACT:REACTOR BUY_BEVERAGE:CAFETERIA CLEAN_O2_FILTER:GREENHOUSE DIVERT_POWER:REACTOR,OFFICE EMPTY_GARBAGE:CAFETERIA ENTER_ID_CODE:ADMIN FUEL_ENGINES:LAUNCHPAD MEASURE_WEATHER:OFFICE PROCESS_DATA:COMMUNICATIONS RUN_DIAGNOSTICS:LAUNCHPAD SORT_SAMPLES:REACTOR START_REACTOR:REACTOR SUBMIT_SCAN:MEDBAY WATER_PLANTS:GREENHOUSE
<- ROLE IMPOSTOR
<- LOCATION LAUNCHPAD
<- TASKS GREENHOUSE:WATER_PLANTS:0 GREENHOUSE:CLEAN_O2_FILTER:0 LAUNCHPAD:FUEL_ENGINES:0 OFFICE:MEASURE_WEATHER:0 REACTOR:DIVERT_POWER:0
<- STATE MAIN

```
The `START` packet may be sent by the room host if there are enough players. The server sends a lot of data when starting the game, so let's break it down.

- `MAP ...`: These packets contain data about the current map.
 - `MAP LOCATIONS ...`: A `<LOCATION>:<DOORS, SEPARATED by COMMA>` map, separated by spaces.
 - `MAP TASKS ...`: A `<TASK>:<LOCATIONS, SEPARATED BY COMMA>` map, separated by spaces. 

- `ROLE IMPOSTOR`: This may either be `IMPOSTOR` or `CREWMATE` when starting the game. Further `ROLE` packets are sent when the client dies or the game ends.
- `LOCATION LAUNCHPAD`: This is the starting location of the game. `LOCATION` packets are sent when the client moves through rooms.
- `TASKS ...`: A `<TASK>:<DONE>` map, separated by spaces. Tasks will also given to impostors to act as "fake tasks", meaning they cannot actually do the assigned tasks.

## Moving between locations
```
-> MOVE MEDBAY
<- LOCATION MEDBAY
```

By default, there's a **10 second** cool-down for moving between locations. The new location must be a neighbor of the preivous location.

## Doing a task
```
-> TASK CAFE_TRASH
<- TASKS ... CAFE_TRASH:CAFETERIA:1 ...
```
You must be in the corresponding location to do a task.

## Calling a meeting & voting
```
-> MEET
<- MEET BUTTON
<- STATE DISCUSSION
```
To call a meeting, you must be in the `CAFETERIA` location, have at least one remaining button press & may not be on cool-down.

## Reporting a body
```
-> REPORT
<- ERR NO_BODY

-> REPORT
<- MEET REPORT
<- STATE DISCUSSION
```
There must be at least one dead body in the current location to report.

### Voting for someone
```
-> VOTE [name]
<- VOTES 0 player1:1 player2:0

-> VOTE
<- VOTES 1 player1:0 player2:0
```

Calling `VOTE` with a player name votes for that player to be ejected.
Calling it without a player name acts a vote to skip the discussion.

`VOTE` packets will be sent whenever someone votes during the discussion.

### Meeting result
**Eject**:
```
<- MEET EJECT player1 CREWMATE
<- MEET EJECT <name> <role>
```

**Skip & Tie**:
```
<- MEET TIE
<- MEET SKIP
```

## Killing someone as the impostor
**Impostor**:
```
-> KILL player2
<- DIE player2
...
```

**Crewmate**:
```
<- ROLE SPECTATOR
```

## Winning the game
**Impostor wins the game**, e.g. by killing all crewmates or sabotaging:
```
<- WIN IMPOSTOR
<- STATE LOBBY
```

**Crewmates win the game**, e.g. by voting out the impostor or completing all tasks:
```
<- WIN CREWMATE
<- STATE LOBBY
```

## Packets
- `->` = Client ➔ Server
- `<-` = Server ➔ Client

### `Server` ➔ `Client`
| Name        | Description                           |
| ----------- | ------------------------------------- |
| `SERVER`    | Initial information about the server  |
| `ERR`       | Error information, if a packet failed |
| `ROOM`      | Information about rooms               |
| `LOCATION`  | The client's location in the map      |
| `TASKS`     | The client's assigned tasks           |
| `STATE`     | State of the running game             |
| `MEET ...`  | Start/end of a discussion             |
| `MAP ...`   | Various map data                      |

---

### `Client` ➔ `Server`
| Name         | Description                                            |
| ------------ | ------------------------------------------------------ |
| `NICK ...`   | Set the client's nickname                              |
| `PING [...]` | Refresh the inactivity timer                           |
| `ROOM ...`   | Join, leave or create a room                           |
| `CHAT ...`   | Send a chat message in the lobby, meeting or when dead |
| `START`      | Start the game, if you're the room host                |
| `MEET`       | Call a meeting, when in the spawn location             |
| `VOTE [...]` | Vote for a client during the meeting or skip           |
| `REPORT`     | Report a dead body in the current location             |
| `KILL ...`   | Kill another player, as the impostor                   | 
| `MOVE ...`   | Move between locations                                 |
| `TASK ...`   | Complete a task in the current location                |