import { NextResponse } from 'next/server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Availability = 'operational' | 'limited' | 'unavailable' | 'unknown';
type Service = {
  id: 'website' | 'ai' | 'ide';
  name: string;
  status: Availability;
  message: string;
};
type PublicStatus = { checkedAt: string; services: Service[] };

// Public traffic should not trigger a provider request for every page view.
// This cache is per server process, never a claim of global uptime.
const CACHE_MS = 60_000;
let cached: { until: number; value: PublicStatus } | null = null;
let pending: Promise<PublicStatus> | null = null;

async function checkAI(): Promise<Service> {
  const base = { id: 'ai' as const, name: 'AI assistant' };
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    // Match the free chat endpoint's supported providers. Configuration alone
    // does not establish provider reachability or a successful completion.
    const hasFallback = [process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY,
      process.env.GOOGLE_AI_API_KEY, process.env.CEREBRAS_API_KEY]
      .some((value) => value?.trim());
    return hasFallback
      ? { ...base, status: 'limited', message: 'AI provider configured; chat replies not yet verified.' }
      : { ...base, status: 'unavailable', message: 'Chat provider is not configured.' };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return { ...base, status: 'unknown', message: 'AI provider check did not succeed.' };
    // Listing models cannot prove that an actual chat completion works.
    return { ...base, status: 'limited', message: 'Provider reachable; chat replies not yet verified.' };
  } catch {
    return { ...base, status: 'unknown', message: 'AI provider could not be checked.' };
  }
}

async function checkIDE(): Promise<Service> {
  const base = { id: 'ide' as const, name: 'Cloud IDE' };
  if (!process.env.CODER_API_URL || !process.env.CODER_API_TOKEN) {
    return { ...base, status: 'unavailable', message: 'Cloud IDE is not configured for customer launch.' };
  }

  try {
    await getCoderLaunchConfig();
    // A reachable Coder template is NOT proof of secure per-customer ownership.
    // Until DreamMakerHub has verified that integration, never show green here.
    return { ...base, status: 'limited', message: 'Private preview; customer launch is not yet verified.' };
  } catch {
    return { ...base, status: 'unknown', message: 'Cloud IDE availability could not be verified.' };
  }
}

async function getStatus(): Promise<PublicStatus> {
  if (cached && cached.until > Date.now()) return cached.value;
  if (pending) return pending;

  pending = (async () => {
    const [ai, ide] = await Promise.all([checkAI(), checkIDE()]);
    const value: PublicStatus = {
      checkedAt: new Date().toISOString(),
      services: [
        { id: 'website', name: 'Website', status: 'operational', message: 'Website API responding.' },
        ai,
        ide,
      ],
    };
    cached = { until: Date.now() + CACHE_MS, value };
    return value;
  })().finally(() => { pending = null; });

  return pending;
}

export async function GET() {
  try {
    return NextResponse.json(await getStatus(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Service status is temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
