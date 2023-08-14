import { type Client } from "../client.ts";
import { server } from "../server.ts";

export type PacketName =
    "NICK"
    | "SERVER"
    | "ERROR"
    | "OK"

export type PacketParameterType = string | number | boolean

interface PacketParameter {
    /** Type of the parameter */
    type: "string" | "number" | "boolean";

    /** Whether the parameter is optional */
    optional?: boolean;
}

interface Packet<Data extends Array<PacketParameterType>> {
    /** Name of the packet */
    name: PacketName;

    /** Parameters of the packet */
    parameters: PacketParameter[];

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

export const Packets = [
    ({
        name: "NICK",

        handler: ({ client, data: [ name ] }) => {
            client.setName(name);
        }
    } as Packet<[ string ]>)
]