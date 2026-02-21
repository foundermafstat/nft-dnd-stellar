export declare enum AttributeKey {
    Strength = "STR",
    Agility = "AGI",
    Intelligence = "INT",
    Charisma = "CHA",
    Luck = "LCK"
}
export interface PlayerAttributes {
    [AttributeKey.Strength]: number;
    [AttributeKey.Agility]: number;
    [AttributeKey.Intelligence]: number;
    [AttributeKey.Charisma]: number;
    [AttributeKey.Luck]: number;
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
