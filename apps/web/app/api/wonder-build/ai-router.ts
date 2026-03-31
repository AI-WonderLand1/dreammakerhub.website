import { NextResponse } from 'next/server';

const PROVIDER = process.env.AI_PROVIDER || 'openai';

export async function runAI(action: string, payload: any) {
  switch (PROVIDER) {
    case 'openai':
      return await callOpenAI(action, payload);
    case 'openrouter':
      return await callOpenRouter(action, payload);
    case 'gemini':
      return await callGemini(action, payload);
    default:
      throw new Error(`Unsupported provider: ${PROVIDER}`);
  }
}

async function callOpenAI(action: string, payload: any) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `AI action: ${action}` },
        { role: 'user', content: payload },
      ],
    }),
  });
  return res.json();
}

async function callOpenRouter(action: string, payload: any) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `AI action: ${action}` },
        { role: 'user', content: payload },
      ],
    }),
  });
  return res.json();
}

async function callGemini(action: string, payload: any) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: { text: payload } }),
    }
  );
  return res.json();
  }
