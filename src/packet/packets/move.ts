import { Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const MovePacket: Packet<[ string ]> = {
    name: "MOVE",
    description: "Move around in the map",

    requirements: [
        PacketRequirement.InGame
    ],

    parameters: [
        {
            name: "loc",
            description: "New location to move to",
            type: "string"
        }
    ],

    handler: async ({ client, data: [ loc ] }) => {
        if (!client.room!.map.location(loc)) throw new PacketError("INVALID_LOC");
        if (client.hasCooldown("move")) throw new PacketError("COOL_DOWN");

        await client.setLocation(loc);
    }
}