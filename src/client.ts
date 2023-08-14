import { PacketError } from "./packet/error.ts";
import { type PacketSendOptions } from "./packet/mod.ts";
import { server } from "./server.ts";
import { connToString } from "./utils/ip.ts";

export enum ClientState {
    /** The client has connected, but not chosen a name yet */
    Connecting,

    /** The client is connected */
    Connected
}

export class Client {
    /** The internal Deno connection */
    public readonly conn: Deno.Conn;

    /** Current state of the client */
    public state: ClientState;

    /** The name of the client, if already set */
    public name: string | null;

    /* ID of the client */
    public readonly id: number;

    constructor(conn: Deno.Conn, id: number) {
        this.conn = conn;
        this.id = id;

        this.state = ClientState.Connecting;
        this.name = null;
    }

    /** Set the name of the client. */
    public setName(name: string): void {
        if (this.name !== null) throw new PacketError("NICK_ALREADY_SET");
        this.name = name;
    }

    /** Send a packet to this client. */
    public send(options: Omit<PacketSendOptions, "client">): void {
        server.send({ client: this, ...options });
    }

    /** Check whether this connection is identical to another, using the IP address. */
    public compare(conn: Deno.Conn) {
        return this.ip === connToString(conn);
    }

    public get ip(): string {
        return connToString(this.conn); 
    }
}