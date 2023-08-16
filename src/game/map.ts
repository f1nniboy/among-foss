import { LocationName, Location } from "./location.ts";
import { Task, TaskName } from "./task.ts";

export type MapName = string

interface MapOptions {
    /** Identifier of the map */
    id: MapName;

    /** Tasks of the map */
    tasks: Record<TaskName, Task>;

    /** Locations of the map */
    locations: Record<LocationName, Location>;
}

export abstract class GameMap implements MapOptions {
    /** Identifier of the map */
    public readonly id: MapName;

    /** Tasks of the map */
    public readonly tasks: Record<TaskName, Task>;

    /** Locations of the map */
    public readonly locations: Record<LocationName, Location>;

    constructor({ tasks, id, locations }: MapOptions) {
        this.id = id;
        this.tasks = tasks;
        this.locations = locations;
    }

    public location(name: LocationName): Location | null {
        return this.locations[name] ?? null;
    }

    public task(name: TaskName): Task | null {
        return this.tasks[name] ?? null;
    }

    /** Serialize the map. */
    public serialize(): [ string, string | string[] ][] {
        return [
            [ "NAME", this.id ],
            [ "LOCATIONS", Object.entries(this.locations).map(([ id, data ]) => `${id}:${data.doors.join(",")}`) ],
            [ "TASKS", Object.entries(this.tasks).map(([ id, data ]) => `${id}:${data.locations.join(",")}`) ]
        ]
    }

    /** Default spawn location */
    public abstract get defaultLocation(): string;
}