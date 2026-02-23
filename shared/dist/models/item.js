"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainStatus = exports.ItemRarity = exports.ItemSubcategory = exports.ItemCategory = void 0;
// ── Item Categories ─────────────────────────────────────────────────
var ItemCategory;
(function (ItemCategory) {
    ItemCategory["Weapon"] = "Weapon";
    ItemCategory["Armor"] = "Armor";
    ItemCategory["Gear"] = "Gear";
    ItemCategory["Magic"] = "Magic";
    ItemCategory["Scroll"] = "Scroll";
    ItemCategory["Wand"] = "Wand";
    ItemCategory["QuestItem"] = "QuestItem";
})(ItemCategory || (exports.ItemCategory = ItemCategory = {}));
var ItemSubcategory;
(function (ItemSubcategory) {
    // Weapons
    ItemSubcategory["Melee"] = "Melee";
    ItemSubcategory["Ranged"] = "Ranged";
    // Armor
    ItemSubcategory["Light"] = "Light";
    ItemSubcategory["Medium"] = "Medium";
    ItemSubcategory["Heavy"] = "Heavy";
    ItemSubcategory["Shield"] = "Shield";
    // Gear
    ItemSubcategory["LightSource"] = "LightSource";
    ItemSubcategory["Tool"] = "Tool";
    ItemSubcategory["Consumable"] = "Consumable";
    ItemSubcategory["Container"] = "Container";
})(ItemSubcategory || (exports.ItemSubcategory = ItemSubcategory = {}));
// ── Rarity ──────────────────────────────────────────────────────────
var ItemRarity;
(function (ItemRarity) {
    ItemRarity["Common"] = "Common";
    ItemRarity["Uncommon"] = "Uncommon";
    ItemRarity["Rare"] = "Rare";
    ItemRarity["Epic"] = "Epic";
    ItemRarity["Legendary"] = "Legendary";
})(ItemRarity || (exports.ItemRarity = ItemRarity = {}));
// ── Blockchain status ───────────────────────────────────────────────
var BlockchainStatus;
(function (BlockchainStatus) {
    BlockchainStatus["OffChain"] = "OFF_CHAIN";
    BlockchainStatus["Mintable"] = "MINTABLE";
    BlockchainStatus["Minted"] = "MINTED";
})(BlockchainStatus || (exports.BlockchainStatus = BlockchainStatus = {}));
