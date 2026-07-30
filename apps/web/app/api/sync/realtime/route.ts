import { NextRequest } from 'next/server';

const clients = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const source = searchParams.get('source') || 'unknown';

  if (!projectId) {
    return new Response('Missing projectId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `${source}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (!clients.has(projectId)) {
        clients.set(projectId, new Set());
      }
      clients.get(projectId)!.add(controller);

      const sendEvent = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendEvent({ type: 'connected', clientId, projectId, source });

      const heartbeat = setInterval(() => {
        sendEvent({ type: 'heartbeat', ts: Date.now() });
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.get(projectId)?.delete(controller);
        if (clients.get(projectId)?.size === 0) {
          clients.delete(projectId);
        }
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  const { projectId, event, data } = await req.json();

  if (!projectId || !event) {
    return Response.json({ ok: false, message: 'Missing projectId or event' }, { status: 400 });
  }

  const projectClients = clients.get(projectId);
  if (!projectClients || projectClients.size === 0) {
    return Response.json({ ok: true, message: 'No clients connected', delivered: 0 });
  }

  let delivered = 0;
  const payload = `data: ${JSON.stringify({ event, data, ts: Date.now() })}\n\n`;

  for (const controller of projectClients) {
    try {
      controller.enqueue(payload);
      delivered++;
    } catch {
      projectClients.delete(controller);
    }
  }

  return Response.json({ ok: true, delivered });
}
