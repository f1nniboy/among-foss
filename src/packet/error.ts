type PacketErrorName = "NICK_TAKEN" | "NICK_ALREADY_SET"

export class PacketError extends Error {
    constructor(name: PacketErrorName) {
        super(name);
    }
}