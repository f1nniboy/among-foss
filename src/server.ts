import { colors, parse } from "./deps.ts";

import { PacketBroadcastOptions, PacketName, PacketReceiveOptions, PacketSendOptions, Packets } from "./packet/mod.ts";
import { LogType, Logger } from "./utils/logger.ts";
import { connToString } from "./utils/ip.ts";
import { Client } from "./client.ts";

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

			Logger.info("Client", colors.bold(`#${client.id}`), "has connected.");

			client.send({
				name: "SERVER", args: "Among FOSS"
			});

			/* Buffer to read data into */
			const buffer = new Uint8Array(1024);

			while (true) {
				const length = await conn.read(buffer);

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
	}

	/** Process a message received by the client. */
	private receive({ client, raw }: PacketReceiveOptions): void {


		/* All parts of the message */
		const parts = raw.slice(0, -1).split(" ");

		/* Name of the packet */
		const name: PacketName = parts.shift()! as PacketName;

		Logger.debug(colors.bold(`#${client.id}`), "->", colors.italic(name), colors.italic(parts.join(" ")));

		/** Corresponding packet, if available */
		const packet = Packets.find(p => p.name === name) ?? null;

		if (!packet) {
			Logger.warn("Client", colors.bold(`#${client.id}`), "sent an invalid packet.");
			client.send({ name: "ERROR", args: "Invalid packet" });

			return;
		}

		try {
			const reply = packet.handler({
				client, args: parts, data: parts as [ string ]
			});

			if (reply) client.send(reply);
			
		} catch (error) {
			client.send({ name: "ERROR", args: error.message });
		}
	}

	/** Send a packet to a client, or broadcast it. */
	public send({ client, name, args: rawArgs }: PacketSendOptions): void {
		const args: string[] = rawArgs ? (typeof rawArgs === "string" ? [ rawArgs ] : rawArgs)
			.map(a => a.toString().includes(" ") ? `:${a}` : a.toString())
		: [];

		/* The raw data to send */
		const raw = `${name} ${args.length > 0 ? `${args.join(" ")}` : ""}\n`;

		client.conn.write(this.encoder.encode(raw));
		Logger.debug(colors.bold(`#${client.id}`), "<-", colors.italic(raw.slice(0, -1)));
	}

	/** Broadcast a packet to all connected clients. */
	public broadcast({ client: except, name, args }: PacketBroadcastOptions): void {
		for (const client of this.clients) {
			if (except && client.id === except.id) continue;
			this.send({ client, name, args });
		}
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