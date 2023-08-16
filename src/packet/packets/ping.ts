import { Packet } from "../mod.ts";

export const PingPacket: Packet<[ number ]> = {
    name: "PING",

    parameters: [
        { type: "number", optional: true }
    ],

    handler: async ({ client, data: [ time ] }) => {
        await client.send({
            name: "PONG", args: time ? (Date.now() - time).toString() : undefined
        });
    }
}