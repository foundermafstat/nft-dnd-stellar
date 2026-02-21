"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemRarity = exports.ItemCategory = void 0;
var ItemCategory;
(function (ItemCategory) {
    ItemCategory["Weapon"] = "Weapon";
    ItemCategory["Artifact"] = "Artifact";
    ItemCategory["Talisman"] = "Talisman";
    ItemCategory["Material"] = "Material";
    ItemCategory["QuestItem"] = "QuestItem"; // Keys, Lore scrolls
})(ItemCategory || (exports.ItemCategory = ItemCategory = {}));
var ItemRarity;
(function (ItemRarity) {
    ItemRarity["Common"] = "Common";
    ItemRarity["Uncommon"] = "Uncommon";
    ItemRarity["Rare"] = "Rare";
    ItemRarity["Epic"] = "Epic";
    ItemRarity["Legendary"] = "Legendary"; // 1%
})(ItemRarity || (exports.ItemRarity = ItemRarity = {}));
