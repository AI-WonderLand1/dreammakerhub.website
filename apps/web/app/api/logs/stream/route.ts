import { NextResponse } from 'next/server';
import { subscribeLogs } from '@lib/logStreamer';

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

