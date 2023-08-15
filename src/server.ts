import { colors, parse } from "./deps.ts";

import {
	PacketBroadcastOptions,
	PacketName,
	PacketParameterType,
	PacketReceiveOptions,
	PacketRequirement,
	PacketSendOptions,
	parseParameters
} from "./packet/mod.ts";

import { Room, RoomNotifyType, RoomVisibility } from "./room.ts";
import { LogType, Logger } from "./utils/logger.ts";
import { Packets } from "./packet/packets/mod.ts";
import { Query } from "./packet/types/query.ts";
import { PacketError } from "./packet/error.ts";
import { connToString } from "./utils/ip.ts";
import { Client } from "./client.ts";

interface ServerSettings {
	port: number;
	duplicateConnections: boolean;
	maxRooms: number;
}

interface ServerArgument {
	/** Name of the argument */
	name: string;

	/** Description of the argument */
	description: string;
}

const ServerArguments: ServerArgument[] = [
	{ name: "d", description: "Whether duplicate connections should be allowed" },
	{ name: "r", description: "Maximum amount of rooms that can exist at a time" },
	{ name: "p", description: "Port to listen on" }
]

class Server {
	/** Server settings */
	public settings: ServerSettings;

	/** TCP server */
	public listener: Deno.Listener;

	/** Connected clients */
	public clients: Client[];

	/** All game rooms */
	public rooms: Room[];

	/** Incremental client ID counter */
	private id: number;

	private encoder: TextEncoder;
	private decoder: TextDecoder;

	constructor() {
		this.settings = {
			port: 1234, duplicateConnections: false, maxRooms: 50
		};

		this.listener = null!;
		this.clients = [];
		this.id = 0;

		this.encoder = new TextEncoder();
		this.decoder = new TextDecoder();

		this.rooms = [];
	}

	/** Create a room. */
	public createRoom(host: Client, visibility: RoomVisibility): Room {
		if (this.rooms.length >= this.settings.maxRooms) throw new PacketError("MAX_ROOMS");

		const room = new Room({
			host, visibility, code: Room.code()
		});

		this.rooms.push(room);
		return room;
	}

	/** Remove a room. */
	public removeRoom(room: Room) {
		Logger.info(`Room ${colors.bold(room.name)} has been removed.`);

		const index = this.rooms.indexOf(room);
		this.rooms.splice(index, 1);
	}

	/** Set up the server & listen for connections. */
	public async listen() {		
		try {
			this.listener = Deno.listen({ port: this.settings.port });
			Logger.info(`Listening on port ${colors.bold(this.settings.port.toString())}.`);
		} catch (error) {
			this.die("Failed to listen on port", colors.bold(this.settings.port.toString()), "->", error.toString());
		}

		for await (const conn of this.listener) {			
			if (!this.settings.duplicateConnections && this.clients.some(c => c.compare(conn))) {
				Logger.warn("IP", colors.bold(connToString(conn)), "tried to connect twice, but duplicate connections are not allowed.");

				conn.write(this.encoder.encode("ERROR ALREADY_CONN"));
				conn.close();

				continue;
			}

			const client = new Client(conn, this.id++);
			this.clients.push(client);

			this.handle(client);
		}
	}

	/** Handle a new connection to the server. */
	private async handle(client: Client) {
		Logger.info("Client", colors.bold(`#${client.id}`), "has connected.");

		client.send({
			name: "SERVER", args: [ "0.0.1", this.clients.length ]
		});

		/* Buffer to read data into */
		const buffer = new Uint8Array(1024);

		while (true) {
			try {
				const length = await client.conn.read(buffer);

				if (!length) {
					this.handleDisconnect(client);
					break;
				} else {
					const message = this.decoder.decode(buffer.subarray(0, length));
	
					this.receive({
						client, raw: message
					});
				}

			/* The client has disconnected */
			} catch (_) {
				this.handleDisconnect(client);
				break;
			}
		}
	}

