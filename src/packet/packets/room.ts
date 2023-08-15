import { RoomVisibility } from "../../room.ts";
import { PacketError } from "../error.ts";
import { server } from "../../server.ts";
import { Packet } from "../mod.ts";

export const RoomPacket: Packet<[ string ]> = {
    name: "ROOM",
    parameters: [ { type: "string" } ],

    handler: ({ client, data: [ action ], args }) => {
        action = action.toLowerCase();
        args.shift();

        /** Join a room using its code */
        if (action === "join") {
            if (client.room !== null) throw new PacketError("ALREADY_IN_ROOM");

            const code = args[0];
            if (!code) throw new PacketError("MISSING_ARG");

            const room = server.rooms.find(r => r.code === code);
            if (!room) throw new PacketError("INVALID_ARG");

            client.join(room);

        /** Leave the current room */
        } else if (action === "leave") {
            if (client.room === null) throw new PacketError("NOT_IN_ROOM");
            client.leave();

        /** Create a room */
        } else if (action === "create") {
            if (client.room !== null) throw new PacketError("ALREADY_IN_ROOM");

            /* Create a new room. */
            const room = server.createRoom(client, RoomVisibility.Public);
            client.join(room);

        } else {
            throw new PacketError("INVALID_ARG");
        }
    }
}