import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';
import { readFile, writeFile } from '@lib/projects/storage';

type AiConfessionEntry = {
  prompt?: string;
  confession: string;
  generationId?: string;
  workerId?: 'A' | 'B' | 'C' | 'D';
  eventName?: string;
  constitutionalCheck?: 'pending' | 'passed' | 'failed';
  at: string;
};

const CONFESSIONS_PATH = 'ai/confessions.json';

async function resolveOwnerId(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  return smokeUserId ?? user?.id ?? null;
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const ownerId = await resolveOwnerId(req);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, confession, generationId, workerId, eventName, constitutionalCheck } = await req.json();
    if (!confession) return NextResponse.json({ ok: true });

    const raw = await readFile(params.projectId, ownerId, CONFESSIONS_PATH);
    const list: AiConfessionEntry[] = raw ? JSON.parse(raw) : [];

    list.push({
      prompt,
      confession,
      generationId,
      workerId,
      eventName,
      constitutionalCheck,
      at: new Date().toISOString(),
    });

    await writeFile(params.projectId, ownerId, CONFESSIONS_PATH, JSON.stringify(list, null, 2));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to store confession' }, { status: 500 });
  }
}
