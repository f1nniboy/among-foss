import { Packet, PacketRequirement } from "../mod.ts";

export const ChatPacket: Packet = {
    name: "CHAT",
    description: "Send a chat message",

    requirements: [
        PacketRequirement.InRoom
    ],

    parameters: {
        name: "message",
        description: "The chat message to send",
        type: "string"
    },

    handler: async ({ client, args }) => {
        const message: string = args.join(" ").trim();
        await client.room!.chat(client, message);
    }
}