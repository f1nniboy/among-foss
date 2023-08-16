import { Packet, PacketRequirement } from "../mod.ts";

export const ChatPacket: Packet = {
    name: "CHAT",

    requirements: [
        PacketRequirement.InRoom
    ],

    parameters: {
        type: "string"
    },

    handler: async ({ client, args }) => {
        const message: string = args.join(" ").trim();
        await client.room!.chat(client, message);
    }
}