import { generateContent } from './openai';
import { PlayerStats, RoomType, BiomeType } from 'shared';

export interface NPCOutput {
    name: string;
    type: 'Merchant' | 'Guard' | 'Monster' | 'Boss';
    character: string;
    goals: string;
    secretOrWeakness: string;
    dialogueTree: any; // Nested dialogue object
}

export interface QuestOutput {
    objective: string;
    story: string;
    obstacles: string;
    branches: any;
}

/**
 * The Narrative Director manages context, pacing, and story states.
 */
export class NarrativeDirector {

    // RAG Context would theoretically be injected here

    public async generateNPCForRoom(roomType: RoomType, biome: BiomeType): Promise<NPCOutput | null> {
        const systemPrompt = `You are the AI Dungeon Master for NFT-DND. Generate an NPC for a ${biome} within a ${roomType}. You must output JSON in the exact format:
        { "name": "", "type": "Merchant/Guard/Monster/Boss", "character": "", "goals": "", "secretOrWeakness": "", "dialogueTree": {} }`;

        const userPrompt = `A group of players just entered this area. Determine who they meet.`;

        return await generateContent<NPCOutput>(systemPrompt, userPrompt);
    }

    public async generateQuest(players: string[], currentBiome: BiomeType): Promise<QuestOutput | null> {
        const systemPrompt = `You are the AI Dungeon Master. Generate a quest graph. Context: Biome is ${currentBiome}. Output JSON format:
        { "objective": "", "story": "", "obstacles": "", "branches": {} }`;

        const userPrompt = `Create a quest. Incorporate the following player names into the lore if possible: ${players.join(', ')}`;

        return await generateContent<QuestOutput>(systemPrompt, userPrompt);
    }
}
