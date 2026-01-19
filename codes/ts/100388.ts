import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '@/utils/openaiClient';


const sqlDbStructureParseInstruction = fs.readFileSync(path.resolve(__dirname, '../data/ai-instructions/db-structure-parse.txt'), 'utf-8')

export const parseEntity = async (req: Request, res: Response): Promise<void> => {
    const { prompt } = req.body;

    if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-2024-08-06',
            temperature: 0.1,
            top_p: 0.1,
            messages: [
                { role: 'assistant', content: sqlDbStructureParseInstruction },
                { role: 'user', content: prompt },
            ],
        });

        let data = response.choices[response.choices.length - 1]?.message.content;

        // remove markdown
        const match = data?.match(/```json([\s\S]*?)```/);
        if (match && match[1]) {
            data = match[1].trim();
        }
        
        res.end(data);
    } catch (error) {
        console.error('Error with ChatGPT:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
