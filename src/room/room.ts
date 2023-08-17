import { DiscussionReason, DiscussionResult } from "../packet/types/discussion.ts";
import { PacketBroadcastOptions } from "../packet/mod.ts";
import { Client, ClientRole } from "../client.ts";
import { PacketError } from "../packet/error.ts";
import { LocationID } from "../game/location.ts";
import { GameMap, MapID } from "../game/map.ts";
import { GameMaps } from "../game/maps/mod.ts";
import { Logger } from "../utils/logger.ts";
import { server } from "../server.ts";
import { colors } from "../deps.ts";

export enum RoomState {
    /** The players are waiting for the game to start & can chat */
    Lobby = "LOBBY",

    /** The game is currently running */
    Main = "MAIN",

    /** Players can vote out others & chat */
    Discussion = "DISCUSSION",

    /** The room is not active anymore */
    Inactive = "INACTIVE"
}

export enum RoomVisibility {
    /** The room will be sent to players when querying & anyone can join */
    Public = "PUBLIC",

    /** The room can only be joined using the code */
    Private = "PRIVATE"
}

export enum RoomNotifyType {
    RoomEnter = "JOIN",
    RoomLeave = "PART",

    LocationEnter = "ENTER",
    LocationLeave = "LEAVE",

    VentEnter = "VENT_ENTER",
    VentLeave = "VENT_LEAVE"
}

export enum RoomDataType {
    Create = "CREATE",
    Update = "UPDATE",
    Delete = "DELETE",
    Join = "JOIN",
    Sync = "SYNC",
    End = "END"
}

interface RoomSettings {
    delays: {
        /** How many seconds should be between each move a user can make between rooms */
        move: number;

        /** How many seconds should be between each kill an impostor can do */
        kill: number;

        /** How many seconds should be between each vent an impostor can use */
        vent: number;

        /** How many seconds of delay should be after a user calls a discussion */
        discussion: number;
    };

    /** Minimum amount of players to start the game */
    minPlayers: number;

    /** Maximum amount of players in the room */
    maxPlayers: number;

    /** How many tasks each player should receive */
    tasks: number;

    /** How many discussions a player has per-game */
    discussions: number;

    /** Map to play on */
    map: MapID;
}

interface RoomTemporaryData {
    /* When the last discussion was called */
    lastDiscussion: number | null;

    /** Corpses in the map; stored in a separate object to keep corpses of people who left */
    corpses: Record<string, LocationID>;

    /* The current impostor */
    impostor: Client | null;

    /* Skips in the current meeting */
    skips: number;
}

interface RoomProgress {
    /** Amount of completed tasks */
    completed: number;

    /** Total amount of tasks */
    total: number;
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

    /** Map of the room */
    public map: GameMap | null;

    /** Temporary data */
    public temp: RoomTemporaryData;

    /** Specific room settings */
    public readonly settings: RoomSettings;

    constructor({ host, visibility, code }: Pick<Room, "host" | "visibility" | "code">) {
        this.state = RoomState.Lobby;
        this.map = null;

        this.temp = {
            lastDiscussion: null, skips: 0, corpses: {}, impostor: null
        };

        this.visibility = visibility;
        this.code = code;
        this.host = host;

        /* Sane default settings */
        this.settings = {
            map: "SKELD",

            delays: {
                move: 10, vent: 15, discussion: 60, kill: 60
            },

            minPlayers: 1, maxPlayers: 10,
            tasks: 8, discussions: 2
        };

        Logger.info(`Room ${colors.bold(this.name)} has been created.`);
    }

    /** Start the game. */
    public async startGame() {
        if (this.state !== RoomState.Lobby) throw new PacketError("ALREADY_ACTIVE");
        if (server.clients.length < this.settings.minPlayers) throw new PacketError("NOT_ENOUGH_PLAYERS");

        /* Figure out which map to use. */
        await this.setMap(
            new GameMaps[this.settings.map]()
        );

        /* Lucky person to be the impostor */
        const impostorIndex = Math.floor(Math.random() * this.clients.length);

        /* Assign clients their roles & tasks. */
        for (const [ index, client ] of this.clients.entries()) {
            await client.setRole(impostorIndex === index ? ClientRole.Impostor : ClientRole.Crewmate);
            if (impostorIndex === index) this.temp.impostor = client;

            await client.setLocation(this.map!.spawn, true);
            
            await client.assignTasks(this.settings.tasks);
            client.temp.remainingDiscussions = this.settings.discussions;
        }
        
        await this.setState(RoomState.Main);
        await this.pushListData();

        Logger.info(`Room ${colors.bold(this.name)} has started.`);
    }

