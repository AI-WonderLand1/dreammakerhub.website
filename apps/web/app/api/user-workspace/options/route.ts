import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';
import { MAX_CODER_CPU, MAX_CODER_MEMORY_GIB, CODER_DISK_GIB } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const config = await getCoderLaunchConfig();
    const cpu = config.cpu.filter((option) => Number(option.value) <= MAX_CODER_CPU);
    const memory = config.memory.filter((option) => Number(option.value) <= MAX_CODER_MEMORY_GIB);
    if (!cpu.length || !memory.length) throw new Error('No cost-capped Coder template options');
    return NextResponse.json({ ...config, cpu, memory, diskGiB: CODER_DISK_GIB, projects: [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Coder launch options are temporarily unavailable.' }, { status: 503 });
  }
}
