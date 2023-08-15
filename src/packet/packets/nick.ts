import { PacketError } from "../error.ts";
import { Query } from "../types/query.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const NickPacket: Packet<[ string ]> = {
    name: "NICK",
    parameters: [ { type: "string" } ],

    handler: ({ client, data: [ name ] }) => {
        if (client.name !== null) throw new PacketError("NICK_SET");

        if (server.clients.some(c => c.name === name)) throw new PacketError("NICK_TAKEN");
        if (name.length > 32) throw new PacketError("NICK_TOO_LONG");
        if (name.length < 2) throw new PacketError("NICK_TOO_SHORT");
        if (!name.match(/^[a-z0-9_.-]+$/)) throw new PacketError("INVALID_NICK");

        client.setName(name);

        const rooms = server.query(Query.Rooms, client);
        return { name: "ROOMS", args: rooms };
    }
}