import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are CosplayMate, a friendly AI companion for cosplayers. You help with:
- Costume recommendations and outfit planning
- Rental shop suggestions
- Cosplay event experiences and tips
- Taking notes about cosplay projects
- Connecting with other cosplayers
- General cosplay advice and encouragement

Be warm, enthusiastic, and knowledgeable about cosplay culture. Keep responses concise and conversational since this is a voice interface. Respond in Thai if the user speaks Thai, otherwise English.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not understand that.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
