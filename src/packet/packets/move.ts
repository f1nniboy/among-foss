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

    handler: ({ client, data: [ loc ] }) => {
        if (!Locations[loc as Loc]) throw new PacketError("INVALID_LOC");
        client.setLocation(loc as Loc);
    }
}