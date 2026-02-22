export declare enum TileType {
    Void = 0,
    Floor = 1,
    Wall = 2,
    Door = 3,
    Column = 4,
    Table = 5,
    Chair = 6,
    Barrel = 7,
    Chest = 8,
    Staircase = 9,
    Fireplace = 10,
    Bar = 11,
    Bed = 12,
    Bookshelf = 13,
    Crate = 14,
    Campfire = 15,
    Tree = 16,
    Water = 17,
    Rug = 18
}
export declare const WALKABLE_TILES: Set<TileType>;
export interface SpawnPoint {
    x: number;
    y: number;
    label?: string;
}
export interface LocationExit {
    tile_x: number;
    tile_y: number;
    target_location_id: string;
    target_location_name: string;
    spawn_label: string;
}
export interface LocationMap {
    id: string;
    name: string;
    biome_type: string;
    room_type: string;
    width: number;
    height: number;
    tiles: TileType[][];
    spawn_points: SpawnPoint[];
    exits: LocationExit[];
    threat_level: number;
}
