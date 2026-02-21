import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';

import { supabase } from './db/supabase';
import { uploadToIPFS } from './services/ipfs';
import { upsertPlayerByWallet } from './db/playerQueries';
import { createCharacter, getCharactersByPlayerId } from './db/characterQueries';

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

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
