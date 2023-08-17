import { RoomDataType, RoomVisibility } from "../../room/room.ts";
import { GameMaps } from "../../game/maps/mod.ts";
import { PacketError } from "../error.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const RoomPacket: Packet<[ string ]> = {
    name: "ROOM",
    description: "Create, join & delete rooms",

    cooldown: 1 * 1000,

    parameters: [
        {
            name: "action",
            description: "Which action to perform",
            enum: [ "join", "leave", "create" ],
            type: "string"
        }
    ],

    handler: async ({ client, data: [ action ], args }) => {
        action = action.toLowerCase();
        args.shift();

        /** Join a room using its code */
        if (action === "join") {
            if (client.room !== null) throw new PacketError("ALREADY_IN_ROOM");

            const code = args[0];
            if (!code) throw new PacketError("MISSING_ARG");

            const room = server.rooms.find(r => r.code === code);
            if (!room) throw new PacketError("INVALID_ARG");

            await client.join(room);

        /** Leave the current room */
        } else if (action === "leave") {
            if (client.room === null) throw new PacketError("NOT_IN_ROOM");
            await client.leave();

        /** Create a room */
        } else if (action === "create") {
            if (client.room !== null) throw new PacketError("ALREADY_IN_ROOM");

            const visibility: RoomVisibility = [ RoomVisibility.Public, RoomVisibility.Private ].includes(args[0] as RoomVisibility)
                ? args[0] as RoomVisibility 
                : RoomVisibility.Public;

            /* Create a new room. */
            const room = await server.createRoom(client, visibility);
            await client.join(room);

        /** Update the room settings */
        } else if (action === "set") {
            if (client.room === null) throw new PacketError("NOT_IN_ROOM");
            if (client.room.host.id !== client.id) throw new PacketError("NOT_ROOM_HOST");
            if (client.room.running) throw new PacketError("ALREADY_ACTIVE");

            /* Key to update & new value */
            const key = args[0]?.toString().toLowerCase();
            let value = args[1]?.toString();

            if (!key || !value) throw new PacketError("INVALID_ARG");

            /** Map */
            if (key === "map") {
                value = value.toUpperCase();

                if (!GameMaps[value] || client.room.settings.map === value) throw new PacketError("INVALID_ARG");
                client.room.settings.map = value;

            /** Maximum players */
            } else if (key === "max") {
                if (isNaN(parseInt(value))) throw new PacketError("INVALID_ARG");

                const max = parseInt(value);
                if (max < 5 || max > 20) throw new PacketError("INVALID_ARG");
                
                client.room.settings.maxPlayers = max;
            }

            await client.room.pushListData(RoomDataType.Update, client.room.clients);
            await client.room.pushListData();

        } else {
            throw new PacketError("INVALID_ARG");
        }
    }
}