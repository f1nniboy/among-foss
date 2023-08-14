import { type Client } from "../client.ts";

import { QueryType } from "./types/query.ts";
import { PacketError } from "./error.ts";
import { server } from "../server.ts";

export type PacketName =
    "NICK" | "CHAT" | "SERVER" | "ERROR" | "PLAYERS" | "QUERY"

export type PacketParameterType = string | number | boolean

interface PacketParameter {
    /** Type of the parameter */
    type: "string" | "number" | "boolean";

    /** Whether the parameter is optional */
    optional?: boolean;
}

interface Packet<Data extends Array<PacketParameterType> = Array<PacketParameterType>> {
    /** Name of the packet */
    name: PacketName;

    /** Parameters of the packet */
    parameters?: PacketParameter[] | PacketParameter;

    /** Handler of the packet */
    handler: (data: PacketHandlerData<Data>) => PacketReply | void;
}

interface PacketHandlerData<Data extends Array<PacketParameterType>> {
    /** The raw arguments */
    args: PacketParameterType[];

    /** The specified data */
    data: Data;

    /** Which client sent this packet */
    client: Client;
}

interface PacketReply {
    name: PacketName;
    args?: string[];
}

export interface PacketReceiveOptions {
    /** Client, that sent the packet */
    client: Client;

    /** Raw data */
    raw: string;
}

export interface PacketSendOptions {
    /** Client to send the packet to */
    client: Client;

    /** Which packet to send */
    name: PacketName;

    /** Arguments to send with the packet */
    args?: PacketParameterType[] | string;
}

export type PacketBroadcastOptions = Omit<PacketSendOptions, "client"> & {
    /** Client to exclude, optional */
    client: Client | null;
}

/** Parse all packet parameters. */
export const parseParameters = (packet: Packet, args: string[]): PacketParameterType[] => {
    const params = packet.parameters ?
        !Array.isArray(packet.parameters) ? [ packet.parameters ] : packet.parameters
        : [];

    if (params.length === 0) return [];
    
    /* Final, parsed parameters */
    const parsed: PacketParameterType[] = [];

    params.forEach((param, index) => {
        const arg = args[index];
        if (!arg) throw new PacketError("MISSING_ARG");

        // deno-lint-ignore valid-typeof
        if (param.type !== typeof arg) throw new PacketError("INVALID_ARG");

        if (param.type === "boolean") {
            parsed.push(arg === "true");
            
        } else if (param.type === "number") {
            if (isNaN(parseFloat(arg))) throw new PacketError("INVALID_ARG");
            parsed.push(parseFloat(arg));

        } else {
            parsed.push(arg);
        }
    });

    return parsed;
}

// deno-lint-ignore no-explicit-any
export const Packets: Packet<any>[] = [
    ({
        name: "NICK",

        parameters: [
            { type: "string" }
        ],

        handler: ({ client, data: [ name ] }) => {
            if (server.clients.some(c => c.name === name)) throw new PacketError("NICK_TAKEN");
            if (name.length > 32) throw new PacketError("NICK_TOO_LONG");
            if (name.length < 2) throw new PacketError("NICK_TOO_SHORT");
            if (client.name !== null) throw new PacketError("NICK_SET");

            client.setName(name);
            
            const players = server.query("PLAYERS");
            if (players.length > 0) return { name: "PLAYERS", args: players };
        }
    } as Packet<[ string ]>),

    ({
        name: "QUERY",

        parameters: [
            { type: "string" }
        ],

        handler: ({ data: [ type ] }) => {
            return { name: type, args: server.query(type) };
        }
    } as Packet<[ QueryType ]>),

    ({
        name: "CHAT",

        parameters: {
            name: "message", type: "string"
        },

        handler: ({ client, args }) => {
            /* Message to send */
            const message: string = args.join(" ").trim();

            if (message.length > 512) throw new PacketError("MESSAGE_TOO_LONG");

            server.broadcast({
                client, name: "CHAT", args: message
            });
        }
    } as Packet)
]