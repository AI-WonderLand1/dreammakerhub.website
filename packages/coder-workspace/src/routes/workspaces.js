import { CoderClient, CoderError } from '../coder-client.js';
import { authMiddleware } from '../middleware/auth.js';

function getClient(request) {
  return new CoderClient(process.env.CODER_API_URL, request.coderToken);
}

export default async function workspaceRoutes(fastify) {
  fastify.addHook('onRequest', authMiddleware);

  fastify.post('/workspaces', async (request, reply) => {
    const client = getClient(request);
    const { templateId, name, cpu, memory, disk, ttlMs, autostartSchedule } = request.body || {};

    if (!templateId) {
      return reply.code(400).send({ error: 'templateId is required' });
    }

    try {
      const workspace = await client.createWorkspace(request.user.id, templateId, {
        name,
        cpu,
        memory,
        disk,
        ttlMs,
        autostartSchedule,
      });

      return reply.code(201).send(workspace);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.get('/workspaces', async (request, reply) => {
    const client = getClient(request);

    try {
      const workspaces = await client.listWorkspaces(request.user.id);
      return reply.send({ workspaces });
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.get('/workspaces/:id', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;

    try {
      const workspace = await client.getWorkspace(id);
      return reply.send(workspace);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.post('/workspaces/:id/start', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;

    try {
      const result = await client.startWorkspace(id);
      return reply.send(result);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.post('/workspaces/:id/stop', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;

    try {
      const result = await client.stopWorkspace(id);
      return reply.send(result);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.delete('/workspaces/:id', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;

    try {
      const result = await client.deleteWorkspace(id);
      return reply.send(result);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.get('/workspaces/:id/logs', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;

    try {
      const ws = await client.getWorkspace(id);
      const buildId = ws.latestBuild?.id;
      if (!buildId) {
        return reply.code(404).send({ error: 'No build found for this workspace' });
      }

      const logs = await client.getBuildLogs(buildId);
      return reply.send({ logs });
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.put('/workspaces/:id/files/*', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;
    const filePath = request.params['*'];

    if (!filePath) {
      return reply.code(400).send({ error: 'File path is required' });
    }

    try {
      const content = await request.body;
      const result = await client.uploadFile(id, filePath, content);
      return reply.send(result);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.post('/workspaces/:id/wait', async (request, reply) => {
    const client = getClient(request);
    const { id } = request.params;
    const { timeoutMs = 60000, intervalMs = 2000 } = request.body || {};

    try {
      const workspace = await client.waitForWorkspace(id, { timeoutMs, intervalMs });
      return reply.send(workspace);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
}
