import { NextRequest } from 'next/server';
import { requireUser, getGeminiApiKey } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * WonderVoice Co-Pilot — streams Gemini responses as Server-Sent Events.
 * Replaces the Express WebSocket /live endpoint with a Next.js-native SSE stream.
 * The client sends a plain text message; the server streams transcript chunks.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireUser(req);
  if (authResult) return authResult;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  const { message } = body;
  if (!message) {
    return new Response('Missing message.', { status: 400 });
  }

  const model = process.env.TEMPLATE_LIBRARY_VOICE_MODEL || 'gemini-2.5-flash';

  const systemInstruction =
    'You are WonderVoice Co-Pilot, an expert AI Web Design assistant for WonderBuild. Speak concisely, offer clear visual design suggestions, and help users construct modern web templates.';

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const apiKey = getGeminiApiKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
        const upstream = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.6 },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => '');
          logger.error(`Gemini voice stream error ${upstream.status}: ${text.slice(0, 500)}`);
          send('error', { error: `Gemini API error ${upstream.status}: ${text.slice(0, 500)}` });
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.replace(/^data:\s*/, '').trim();
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              const parts = json?.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  send('transcript', { transcript: part.text });
                }
              }
            } catch {
              // ignore partial / keep-alive frames
            }
          }
        }

        send('done', { done: true });
      } catch (err: any) {
        logger.error('Voice co-pilot stream failed:', err.message);
        send('error', { error: err?.message || 'Voice co-pilot stream failed.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
