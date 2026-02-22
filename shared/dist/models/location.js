"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WALKABLE_TILES = exports.TileType = void 0;
var TileType;
(function (TileType) {
    TileType[TileType["Void"] = 0] = "Void";
    TileType[TileType["Floor"] = 1] = "Floor";
    TileType[TileType["Wall"] = 2] = "Wall";
    TileType[TileType["Door"] = 3] = "Door";
    TileType[TileType["Column"] = 4] = "Column";
    TileType[TileType["Table"] = 5] = "Table";
    TileType[TileType["Chair"] = 6] = "Chair";
    TileType[TileType["Barrel"] = 7] = "Barrel";
    TileType[TileType["Chest"] = 8] = "Chest";
    TileType[TileType["Staircase"] = 9] = "Staircase";
    TileType[TileType["Fireplace"] = 10] = "Fireplace";
    TileType[TileType["Bar"] = 11] = "Bar";
    TileType[TileType["Bed"] = 12] = "Bed";
    TileType[TileType["Bookshelf"] = 13] = "Bookshelf";
    TileType[TileType["Crate"] = 14] = "Crate";
    TileType[TileType["Campfire"] = 15] = "Campfire";
    TileType[TileType["Tree"] = 16] = "Tree";
    TileType[TileType["Water"] = 17] = "Water";
    TileType[TileType["Rug"] = 18] = "Rug";
})(TileType || (exports.TileType = TileType = {}));
exports.WALKABLE_TILES = new Set([
    TileType.Floor,
    TileType.Door,
    TileType.Chair,
    TileType.Staircase,
    TileType.Rug,
]);
