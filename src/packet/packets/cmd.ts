import { PacketError } from "../error.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const CommandPacket: Packet<[ string ]> = {
    name: "CMD",

    parameters: [
        { type: "string" }
    ],

    handler: ({ data: [ name ], args }) => {
        args.shift();

        if (name === "start") {
            //server.game.start();
        } else if (name === "kick") {
            const target = args[0];
            if (!target) throw new PacketError("MISSING_ARG");

            const client = server.clients.find(c => c.name === target);
            if (!client) throw new PacketError("INVALID_ARG");

        } else {
            throw new PacketError("INVALID_CMD");
        }
    }
}