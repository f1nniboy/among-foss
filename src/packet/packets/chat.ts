import { Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const ChatPacket: Packet = {
    name: "CHAT",

    requirements: [
        PacketRequirement.InRoom
    ],

    parameters: {
        type: "string"
    },

    handler: ({ client, args }) => {
        if (client.room!.running) throw new PacketError("FORBIDDEN");

        const message: string = args.join(" ").trim();
        if (message.length > 512) throw new PacketError("MSG_LENGTH");

        // deno-lint-ignore no-control-regex
        if (message.match(/(\x1B\[.*?[\x40-\x7E])|[\x00-\x09\x0B-\x0C\x0E-\x1F]/g)) {
            throw new PacketError("INVALID_MSG");
        }

        client.room!.broadcast({
            client, name: "CHAT", args: [ client.name, message ]
        });
    }
}