import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { coderApiRequest, coderServiceClient } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Usage = {
  slot_id: string; workspace_id: string; user_id: string;
  used_ms: number; max_ms: number; stop_requested_at: string | null;
};
type Workspace = {
  id?: string; owner_id?: string; template_id?: string;
  status?: string; latest_build?: { transition?: string; status?: string };
};

function authorized(request: Request): boolean {
  const expected = process.env.CODER_CUSTOMER_RUNNER_SECRET;
  const supplied = request.headers.get('authorization');
  if (!expected || expected.length < 32 || !supplied?.startsWith('Bearer ')) return false;
  const a = Buffer.from(supplied.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.CODER_CUSTOMER_CONTROLLER_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Customer compute controller disabled' }, { status: 503 });
  }
  const db = coderServiceClient();
  try {
    const pending = await db.from('coder_customer_jobs')
      .select('status,updated_at').in('status', ['claimed', 'needs_reconciliation']).limit(21);
    if (pending.error || !Array.isArray(pending.data) || pending.data.length > 20 ||
        pending.data.some((item) => item.status === 'needs_reconciliation' ||
          Date.now() - Date.parse(item.updated_at) > 120_000)) {
      throw new Error('Unreconciled customer allocation: no controller heartbeat');
    }
    const { data, error } = await db.from('coder_customer_compute_usage')
      .select('slot_id,workspace_id,user_id,used_ms,max_ms,stop_requested_at').limit(21);
    if (error || !Array.isArray(data) || data.length > 20) throw new Error('Usage ledger unavailable or exceeds controller capacity');
    let stopped = 0;
    // The pilot quota allows at most two running customer pods. Increase
    // capacity only after confirming controller completion every minute.
    for (const usage of data as Usage[]) {
      const identity = await db.from('coder_customer_identities')
        .select('coder_user_id').eq('user_id', usage.user_id).maybeSingle();
      if (identity.error || !identity.data) throw new Error('Customer identity mapping missing');
      const job = await db.from('coder_customer_jobs')
        .select('template_id,status').eq('slot_id', usage.slot_id).maybeSingle();
      if (job.error || job.data?.status !== 'ready') throw new Error('Unreconciled workspace state');
      const remoteResponse = await coderApiRequest(`/api/v2/workspaces/${encodeURIComponent(usage.workspace_id)}`, 'GET');
      const remote = remoteResponse.ok ? await remoteResponse.json().catch(() => null) as Workspace | null : null;
      if (!remote || remote.id !== usage.workspace_id || remote.owner_id !== identity.data.coder_user_id ||
          remote.template_id !== job.data.template_id) throw new Error('Remote workspace owner could not be verified');
      const build = remote.latest_build;
      if (!build || !['start', 'stop'].includes(build.transition || '')) throw new Error('Unknown Coder workspace lifecycle');
      const stoppedState = build.transition === 'stop' && ['succeeded', 'stopped'].includes(build.status || '');
      const sample = await db.rpc('meter_coder_customer_compute', {
        p_slot_id: usage.slot_id, p_running: !stoppedState,
      });
      const meter = sample.data?.[0];
      if (sample.error || !meter || typeof meter.should_stop !== 'boolean') {
        throw new Error('Cumulative compute meter failed');
      }
      if (meter.should_stop && !stoppedState) {
        const stop = await coderApiRequest(`/api/v2/workspaces/${encodeURIComponent(usage.workspace_id)}/builds`,
          'POST', { transition: 'stop' });
        if (!stop.ok && stop.status !== 409) throw new Error('Coder failed to stop over-limit workspace');
        const marked = await db.from('coder_customer_compute_usage')
          .update({ stop_requested_at: new Date().toISOString() }).eq('slot_id', usage.slot_id);
        if (marked.error) throw new Error('Stop event was not recorded');
        stopped++;
      }
    }
    // Heartbeat is a creation gate, NOT a fail-safe hard-stop if the entire
    // controller, scheduler, website, or Coder API is unavailable.
    const beat = await db.from('coder_customer_controller').upsert({
      id: true, last_heartbeat_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (beat.error) throw new Error('Could not commit controller heartbeat');
    return NextResponse.json({ status: 'ok', checked: data.length, stop_requested: stopped }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Usage reconciliation failed; customer creation will pause' }, { status: 503 });
  }
}
