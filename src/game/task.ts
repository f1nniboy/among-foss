import { Loc } from "./location.ts";

export enum Task {
    CafeTrash = "CAFE_TRASH",
    CafeCoffee = "CAFE_COFFEE",
    CafeWires = "CAFE_WIRES",
    StorageTrash = "STORAGE_TRASH",
    StorageWires = "STORAGE_WIRES",
    StorageClean = "STORAGE_CLEAN",
    ElectricalWires = "ELECTRICAL_WIRES",
    ElectricalBreakers = "ELECTRICAL_BREAKERS",
    AdminWires = "ADMIN_WIRES",
    AdminClean = "ADMIN_CLEAN",
    NavigationWires = "NAVIGATION_WIRES",
    NavigationCourse = "NAVIGATION_COURSE",
    NavigationHeading = "NAVIGATION_HEADING",
    WeaponsWires = "WEAPONS_WIRES",
    WeaponsCalibrate = "WEAPONS_CALIBRATE",
    ShieldsWires = "SHIELDS_WIRES",
    ShieldsCalibrate = "SHIELDS_CALIBRATE",
    O2Wires = "O2_WIRES",
    O2Clean = "O2_CLEAN",
    O2Water = "O2_WATER",
    MedBayWires = "MEDBAY_WIRES",
    MedBayScan = "MEDBAY_SCAN",
    UpperCatalyzer = "UPPER_CATALYZER",
    LowerCatalyzer = "LOWER_CATALYZER",
    UpperCoil = "UPPER_COIL",
    LowerCoil = "LOWER_COIL"
}

export interface ITask {
    /* Location of the task */
    location: Loc;

    /** Whether this is a "long" task */
    long?: boolean;
}

export const Tasks: Record<Task, ITask> = {
    [Task.CafeTrash]:          { location: Loc.Cafeteria   },
    [Task.CafeCoffee]:         { location: Loc.Cafeteria   },
    [Task.CafeWires]:          { location: Loc.Cafeteria   },
    [Task.StorageTrash]:       { location: Loc.Storage     },
    [Task.StorageWires]:       { location: Loc.Storage     },
    [Task.StorageClean]:       { location: Loc.Storage     },
    [Task.ElectricalWires]:    { location: Loc.Electrical  },
    [Task.ElectricalBreakers]: { location: Loc.Electrical  },
    [Task.AdminWires]:         { location: Loc.Admin       },
    [Task.AdminClean]:         { location: Loc.Admin       },
    [Task.NavigationWires]:    { location: Loc.Navigation  },
    [Task.NavigationCourse]:   { location: Loc.Navigation  },
    [Task.NavigationHeading]:  { location: Loc.Navigation  },
    [Task.WeaponsWires]:       { location: Loc.Weapons     },
    [Task.WeaponsCalibrate]:   { location: Loc.Weapons     },
    [Task.ShieldsWires]:       { location: Loc.Shields     },
    [Task.ShieldsCalibrate]:   { location: Loc.Shields     },
    [Task.O2Wires]:            { location: Loc.O2          },
    [Task.O2Clean]:            { location: Loc.O2          },
    [Task.O2Water]:            { location: Loc.O2          },
    [Task.MedBayWires]:        { location: Loc.MedBay      },
    [Task.MedBayScan]:         { location: Loc.MedBay      },
    [Task.UpperCatalyzer]:     { location: Loc.UpperEngine },
    [Task.UpperCoil]:          { location: Loc.UpperEngine },
    [Task.LowerCatalyzer]:     { location: Loc.LowerEngine },
    [Task.LowerCoil]:          { location: Loc.LowerEngine }
}

/** Select X random tasks, avoiding duplicates. */
export const chooseRandomTasks = (amount: number): Partial<Record<Task, boolean>> => {
    const allTasks = Object.values(Task);

    const shuffledTasks = allTasks.sort(() => Math.random() - 0.5);
    const selectedTasks = shuffledTasks.slice(0, amount);

    const result: Partial<Record<Task, boolean>> = {};

    for (const task of selectedTasks) {
        result[task] = false;
    }

    return result;
}