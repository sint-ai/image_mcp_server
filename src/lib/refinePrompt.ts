import { anthropic } from "../configs/anthropic/index.js";
import { systemPrompt } from "../configs/constants/index.js";

export default async function refinePrompt(input: string) {
    const res = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-latest',
        system: systemPrompt,
        messages: [
            { role: 'user', content: input },
        ],
        max_tokens: 4000,
        temperature: 0.7,
    })
    return res.content
        .map((c) => c.type === 'text' ? c.text : '')
        .join(' ');
}
