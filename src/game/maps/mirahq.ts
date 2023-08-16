import { GameMap } from "../map.ts";

export class MiraHQMap extends GameMap {
    constructor() {
        super({
            id: "MIRA_HQ",

            tasks: {
                "WIRING": { locations: [ "CAFETERIA", "ADMIN" ] },
                "FIX_WIRING": { locations: [ "GREENHOUSE" ] },
                "ASSEMBLE_ARTIFACT": { locations: [ "REACTOR" ] },
                "BUY_BEVERAGE": { locations: [ "CAFETERIA" ] },
                "CLEAN_O2_FILTER": { locations: [ "GREENHOUSE" ] },
                "DIVERT_POWER": { locations: [ "REACTOR", "OFFICE" ] },
                "EMPTY_GARBAGE": { locations: [ "CAFETERIA" ] },
                "ENTER_ID_CODE": { locations: [ "ADMIN" ] },
                "FUEL_ENGINES": { locations: [ "LAUNCHPAD" ] },
                "MEASURE_WEATHER": { locations: [ "OFFICE" ] },
                "PROCESS_DATA": { locations: [ "COMMUNICATIONS" ] },
                "RUN_DIAGNOSTICS": { locations: [ "LAUNCHPAD" ] },
                "SORT_SAMPLES": { locations: [ "REACTOR" ] },
                "START_REACTOR": { locations: [ "REACTOR" ] },
                "SUBMIT_SCAN": { locations: [ "MEDBAY" ] },
                "WATER_PLANTS": { locations: [ "GREENHOUSE" ] },
            },

            locations: {
                "CAFETERIA": { doors: [ "GREENHOUSE", "MEDBAY", "ADMIN" ] },
                "ADMIN": { doors: [ "CAFETERIA", "GREENHOUSE", "OFFICE" ] },
                "GREENHOUSE": { doors: [ "CAFETERIA", "ADMIN" ] },
                "REACTOR": { doors: [ "LABORATORY" ] },
                "OFFICE": { doors: [ "ADMIN" ] },
                "LAUNCHPAD": { doors: [ "MEDBAY" ] },
                "MEDBAY": { doors: [ "LAUNCHPAD", "CAFETERIA" ] },
                "COMMUNICATIONS": { doors: [ "OFFICE" ] },
                "LABORATORY": { doors: [ "REACTOR" ] },
            }
        })
    }

    public get defaultLocation(): string {
        return "LAUNCHPAD";
    }
}