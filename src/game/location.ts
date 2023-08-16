export type LocationName = string

export interface Location {
    /** Neighboring locations, acting as doors */
    doors: LocationName[];
}