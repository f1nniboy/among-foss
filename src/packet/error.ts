type PacketErrorName =
    /** Name */
    "NICK_TAKEN" | "NICK_SET" | "NICK_TOO_LONG" | "NICK_TOO_SHORT" | "CHOOSE_NICK"

    /** Chat */
    | "MESSAGE_TOO_LONG"

    /** Query */
    | "INVALID_QUERY"

    /* Parameter parsing */
    | "MISSING_ARG" | "INVALID_ARG"

    /** Generic errors */
    | "NOT_IN_LOBBY" | "INVALID_CMD" | "NOT_IMPLEMENTED"

export class PacketError extends Error {
    constructor(name: PacketErrorName) {
        super(name);
    }
}