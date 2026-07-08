export default async function healthRoutes(fastify) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'coder-workspace',
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/health/ready', async (request, reply) => {
    const coderUrl = process.env.CODER_API_URL;
    if (!coderUrl) {
      return reply.code(503).send({ status: 'not ready', reason: 'CODER_API_URL not configured' });
    }

    try {
      const res = await fetch(`${coderUrl}/api/v2/buildinfo`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        return { status: 'ready', coder: 'reachable' };
      }
      return reply.code(503).send({ status: 'not ready', reason: `Coder returned ${res.status}` });
    } catch (err) {
      return reply.code(503).send({ status: 'not ready', reason: err.message });
    }
  });
}
