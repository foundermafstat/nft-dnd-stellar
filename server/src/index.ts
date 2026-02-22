import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';

import { supabase } from './db/supabase';
import { uploadToIPFS } from './services/ipfs';
import { upsertPlayerByWallet } from './db/playerQueries';
import { createCharacter, getCharactersByPlayerId } from './db/characterQueries';
import { createQuest, finishQuest, getAllQuests, getQuestById, getQuestHistory, seedLocations, getAllLocations, getLocationById, upsertPlayerPosition, getPlayerPosition, getPlayersInLocation } from './db/questQueries';
import { getNpcsByLocation, getNpcById, seedNpcs } from './db/npcQueries';
import { ALL_SEED_LOCATIONS } from './game/locationSeeds';
import { ALL_SEED_NPCS } from './game/npcSeeds';
import { QuestDirector, QuestActionInput } from './ai/QuestDirector';
import { generateNpcDialog } from './ai/npcDialog';

const questDirector = new QuestDirector();

// Load environment variables from the root .env file
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configure multer for memory storage (for file uploads)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NFT-DND Server is running' });
});

app.post('/api/auth/wallet', async (req, res) => {
    const { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({ error: 'Missing publicKey' });
    }

    try {
        const player = await upsertPlayerByWallet(publicKey);
        res.json({ success: true, player });
    } catch (error: any) {
        res.status(500).json({ error: 'Auth failed', details: error.message });
    }
});

// --- CHARACTER ENDPOINTS ---

app.post('/api/character/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        const systemPrompt = `You are an expert game master for a dark-fantasy RPG akin to Shadowdark. 
Generate a level 1 hero based on the user's prompt. 
Respond ONLY with a valid JSON strictly matching this schema, no markdown blocks or extra text:
{
  "name": "string",
  "ancestry": "Dwarf | Elf | Goblin | Halfling | HalfOrc | Human",
  "class": "Fighter | Priest | Thief | Wizard",
  "alignment": "Lawful | Neutral | Chaotic",
  "background": "A short, gritty 1-2 sentence origin story.",
  "stats": {
    "str": number (3-18),
    "dex": number (3-18),
    "con": number (3-18),
    "int": number (3-18),
    "wis": number (3-18),
    "cha": number (3-18)
  }
}
The total sum of stats should be around 65-75. Assign highest stats to attributes relevant to their class.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt || 'Generate a random dark fantasy hero.' }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const data = JSON.parse(content);
        res.json({ success: true, character: data });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate character', details: error.message });
    }
});

app.post('/api/character/create', async (req, res) => {
    try {
        const characterData = req.body;

        // Basic validation
        if (!characterData.playerId || !characterData.name || !characterData.class || !characterData.ancestry) {
            return res.status(400).json({ error: 'Missing required character fields' });
        }

        const character = await createCharacter(characterData);
        res.json({ success: true, character });
    } catch (error: any) {
        res.status(500).json({ error: 'Character creation failed', details: error.message });
    }
});

app.get('/api/character/player/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const characters = await getCharactersByPlayerId(playerId);
        res.json({ success: true, characters });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch characters', details: error.message });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await uploadToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json({ success: true, result });
    } catch (error: any) {
        res.status(500).json({ error: 'IPFS Upload failed', details: error.message });
    }
});

app.get('/api/db-check', async (req, res) => {
    try {
        // Just a simple query to assert Supabase is functional
        const { data, error } = await supabase.from('_test').select('*').limit(1);
        res.json({ success: true, connected: !error, error });
    } catch (error: any) {
        res.status(500).json({ error: 'DB check failed', details: error.message });
    }
});

// --- LOCATION ENDPOINTS ---

app.get('/api/location/list', async (req, res) => {
    try {
        const locations = await getAllLocations();
        res.json({ success: true, locations });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch locations', details: error.message });
    }
});

