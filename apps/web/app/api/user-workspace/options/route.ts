import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';
import { MAX_CODER_CPU, MAX_CODER_MEMORY_GIB, CODER_DISK_GIB } from '@/lib/coder/workspace-slots.server';
import { managedIdeOptions } from '@/lib/managed-ide/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (process.env.MANAGED_IDE_ENABLED === 'true') {
    try {
      return NextResponse.json(await managedIdeOptions(), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ error: 'Managed IDE launch is temporarily unavailable.' }, { status: 503 });
    }
  }

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
