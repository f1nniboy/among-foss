type PacketErrorName =
    /** Name */
    "NICK_TAKEN" | "NICK_SET" | "NICK_TOO_LONG" | "NICK_TOO_SHORT" | "INVALID_NICK" | "CHOOSE_NICK"

    /** Chat */
    | "MSG_LENGTH" | "INVALID_MSG"

    /** Query */
    | "INVALID_QUERY"

    /* Parameter parsing */
    | "MISSING_ARG" | "INVALID_ARG"

    /** Game */
    | "NOT_ENOUGH_PLAYERS" | "ALREADY_STARTED"  | "NOT_ACTIVE" | "DEAD"

    /** Location */
    | "INVALID_LOC" | "ALREADY_LOC"

    /** Discussion */
    | "MEET_LIMIT" | "ALREADY_VOTED"

    /** Room */
    | "NOT_IN_ROOM" | "ALREADY_IN_ROOM" | "ALREADY_RUNNING" | "NOT_ROOM_HOST" | "MAX_ROOMS" | "MAX_PLAYERS"

    /** Generic errors */
    | "COOL_DOWN" | "FORBIDDEN" | "TIME_OUT" | "INVALID_CMD" | "NOT_IMPLEMENTED" | "ALREADY_CONN"

export class PacketError extends Error {
    constructor(name: PacketErrorName) {
        super(name);
    }
}