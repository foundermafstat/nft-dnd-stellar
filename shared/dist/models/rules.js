"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASS_MODIFIERS = exports.GameplayConstants = exports.Distance = exports.DifficultyClass = void 0;
exports.calculateModifier = calculateModifier;
exports.calculateMaxInventorySlots = calculateMaxInventorySlots;
exports.xpForNextLevel = xpForNextLevel;
const player_1 = require("./player");
// --- STAT MODIFIER CALCULATION ---
/**
 * Calculates the stat modifier based on the raw 3-18 value
 * 1-3: -4 | 4-5: -3 | 6-7: -2 | 8-9: -1 | 10-11: 0 | 12-13: +1 | 14-15: +2 | 16-17: +3 | 18+: +4
 */
function calculateModifier(value) {
    if (value <= 3)
        return -4;
    if (value <= 5)
        return -3;
    if (value <= 7)
        return -2;
    if (value <= 9)
        return -1;
    if (value <= 11)
        return 0;
    if (value <= 13)
        return 1;
    if (value <= 15)
        return 2;
    if (value <= 17)
        return 3;
    return 4;
}
// --- CONSTANTS AND DCs ---
exports.DifficultyClass = {
    EASY: 9,
    NORMAL: 12,
    HARD: 15,
    EXTREME: 18,
};
// Abstract distances for web mechanics
var Distance;
(function (Distance) {
    Distance["CLOSE"] = "Close";
    Distance["NEAR"] = "Near";
    Distance["FAR"] = "Far";
})(Distance || (exports.Distance = Distance = {}));
// Gameplay Constants
exports.GameplayConstants = {
    TORCH_DURATION_SECONDS: 3600, // 1 hour real-time
    MAX_LUCK_TOKENS: 1,
    CURRENCY_SLOT_DENOMINATION: 100, // First 100 free, then 1 slot per 100 coins
    BASE_AC: 10,
};
exports.CLASS_MODIFIERS = {
    [player_1.HeroClass.Fighter]: {
        hitDie: 8,
        weapons: 'Any',
        armor: 'Any + Shields',
    },
    [player_1.HeroClass.Priest]: {
        hitDie: 6,
        weapons: 'Limited',
        armor: 'Any + Shields',
    },
    [player_1.HeroClass.Thief]: {
        hitDie: 4,
        weapons: 'Limited',
        armor: 'Leather',
    },
    [player_1.HeroClass.Wizard]: {
        hitDie: 4,
        weapons: 'Dagger, Staff',
        armor: 'None',
    },
};
// --- HELPER FUNCTIONS ---
/**
 * Calculates total inventory slots based on STR, checking for Fighter class bonus.
 */
function calculateMaxInventorySlots(stats, heroClass) {
    let slots = Math.max(stats.str.value, 10);
    // Fighter exception: +CON mod if positive
    if (heroClass === player_1.HeroClass.Fighter && stats.con.mod > 0) {
        slots += stats.con.mod;
    }
    return slots;
}
/**
 * XP Required for the next level
 */
function xpForNextLevel(currentLevel) {
    return currentLevel * 10;
}
