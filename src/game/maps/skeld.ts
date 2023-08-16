import { GameMap } from "../map.ts";

export class SkeldMap extends GameMap {
    constructor() {
        super({
            id: "SKELD",

            tasks: {
                "WIRING": { locations: ["CAFETERIA", "ADMIN", "NAVIGATION", "SECURITY", "ELECTRICAL", "STORAGE"] },
                "SWIPE_CARD": { locations: ["ADMIN"] },
                "DOWNLOAD_DATA": { locations: ["CAFETERIA", "WEAPONS", "NAVIGATION", "ADMIN", "COMMUNICATIONS", "ELECTRICAL"] },
                "UPLOAD_DATA": { locations: ["ADMIN"] },
                "FIX_WIRING": { locations: ["ELECTRICAL", "SECURITY", "NAVIGATION", "ADMIN"] },
                "EMPTY_GARBAGE": { locations: ["CAFETERIA", "STORAGE"] },
                "FUEL_ENGINES": { locations: ["STORAGE", "UPPER_ENGINE", "LOWER_ENGINE"] },
                "ALIGN_ENGINE_OUTPUT": { locations: ["UPPER_ENGINE", "LOWER_ENGINE"] },
                "ACCEPT_DIVERTED_POWER": { locations: ["ELECTRICAL", "WEAPONS", "SHIELDS", "O2", "NAVIGATION", "COMMUNICATIONS"] },
                "INSPECT_SAMPLE": { locations: ["MEDBAY"] },
                "START_REACTOR": { locations: ["REACTOR"] },
                "CALIBRATE_DISTRIBUTOR": { locations: ["ELECTRICAL"] },
                "CLEAR_ASTEROIDS": { locations: ["WEAPONS"] },
                "DIVERT_POWER": { locations: ["ELECTRICAL"] },
                "CLEAN_O2_FILTER": { locations: ["O2"] },
                "STABILIZE_STEERING": { locations: ["NAVIGATION"] },
                "UNLOCK_MANIFOLDS": { locations: ["REACTOR"] },
                "PRIME_SHIELDS": { locations: ["SHIELDS"] },
                "SUBMIT_SCAN": { locations: ["MEDBAY"] },
                "EMPTY_CHUTE": { locations: ["O2", "STORAGE"] }
            },

            locations: {
                "CAFETERIA": { doors: ["ADMIN", "MEDBAY", "WEAPONS", "UPPER_ENGINE", "LOWER_ENGINE"] },
                "ADMIN": { doors: ["CAFETERIA", "STORAGE"] },
                "NAVIGATION": { doors: ["O2", "WEAPONS"] },
                "SECURITY": { doors: ["REACTOR", "UPPER_ENGINE", "LOWER_ENGINE"] },
                "ELECTRICAL": { doors: ["LOWER_ENGINE", "STORAGE"] },
                "STORAGE": { doors: ["ADMIN", "ELECTRICAL", "COMMUNICATIONS", "SHIELDS"] },
                "WEAPONS": { doors: ["CAFETERIA", "O2", "NAVIGATION"] },
                "O2": { doors: ["NAVIGATION", "WEAPONS"] },
                "REACTOR": { doors: ["SECURITY", "UPPER_ENGINE", "LOWER_ENGINE"] },
                "MEDBAY": { doors: ["CAFETERIA", "UPPER_ENGINE"] },
                "UPPER_ENGINE": { doors: ["CAFETERIA", "MEDBAY", "REACTOR", "SECURITY"] },
                "LOWER_ENGINE": { doors: ["CAFETERIA", "ELECTRICAL", "REACTOR", "SECURITY"] },
                "COMMUNICATIONS": { doors: ["STORAGE", "SHIELDS"] },
                "SHIELDS": { doors: ["STORAGE", "COMMUNICATIONS", "NAVIGATION"] }
            }
        })
    }

    public get defaultLocation(): string {
        return "CAFETERIA";
    }
}