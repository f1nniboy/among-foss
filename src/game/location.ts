export type LocationID = string

export interface Location {
    /** Display name of the location */
    name: string;

    /** Neighboring locations, acting as doors */
    doors: LocationID[];

    /** Whether this location has a vent */
    vent?: boolean;
}