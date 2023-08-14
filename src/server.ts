import { colors, parse } from "./deps.ts";

import { PacketBroadcastOptions, PacketName, PacketParameterType, PacketReceiveOptions, PacketSendOptions, Packets, parseParameters } from "./packet/mod.ts";
import { LogType, Logger } from "./utils/logger.ts";
import { QueryType } from "./packet/types/query.ts";
import { PacketError } from "./packet/error.ts";
import { connToString } from "./utils/ip.ts";
import { Client } from "./client.ts";
import { Game } from "./game.ts";

interface ServerSettings {
	/** Port to listen on */
	port: number;

	/** Whether duplicate connections should be allowed */
	duplicateConnections: boolean;
}

class Server {
	/** Server settings */
	public settings: ServerSettings;

	/** TCP server */
	public listener: Deno.Listener;

	/** Connected clients */
	public clients: Client[];

	/** The game itself */
	public game: Game;

	private encoder: TextEncoder;
	private decoder: TextDecoder;

	constructor() {
		this.settings = {
			port: 1234, duplicateConnections: false
		};

		this.listener = null!;
		this.clients = [];

		this.encoder = new TextEncoder();
		this.decoder = new TextDecoder();

		this.game = new Game();
	}

	/** Set up the server. */
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
				conn.close();

				continue;
			}

			const client = new Client(conn, this.clients.length);
			this.clients.push(client);

			this.handle(client);
		}
	}

	/** Handle a new connection to the server. */
	private async handle(client: Client) {
		Logger.info("Client", colors.bold(`#${client.id}`), "has connected.");

		client.send({
			name: "SERVER", args: "Among FOSS"
		});

		/* Buffer to read data into */
		const buffer = new Uint8Array(1024);

		while (true) {
			const length = await client.conn.read(buffer);

			if (!length) {
				const index = this.clients.indexOf(client);
				this.clients.splice(index, 1);

				Logger.info("Client", colors.bold(`#${client.id}`), "has disconnected.");
				break;
			} else {
				  const message = this.decoder.decode(buffer.subarray(0, length));

				this.receive({
					client, raw: message
				});
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
			client.send({ name: "ERROR", args: "INVALID_CMD" });

			return;
		}

		/* If the client hasn't chosen a name yet, ... */
		if (!client.active && packet.name !== "NICK") {
			return client.send({ name: "ERROR", args: "CHOOSE_NICK" });
		}

		Logger.debug(colors.bold(`#${client.id}`), "->", colors.italic(name), colors.italic(parts.join(" ")));

		try {
			const reply = packet.handler({
				client, args: parts, data: parseParameters(packet, parts) as Array<PacketParameterType>
			});

			if (reply) client.send(reply);

		} catch (error) {
			client.send({ name: "ERROR", args: error.message });
		}
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
	public broadcast({ client: except, name, args }: PacketBroadcastOptions) {
		for (const client of this.clients.filter(c => c.active)) {
			if (except && client.id === except.id) continue;
			this.send({ client, name, args });
		}
	}

	public query(type: QueryType): string[] {
		if (type === "PLAYERS") {
			return server.clients.filter(c => c.active).map(c => c.name!);
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