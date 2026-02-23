"use strict";
// ── Combat System Models ────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceTiles = distanceTiles;
exports.parseDice = parseDice;
// ── Helper: Euclidean tile distance ────────────────────────────────
function distanceTiles(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
// ── Helper: Parse dice string → { count, sides, bonus } ───────────
function parseDice(dice) {
    const match = dice.match(/^(\d+)?d(\d+)(?:\+(\d+))?$/i);
    if (!match)
        return { count: 1, sides: 6, bonus: 0 };
    return {
        count: parseInt(match[1] || '1', 10),
        sides: parseInt(match[2], 10),
        bonus: parseInt(match[3] || '0', 10),
    };
}
