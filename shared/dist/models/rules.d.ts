import { HeroClass, CharacterStats } from './player';
/**
 * Calculates the stat modifier based on the raw 3-18 value
 * 1-3: -4 | 4-5: -3 | 6-7: -2 | 8-9: -1 | 10-11: 0 | 12-13: +1 | 14-15: +2 | 16-17: +3 | 18+: +4
 */
export declare function calculateModifier(value: number): number;
export declare const DifficultyClass: {
    EASY: number;
    NORMAL: number;
    HARD: number;
    EXTREME: number;
};
export declare enum Distance {
    CLOSE = "Close",// 5 feet (1.5m)
    NEAR = "Near",// 30 feet (9m) - standard move
    FAR = "Far"
}
export declare const GameplayConstants: {
    TORCH_DURATION_SECONDS: number;
    MAX_LUCK_TOKENS: number;
    CURRENCY_SLOT_DENOMINATION: number;
    BASE_AC: number;
};
export interface ClassConfig {
    hitDie: number;
    weapons: string;
    armor: string;
}
export declare const CLASS_MODIFIERS: Record<HeroClass, ClassConfig>;
/**
 * Calculates total inventory slots based on STR, checking for Fighter class bonus.
 */
export declare function calculateMaxInventorySlots(stats: CharacterStats, heroClass: HeroClass): number;
/**
 * XP Required for the next level
 */
export declare function xpForNextLevel(currentLevel: number): number;
