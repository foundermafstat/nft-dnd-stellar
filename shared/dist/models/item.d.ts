export declare enum ItemCategory {
    Weapon = "Weapon",
    Armor = "Armor",
    Gear = "Gear",
    Magic = "Magic",
    Scroll = "Scroll",
    Wand = "Wand",
    QuestItem = "QuestItem"
}
export declare enum ItemSubcategory {
    Melee = "Melee",
    Ranged = "Ranged",
    Light = "Light",
    Medium = "Medium",
    Heavy = "Heavy",
    Shield = "Shield",
    LightSource = "LightSource",
    Tool = "Tool",
    Consumable = "Consumable",
    Container = "Container"
}
export declare enum ItemRarity {
    Common = "Common",// 60%
    Uncommon = "Uncommon",// 25%
    Rare = "Rare",// 10%
    Epic = "Epic",// 4%
    Legendary = "Legendary"
}
export declare enum BlockchainStatus {
    OffChain = "OFF_CHAIN",
    Mintable = "MINTABLE",
    Minted = "MINTED"
}
export type WeaponProperty = 'Finesse' | 'Versatile' | 'Thrown' | 'TwoHanded' | 'Loading';
export interface WeaponStats {
    damage: string;
    range?: string;
    properties?: WeaponProperty[];
    versatile_damage?: string;
}
export interface ArmorStats {
    ac_base: number;
    ac_dex: boolean;
    penalties?: string[];
}
export interface GearStats {
    duration_seconds?: number;
    light_range?: string;
    uses?: number;
    description?: string;
}
export interface MagicStats {
    spell?: string;
    charges?: number;
    break_on_nat1?: boolean;
}
export interface ItemBonuses {
    attack_bonus?: number;
    damage_bonus?: number;
    ac_bonus?: number;
    save_bonus?: number;
}
export interface GameItem {
    id: string;
    name: string;
    base_type: string;
    category: ItemCategory;
    subcategory?: ItemSubcategory;
    rarity: ItemRarity;
    is_nft: boolean;
    blockchain_status: BlockchainStatus;
    stellar_token_id?: string;
    cost_gp: number;
    slots: number;
    stats: WeaponStats | ArmorStats | GearStats | MagicStats;
    bonuses: ItemBonuses;
    perks: string[];
    lore?: string;
    class_restrictions: string[];
    is_template: boolean;
    parent_template_id?: string;
    metadata?: Record<string, any>;
}
