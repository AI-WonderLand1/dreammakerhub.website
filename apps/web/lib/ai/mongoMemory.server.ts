import 'server-only';
import { MongoClient, type Collection, type Db } from 'mongodb';
import { logger } from '@/lib/logger';

type AiConversationMemory = {
  userId: string;
  projectId: string;
  traceId: string;
  prompt: string;
  response: string;
  model: string;
  persona: string;
  createdAt: Date;
};

let clientPromise: Promise<MongoClient> | null = null;
let indexesReady: Promise<void> | null = null;

function configuredUri(): string | null {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) return null;
  return uri;
}

export function isMongoMemoryEnabled(): boolean {
  return process.env.MONGODB_AI_MEMORY_ENABLED === 'true' && Boolean(configuredUri());
}

async function mongoClient(): Promise<MongoClient> {
  const uri = configuredUri();
  if (!uri || process.env.MONGODB_AI_MEMORY_ENABLED !== 'true') {
    throw new Error('MongoDB AI memory is not enabled');
  }
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      appName: 'DreamMakerHub-AI-Memory',
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

async function memoryCollection(): Promise<Collection<AiConversationMemory>> {
  const client = await mongoClient();
  const dbName = process.env.MONGODB_DB?.trim() || 'dreammakerhub';
  const db: Db = client.db(dbName);
  const collection = db.collection<AiConversationMemory>('ai_conversations');

  if (!indexesReady) {
    indexesReady = Promise.all([
      collection.createIndex({ userId: 1, createdAt: -1 }),
      collection.createIndex({ userId: 1, projectId: 1, createdAt: -1 }),
      collection.createIndex({ traceId: 1 }, { unique: true }),
    ]).then(() => undefined).catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  await indexesReady;
  return collection;
}

export async function archiveAiConversation(input: {
  userId: string;
  projectId: string;
  traceId: string;
  prompt: string;
  response: string;
  model: string;
  persona: string;
}): Promise<boolean> {
  if (!isMongoMemoryEnabled()) return false;
  try {
    const collection = await memoryCollection();
    await collection.updateOne(
      { traceId: input.traceId, userId: input.userId },
      {
        $setOnInsert: {
          ...input,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    return true;
  } catch (error) {
    logger.error('[MongoMemory] archive failed', {
      kind: error instanceof Error ? error.name : 'unknown',
    });
    return false;
  }
}

export async function deleteUserMongoMemory(userId: string): Promise<boolean> {
  if (!isMongoMemoryEnabled()) return true;
  try {
    const collection = await memoryCollection();
    await collection.deleteMany({ userId });
    return true;
  } catch (error) {
    logger.error('[MongoMemory] user-memory delete failed', {
      kind: error instanceof Error ? error.name : 'unknown',
    });
    return false;
  }
}
