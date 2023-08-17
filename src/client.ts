import { type PacketSendOptions } from "./packet/mod.ts";

import { DisconnectReason } from "./packet/types/disconnect.ts";
import { TaskName, randomTasks } from "./game/task.ts";
import { Room, RoomDataType, RoomNotifyType, RoomState } from "./room/room.ts";
import { LocationID } from "./game/location.ts";
import { PacketError } from "./packet/error.ts";
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
    /** How many discussions the client has remaining */
    remainingDiscussions: number;

    /** Tasks assigned to the client */
    tasks: Record<`${LocationID}:${TaskName}`, boolean> | null;

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
    public location: LocationID;

    /** Temporary data, used during the game */
    public temp: ClientTemporaryData;

    /** Which room the client is in */
    public room: Room | null;

    /** The current time-out timer */
    public timer: number | null;

    /* Cool-down timers */
    public spam: Record<string, number>;

    constructor(conn: Deno.Conn, id: number) {
        this.conn = conn;
        this.id = id;

        this.state = ClientState.Idle;
        this.role = ClientRole.None;
        this.location = "NONE";

        this.timer = null;
        this.name = null!;
        this.room = null;
        this.spam = {};

        this.temp = null!;
        this.clean();
    }

    /** Join a room. */
    public async join(room: Room) {
        if (this.room !== null) throw new PacketError("ALREADY_IN_ROOM");
        if (room.running) throw new PacketError("ALREADY_ACTIVE");

        if (room.clients.length + 1 > room.settings.maxPlayers) {
            throw new PacketError("MAX_PLAYERS");
        }
        
        this.room = room;

        await this.room.notify(this, RoomNotifyType.RoomEnter);
        await this.send(room.data(RoomDataType.Join));

        await this.send({
            name: "PLAYERS", args: [
                ...this.room.clients.filter(c => c.id !== this.id).map(c => c.name)
            ]
        });

        await room.pushListData(); 
    }

    /** Leave the current room. */
    public async leave() {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");
        const room = this.room;

        await this.room.notify(this, RoomNotifyType.RoomLeave);
        await this.room.clean();

        this.room = null;
        this.clean();

        if (room.state !== RoomState.Inactive) await room.pushListData();
        await server.sendRoomList(this);
    }
    
    /** Clean up all game-related variables. */
    public clean() {
        this.temp = {
            tasks: null, remainingDiscussions: 0, voted: false, votes: 0
        };

        this.role = ClientRole.None;
        this.location = "NONE";
    }

    /** Kill the client. */
    public async die(broadcast = false) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");
        await this.setRole(ClientRole.Spectator);

        if (broadcast) {
            await this.room.broadcast({
                client: this, name: "DIE", args: this.name,
                clients: this.room.players.filter(c => c.location === this.location)
            });
        }
    }

    /** Kill another client. */
    public async kill(target: Client) {
        if (
            this.role !== ClientRole.Impostor || target.role === ClientRole.Impostor || target.location !== this.location
        ) throw new PacketError("FORBIDDEN");

        if (this.hasCooldown("kill")) throw new PacketError("COOL_DOWN");
        this.room!.temp.corpses[target.name] = this.location;

        this.setCooldown("kill", this.room!.settings.delays.kill * 1000);

        await target.die(true);
        await this.room!.check();
    }

    /** Complete an assigned task. */
    public async completeTask(id: TaskName) {
        if (!this.alive) throw new PacketError("DEAD");
        if (this.role === ClientRole.Impostor || !this.temp.tasks) throw new PacketError("FORBIDDEN");
        if (this.temp.tasks[`${this.location}:${id}`] == undefined) throw new PacketError("INVALID_ARG");

        /* Corresponding task data */
        const task = this.room!.map!.task(id)!;
        if (!task.loc.includes(this.location)) throw new PacketError("WRONG_LOC");

        this.temp.tasks[`${this.location}:${id}`] = true;

        await this.send({ name: "TASK", args: [ this.location, id ] });
        await this.room!.broadcastProgress();
    }

    /** Assign tasks to the client. */
    public async assignTasks(amount: number) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        this.temp.tasks = randomTasks(this.room.map!.tasks, amount);
        await this.send({ name: "TASKS", args: this.tasks() });
    }

    /** Send the client their pending & completed tasks. */
    public tasks(): string[] {
        return Object.entries(this.temp.tasks!).map(
            ([ key, done ]) => {
                const [ location, id ] = key.split(":");
                return `${location}:${id}:${Number(done)}`;
            }
        );
    }

    /** Change the role of the client. */
    public async setRole(role: ClientRole) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");

        this.role = role;
        await this.send({ name: "ROLE", args: role });
    }

    /** Change the location of the client. */
    public async setLocation(location: LocationID, instant = false) {
        if (this.room === null) throw new PacketError("NOT_IN_ROOM");
        if (!instant && this.location === location) throw new PacketError("ALREADY_LOC");

        /* Whether the new location is next to the previous one */
        const neighboring: boolean = instant
            || this.role === ClientRole.Spectator
            || this.location === location
            || this.room.map!.location(this.location)!.doors.includes(location);
        
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

        this.setCooldown("move", this.room.settings.delays.move * 1000);
        this.location = location;

        if (!instant) await this.send({
            name: "PLAYERS", args: [
                ...this.room.players.filter(c => c.id !== this.id && c.location === this.location && c.alive).map(c => c.name),

                ...Object.entries(this.room.temp.corpses)
                    .filter(([ _, location ]) => location === this.location)
                    .map(([ name ]) => `#${name}`)
            ]
        });
        
        await this.send({ name: "LOCATION", args: location });
        if (!instant) await this.room.check();
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

    public setCooldown(key: string, duration: number) {
        this.spam[key] = Date.now() + duration;
    }

    public hasCooldown(key: string): boolean {
        return this.spam[key] !== undefined && this.spam[key] > Date.now();
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

    public get active(): boolean {
        return this.state === ClientState.Connected;
    }

    public get alive(): boolean {
        return this.role === ClientRole.Crewmate || this.role === ClientRole.Impostor;
    }

    public get ip(): string {
        return connToString(this.conn); 
    }
}