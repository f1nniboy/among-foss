# Packets
You can find the **IDs**, **names** and **descriptions** for packet status codes here.

## Information
### Generic
| ID  | Name    | Description                            |
| --  | ------- | -------------------------------------- |
| `0` | OK      | The packet was processed successfully. |
| `1` | Invalid | The packet data is invalid.            |
| `2` | Again   | The packet has already been sent.      |

### Name
| ID  | Name         | Description                               |
| --  | ------------ | ----------------------------------------- |
| `3` | Wrong Length | The name is either too long or too short. |

### Game
| ID  | Name        | Description                              |
| --  | ----------- | ---------------------------------------- |
| `4` | Not in Game | The client needs to be playing the game. |

## Other
You can find another type of packet status codes below.
They may *overlap* with normal packet status codes.

### Client
| ID  | Name        | Description                          |
| --  | ----------- | ------------------------------------ |
| `0` | Join        | The client joined the server         |
| `1` | Leave       | The client left the server           |
| `2` | Room Enter  | The client entered your room         |
| `3` | Room Leave  | The client left your room            |
| `4` | Vote        | The client got voted out, **unused** |

### Game Status
| ID  | Name         | Description                                             |
| --  | ------------ | ------------------------------------------------------- |
| `0` | Full         | The game is full and the client cannot join, **unused** |
| `0` | Running      | The game has started and is currently running           |
| `0` | Impostor Win | The impostor won the game                               |
| `0` | Crewmate Win | The crewmates won the game                              |