import { LocationID, Location } from "./location.ts";
import { Task, TaskName } from "./task.ts";

export type MapID = string

interface MapOptions {
    /** Identifier of the map */
    id: MapID;

    /** Display name of the map */
    name: string;

    /** Tasks of the map */
    tasks: Record<TaskName, Task>;

    /** Locations of the map */
    locations: Record<LocationID, Location>;

    /** Default spawn location */
    spawn: LocationID;
}

export abstract class GameMap implements MapOptions {
    /** Identifier of the map */
    public readonly id: MapID;

    /** Display name of the map */
    public readonly name: string;

    /** Tasks of the map */
    public readonly tasks: Record<TaskName, Task>;

    /** Locations of the map */
    public readonly locations: Record<LocationID, Location>;

    /** Default spawn location */
    public readonly spawn: LocationID;

    constructor({ id, name, tasks, locations, spawn }: MapOptions) {
        this.id = id;
        this.name = name
        this.tasks = tasks;
        this.locations = locations;
        this.spawn = spawn;
    }

    public location(name: LocationID): Location | null {
        return this.locations[name] ?? null;
    }

    public task(name: TaskName): Task | null {
        return this.tasks[name] ?? null;
    }

    /** Serialize the map data. */
    public serialize(): [ string, string | string[] ][] {
        return [
            [ "NAME", this.id ],
            [ "LOCATIONS", Object.entries(this.locations).map(([ id, data ]) => `${id}:${data.doors.join(",")}`) ],
            [ "TASKS", Object.entries(this.tasks).map(([ id, data ]) => `${id}:${data.loc.join(",")}`) ]
        ]
    }
}