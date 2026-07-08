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

export default async function agentRoutes(fastify) {
  fastify.addHook('onRequest', authMiddleware);

  fastify.get('/agents/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const agent = await client.getAgent(request.params.id);
      return reply.send(agent);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/agents/:id/connection', async (request, reply) => {
    try {
      const client = getClient(request);
      const connection = await client.getAgentConnection(request.params.id);
      return reply.send(connection);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/agents/:id/logs', async (request, reply) => {
    try {
      const client = getClient(request);
      const { before, after, follow, format } = request.query;
      const logs = await client.getAgentLogs(request.params.id, {
        before: before ? Number(before) : undefined,
        after: after ? Number(after) : undefined,
        follow: follow === 'true' ? true : undefined,
        format,
      });
      return reply.send({ logs });
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/agents/:id/ports', async (request, reply) => {
    try {
      const client = getClient(request);
      const data = await client.getAgentListeningPorts(request.params.id);
      return reply.send(data);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/agents/:id/containers', async (request, reply) => {
    try {
      const client = getClient(request);
      const { label } = request.query;
      const data = await client.getAgentContainers(request.params.id, label);
      return reply.send(data);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.get('/agents/me/gitsshkey', async (request, reply) => {
    try {
      const client = getClient(request);
      const key = await client.getAgentGitSSHKey();
      return reply.send(key);
    } catch (err) {
      return parseError(err, reply);
    }
  });

  fastify.patch('/agents/me/app-status', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.patchAgentAppStatus(request.body);
      return reply.send(result);
    } catch (err) {
      return parseError(err, reply);
    }
  });
}
