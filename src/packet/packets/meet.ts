import { Packet, PacketRequirement } from "../mod.ts";

export const MeetPacket: Packet<[ string ]> = {
    name: "MEET",

    requirements: [
        PacketRequirement.InRoom,
        PacketRequirement.Alive
    ],

    handler: ({ client }) => {
        client.room!.startDiscussion(client);
    }
}