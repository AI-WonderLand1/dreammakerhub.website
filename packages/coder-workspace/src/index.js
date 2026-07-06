import Fastify from 'fastify';
import workspaceRoutes from './routes/workspaces.js';
import templateRoutes from './routes/templates.js';
import healthRoutes from './routes/health.js';

const PORT = parseInt(process.env.CODER_WORKSPACE_PORT || '3091', 10);
const HOST = process.env.CODER_WORKSPACE_HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

fastify.register(healthRoutes);
fastify.register(workspaceRoutes, { prefix: '/api' });
fastify.register(templateRoutes, { prefix: '/api' });

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.code(statusCode).send({
    error: error.message || 'Internal server error',
    statusCode,
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Coder Workspace service listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
