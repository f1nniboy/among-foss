# Packets
You can find the **IDs**, **names**, **descriptions** and **examples** for packets here.

## Information
### `Server` ➔ `Client`
| ID  | Name        | Description                          |
| --  | ----------- | ------------------------------------ |
| `0` | Info        | Information about the server         |
| `1` | Client Info | Information about a client           |
| `2` | Game Status | State and winner of the current game |
| `3` | Room Info   | Information about the current room   |
| `4` | State       | The current state of the client      |

### `Client` ➔ `Server`
| ID  | Name     | Description                  |
| --  | -------- | ---------------------------- |
| `5` | Command  | Run a command.               |
| `6` | Name     | Set the client's name.       |
| `7` | Location | Set the location on the map. |

### `Client` ⬌ `Server`
| ID  | Name    | Description                          |
| --  | ------- | ------------------------------------ |
| `8` | Clients | Request a list of connected clients. |
| `9` | Chat    | Send a chat message.                 |

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
The client receives this packet after a *successful* `Location` *packet call*.

```json
{
	"arguments": {
		"name": "Cafeteria",
		"doors": {
			"MedBay",
			"Weapons",
			"Admin"
		},
		"clients": {
			{ "id": 0, "alive": true },
			{ "id": 1, "alive": false }
		}
	}
}
```

### `4` ➔ State
This packet exchanges a variety of information with the client, e.g.
the *role*, the *current state* and whether the client is still *alive*.

**`Role`**
`0` ➔ `Crewmate`
`1` ➔ `Impostor`

**`State`**
`0` ➔ `Name`
`1` ➔ `Lobby`
`2` ➔ `Main`

```json
{
	"arguments": {
		"state": 2,
		"role": 1,
		"alive": 1
	}
}
```

### `5` ➔ Command
This will run the `start_game` command.

```json
{
	"arguments": {
		"name": "start_game"
	}
}
```

### `5` ➔ Command
This will run the `start_game` command.

```json
{
	"arguments": {
		"name": "start_game"
	}
}
```

### `6` ➔ Name
This will set the client's name to `Test`. The client's name can only be set **once**.

```json
{
	"arguments": {
		"name": "Test"
	}
}
```

### `7` ➔ Location
This will set the client's location to `Cafeteria`. The location must be *adjacent to the current one*.

```json
{
	"arguments": {
		"name": "Cafeteria"
	}
}
```

### `8` ➔ Clients
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

### `9` ➔ Chat
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