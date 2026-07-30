import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const subscribers = new Set<(msg: string) => void>();

export function broadcastLog(message: string) {
  subscribers.forEach((send) => send(message));
}

export function subscribeLogs(send: (msg: string) => void): () => void {
  subscribers.add(send);
  return () => subscribers.delete(send);
}

export async function GET(req: Request) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const send = (message: string) => {
        controller.enqueue(`data: ${message}\n\n`);
      };

      const unsubscribe = subscribeLogs(send);

      // Close stream when client disconnects
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

