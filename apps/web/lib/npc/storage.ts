"use server";

import path from "path";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";

// Ensure the npcs tables exist
async function ensureTables() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS _npcs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      world_id TEXT,
      model_url TEXT,
      position TEXT,
      rotation TEXT,
      personality TEXT,
      llm_provider TEXT,
      llm_model TEXT,
      system_prompt TEXT,
      knowledge_base TEXT,
      memory_size INTEGER,
      interaction_radius REAL,
      voice_enabled BOOLEAN,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});
}

// Type definitions
export type NpcMetadata = {
  id: string;
  ownerId: string;
  name: string;
  worldId?: string | null;
  modelUrl?: string | null;
  position?: number[] | null; // [x, y, z]
  rotation?: number[] | null; // [x, y, z]
  personality?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  systemPrompt?: string | null;
  knowledgeBase?: any[] | null; // Array of strings or objects
  memorySize?: number | null;
  interactionRadius?: number | null;
  voiceEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type DbNpc = {
  id: string;
  owner_id: string;
  name: string;
  world_id: string | null;
  model_url: string | null;
  position: string | null; // JSON stringified
  rotation: string | null; // JSON stringified
  personality: string | null;
  llm_provider: string | null;
  llm_model: string | null;
  system_prompt: string | null;
  knowledge_base: string | null; // JSON stringified
  memory_size: number | null;
  interaction_radius: number | null;
  voice_enabled: boolean | null;
  created_at: string;
  updated_at: string;
};

// Convert from database format to application format
function toNpcMetadata(dbNpc: DbNpc): NpcMetadata {
  return {
    id: dbNpc.id,
    ownerId: dbNpc.owner_id,
    name: dbNpc.name,
    worldId: dbNpc.world_id,
    modelUrl: dbNpc.model_url,
    position: dbNpc.position ? JSON.parse(dbNpc.position) : null,
    rotation: dbNpc.rotation ? JSON.parse(dbNpc.rotation) : null,
    personality: dbNpc.personality,
    llmProvider: dbNpc.llm_provider,
    llmModel: dbNpc.llm_model,
    systemPrompt: dbNpc.system_prompt,
    knowledgeBase: dbNpc.knowledge_base ? JSON.parse(dbNpc.knowledge_base) : null,
    memorySize: dbNpc.memory_size,
    interactionRadius: dbNpc.interaction_radius,
    voiceEnabled: dbNpc.voice_enabled,
    createdAt: dbNpc.created_at,
    updatedAt: dbNpc.updated_at,
  };
}

// Convert from application format to database format
function toDbNpc(npc: NpcMetadata): DbNpc {
  return {
    id: npc.id,
    ownerId: npc.ownerId,
    name: npc.name,
    world_id: npc.worldId ?? null,
    model_url: npc.modelUrl ?? null,
    position: npc.position ? JSON.stringify(npc.position) : null,
    rotation: npc.rotation ? JSON.stringify(npc.rotation) : null,
    personality: npc.personality ?? null,
    llm_provider: npc.llmProvider ?? null,
    llm_model: npc.llmModel ?? null,
    system_prompt: npc.systemPrompt ?? null,
    knowledge_base: npc.knowledgeBase ? JSON.stringify(npc.knowledgeBase) : null,
    memory_size: npc.memorySize,
    interaction_radius: npc.interactionRadius,
    voice_enabled: npc.voiceEnabled ?? false,
    createdAt: npc.createdAt,
    updatedAt: npc.updatedAt,
  };
}

export async function listNpcs(ownerId: string): Promise<NpcMetadata[]> {
  await ensureTables();
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM _npcs WHERE owner_id = $1 ORDER BY updated_at DESC`,
    [ownerId]
  );
  return result.rows.map((row: any) => toNpcMetadata(row));
}

export async function getNpc(npcId: string, ownerId: string): Promise<NpcMetadata> {
  await ensureTables();
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM _npcs WHERE id = $1 AND owner_id = $2`,
    [npcId, ownerId]
  );
  
  if (!result.rows[0]) {
    throw new Error("NPC not found");
  }
  
  return toNpcMetadata(result.rows[0]);
}

export async function createNpc(ownerId: string, input: Omit<NpcMetadata, "id" | "ownerId" | "createdAt" | "updatedAt">): Promise<NpcMetadata> {
  await ensureTables();
  const now = new Date().toISOString();
  
  const npc: NpcMetadata = {
    id: randomUUID(),
    ownerId,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  
  const dbNpc = toDbNpc(npc);
  
  const db = getDb();
  await db.query(`
    INSERT INTO _npcs (
      id, owner_id, name, world_id, model_url, position, rotation, personality,
      llm_provider, llm_model, system_prompt, knowledge_base, memory_size,
      interaction_radius, voice_enabled, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
    )
  `, [
    dbNpc.id, dbNpc.ownerId, dbNpc.name, dbNpc.world_id, dbNpc.model_url,
    dbNpc.position, dbNpc.rotation, dbNpc.personality, dbNpc.llm_provider,
    dbNpc.llm_model, dbNpc.system_prompt, dbNpc.knowledge_base,
    dbNpc.memory_size, dbNpc.interaction_radius, dbNpc.voice_enabled,
    dbNpc.createdAt, dbNpc.updatedAt
  ]);
  
  return npc;
}

export async function updateNpc(npcId: string, ownerId: string, updates: Partial<Omit<NpcMetadata, "id" | "ownerId" | "createdAt" | "updatedAt">>): Promise<NpcMetadata> {
  await ensureTables();
  
  // First, verify ownership and get current NPC
  const currentNpc = await getNpc(npcId, ownerId);
  
  // Prepare updates
  const now = new Date().toISOString();
  const npcToUpdate: NpcMetadata = {
    ...currentNpc,
    ...updates,
    updatedAt: now,
  };
  
  const dbNpc = toDbNpc(npcToUpdate);
  
  const db = getDb();
  await db.query(`
    UPDATE _npcs SET
      name = $1,
      world_id = $2,
      model_url = $3,
      position = $4,
      rotation = $5,
      personality = $6,
      llm_provider = $7,
      llm_model = $8,
      system_prompt = $9,
      knowledge_base = $10,
      memory_size = $11,
      interaction_radius = $12,
      voice_enabled = $13,
      updated_at = $14
    WHERE id = $15 AND owner_id = $16
  `, [
    dbNpc.name, dbNpc.world_id, dbNpc.model_url, dbNpc.position, dbNpc.rotation,
    dbNpc.personality, dbNpc.llm_provider, dbNpc.llm_model, dbNpc.system_prompt,
    dbNpc.knowledge_base, dbNpc.memory_size, dbNpc.interaction_radius,
    dbNpc.voice_enabled, dbNpc.updatedAt, dbNpc.id, dbNpc.ownerId
  ]);
  
  return npcToUpdate;
}

export async function deleteNpc(npcId: string, ownerId: string): Promise<void> {
  await ensureTables();
  
  // Verify ownership first
  await getNpc(npcId, ownerId);
  
  const db = getDb();
  await db.query(`DELETE FROM _npcs WHERE id = $1 AND owner_id = $2`, [npcId, ownerId]);
}