app.get('/api/location/:id', async (req, res) => {
    try {
        const location = await getLocationById(req.params.id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json({ success: true, location });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch location', details: error.message });
    }
});

app.post('/api/location/seed', async (req, res) => {
    try {
        const dbLocations = ALL_SEED_LOCATIONS.map(loc => ({
            id: loc.id,
            name: loc.name,
            biome_type: loc.biome_type,
            room_type: loc.room_type,
            threat_level: loc.threat_level,
            coordinates: {
                width: loc.width,
                height: loc.height,
                tiles: loc.tiles,
                spawn_points: loc.spawn_points,
                exits: loc.exits,
            },
        }));
        const success = await seedLocations(dbLocations);
        if (!success) {
            return res.status(500).json({ error: 'Failed to seed locations' });
        }
        res.json({ success: true, count: dbLocations.length });
    } catch (error: any) {
        res.status(500).json({ error: 'Seed failed', details: error.message });
    }
});

// --- PLAYER POSITION ENDPOINTS ---

app.get('/api/player/:id/position', async (req, res) => {
    try {
        const position = await getPlayerPosition(req.params.id);
        res.json({ success: true, position });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch position', details: error.message });
    }
});

app.put('/api/player/:id/position', async (req, res) => {
    try {
        const { locationId, tileX, tileY } = req.body;
        if (!locationId) {
            return res.status(400).json({ error: 'locationId is required' });
        }
        const success = await upsertPlayerPosition(req.params.id, locationId, tileX ?? 0, tileY ?? 0);
        if (!success) {
            return res.status(500).json({ error: 'Failed to update position' });
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Position update failed', details: error.message });
    }
});

app.get('/api/location/:id/players', async (req, res) => {
    try {
        const players = await getPlayersInLocation(req.params.id);
        res.json({ success: true, players });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch players', details: error.message });
    }
});

// --- NPC ENDPOINTS ---

app.get('/api/location/:id/npcs', async (req, res) => {
    try {
        const npcs = await getNpcsByLocation(req.params.id);
        res.json({ success: true, npcs });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch NPCs', details: error.message });
    }
});

app.post('/api/npc/:id/dialog', async (req, res) => {
    try {
        const npc = await getNpcById(req.params.id);
        if (!npc) {
            return res.status(404).json({ error: 'NPC not found' });
        }
        const { message, history, playerId } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'message is required' });
        }
        const response = await generateNpcDialog(npc, message, history || [], playerId);
        res.json({ success: true, response });
    } catch (error: any) {
        res.status(500).json({ error: 'Dialog failed', details: error.message });
    }
});

app.post('/api/npc/seed', async (req, res) => {
    try {
        const success = await seedNpcs(ALL_SEED_NPCS);
        if (!success) {
            return res.status(500).json({ error: 'Failed to seed NPCs' });
        }
        res.json({ success: true, count: ALL_SEED_NPCS.length });
    } catch (error: any) {
        res.status(500).json({ error: 'NPC seed failed', details: error.message });
    }
});


app.get('/api/quest/list', async (req, res) => {
    try {
        const quests = await getAllQuests();
        res.json({ success: true, quests });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch quests', details: error.message });
    }
});

app.get('/api/quest/:id', async (req, res) => {
    try {
        const quest = await getQuestById(req.params.id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        res.json({ success: true, quest });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch quest', details: error.message });
    }
});

app.get('/api/quest/:id/history', async (req, res) => {
    try {
        const history = await getQuestHistory(req.params.id);
        res.json({ success: true, history });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch quest history', details: error.message });
    }
});

app.post('/api/quest/start', async (req, res) => {
    try {
        const { partyMembers } = req.body;
        const questId = await createQuest(partyMembers || []);
        if (!questId) {
            return res.status(500).json({ error: 'Failed to create quest' });
        }
        res.json({ success: true, questId });
    } catch (error: any) {
        res.status(500).json({ error: 'Quest start failed', details: error.message });
    }
});

app.post('/api/quest/action', async (req, res) => {
    try {
        const input: QuestActionInput = req.body;
        if (!input.questId || !input.playerAction || input.playerRoll === undefined || input.currentZoneThreatLevel === undefined) {
            return res.status(400).json({ error: 'Missing required quest action fields' });
        }

        const output = await questDirector.processAction(input);
        if (!output) {
            return res.status(500).json({ error: 'Failed to generate AI narrative' });
        }

        res.json({ success: true, event: output });
    } catch (error: any) {
        console.error('Quest Action Error:', error);
        res.status(500).json({ error: 'Quest action failed', details: error.message });
    }
});

app.post('/api/quest/finish', async (req, res) => {
    try {
        const { questId, status, lootDropped, statChanges } = req.body;
        if (!questId || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const success = await finishQuest(questId, status, lootDropped || false, statChanges || {});
        if (!success) {
            return res.status(500).json({ error: 'Failed to finish quest' });
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Quest finish failed', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
