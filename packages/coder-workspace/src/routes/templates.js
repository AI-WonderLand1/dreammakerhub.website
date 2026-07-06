import { CoderClient, CoderError } from '../coder-client.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function templateRoutes(fastify) {
  fastify.addHook('onRequest', authMiddleware);

  fastify.get('/templates', async (request, reply) => {
    const client = new CoderClient(process.env.CODER_API_URL, request.coderToken);

    try {
      const templates = await client.listTemplates();
      return reply.send({ templates });
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  fastify.get('/templates/:id', async (request, reply) => {
    const client = new CoderClient(process.env.CODER_API_URL, request.coderToken);
    const { id } = request.params;

    try {
      const template = await client.getTemplate(id);
      return reply.send(template);
    } catch (err) {
      if (err instanceof CoderError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
}
