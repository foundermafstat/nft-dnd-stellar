import { generateContent } from './openai';
import { ItemRarity, ItemCategory, Weapon, BiomeType } from 'shared';
import { v4 as uuidv4 } from 'uuid';

export interface LootOutput {
    name: string;
    aiHistory: string;
    category: ItemCategory;
    rarity: ItemRarity;
    perks: string[];
}

export class LootGenerator {

    public async generateChestLoot(biome: BiomeType, playerLevel: number): Promise<Weapon | null> {
        const systemPrompt = `You are the Loot Generator for NFT-DND. Generate a culturally appropriate weapon for the ${biome}. It must sound legendary but fit the low-fantasy DND setting. 
        Output JSON in this exact format:
        { "name": "Name of Weapon", "aiHistory": "Short lore about who forged it or used it.", "category": "Weapon", "rarity": "Common/Uncommon/Rare/Epic/Legendary", "perks": ["+Fire damage", "Glows in dark"] }`;

        const userPrompt = `Generate a weapon for a level ${playerLevel} hero.`;

        const aiLoot = await generateContent<LootOutput>(systemPrompt, userPrompt);

        if (!aiLoot) return null;

        // Map AI output to our strict Type System
        const weapon: Weapon = {
            id: uuidv4(),
            name: aiLoot.name,
            category: ItemCategory.Weapon,
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

    private getRarityMultiplier(rarity: ItemRarity): number {
        switch (rarity) {
            case ItemRarity.Common: return 1.0;
            case ItemRarity.Uncommon: return 1.25;
            case ItemRarity.Rare: return 1.5;
            case ItemRarity.Epic: return 2.0;
            case ItemRarity.Legendary: return 3.0;
            default: return 1.0;
        }
    }
}
