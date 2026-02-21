"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = generateContent;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
/**
 * Base AI interaction point. Prompts Open AI with game context to generate JSON structured responses.
 */
async function generateContent(systemPrompt, userPrompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Or gpt-4-turbo depending on preference
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
        });
        const content = response.choices[0].message.content;
        if (!content)
            return null;
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error in OpenAI Generation:', error);
        return null;
    }
}
