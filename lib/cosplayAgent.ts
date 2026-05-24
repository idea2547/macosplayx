/**
 * CosplayMate AI Agent — direct OpenAI API (no OpenClaw)
 * Server-side only. Called via /api/chat route.
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const COSPLAY_SYSTEM_PROMPT = `You are "CosplayMate" (คู่หูคอสเพลย์), a friendly AI cosplay assistant in the MaCosplayX app.

Your role:
1. Help cosplayers find outfits, accessories, and rental shops
2. Recommend shops by province/location in Thailand
3. Share cosplay tips: wig styling, makeup, prop-making, posing, sewing
4. Provide info about upcoming cosplay events in Thailand
5. Help users document and share cosplay experiences
6. Connect cosplayers with similar interests

Personality:
- Friendly, enthusiastic, supportive — like a cosplay senpai
- Casual Thai with Japanese/English cosplay terms
- Encourage creativity at all skill levels
- Use emoji naturally 🎭✨💜

Keep responses concise and conversational. When suggesting outfits or shops, consider body measurements, budget, location, and skill level if known.`;

export interface ChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  sessionId?: string;
  systemPrompt?: string;
}

export async function chatWithCosplayMate(req: ChatRequest): Promise<{ reply: string }> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: req.systemPrompt || COSPLAY_SYSTEM_PROMPT },
    ...req.history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: req.message },
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages,
    temperature: 0.8,
    max_tokens: 1024,
  });

  const reply = completion.choices[0]?.message?.content || '(no response)';
  return { reply };
}
