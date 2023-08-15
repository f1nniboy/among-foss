import { PacketError } from "../error.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const ChatPacket: Packet = {
    name: "CHAT",

    parameters: {
        type: "string"
    },

    handler: ({ client, args }) => {
        const message: string = args.join(" ").trim();
        if (message.length > 512) throw new PacketError("MESSAGE_TOO_LONG");

        server.broadcast({
            client, name: "CHAT", args: [ client.name, message ]
        });
    }
}