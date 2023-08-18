import { type Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const TaskPacket: Packet<[ string ]> = {
    name: "DO",
    description: "Complete an assigned task",

    requirements: [
        PacketRequirement.InGame,
        PacketRequirement.Alive
    ],

    parameters: [
        {
            name: "task",
            description: "Which task to complete",
            type: "string"
        }
    ],

    handler: async ({ client, data: [ name ] }) => {
        if (!client.room!.map!.task(name)) throw new PacketError("INVALID_ARG");
        await client.completeTask(name);
    }
}