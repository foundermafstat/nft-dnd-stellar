"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_CONSTANTS = exports.RoomType = exports.BiomeType = void 0;
var BiomeType;
(function (BiomeType) {
    BiomeType["DarkForest"] = "DarkForest";
    BiomeType["CrystalCaves"] = "CrystalCaves";
    BiomeType["JailBiome"] = "JailBiome";
    BiomeType["HubRegion"] = "HubRegion";
    BiomeType["Ruins"] = "Ruins";
})(BiomeType || (exports.BiomeType = BiomeType = {}));
var RoomType;
(function (RoomType) {
    RoomType["Arena"] = "Arena";
    RoomType["PuzzleRoom"] = "PuzzleRoom";
    RoomType["TreasureRoom"] = "TreasureRoom";
    RoomType["Corridor"] = "Corridor";
    RoomType["SafeZone"] = "SafeZone";
})(RoomType || (exports.RoomType = RoomType = {}));
exports.GAME_CONSTANTS = {
    PHYSICS_TICK_RATE_MS: 50,
    AI_DIRECTOR_TICK_MS: 5000,
    WORLD_UPDATER_TICK_MS: 60000,
    MAX_PLAYERS_PER_HUB: 100,
    DEAD_END_FALLBACK_MINUTES: 10,
};
