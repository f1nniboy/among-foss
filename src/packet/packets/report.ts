import { type Packet, PacketRequirement } from "../mod.ts";
import { DiscussionReason } from "../types/discussion.ts";
import { PacketError } from "../error.ts";

export const ReportPacket: Packet<[ string ]> = {
    name: "REPORT",
    description: "Report a dead body",

    requirements: [
        PacketRequirement.Alive
    ],

    handler: ({ client }) => {
        if (!Object.values(client.room!.temp.corpses).includes(client.location)) throw new PacketError("NO_BODY");
        client.room!.startDiscussion(client, DiscussionReason.Report);
    }
}