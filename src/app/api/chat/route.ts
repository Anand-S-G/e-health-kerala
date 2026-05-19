import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: "You are a helpful E-Health Kerala telemedicine AI assistant. Help patients understand their symptoms or guide them on how to use the portal. Keep responses concise.",
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