	/** Process a message received by the client. */
	private receive({ client, raw }: PacketReceiveOptions) {
		/* All parts of the message */
		const parts = raw.slice(0, -1).split(" ");

		/* Name of the packet */
		const name: PacketName = parts.shift()! as PacketName;

		/** Corresponding packet, if available */
		const packet = Packets.find(p => p.name.toLowerCase() === name.toLowerCase()) ?? null;

		if (!packet) {
			Logger.warn("Client", colors.bold(`#${client.id}`), "sent an invalid packet.");
			client.send({ name: "ERR", args: "INVALID_CMD" });

			return;
		}

		/* If the client hasn't chosen a name yet, ... */
		if (!client.active && packet.name !== "NICK") {
			return client.send({ name: "ERR", args: "CHOOSE_NICK" });
		}

		Logger.debug(colors.bold(`#${client.id}`), "->", colors.italic(name), colors.italic(parts.join(" ")));

		try {
			/** Requirements of the packet */
			const req = packet.requirements ?? [];

			if ((req.includes(PacketRequirement.InRoom) || req.includes(PacketRequirement.RoomHost) || req.includes(PacketRequirement.InGame)) && client.room === null) {
				throw new PacketError("NOT_IN_ROOM");
			}
			
			if (req.includes(PacketRequirement.RoomHost) && client.room?.host.id !== client.id) {
				throw new PacketError("NOT_ROOM_HOST");
			}

			if (req.includes(PacketRequirement.InGame) && !client.room?.running) {
				throw new PacketError("GAME_NOT_ACTIVE");
			}

			const reply = packet.handler({
				client, args: parts, data: parseParameters(packet, parts) as Array<PacketParameterType>
			});

			if (reply) client.send(reply);

		} catch (error) {
			client.send({ name: "ERR", args: error.message });
		}
	}

	/** Handle disconnections from clients. */
	private handleDisconnect(client: Client) {
		Logger.info("Client", colors.bold(`#${client.id}`), "has disconnected.");

		if (client.room) {
			client.room.notify(client, RoomNotifyType.RoomLeave);
			client.room.clean();
		}

		const index = this.clients.indexOf(client);
		this.clients.splice(index, 1);
	}

	/** Send a packet to a client, or broadcast it. */
	public send({ client, name, args: rawArgs }: PacketSendOptions) {
		let args: string[] = rawArgs ? (typeof rawArgs === "string" ? [ rawArgs ] : rawArgs as string[]) : [];
		args = args.map(a => a.toString().includes(" ") && args.length > 1 ? `:${a}` : a.toString());

		/* The raw data to send */
		const raw = `${name}${args.length > 0 ? ` ${args.join(" ")}` : ""}\n`;

		client.conn.write(this.encoder.encode(raw));
		Logger.debug(colors.bold(`#${client.id}`), "<-", colors.italic(raw.slice(0, -1)));
	}

	/** Broadcast a packet to all connected clients. */
	public broadcast({ client: except, clients, name, args }: PacketBroadcastOptions) {
		for (const client of clients ?? this.clients.filter(c => c.active)) {
			if (except && client.id === except.id) continue;
			this.send({ client, name, args });
		}
	}

	/** Query specific data from the server. */
	public query(type: Query, client: Client): string[] | string {
		if (type === Query.Players) {
			if (client.room === null) throw new PacketError("NOT_IN_ROOM");
			return server.clients.filter(c => c.active && c.id !== client.id).map(c => c.name);

		} else if (type === Query.Tasks) {
			if (client.room === null) throw new PacketError("NOT_IN_ROOM");
			if (!client.room.running || !client.tasks) throw new PacketError("GAME_NOT_ACTIVE");

			return Object.entries(client.tasks)
				.map(([ id, done ]) => `${id}:${Number(done)}`);

		} else if (type === Query.Rooms) {
			if (client.room !== null) throw new PacketError("ALREADY_IN_ROOM");

			return this.rooms
				.filter(r => r.visibility === RoomVisibility.Public)
				.map(r => `${r.name}:${r.code}`);
		}

		throw new PacketError("INVALID_QUERY");
	}

	/** Parse the command arguments. */
	public parse() {
		const args = parse(Deno.args);

		/** Port to listen on */
		if (args.p && typeof args.p === "number") this.settings.port = args.p;

		/** Whether duplicate connections should be allowed */
		if (args.d && typeof args.d === "boolean") this.settings.duplicateConnections = args.d;

		/** Maximum amount of rooms that can exist at a time*/
		if (args.r && typeof args.d === "number") this.settings.maxRooms = args.r;

		if (args.h) {
			Logger.info(`${colors.bold("Among Foss")} • ${colors.italic("A recreation of Among Us")}\n`);
			
			for (const arg of ServerArguments) {
				Logger.info(`${colors.bold(`-${arg.name}`)} • ${arg.description}`);
			}

			console.log();
			Logger.info(`${colors.italic("e.g.")} ${colors.bold("among-foss -p 1234 -r 15 -d")}`);

			Deno.exit();
		}
	}

	/** Shut down the server, due to an error. */
	public die(...message: LogType[]): never {
		Logger.error(...message);
		Deno.exit(1);
	}
}

export const server = new Server();

server.parse();
server.listen();