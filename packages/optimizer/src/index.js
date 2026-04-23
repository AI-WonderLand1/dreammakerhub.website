import Fastify from 'fastify';
import { getDocument, Document, NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, meshopt, textureCompress, dedup, flatten, join, weld, simplify } from '@gltf-transform/functions';
import sharp from 'sharp';

const fastify = Fastify({ logger: true });

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

fastify.post('/optimize', async (request, reply) => {
  try {
    const buffer = await request.body;

    if (!buffer || buffer.length === 0) {
      return reply.status(400).send({ error: 'No glTF data provided' });
    }

    const document = await io.readBinary(new Uint8Array(buffer));

    await document.transform(
      dedup(),
      flatten(),
      join(),
      weld(),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [2048, 2048],
      }),
      draco(),
    );

    const optimized = await io.writeBinary(document);

    return reply
      .status(200)
      .header('Content-Type', 'model/gltf-binary')
      .send(Buffer.from(optimized));

  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Optimization failed', detail: err.message });
  }
});

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  await fastify.listen({ port: 3090, host: '0.0.0.0' });
};

start();
