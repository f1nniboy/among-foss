# Among FOSS • Protocol
Among FOSS uses an IRC-like protocol for communcation. Packets are kept simple, so that even tools such as `nc` can be used to play the game. All packet names & sub-commands are case-insensitive, e.g. `rOOm creATE` and `ROOM CREATE` both work.

## Notes
This documention is still **work-in-progress**, so some things may be out-of-date or just entirely missing.

## Initial authentication
When connecting to the server, clients must set a nickname using `NICK ...` within the inactivity time frame, or they will be kicked.
```
<- SERVER 0.0.1 0
-> NICK player1
<- ROOMS ...
```

## Nickname limitations
Nicknames must be between **2-32 characters** long, may only contain `_`, `.`, and `-` as special characters and cannot contain spaces.

## Time-out
By default, clients are kicked after **180 seconds** of inactivity, AKA sending no packets within that time frame. Clients may periodically send `PING` packet to not get kicked.
```
-> PING [Client unix time, in milliseconds]
<- PONG [Elapsed time since client unix time]
```
It's recommended for clients to implement the `PING` packet, to avoid unexpected disconnects from the server. The `PONG` packet reply contains the latency of one roundtrip (client -> server -> client), if the Unix timestamp was provided.


## Starting the game as the host
```
-> START

<- LOCATION CAFETERIA
<- ROLE CREWMATE
<- TASKS UPPER_CATALYZER:0 NAVIGATION_WIRES:0 CAFE_TRASH:0 NAVIGATION_HEADING:0 WEAPONS_CALIBRATE:0
<- STATE MAIN
```
The `START` packet may be sent by the room host if there are enough players. The server sends a lot of data when starting the game, so let's break it down.

- `LOCATION CAFETERIA`: This is the starting location of the game. `LOCATION` packets are sent when the client moves through rooms.
- `ROLE CREWMATE`: This may either be `IMPOSTOR` or `CREWMATE` when starting the game. Further `ROLE` packets are sent when the client dies or the game ends.
- `TASKS <NAME>:<LOCATION>:<DONE> ...`: This will be sent at the start and whenever a task is completed. `0` means the task is pending, `1` means it's completed.

The tasks may be queried at any point using `QUERY TASKS`, although clients are urged to keep track of tasks themselves.

## Moving between locations
```
-> MOVE MEDBAY
<- LOCATION MEDBAY
```

**When on cool-down**:
```
-> MOVE MEDBAY
<- ERR COOL_DOWN
```

**When specifying an invalid location**:
```
-> MOVE LOWER_ENGINE
<- ERR INVALID_LOC
```

## Doing a task
```
-> TASK CAFE_TRASH
<- TASKS ... CAFE_TRASH:CAFETERIA:1 ...
```
You must be in the corresponding task location to do a task.

## Calling a meeting & voting
```
-> MEET
<- STATE DISCUSSION
```
To call a meeting, you must be in the `CAFETERIA` location, have at least one remaining button press & may not be on cool-down.

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
<- MEETING EJECT player1 CREWMATE
<- MEETING EJECT <name> <role>
```

**Skip & Tie**:
```
<- MEETING TIE
<- MEETING SKIP
```

## Querying data
```
-> QUERY ROOMS
<- ROOMS player1:1234 ...

-> QUERY PLAYERS
<- PLAYERS player1 player2 ...

-> QUERY TASKS
<- TASKS UPPER_CATALYZER:UPPER_ENGINE:0 NAVIGATION_WIRES:NAVIGATION:0 ...

-> QUERY PROGRESS
<- PROGRESS 1 5
```
The `QUERY` packet allows clients to fetch various data about the game & server at any point.
Nonetheless, clients are urged to keep track of this data themselves & to avoid using `QUERY`, as the server always sends initial data to the client.

## Packets
*`...` indicates that the packet requires a sub-command as an argument*.

- `->` = Client ➔ Server
- `<-` = Server ➔ Client

### `Server` ➔ `Client`
| Name        | Description                           |
| ----------- | ------------------------------------- |
| `SERVER`    | Initial information about the server  |
| `ERR`       | Error information, if a packet failed |
| `ROOM`      | Information about the room            |
| `ROOMS`     | Information about all public rooms    |
| `LOCATION`  | The client's location in the map      |
| `TASKS`     | The client's assigned tasks           |
| `STATE`     | State of the running game             |

---

#### `SERVER`
```
<- SERVER 0.0.1 2
```
This packet gets sent by the server once a connection has been established. It contains the current version (`0.0.1`) and the amount of authenticated clients (`2`).

#### `ERR`
```
-> NICK a
<- ERR NICK_TOO_SHORT
```
This packet is used to notify the client of any errors that occured when executing a packet. A full list of errors with their descriptions can be found in **ERRORS.md**.

#### `ROOM`
```
-> ROOM JOIN <CODE>
-> ROOM CREATE [VISIBILITY]

<- ROOM <NAME> <CODE> <VISIBILITY>
```
```
-> ROOM LEAVE
<- ROOMS <NAME>:<CODE> ...
```
This packet allows clients to create a room, join a room using its code and to leave the current room.

When creating a room using `ROOM CREATE ...`, the `VISIBILITY` option can be specified, and may be `PUBLIC` or `PRIVATE`.

---

### `Client` ➔ `Server`
| Name        | Description                                  |
| ----------- | -------------------------------------------- |
| `NICK`      | Set the client's nickname                    |
| `PING`      | Refresh the inactivity timer                 |
| `ROOM ...`  | Join, leave or create a room                 |
| `QUERY ...` | Query various data from the server           |
| `START`     | Start the game, if you're the room host      |
| `MEET`      | Call a meeting to vote out other players     |
| `VOTE`      | Vote for a client during the meeting or skip |