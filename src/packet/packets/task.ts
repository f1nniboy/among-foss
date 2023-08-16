import { Packet, PacketRequirement } from "../mod.ts";
import { Task, Tasks } from "../../game/task.ts";
import { PacketError } from "../error.ts";

export const TaskPacket: Packet<[ string ]> = {
    name: "TASK",

    requirements: [
        PacketRequirement.InGame,
        PacketRequirement.Alive
    ],

    parameters: [
        { type: "string" }
    ],

    handler: async ({ client, data: [ name ] }) => {
        if (!Tasks[name as Task]) throw new PacketError("INVALID_ARG");
        await client.completeTask(name as Task);
    }
}