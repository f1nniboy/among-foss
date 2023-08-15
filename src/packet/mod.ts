import { type Client } from "../client.ts";
import { PacketError } from "./error.ts";

export type PacketName = string

export type PacketParameterType = string | number | boolean

interface PacketParameter {
    /** Type of the parameter */
    type: "string" | "number" | "boolean";

    /** Whether the parameter is optional */
    optional?: boolean;
}

export enum PacketRequirement {
    /** The client has to be connected to a room */
    InRoom,

    /** The client has to be the room host */
    RoomHost,

    /** The client has to be in a game round */
    InGame
}

export interface Packet<Data extends Array<PacketParameterType> = Array<PacketParameterType>> {
    /** Name of the packet */
    name: PacketName;

    /** Parameters of the packet */
    parameters?: PacketParameter[] | PacketParameter;

    /** Requirements of the packet */
    requirements?: PacketRequirement[];

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
    args?: string[] | string;
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
    client?: Client;

    /** Which clients to send this to */
    clients?: Client[];
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
        if (!arg && !param.optional) throw new PacketError("MISSING_ARG");

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