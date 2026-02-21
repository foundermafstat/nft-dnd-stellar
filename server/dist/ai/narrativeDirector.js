"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeDirector = void 0;
const openai_1 = require("./openai");
/**
 * The Narrative Director manages context, pacing, and story states.
 */
class NarrativeDirector {
    // RAG Context would theoretically be injected here
    async generateNPCForRoom(roomType, biome) {
        const systemPrompt = `You are the AI Dungeon Master for NFT-DND. Generate an NPC for a ${biome} within a ${roomType}. You must output JSON in the exact format:
        { "name": "", "type": "Merchant/Guard/Monster/Boss", "character": "", "goals": "", "secretOrWeakness": "", "dialogueTree": {} }`;
        const userPrompt = `A group of players just entered this area. Determine who they meet.`;
        return await (0, openai_1.generateContent)(systemPrompt, userPrompt);
    }
    async generateQuest(players, currentBiome) {
        const systemPrompt = `You are the AI Dungeon Master. Generate a quest graph. Context: Biome is ${currentBiome}. Output JSON format:
        { "objective": "", "story": "", "obstacles": "", "branches": {} }`;
        const userPrompt = `Create a quest. Incorporate the following player names into the lore if possible: ${players.join(', ')}`;
        return await (0, openai_1.generateContent)(systemPrompt, userPrompt);
    }
}
exports.NarrativeDirector = NarrativeDirector;
