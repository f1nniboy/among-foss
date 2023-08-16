import { Packet, PacketRequirement } from "../mod.ts";

export const MeetPacket: Packet<[ string ]> = {
    name: "MEET",

    requirements: [
        PacketRequirement.InRoom,
        PacketRequirement.Alive
    ],

    handler: async ({ client }) => {
        await client.room!.startDiscussion(client);
    }
}