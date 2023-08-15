import { Query } from "../types/query.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const QueryPacket: Packet<[ Query ]> = {
    name: "QUERY",

    parameters: [
        { type: "string" }
    ],

    handler: ({ client, data: [ type ] }) => {
        type = type.toUpperCase() as Query;

        return {
            name: type, args: server.query(type.toUpperCase() as Query, client)
        };
    }
}