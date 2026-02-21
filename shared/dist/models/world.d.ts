export declare enum BiomeType {
    DarkForest = "DarkForest",
    CrystalCaves = "CrystalCaves",
    JailBiome = "JailBiome",
    HubRegion = "HubRegion",
    Ruins = "Ruins"
}
export declare enum RoomType {
    Arena = "Arena",
    PuzzleRoom = "PuzzleRoom",
    TreasureRoom = "TreasureRoom",
    Corridor = "Corridor",
    SafeZone = "SafeZone"
}
export interface WorldConstants {
    PHYSICS_TICK_RATE_MS: number;
    AI_DIRECTOR_TICK_MS: number;
    WORLD_UPDATER_TICK_MS: number;
    MAX_PLAYERS_PER_HUB: number;
    DEAD_END_FALLBACK_MINUTES: number;
}
export declare const GAME_CONSTANTS: WorldConstants;
