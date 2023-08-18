import { type Packet } from "../mod.ts";

export const PingPacket: Packet<[ number ]> = {
    name: "PING",
    description: "Regular heartbearts to prevent the client from being kicked due to inactivity",

    parameters: [
        {
            name: "time",
            description: "Unix time in milliseconds of the client",
            type: "number",
            optional: true
        }
    ],

    handler: async ({ client, data: [ time ] }) => {
        await client.send({
            name: "PONG", args: time ? (Date.now() - time).toString() : undefined
        });
    }
}