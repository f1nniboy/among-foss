import { Loc, Locations } from "../../game/location.ts";
import { Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const MovePacket: Packet<[ string ]> = {
    name: "MOVE",

    requirements: [
        PacketRequirement.InGame
    ],

    parameters: [
        { type: "string" }
    ],

    handler: async ({ client, data: [ loc ] }) => {
        if (client.temp.lastMove && client.temp.lastMove + (client.room!.settings.delayPerMove * 1000) > Date.now()) {
            throw new PacketError("COOL_DOWN");
        }

        if (!Locations[loc as Loc]) throw new PacketError("INVALID_LOC");
        if (client.location === loc) throw new PacketError("ALREADY_LOC");

        await client.setLocation(loc as Loc);
    }
}