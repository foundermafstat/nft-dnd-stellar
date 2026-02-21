export enum AttributeKey {
    Strength = 'STR',
    Agility = 'AGI',
    Intelligence = 'INT',
    Charisma = 'CHA',
    Luck = 'LCK'
}

export interface PlayerAttributes {
    [AttributeKey.Strength]: number;     // Melee DMG, weight, push puzzles
    [AttributeKey.Agility]: number;      // Movement speed, dodge, crit chance, ranged DMG
    [AttributeKey.Intelligence]: number; // Magic DMG, mana regen, puzzle hints
    [AttributeKey.Charisma]: number;     // NPC prices, diplomacy branches
    [AttributeKey.Luck]: number;         // Drop rarity, save on 1 HP roll (D20-system)
}

export interface PlayerStats {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    stamina: number;
    maxStamina: number;
    baseAtk: number;
    armor: number;
    luckBase: number;
}
