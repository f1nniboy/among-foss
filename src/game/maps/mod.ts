import { MapID } from "../map.ts";

/* All game maps */
import { SkeldMap } from "./skeld.ts";

export const GameMaps: Record<MapID, typeof SkeldMap> = {
    SKELD: SkeldMap
}