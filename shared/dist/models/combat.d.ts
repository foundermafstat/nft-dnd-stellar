export type CombatActionType = 'MELEE_ATTACK' | 'RANGED_ATTACK' | 'CAST_SPELL' | 'USE_ITEM' | 'MOVE' | 'END_TURN';
export interface CombatAction {
    type: CombatActionType;
    targetId?: string;
    weaponId?: string;
    spellId?: string;
    itemId?: string;
    moveTo?: {
        x: number;
        y: number;
    };
}
export interface DiceResult {
    raw: number;
    modifier: number;
    total: number;
    dieType: number;
    fateIndex: number;
}
export interface CombatEntity {
    id: string;
    name: string;
    type: 'PLAYER' | 'MOB';
    characterId?: string;
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    ac: number;
    hp: number;
    maxHp: number;
    position: {
        x: number;
        y: number;
    };
    initiative: number;
    fatePoolId?: string;
    fatePoolIndex: number;
    damage?: string;
    xpReward?: number;
}
export interface CombatLog {
    id: string;
    round: number;
    actorId: string;
    actorName: string;
    actionType: CombatActionType;
    targetId?: string;
    targetName?: string;
    roll?: DiceResult;
    damageRoll?: DiceResult;
    isHit?: boolean;
    damage?: number;
    narrative: string;
}
export interface CombatState {
    combatId: string;
    locationId: string;
    status: 'INITIATIVE' | 'IN_PROGRESS' | 'VICTORY' | 'DEFEAT';
    round: number;
    turnQueue: string[];
    currentTurnIndex: number;
    activeEntityId: string;
    entities: Record<string, CombatEntity>;
    logs: CombatLog[];
}
export interface MobTemplate {
    name: string;
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    ac: number;
    maxHp: number;
    damage: string;
    xpReward: number;
    spriteColor?: string;
}
export declare function distanceTiles(a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}): number;
export declare function parseDice(dice: string): {
    count: number;
    sides: number;
    bonus: number;
};
