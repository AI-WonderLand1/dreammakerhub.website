import { applyArtifact } from "@core/ide/applyArtifact";

export async function POST(req: Request) {
  const artifact = await req.json();
  await applyArtifact(artifact);
  return Response.json({ ok: true });
}

