import { type Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const VotePacket: Packet<[ string ]> = {
    name: "VOTE",
    description: "Vote for someone during a discussion",

    requirements: [
        PacketRequirement.InDiscussion,
        PacketRequirement.Alive
    ],

    parameters: [
        {
            name: "player",
            description: "Which user to vote for",
            type: "string",
            optional: true
        }
    ],

    handler: async ({ client, data: [ name ] }) => {
        const target = client.room!.players.find(c => c.name === name) ?? null;
        if (!target || (target && target.id === client.id)) throw new PacketError("INVALID_ARG");

        await client.room!.vote(client, target);
    }
}