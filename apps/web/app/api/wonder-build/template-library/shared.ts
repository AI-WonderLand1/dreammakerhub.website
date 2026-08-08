import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getSmokeUserIdFromRequest } from '@/lib/smokeAuth';

/**
 * Shared auth gate for the wonder-build template library API routes.
 * Mirrors the convention used by other wonder-build routes (cookie auth + smoke fallback).
 */
export async function requireUser(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPaid = Boolean(user?.app_metadata?.plan === 'pro' || smokeUserId);
  if (process.env.WONDER_BUILD_REQUIRE_PAID === 'true' && !isPaid) {
    return NextResponse.json({ error: 'PAYWALL' }, { status: 402 });
  }

  return null;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '';
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return key;
}

/** Robust JSON extraction that strips markdown fences. */
export function extractJsonArray<T = any>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model returned non-JSON output.');
  }
}

export function extractJsonObject<T = any>(raw: string): T {
  try {
    return JSON.parse(raw.trim());
  } catch {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model returned non-JSON output.');
  }
}
