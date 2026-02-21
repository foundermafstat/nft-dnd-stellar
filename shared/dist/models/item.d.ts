export declare enum ItemCategory {
    Weapon = "Weapon",
    Artifact = "Artifact",// Armor, Helmets
    Talisman = "Talisman",// Trinkets, max 2 slots
    Material = "Material",// Copper, Leather, Runes
    QuestItem = "QuestItem"
}
export declare enum ItemRarity {
    Common = "Common",// 60%
    Uncommon = "Uncommon",// 25%
    Rare = "Rare",// 10%
    Epic = "Epic",// 4%
    Legendary = "Legendary"
}
export interface ItemAttributes {
    baseStat: number;
    rarityMultiplier: number;
    perks: string[];
}
export interface BaseItem {
    id: string;
    name: string;
    category: ItemCategory;
    rarity: ItemRarity;
    isNft: boolean;
    attributes: ItemAttributes;
    aiHistory?: string;
}
export interface Weapon extends BaseItem {
    category: ItemCategory.Weapon;
    weaponSubtype: 'Sword' | 'Bow' | 'Staff' | 'Dagger';
}