    /** Start the voting discussion. */
    public async startDiscussion(client: Client, reason: DiscussionReason) {
        if (this.state === RoomState.Discussion || this.state === RoomState.Lobby || client.location !== this.map!.spawn) throw new PacketError("FORBIDDEN");
        if (client.temp.remainingDiscussions === 0) throw new PacketError("MEET_LIMIT");

        if (this.temp.lastDiscussion && this.temp.lastDiscussion + (this.settings.delays.discussion * 1000) > Date.now()) {
            throw new PacketError("COOL_DOWN");
        }

        this.temp.skips = 0;

        await this.broadcast({ name: "MEET", args: reason });
        this.setState(RoomState.Discussion);

        /* Duration of the discussion */
        const duration: number = this.settings.delays.discussion * 1000;
        const started = Date.now();

        /** Wait until the discussion is done. */
        do {
            await new Promise(resolve => setTimeout(resolve, 1000));
        } while (!this.clients.every(c => c.temp.voted) && started + duration > Date.now() && this.state !== RoomState.Inactive);

        if (this.state === RoomState.Inactive) return;

        /** Figure out how the discussion ended. */
        let result = DiscussionResult.Skip;
        let target: Client | null = null;

        let maxVotes = this.temp.skips;

        for (const client of this.players) {
            if (client.temp.votes > maxVotes) {
                maxVotes = client.temp.votes;
                target = client;

                result = DiscussionResult.Eject
                continue;

            } else if (client.temp.votes === maxVotes && target !== null) {
                result = DiscussionResult.Tie;
                target = null;
            }
        }

        if (result === DiscussionResult.Eject && target !== null) {
            await this.broadcast({ name: "MEET", args: [
                result, target.name, target.role
            ] });

            await target.die();

        } else {
            await this.broadcast({
                name: "MEET", args: result
            });
        }

        for (const client of this.clients) {
            client.temp.voted = false;
            client.temp.votes = 0;
        }

        this.temp.lastDiscussion = Date.now();
        this.temp.corpses = {};
        this.temp.skips = 0;

        await this.check();
        await this.setState(RoomState.Main);
    }

    /** Vote for someone during a discussion. */
    public async vote(from: Client, target: Client | null) {
        if (this.state !== RoomState.Discussion) throw new PacketError("FORBIDDEN");
        if (from.temp.voted) throw new PacketError("ALREADY_VOTED");

        from.temp.voted = true;
        
        if (target !== null) target.temp.votes++;
        else this.temp.skips++;

        await this.broadcast({
            name: "VOTES", args: [
                `${this.temp.skips}`, ...this.clients.map(c => `${c.name}:${c.temp.votes}`)
            ]
        });
    }

    /** Check whether either role has won the game. */
    public check() {
        if (this.state === RoomState.Inactive || this.state === RoomState.Lobby) return;

        /* If the impostor is dead (was voted out of the game), ... */
        if (this.temp.impostor && this.temp.impostor.role !== ClientRole.Impostor) return this.end(ClientRole.Crewmate);

        /* If the amount of alive players is below the minimum, ... */
        const alive = this.players.filter(c => c.alive && c.role !== ClientRole.Impostor).length;
        if (this.settings.minPlayers > alive) return this.end(ClientRole.Impostor);
        
        /* If the crewmates completed all their tasks, ... */
        const progress = this.progress();
        if (progress.completed === progress.total) return this.end(ClientRole.Crewmate);
    }

    /** End the game, with the specified winner. */
    public async end(winner: ClientRole) {
        /* Clean up everything. */
        this.temp = {
            lastDiscussion: null, skips: 0, corpses: {}, impostor: null
        };
        
        this.map = null;

        for (const client of this.clients) {
            client.clean();
        }

        await this.broadcast({ name: "WIN", args: winner });
        await this.setState(RoomState.Lobby);
        await this.pushListData();

        Logger.info(`Room ${colors.bold(this.name)} has ended.`);
    }

