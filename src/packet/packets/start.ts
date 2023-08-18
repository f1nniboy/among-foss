import { type Packet, PacketRequirement } from "../mod.ts";

export const StartPacket: Packet = {
    name: "START",
    description: "Start the game",

    requirements: [
        PacketRequirement.InRoom, PacketRequirement.RoomHost
    ],

    handler: async ({ client }) => {
        await client.room!.startGame();
    }
}