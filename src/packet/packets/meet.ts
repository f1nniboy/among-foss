import { DiscussionReason } from "../types/discussion.ts";
import { Packet, PacketRequirement } from "../mod.ts";

export const MeetPacket: Packet<[ string ]> = {
    name: "MEET",
    description: "Call a meeting",

    requirements: [
        PacketRequirement.Alive
    ],

    handler: ({ client }) => {
        client.room!.startDiscussion(client, DiscussionReason.Button);
    }
}