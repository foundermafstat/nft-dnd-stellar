"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const multer_1 = __importDefault(require("multer"));
const supabase_1 = require("./db/supabase");
const ipfs_1 = require("./services/ipfs");
// Load environment variables from the root .env file
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configure multer for memory storage (for file uploads)
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Initialize OpenAI client
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NFT-DND Server is running' });
});
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const result = await (0, ipfs_1.uploadToIPFS)(req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json({ success: true, result });
    }
    catch (error) {
        res.status(500).json({ error: 'IPFS Upload failed', details: error.message });
    }
});
app.get('/api/db-check', async (req, res) => {
    try {
        // Just a simple query to assert Supabase is functional
        const { data, error } = await supabase_1.supabase.from('_test').select('*').limit(1);
        res.json({ success: true, connected: !error, error });
    }
    catch (error) {
        res.status(500).json({ error: 'DB check failed', details: error.message });
    }
});
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
