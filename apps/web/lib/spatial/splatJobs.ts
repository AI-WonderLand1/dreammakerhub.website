import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import type { SplatJob, SplatJobStatus } from "./types";

const TABLE = "_splat_jobs";

async function ensureTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      source_type TEXT NOT NULL,
      source_asset_urls JSONB NOT NULL DEFAULT '[]',
      result_url TEXT,
      result_format TEXT,
      progress INTEGER DEFAULT 0,
      error TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `).catch(() => {});
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_${TABLE}_project ON ${TABLE} (project_id)
  `).catch(() => {});
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_${TABLE}_user ON ${TABLE} (user_id)
  `).catch(() => {});
}

function rowToJob(r: any): SplatJob {
  return {
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    status: r.status as SplatJobStatus,
    sourceType: r.source_type,
    sourceAssetUrls: r.source_asset_urls ?? [],
    resultUrl: r.result_url ?? undefined,
    resultFormat: r.result_format ?? undefined,
    progress: r.progress ?? undefined,
    error: r.error ?? undefined,
    metadata: r.metadata ?? undefined,
    createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    updatedAt: r.updated_at?.toISOString?.() ?? r.updated_at,
    completedAt: r.completed_at?.toISOString?.() ?? r.completed_at ?? undefined,
  };
}

export async function createJob(
  projectId: string,
  userId: string,
  sourceType: 'photos' | 'video',
  sourceAssetUrls: string[]
): Promise<SplatJob> {
  await ensureTable();
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.query(`
    INSERT INTO ${TABLE} (id, project_id, user_id, status, source_type, source_asset_urls, created_at, updated_at)
    VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
  `, [id, projectId, userId, sourceType, JSON.stringify(sourceAssetUrls), now, now]);

  return {
    id,
    projectId,
    userId,
    status: 'pending',
    sourceType,
    sourceAssetUrls,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getJob(jobId: string): Promise<SplatJob | null> {
  await ensureTable();
  const db = getDb();
  const result = await db.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [jobId]);
  return result.rows[0] ? rowToJob(result.rows[0]) : null;
}

export async function updateJobStatus(
  jobId: string,
  status: SplatJobStatus,
  patch?: {
    progress?: number
    resultUrl?: string
    resultFormat?: 'ply' | 'splat' | 'ksplat'
    error?: string
    metadata?: Record<string, unknown>
  }
): Promise<SplatJob | null> {
  await ensureTable();
  const db = getDb();
  const now = new Date().toISOString();
  const sets = ['status = $1', 'updated_at = $2'];
  const values: any[] = [status, now];
  let idx = 3;

  if (patch?.progress !== undefined) { sets.push(`progress = $${idx++}`); values.push(patch.progress); }
  if (patch?.resultUrl !== undefined) { sets.push(`result_url = $${idx++}`); values.push(patch.resultUrl); }
  if (patch?.resultFormat !== undefined) { sets.push(`result_format = $${idx++}`); values.push(patch.resultFormat); }
  if (patch?.error !== undefined) { sets.push(`error = $${idx++}`); values.push(patch.error); }
  if (patch?.metadata !== undefined) { sets.push(`metadata = $${idx++}`); values.push(JSON.stringify(patch.metadata)); }
  if (status === 'completed') { sets.push(`completed_at = $${idx++}`); values.push(now); }

  values.push(jobId);
  await db.query(`UPDATE ${TABLE} SET ${sets.join(', ')} WHERE id = $${idx}`, values);

  return getJob(jobId);
}

export async function listJobsForProject(projectId: string): Promise<SplatJob[]> {
  await ensureTable();
  const db = getDb();
  const result = await db.query(
    `SELECT * FROM ${TABLE} WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows.map(rowToJob);
}
