import { CoderClient, CoderError } from '../coder-client.js';
import { authMiddleware } from '../middleware/auth.js';

function getClient(request) {
  return new CoderClient(process.env.CODER_API_URL, request.coderToken);
}

function parseError(err, reply) {
  if (err instanceof CoderError) {
    return reply.code(err.statusCode).send({ error: err.message });
  }
  throw err;
}

export default async function aiBridgeRoutes(fastify) {
  fastify.addHook('onRequest', authMiddleware);

  fastify.get('/aibridge/clients', async (request, reply) => {
    try {
      const client = getClient(request);
      const clients = await client.listAIBridgeClients();
      return reply.send({ clients });
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/aibridge/interceptions', async (request, reply) => {
    try {
      const client = getClient(request);
      const { q, limit, after_id, offset } = request.query;
      const data = await client.listAIBridgeInterceptions({ q, limit, after_id, offset });
      return reply.send(data);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/aibridge/models', async (request, reply) => {
    try {
      const client = getClient(request);
      const models = await client.listAIBridgeModels();
      return reply.send({ models });
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/aibridge/sessions', async (request, reply) => {
    try {
      const client = getClient(request);
      const { q, limit, after_session_id, offset } = request.query;
      const data = await client.listAIBridgeSessions({ q, limit, after_session_id, offset });
      return reply.send(data);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/aibridge/sessions/:sessionId', async (request, reply) => {
    try {
      const client = getClient(request);
      const { sessionId } = request.params;
      const { after_id, before_id, limit } = request.query;
      const data = await client.getAIBridgeSessionThreads(sessionId, { after_id, before_id, limit });
      return reply.send(data);
    } catch (err) {
      return parseError(err, reply);
    }
  });
}
