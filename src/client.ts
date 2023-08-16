import { type PacketSendOptions } from "./packet/mod.ts";

import { Task, Tasks, chooseRandomTasks } from "./game/task.ts";
import { DisconnectReason } from "./packet/types/disconnect.ts";
import { Loc, Locations } from "./game/location.ts";
import { Room, RoomNotifyType } from "./room.ts";
import { PacketError } from "./packet/error.ts";
import { Query } from "./packet/types/query.ts";
import { connToString } from "./utils/ip.ts";
import { server } from "./server.ts";

export enum ClientState {
    /** The client has connected, but not chosen a name yet */
    Idle = "IDLE",

    /** The client is connected */
    Connected = "LOBBY"
}

export enum ClientRole {
    Crewmate = "CREWMATE",
    Impostor = "IMPOSTOR",
    Spectator = "SPECTATOR",
    None = "NONE"
}

interface ClientTemporaryData {
    /* When the client did their last move */
    lastMove: number | null;

    /* How many discussions the client has remaining */
    remainingDiscussions: number;

    /** Tasks assigned to the client */
    tasks: Partial<Record<Task, boolean>> | null;

    /** Whether the client has voted already */
    voted: boolean;

    /** Amount of votes for the client */
    votes: number;
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

    /** Temporary data, used during the game */
    public temp: ClientTemporaryData;

    /** Which room the client is in */
    public room: Room | null;

    /** The current time-out timer */
    public timer: number | null;

    constructor(conn: Deno.Conn, id: number) {
        this.conn = conn;
        this.id = id;

        this.location = Loc.Cafeteria;
        this.state = ClientState.Idle;
        this.role = ClientRole.None;

        this.timer = null;
        this.name = null!;
        this.room = null;

        this.temp = null!;
        this.clean();
    }

    /** Join a room. */
    public async join(room: Room) {
        if (this.room !== null) throw new PacketError("ALREADY_IN_ROOM");
        if (room.running) throw new PacketError("ALREADY_RUNNING");

        if (room.clients.length + 1 > room.settings.maxPlayers) {
            throw new PacketError("MAX_PLAYERS");
        }
        
        this.room = room;
        this.room.notify(this, RoomNotifyType.RoomEnter);

        await this.send({
            name: "ROOM", args: [
                room.name, room.code, room.visibility
            ]
        });
    }

    /** Leave the current room. */
    public async leave() {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        await this.room.notify(this, RoomNotifyType.RoomLeave);
        this.room.clean();

        this.room = null;
        this.clean();

        const rooms = server.query(Query.Rooms, this);
        await this.send({ name: "ROOMS", args: rooms });
    }
    
    /** Clean up all game-related variables. */
    public clean() {
        this.temp = {
            lastMove: null, tasks: null, remainingDiscussions: 0, voted: false, votes: 0
        };

        this.role = ClientRole.None;
        this.location = Loc.Cafeteria;
    }

    /** Complete an assigned task. */
    public async completeTask(id: Task) {
        if (!this.alive) throw new PacketError("DEAD");
        if (this.role === ClientRole.Impostor || !this.temp.tasks) throw new PacketError("FORBIDDEN");
        
        /* Corresponding task data */
        const task = Tasks[id];
        if (this.location !== task.location) throw new PacketError("WRONG_LOC");

        this.temp.tasks[id] = true;
        await this.send({ name: "TASKS", args: this.tasks() });
    }

    /** Kill the client. */
    public async kill(by?: Client) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");
        await this.setRole(ClientRole.Spectator);

        if (by) {
            await this.room.broadcast({
                client: this, name: "DIE", args: this.name,
                clients: this.room.players.filter(c => c.location === this.location)
            });
        }
    }

    /** Choose tasks for the client. */
    public async chooseTasks() {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        this.temp.tasks = chooseRandomTasks(this.room.settings.tasks);
        await this.send({ name: "TASKS", args: this.tasks() });
    }

    /** Send the client their pending & completed tasks. */
    public tasks(): string[] {
        return Object.entries(this.temp.tasks!).map(([ id, done ]) => `${id}:${Tasks[id as Task].location}:${Number(done)}`);
    }

    /** Change the role of the client. */
    public async setRole(role: ClientRole) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        this.role = role;
        await this.send({ name: "ROLE", args: role });
    }

    /** Change the location of the client. */
    public async setLocation(location: Loc) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        /* Whether the new location is next to the previous one */
        const neighboring: boolean = this.location === location || Locations[this.location].doors.includes(location);
        if (!neighboring) throw new PacketError("INVALID_LOC");

        if (this.room.running) {
            /* Location leave */
            this.room.notify(
                this, RoomNotifyType.LocationLeave, this.room.clients.filter(c => c.location === this.location)
            );

            /* Location enter */
            this.room.notify(
                this, RoomNotifyType.LocationEnter, this.room.clients.filter(c => c.location === location)
            );
        }

        this.temp.lastMove = Date.now();
        this.location = location;

        await this.send({ name: "LOCATION", args: location });
    }

    /** Set the name of the client. */
    public setName(name: string) {
        this.state = ClientState.Connected;
        this.name = name;
    }

    /** Refresh the inactivity timer. */
    public ping() {
        if (this.timer) clearTimeout(this.timer);

        this.timer = setTimeout(async () => {
            await this.disconnect(DisconnectReason.TimeOut);
        }, 3 * 60 * 1000);
    }

    /** Disconnect the client. */
    public async disconnect(reason: DisconnectReason) {
        await this.send({
            name: "PART", args: reason
        });

        if (this.timer) clearTimeout(this.timer);
        this.conn.close();
    }

    /** Send a packet to this client. */
    public send(options: Omit<PacketSendOptions, "client">) {
        return server.send({ client: this, ...options });
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

    public get alive(): boolean {
        return this.role === ClientRole.Crewmate || this.role === ClientRole.Impostor;
    }
}