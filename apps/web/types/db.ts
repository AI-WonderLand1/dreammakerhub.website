// apps/web/types/db.ts
export type EngineType = "puck" | "playcanvas" | "3d" | "unreal" | "ai";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  engine: EngineType;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  bucket: string;
  type: string | null;
  size: number | null;
  created_at: string;
}
