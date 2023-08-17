import { Packet, PacketRequirement } from "../mod.ts";

export const VentPacket: Packet<[ string ]> = {
    name: "VENT",
    description: "Use vents to get to another room, if you're the impostor",

    requirements: [
        PacketRequirement.InGame,
        PacketRequirement.Alive
    ],

    parameters: [
        {
            name: "location",
            description: "Which location to vent to, must have a vent",
            type: "string"
        }
    ],

    handler: async ({ client, data: [ location ] }) => {
        await client.vent(location);
    }
}