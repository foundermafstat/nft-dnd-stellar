import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';

import { supabase } from './db/supabase';
import { uploadToIPFS } from './services/ipfs';
import { upsertPlayerByWallet } from './db/playerQueries';

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
