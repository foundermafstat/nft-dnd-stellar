"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LootGenerator = void 0;
const openai_1 = require("./openai");
const shared_1 = require("shared");
const uuid_1 = require("uuid");
class LootGenerator {
    async generateChestLoot(biome, playerLevel) {
        const systemPrompt = `You are the Loot Generator for NFT-DND. Generate a culturally appropriate weapon for the ${biome}. It must sound legendary but fit the low-fantasy DND setting. 
        Output JSON in this exact format:
        { "name": "Name of Weapon", "aiHistory": "Short lore about who forged it or used it.", "category": "Weapon", "rarity": "Common/Uncommon/Rare/Epic/Legendary", "perks": ["+Fire damage", "Glows in dark"] }`;
        const userPrompt = `Generate a weapon for a level ${playerLevel} hero.`;
        const aiLoot = await (0, openai_1.generateContent)(systemPrompt, userPrompt);
        if (!aiLoot)
            return null;
        // Map AI output to our strict Type System
        const weapon = {
            id: (0, uuid_1.v4)(),
            name: aiLoot.name,
            category: shared_1.ItemCategory.Weapon,
            weaponSubtype: 'Sword', // Simplified for now, could be dynamic
            rarity: aiLoot.rarity,
            isNft: false, // Must be explicitly minted on Stellar later
            attributes: {
                baseStat: playerLevel * 2,
                rarityMultiplier: this.getRarityMultiplier(aiLoot.rarity),
                perks: aiLoot.perks
            },
            aiHistory: aiLoot.aiHistory
        };
        return weapon;
    }
    getRarityMultiplier(rarity) {
        switch (rarity) {
            case shared_1.ItemRarity.Common: return 1.0;
            case shared_1.ItemRarity.Uncommon: return 1.25;
            case shared_1.ItemRarity.Rare: return 1.5;
            case shared_1.ItemRarity.Epic: return 2.0;
            case shared_1.ItemRarity.Legendary: return 3.0;
            default: return 1.0;
        }
    }
}
exports.LootGenerator = LootGenerator;
