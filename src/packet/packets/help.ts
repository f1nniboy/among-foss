import { type Packet } from "../mod.ts";
import { Packets } from "./mod.ts";

export const HelpPacket: Packet = {
    name: "HELP",
    description: "View information about each command",
    always: true,

    handler: () => {
        return Packets.map(p => ({
            name: "HELP", args: [
                p.name,

                ...(p.parameters ?? []).map(p => 
                    `${p.optional ? "[" : "<"}${p.enum ? p.enum.join("|") : p.name}${p.optional ? "]" : ">"}`
                ),
                
                `:${p.description}`
            ]
        }));
    }
}