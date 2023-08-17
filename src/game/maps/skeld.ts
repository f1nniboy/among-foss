import { GameMap } from "../map.ts";

export class SkeldMap extends GameMap {
    constructor() {
        super({
            id: "SKELD",
            name: "Skeld",

            tasks: {
                WIRING: { desc: "Connect the wires", loc: ["CAFETERIA", "ADMIN", "NAVIGATION", "ELECTRICAL", "STORAGE", "SECURITY"] },
                CARD_SWIPE: { desc: "Swipe the card", loc: ["ADMIN"] },
                DOWNLOAD: { desc: "Download data", loc: ["CAFETERIA", "WEAPONS", "NAVIGATION", "COMMUNICATIONS", "ELECTRICAL"] },
                UPLOAD: { desc: "Upload data", loc: ["ADMIN"] },
                TRASH: { desc: "Empty the trash", loc: ["CAFETERIA", "O2", "STORAGE"] },
                ASTEROIDS: { desc: "Shoot asteroids", loc: ["WEAPONS"] },
                DIVERT_POWER: { desc: "Divert power to a room", loc: ["ELECTRICAL"] },
                FUEL_ENGINES: { desc: "Fuel the engines", loc: ["STORAGE"] },
                ALIGN_ENGINE: { desc: "Align the engine", loc: ["UPPER_ENGINE", "LOWER_ENGINE"] },
                INSPECT_SAMPLE: { desc: "Inspect the sample", loc: ["MEDBAY"] },
                START_REACTOR: { desc: "Start the reactor sequence", loc: ["REACTOR"] },
                CALIBRATE_DISTRIBUTOR: { desc: "Calibrate distributor", loc: ["ELECTRICAL"] },
                SUBMIT_SCAN: { desc: "Submit scan", loc: ["MEDBAY"] },
                PRIME_SHIELDS: { desc: "Prime the shields", loc: ["SHIELDS"] },
                CLEAR_ASTEROIDS: { desc: "Clear asteroids", loc: ["WEAPONS"] },
                UNLOCK_MANIFOLDS: { desc: "Unlock manifolds", loc: ["REACTOR"] },
                CLEAN_O2_FILTER: { desc: "Clean O2 filter", loc: ["O2"] },
                EMPTY_CHUTE: { desc: "Empty chute", loc: ["STORAGE", "O2"] },
                STABILIZE_STEERING: { desc: "Stabilize steering", loc: ["NAVIGATION"] },
                FIX_LIGHTS: { desc: "Fix lights", loc: ["ELECTRICAL"] }
            },

            locations: {
                CAFETERIA: { name: "Cafeteria", doors: ["ADMIN", "MEDBAY", "WEAPONS", "UPPER_ENGINE", "STORAGE"], vent: true },
                ADMIN: { name: "Admin", doors: ["CAFETERIA", "STORAGE"], vent: true },
                MEDBAY: { name: "MedBay", doors: ["CAFETERIA", "UPPER_ENGINE"], vent: true },
                SECURITY: { name: "Security", doors: ["REACTOR", "UPPER_ENGINE"], vent: true },
                REACTOR: { name: "Reactor", doors: ["SECURITY", "LOWER_ENGINE"], vent: true },
                ELECTRICAL: { name: "Electrical", doors: ["STORAGE", "LOWER_ENGINE"], vent: true },
                STORAGE: { name: "Storage", doors: ["CAFETERIA", "ADMIN", "ELECTRICAL", "COMMUNICATIONS", "SHIELDS"], vent: false },
                COMMUNICATIONS: { name: "Communications", doors: ["STORAGE", "SHIELDS"], vent: false },
                SHIELDS: { name: "Shields", doors: ["STORAGE", "COMMUNICATIONS", "NAVIGATION"], vent: true },
                NAVIGATION: { name: "Navigation", doors: ["O2", "SHIELDS"], vent: true },
                O2: { name: "O2", doors: ["CAFETERIA", "NAVIGATION", "WEAPONS"], vent: false },
                WEAPONS: { name: "Weapons", doors: ["CAFETERIA", "O2"], vent: true },
                UPPER_ENGINE: { name: "Upper Engine", doors: ["CAFETERIA", "MEDBAY", "SECURITY"], vent: false },
                LOWER_ENGINE: { name: "Lower Engine", doors: ["ELECTRICAL", "REACTOR"], vent: false },
            },

            spawn: "CAFETERIA"
        });
    }
}