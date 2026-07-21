import { applyArtifact } from "@core/ide/applyArtifact";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const artifact = await req.json();
  await applyArtifact(artifact);
  return Response.json({ ok: true });
}