    /**
     * Update the map of the game.
     * 
     * A new instance of the map is created each, in case we want to store temporary data
     * or sabotages in the future. This hopefully isn't a big memory hit.
     */
    public async setMap(map: GameMap) {
        const data = map.serialize();

        for (const [ key, value ] of data) {
            await this.broadcast({
                name: "MAP", args: [
                    key, Array.isArray(value) ? value.join(" ") : value
                ]
            });
        }

        this.map = map;
    }

    /** Update the state of the game. */
    public async setState(state: RoomState) {
        this.state = state;

        await this.broadcast({
            name: "STATE", args: state
        });
    }

    /** Broadcast the progress of the game. */
    public async broadcastProgress() {
        const { completed, total } = this.progress();
        
        await this.broadcast({
            name: "PROGRESS", args: [
                completed.toString(), total.toString()
            ]
        });
    }

    /** Progress of the game, [ completed tasks, total tasks ] */
    public progress(): RoomProgress {
        const players = this.players.filter(c => c.role === ClientRole.Crewmate);

        return {
            completed: players.reduce((value, client) => value + Object.entries(client.temp.tasks!).filter(([ _, done ]) => done).length, 0),
            total: (players.length * this.settings.tasks)
        };
    }

    /** Send a chat message to other clients. */
    public async chat(client: Client, content: string) {
        if (client.alive && this.running) throw new PacketError("FORBIDDEN");
        if (content.length > 512) throw new PacketError("MSG_LENGTH");

        // deno-lint-ignore no-control-regex
        if (content.match(/(\x1B\[.*?[\x40-\x7E])|[\x00-\x09\x0B-\x0C\x0E-\x1F]/g)) {
            throw new PacketError("INVALID_MSG");
        }

        content = content.trim();

        await client.room!.broadcast({
            client, name: "CHAT", args: [ client.name, content ],
            clients: this.clients.filter(c => (c.alive && client.alive) || c.role === client.role)
        });
    }

    /** Notify other clients when a client joins or leaves. */
    public notify(client: Client, type: RoomNotifyType, clients?: Client[]) {
        return this.broadcast({
            client, clients, name: "LOC", args: [
                type, client.name
            ]
        });
    }

    /** Assign a new host to the room. */
    public assignHost() {
        this.host = this.clients[0];
    }

    /** Send updates about the room to all "lurkers", or the specified clients. */
    public pushListData(type: RoomDataType = RoomDataType.Update, clients?: Client[]) {
        if (this.public) return server.broadcast({
            clients: clients ?? server.lurkers, ...this.data(type)
        });
    }

    /** Data of this room, for the room list & updates */
    public data(type: RoomDataType): PacketBroadcastOptions {
        return {
            name: "ROOM", args: [
                type, this.name, this.code, this.settings.map, Number(this.running), this.clients.length, this.settings.maxPlayers
            ]
        };
    }

	/** Broadcast a packet to all connected clients in the room. */
	public async broadcast({ client: except, clients, name, args }: PacketBroadcastOptions) {
		for (const client of clients ?? this.clients.filter(c => c.active)) {
			if (except && client.id === except.id) continue;
			await server.send({ client, name, args });
		}
	}

    /** Clean up the room, if needed. */
    public async clean() {
        if (this.empty || !this.host) {
            await server.removeRoom(this);
        }
    }

    /** Which clients are connected to this room */
    public get clients(): Client[] {
        return server.clients.filter(c => c.room === this);
    }

    /** Which clients are actually in-game & playing */
    public get players(): Client[] {
        return this.clients.filter(c => c.alive || c.role === ClientRole.Spectator);
    }

    /** Whether this room is public & visible in the server list */
    public get public(): boolean {
        return this.visibility === RoomVisibility.Public;
    }

    /** Whether the game is currently running */
    public get running(): boolean {
        return this.state === RoomState.Main;
    }

    /** Whether the room is empty */
    public get empty(): boolean {
        return this.clients.length - 1 === 0;
    }

    /** Name of the room */
    public get name(): string {
        return this.host.name;
    }

    /** Generate a room code. */
    public static code(length = 6): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";

        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
}