import { Packet } from "../mod.ts";

import { ReportPacket } from "./report.ts";
import { StartPacket } from "./start.ts";
import { NickPacket } from "./nick.ts";
import { ChatPacket } from "./chat.ts";
import { RoomPacket } from "./room.ts";
import { MovePacket } from "./move.ts";
import { MeetPacket } from "./meet.ts";
import { VotePacket } from "./vote.ts";
import { PingPacket } from "./ping.ts";
import { TaskPacket } from "./task.ts";
import { KillPacket } from "./kill.ts";
import { VentPacket } from "./vent.ts";

// deno-lint-ignore no-explicit-any
export const Packets: Packet<any>[] = [
    NickPacket, ChatPacket, StartPacket,
    RoomPacket, MovePacket, MeetPacket,
    VotePacket, PingPacket, TaskPacket,
    KillPacket, ReportPacket, VentPacket
]