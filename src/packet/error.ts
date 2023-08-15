type PacketErrorName =
    /** Name */
    "NICK_TAKEN" | "NICK_SET" | "NICK_TOO_LONG" | "NICK_TOO_SHORT" | "INVALID_NICK" | "CHOOSE_NICK"

    /** Chat */
    | "MESSAGE_TOO_LONG"

    /** Query */
    | "INVALID_QUERY"

    /* Parameter parsing */
    | "MISSING_ARG" | "INVALID_ARG"

    /** Game */
    | "NOT_ENOUGH_PLAYERS" | "GAME_ALREADY_STARTED"

    /** Location */
    | "NOT_NEIGHBORING"

    /** Room */
    | "NOT_IN_ROOM" | "ALREADY_IN_ROOM" | "ALREADY_RUNNING" | "NOT_ROOM_HOST" | "MAX_ROOMS" | "MAX_PLAYERS"

    /** Generic errors */
    | "NOT_IN_LOBBY" | "INVALID_CMD" | "NOT_IMPLEMENTED" | "ALREADY_CONN"

export class PacketError extends Error {
    constructor(name: PacketErrorName) {
        super(name);
    }
}