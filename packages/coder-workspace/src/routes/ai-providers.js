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

export default async function aiProviderRoutes(fastify) {
  fastify.addHook('onRequest', authMiddleware);

  fastify.get('/ai/providers', async (request, reply) => {
    try {
      const client = getClient(request);
      const providers = await client.listAIProviders();
      return reply.send({ providers });
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.post('/ai/providers', async (request, reply) => {
    try {
      const client = getClient(request);
      const body = request.body;

      if (!body.name || !body.type) {
        return reply.code(400).send({ error: 'name and type are required' });
      }

      const provider = await client.createAIProvider(body);
      return reply.code(201).send(provider);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/ai/providers/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const provider = await client.getAIProvider(request.params.id);
      return reply.send(provider);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.patch('/ai/providers/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const provider = await client.updateAIProvider(request.params.id, request.body);
      return reply.send(provider);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.delete('/ai/providers/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      await client.deleteAIProvider(request.params.id);
      return reply.code(204).send();
    } catch (err) {
      return parseError(err, reply);
    }
  });
}
