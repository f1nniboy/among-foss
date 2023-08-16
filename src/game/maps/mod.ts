import { type GameMap } from "../map.ts";

/* All game maps */
import { MiraHQMap } from "./mirahq.ts";
import { SkeldMap } from "./skeld.ts";

export const GameMaps: GameMap[] = [
    new MiraHQMap(), new SkeldMap()
]