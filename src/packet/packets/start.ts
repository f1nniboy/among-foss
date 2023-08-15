import { Packet, PacketRequirement } from "../mod.ts";

export const StartPacket: Packet = {
    name: "START",

    requirements: [
        PacketRequirement.InRoom, PacketRequirement.RoomHost
    ],

    handler: ({ client }) => {
        client.room!.start();
    }
}