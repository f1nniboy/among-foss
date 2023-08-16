import { Packet } from "../mod.ts";

export const PingPacket: Packet = {
    name: "PING",
    always: true,

    handler: async ({ client }) => {
        await client.send({
            name: "PONG", args: Date.now().toString()
        });
    }
}