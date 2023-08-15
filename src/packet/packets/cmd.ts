import { Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const CommandPacket: Packet<[ string ]> = {
    name: "CMD",

    requirements: [
        PacketRequirement.InRoom, PacketRequirement.RoomHost
    ],

    parameters: [
        { type: "string" }
    ],

    handler: ({ client, data: [ name ], args }) => {
        args.shift();

        if (name === "start") {
            client.room!.start();

        } else {
            throw new PacketError("INVALID_CMD");
        }
    }
}