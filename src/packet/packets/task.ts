import { Packet, PacketRequirement } from "../mod.ts";

export const TaskPacket: Packet<[ string ]> = {
    name: "TASK",

    requirements: [
        PacketRequirement.InRoom,
        PacketRequirement.Alive
    ],

    parameters: [
        { type: "string" }
    ],

    handler: async ({ client }) => {
        await client.room!.startDiscussion(client);
    }
}