# Among FOSS • Errors
This document contains information about each error the server may send, and how they might be triggered.

The server sends errors to the client like this:
```
...
<- ERR <NAME>
```

## Authentication
| Name             | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `NICK_TAKEN`     | The nickname is already being used by another client.                   |
| `NICK_SET`       | The client has already set a nickname.                                  |
| `NICK_TOO_LONG`  | The nickname is too long.                                               |
| `NICK_TOO_SHORT` | The nickname is too short.                                              |
| `INVALID_NICK`   | The nickname contains spaces, special characters, or ANSI escape codes. |
| `AUTH`           | The client has to choose a nickname to continue.                        |

## Chat
| Name          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `MSG_LENGTH`  | The chat message is too long.                                         |
| `INVALID_MSG` | The chat message contains invalid characters, e.g. ANSI escape codes. |

## Packet parameters
| Name          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `MISSING_ARG` | The packet is missing a require argument.                             |
| `INVALID_ARG` | A specified argument is not valid, e.g. doesn't exist, of wrong type. |

## Game
| Name                 | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `NOT_ENOUGH_PLAYERS` | There are not enough players in the lobby to start the game. |
| `ALREADY_ACTIVE`     | The game is already running.                                 |
| `NOT_ACTIVE`         | The game is not running.                                     |
| `DEAD`               | The client cannot perform this action, as it is dead.        |

## Location
| Name          | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `INVALID_LOC` | The given location does not exist or is not next to the current one. |
| `ALREADY_LOC` | The given location is already the current one.                       |

## Discussion & Reporting
| Name            | Description                                                           |
| ------------    | --------------------------------------------------------------------- |
| `MEET_LIMIT`    | The client has used up all button presses, and cannot call a meeting. |
| `ALREADY_VOTED` | The client has already voted for someone or to skip.                  |
| `NO_BODY`       | There is no dead body in the current location to report.              |

## Task
| Name            | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `WRONG_LOC`     | The task is valid & assigned, but the client is in the wrong location. |
| `ALREADY_DONE`  | The client has already completed this task.                            |

## Room
| Name              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `NOT_IN_ROOM`     | The client has to be in a room to perform this action.                      |
| `ALREADY_IN_ROOM` | The client is already connected to a room.                                  |
| `NOT_ROOM_HOST`   | The client has to be the room host to perform this action.                  |
| `MAX_ROOMS`       | The server has reached the room limit, and further rooms cannot be created. |
| `MAX_PLAYERS`     | The room has reached the player limit, and further players cannot join.     |

## General
| Name              | Description                                  |
| ----------------- | -------------------------------------------- |
| `COOL_DOWN`       | This action is currently being rate-limited. |
| `FORBIDDEN`       | This action is not allowed at the moment.    |
| `INVALID_CMD`     | An invalid packet was sent to the server.    |
| `NOT_IMPLEMENTED` | This action has not been implemented yet.    |