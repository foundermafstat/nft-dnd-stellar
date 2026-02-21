export declare enum HeroClass {
    Fighter = "Fighter",
    Priest = "Priest",
    Thief = "Thief",
    Wizard = "Wizard"
}
export interface Attribute {
    value: number;
    mod: number;
}
export interface CharacterStats {
    str: Attribute;
    dex: Attribute;
    con: Attribute;
    int: Attribute;
    wis: Attribute;
    cha: Attribute;
}
export interface CharacterStatus {
    hp_current: number;
    hp_max: number;
    ac: number;
    is_dying: boolean;
    death_timer: number | null;
    luck_token: number;
}
export interface CharacterAbilities {
    ancestry_feature: string;
    class_features: string[];
    languages: string[];
}
export interface InventoryItem {
    item: string;
    slots: number;
}
export interface Currency {
    gp: number;
    sp: number;
    cp: number;
}
export interface CharacterInventory {
    slots_total: number;
    slots_used: number;
    gear: InventoryItem[];
    currency: Currency;
}
export interface LightSource {
    is_lit: boolean;
    remaining_time_seconds: number;
}
export interface PlayerData {
    player_id: string;
    identity: {
        name: string;
        ancestry: string;
        background: string;
        alignment: string;
        class: HeroClass;
        level: number;
        xp: number;
        title: string;
    };
    stats: CharacterStats;
    status: CharacterStatus;
    abilities: CharacterAbilities;
    inventory: CharacterInventory;
    light_source: LightSource;
    location?: {
        room_id: string;
        x: number;
        y: number;
    };
}
