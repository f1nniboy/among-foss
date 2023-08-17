type PacketErrorName =
    /** Name */
    "NICK_TAKEN" | "NICK_SET" | "NICK_TOO_LONG" | "NICK_TOO_SHORT" | "INVALID_NICK" | "AUTH"

    /** Chat */
    | "MSG_LENGTH" | "INVALID_MSG"

    /* Parameter parsing */
    | "MISSING_ARG" | "INVALID_ARG"

    /** Game */
    | "NOT_ENOUGH_PLAYERS" | "ALREADY_ACTIVE" | "NOT_ACTIVE" | "DEAD"

    /** Location */
    | "INVALID_LOC" | "ALREADY_LOC"

    /** Discussion & Reporting */
    | "MEET_LIMIT" | "ALREADY_VOTED" | "NO_BODY"

    /** Task */
    | "WRONG_LOC" | "ALREADY_DONE"

    /** Room */
    | "NOT_IN_ROOM" | "ALREADY_IN_ROOM" | "NOT_ROOM_HOST" | "MAX_ROOMS" | "MAX_PLAYERS"

    /** Generic errors */
    | "COOL_DOWN" | "FORBIDDEN" | "INVALID_CMD" | "NOT_IMPLEMENTED"

export class PacketError extends Error {
    constructor(name: PacketErrorName) {
        super(name);
    }
}