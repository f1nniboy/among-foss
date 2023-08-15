import { Packet } from "../mod.ts";

import { CommandPacket } from "./cmd.ts";
import { QueryPacket } from "./query.ts";
import { NickPacket } from "./nick.ts";
import { ChatPacket } from "./chat.ts";
import { RoomPacket } from "./room.ts";

// deno-lint-ignore no-explicit-any
export const Packets: Packet<any>[] = [
    QueryPacket, NickPacket, ChatPacket, CommandPacket, RoomPacket
]