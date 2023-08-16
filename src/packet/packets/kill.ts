import { Packet, PacketRequirement } from "../mod.ts";
import { PacketError } from "../error.ts";

export const KillPacket: Packet<[ string ]> = {
    name: "KILL",
    description: "Kill another player, if you're the impostor",
    ack: true,

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
        const target = client.room!.players.find(c => c.name === name) ?? null;
        if (!target || (target && target.id === client.id)) throw new PacketError("INVALID_ARG");
        
        await client.kill(target);
    }
}