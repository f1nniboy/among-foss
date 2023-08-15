import { type PacketSendOptions } from "./packet/mod.ts";

import { Room, RoomNotifyType } from "./room.ts";
import { PacketError } from "./packet/error.ts";
import { Query } from "./packet/types/query.ts";
import { connToString } from "./utils/ip.ts";
import { Loc } from "./game/location.ts";
import { server } from "./server.ts";

export enum ClientState {
    /** The client has connected, but not chosen a name yet */
    Idle = "IDLE",

    /** The client is connected & in the lobby, searching for a room */
    InLobby = "LOBBY",

    /** The client is connected & in a room */
    InRoom = "ROOM"
}

export enum ClientRole {
    Crewmate = "CREWMATE",
    Impostor = "IMPOSTOR",
    Spectator = "SPECTATOR",
    None = "NONE"
}

export class Client {
    /** The internal Deno connection */
    public readonly conn: Deno.Conn;

    /** The name of the client, if already set */
    public name: string;

    /** ID of the client */
    public readonly id: number;

    /** Current state of the client */
    public state: ClientState;

    /** Role of the client */
    public role: ClientRole;

    /** Location of the client */
    public location: Loc;

    /** Which room the client is in */
    public room: Room | null;

    constructor(conn: Deno.Conn, id: number) {
        this.conn = conn;
        this.id = id;

        this.location = Loc.Cafeteria;
        this.state = ClientState.Idle;
        this.role = ClientRole.None;
        this.name = null!;
        this.room = null;
    }

    /** Join a room. */
    public join(room: Room) {
        if (this.room !== null) throw new PacketError("ALREADY_IN_ROOM");
        if (room.running) throw new PacketError("ALREADY_RUNNING");

        if (room.clients.length + 1 > room.settings.maxPlayers) {
            throw new PacketError("MAX_PLAYERS");
        }
        
        this.room = room;
        this.room.notify(this, RoomNotifyType.RoomEnter);

        this.send({
            name: "ROOM", args: [
                room.name, room.code, room.visibility
            ]
        });
    }

    /** Leave the current room. */
    public leave() {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        this.room.notify(this, RoomNotifyType.RoomLeave);

        if (this.room.empty) server.removeRoom(this.room);
        this.room = null;

        const rooms = server.query(Query.Rooms, this);
        this.send({ name: "ROOMS", args: rooms });
    }

    /** Change the role of the client. */
    public setRole(role: ClientRole) {
        if (this.room === null) throw new PacketError("NOT_IN_LOBBY");

        this.role = role;
        this.send({ name: "PLAYER", args: [ "ROLE", role ] });
    }

    /** Change the location of the client. */
    public setLocation(location: Loc) {
        if (this.room === null) throw new PacketError("NOT_IN_LOBBY");

        this.location = location;
        this.send({ name: "PLAYER", args: [ "LOCATION", location ] });
    }

    /** Set the name of the client. */
    public setName(name: string) {
        this.state = ClientState.InLobby;
        this.name = name;
    }

    /** Send a packet to this client. */
    public send(options: Omit<PacketSendOptions, "client">) {
        server.send({ client: this, ...options });
    }

    /** Check whether this connection is identical to another, using the IP address. */
    public compare(conn: Deno.Conn) {
        return this.ip === connToString(conn);
    }

    public get ip(): string {
        return connToString(this.conn); 
    }

    public get active(): boolean {
        return this.state !== ClientState.Idle;
    }
}