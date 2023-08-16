import { Packet } from "../mod.ts";

import { StartPacket } from "./start.ts";
import { QueryPacket } from "./query.ts";
import { NickPacket } from "./nick.ts";
import { ChatPacket } from "./chat.ts";
import { RoomPacket } from "./room.ts";
import { MovePacket } from "./move.ts";
import { MeetPacket } from "./meet.ts";
import { VotePacket } from "./vote.ts";
import { PingPacket } from "./ping.ts";

// deno-lint-ignore no-explicit-any
export const Packets: Packet<any>[] = [
    QueryPacket, NickPacket, ChatPacket, StartPacket, RoomPacket, MovePacket, MeetPacket, VotePacket, PingPacket
]