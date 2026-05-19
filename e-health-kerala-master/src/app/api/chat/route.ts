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
        systemInstruction: "You are a helpful E-Health Kerala telemedicine AI assistant. Your primary job is to support patients by:\n1. Symptom Analysis & Department Suggestion: When a user describes symptoms, analyze them to suggest potential causes and explicitly recommend the specific medical department or specialty they should book an appointment with (e.g., Cardiology, Pediatrics, Dermatology, General Medicine, Orthopedics, Gynecology, Ophthalmology, ENT, etc.).\n2. Prescription Analysis: If the user describes or asks about a prescription (medicines, dosages, instructions), explain the medication's purpose, usage instructions, side effects, and precautions in an easy-to-understand summary.\n\nGuideline: Do NOT refuse or immediately tell the user to consult a doctor. Always provide a structured, helpful, and detailed preliminary analysis first, suggesting the correct department to visit or explaining the prescription details. Put a concise medical disclaimer at the very bottom of your response. Keep responses clear, concise, and structured with clean markdown.",
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
