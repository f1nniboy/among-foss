# Packets
You can find the **IDs**, **names**, **descriptions** and **examples** for packets here.

## Information
### `Server` ➔ `Client`
| ID  | Name        | Description                           |
| --  | ----------- | ------------------------------------- |
| `0` | Info        | Information about the server          |
| `1` | Client Info | Information about a client            |
| `2` | Game Status | State and winner of the current game  |
| `3` | Room Info   | Information about the current room    |
| `4` | State       | The current state of the client       |
| `5` | Tasks       | A list of tasks the client has to do  |
| `6` | Data        | Information about tasks and locations |

### `Client` ➔ `Server`
| ID   | Name     | Description                     |
| ---- | -------- | ------------------------------- |
| `7`  | Command  | Run a command.                  |
| `8`  | Name     | Set the client's name.          |
| `9`  | Location | Set the location on the map.    |
| `10` | Kill     | Kill a client, as the impostor. |

### `Client` ⬌ `Server`
| ID   | Name    | Description                          |
| ---- | ------- | ------------------------------------ |
| `11` | Clients | Request a list of connected clients. |
| `12` | Chat    | Send a chat message.                 |
| `13` | Task    | Complete a task.                     |

## Examples
This contains examples for packets sent from the *client to the server*, *the other way around* and packets only sent *by the server*.
The `type` value will be *omitted* for the examples.


### Connecting
First, send a `Name` packet to the server.
Then, you may receive *chat messages and other packets* from the server.

To *start the game*, send a `Command` packet with the command name `start_game`.

### `0` ➔ Info
```json
{
	"arguments": {
		"version": "dev"
	}
}
```

### `1` ➔ Client Info
The new state of the client is exchanged through the `status` field. Refer to **Status Codes** for more information.

The client names are only exchanged through the `Client Info` and `Clients` packets, so it would be benefitial
to *keep track of the clients*.

```json
{
	"status": 0,
	"arguments": {
		"name": "Test",
		"id": 0
	}
}
```

### `2` ➔ Game Status
The new state is exchanged through the `status` field. Refer to **Status Codes** for more information.
The `winner` field is omitted when the game hasn't ended yet.

The field may have the following values:

`0` ➔ `Crewmate`
`1` ➔ `Impostor`

```json
{
	"arguments": {
		"winner": 0
	}
}
```

### `3` ➔ Room Info
The client receives this packet after a *successful* `Location` packet call.

```json
{
	"arguments": {
		"id": 0,
		"doors": [
			5, 11, 8
		],
		"clients": {
			{ "id": 0, "alive": true },
			{ "id": 1, "alive": false }
		}
	}
}
```

### `4` ➔ State
This packet exchanges a variety of information with the client, e.g. the *role*, the *current stage* and whether the client is still *alive*.
Fields, which *have not changed since the last time*, will be omitted.

**`Role`**
`0` ➔ `Crewmate`
`1` ➔ `Impostor`

**`Stage`**
`0` ➔ `Name`
`1` ➔ `Lobby`
`2` ➔ `Main`

```json
{
	"arguments": {
		"stage": 2,
		"role": 1,
		"alive": 1
	}
}
```

### `5` ➔ Tasks
This packet will be sent at the start of the game, containing a list of tasks the client has to complete.
After this, the client has to *keep track of the completed tasks themselves*.

```json
{
	"arguments": {
		{
			"id": 3,
			"loc": 1
		},

		...
	}
}
```

### `6` ➔ Data
This packet will sent be *after the client has authenticated* and contains the **names of locations** and **descriptions and locations of tasks**.
The index of the tasks and locations correspond to their ID.

```json
{
	"arguments": {
		"tasks": [
			{
				"desc": "Empty trash",
				"loc": 0
			},
			...
		],

		"locations": [
			{
				"name": "Cafeteria",
				"doors": [ 5, 8, 11 ]
			},
			...
		]
	}
}
```

### `7` ➔ Command
This will run the `start_game` command.
The server will respond with a packet of the same type.

```json
{
	"arguments": {
		"name": "start_game"
	}
}
```

### `8` ➔ Name
This will set the client's name to `Test`. The client's name can only be set **once** and may *only contain ASCII characters*.

```json
{
	"arguments": {
		"name": "Test"
	}
}
```

### `9` ➔ Location
This will set the client's location to `Cafeteria`. The location must be *adjacent to the current one*.

```json
{
	"arguments": {
		"id": 0
	}
}
```

### `10` ➔ Kill
This packet can be sent by an impostor to kill the specified client.

```json
{
	"arguments": {
		"id": 0
	}
}
```

### `11` ➔ Clients
```json
{
	"arguments": [
		{
			"name": "Test",
			"id": 0
		},
		{
			"name": "Test2",
			"id": 1
		}
	]
}
```

### `12` ➔ Chat
The sent packet will be broadcasted to all other clients, as long as it only *contains ASCII characters*.
The broadcasted packet will contain a `id` field, to specify which player sent it.

```json
{
	"arguments": {
		"id": 0,
		"content": "Test"
	}
}
```

### `13` ➔ Task
This packet can be sent by the client to complete the specified task.
The server will respond with the same packet, and a status code.

```json
{
	"arguments": {
		"id": 3
	}
}
```