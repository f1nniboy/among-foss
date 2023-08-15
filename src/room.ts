import { PacketBroadcastOptions } from "./packet/mod.ts";
import { Client, ClientRole } from "./client.ts";
import { PacketError } from "./packet/error.ts";
import { Loc } from "./game/location.ts";
import { server } from "./server.ts";

enum RoomState {
    /** The players are waiting for the game to start & can chat */
    Lobby = "LOBBY",

    /** The game is currently running */
    Main = "MAIN",

    /** Players can vote out others & chat */
    Discussion = "DISCUSSION"
}

export enum RoomVisibility {
    /** The room will be sent to players when querying & anyone can join */
    Public = "PUBLIC",

    /** The room can only be joined using the code */
    Private = "PRIVATE"
}

export enum RoomNotifyType {
    Join = "JOIN",
    Leave = "LEAVE"
}

interface RoomSettings {
    /** How many impostors will play */
    impostors: number;

    /** How many seconds should be between each move a user can make between rooms */
    delayPerMove: number;

    /** Minimum amount of players to start the game */
    minPlayers: number;
}

export class Room {
    /** State of the room */
    public state: RoomState;

    /** Visibility of the room */
    public visibility: RoomVisibility;

    /** Host of the room */
    public host: Client;

    /** Code of the room */
    public code: string;

    /** Specific room settings */
    public readonly settings: RoomSettings;

    constructor({ host, visibility, code }: Pick<Room, "host" | "visibility" | "code">) {
        this.state = RoomState.Lobby;

        this.visibility = visibility;
        this.code = code;
        this.host = host;

        /* Sane default settings */
        this.settings = {
            impostors: 1, delayPerMove: 15, minPlayers: 1
        };
    }

    /** Start the game. */
    public start() {
        if (this.state !== RoomState.Lobby) throw new PacketError("GAME_ALREADY_STARTED");
        if (server.clients.length < this.settings.minPlayers) throw new PacketError("NOT_ENOUGH_PLAYERS");

        this.setState(RoomState.Main);
        
        for (const client of server.clients) {
            client.setLocation(Loc.Cafeteria);
            client.setRole(ClientRole.Crewmate);
        }
    }

    /** Update the state of the game. */
    private setState(state: RoomState) {
        this.state = state;

        server.broadcast({
            name: "STATE", args: state
        });
    }

    /** Notify other clients when a client joins or leaves. */
    public notify(client: Client, type: RoomNotifyType) {
        this.broadcast({
            client, name: type, args: client.name
        });
    }

	/** Broadcast a packet to all connected clients in the room. */
	public broadcast({ client: except, name, args }: PacketBroadcastOptions) {
		for (const client of this.clients.filter(c => c.active)) {
			if (except && client.id === except.id) continue;
			server.send({ client, name, args });
		}
	}

    /** Which players are the impostors */
    public impostors(): Client[] {
        return server.clients.filter(c => c.role === ClientRole.Impostor);
    }

    /** Which clients are connected to this room */
    public get clients(): Client[] {
        return server.clients.filter(c => c.room === this);
    }

    /** Whether the game is currently running */
    public get running(): boolean {
        return this.state === RoomState.Main;
    }

    /** Name of the room */
    public get name(): string {
        return this.host.name;
    }

    /** Generate a room code. */
    public static code(): string {
        return `${Math.floor((Math.random() * 10000))}`;
    }
}