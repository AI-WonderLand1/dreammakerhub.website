import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getSmokeUserIdFromRequest, isSmokeEnabled } from '@/lib/smokeAuth';

type TemplateLibraryPrincipal =
  | { userId: string; response: null }
  | { userId: null; response: NextResponse };

/**
 * Shared auth gate for the wonder-build template library API routes.
 * Mirrors the convention used by other wonder-build routes (cookie auth + smoke fallback).
 */
export async function requireTemplateUser(req: NextRequest): Promise<TemplateLibraryPrincipal> {
  // Use the principal from the same gate that authorizes the operation. A
  // second cookie/bearer-only lookup would discard an accepted smoke identity.
  const smokeUserId = isSmokeEnabled() ? getSmokeUserIdFromRequest(req) : undefined;
  let user: { id: string; app_metadata?: Record<string, unknown> } | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.error ? null : result.data.user;
  } catch {
    if (!smokeUserId) {
      return { userId: null, response: NextResponse.json({ error: 'Authentication is temporarily unavailable.' }, { status: 503 }) };
    }
  }

  if (!user && !smokeUserId) {
    return { userId: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const isPaid = Boolean(['creator', 'pro', 'studio', 'team', 'enterprise'].includes(String(user?.app_metadata?.plan || '')) || smokeUserId);
  if (process.env.WONDER_BUILD_REQUIRE_PAID === 'true' && !isPaid) {
    return { userId: null, response: NextResponse.json({ error: 'PAYWALL' }, { status: 402 }) };
  }

  return { userId: user?.id || smokeUserId!, response: null };
}

// Retain the response-only gate for existing template-library callers.
export async function requireUser(req: NextRequest) {
  return (await requireTemplateUser(req)).response;
}

export function getGeminiApiKey(): string {
  // Production provider secrets are server-side only. The deploy workflow
  // maps GitHub Actions GEMINI_API_KEY (or GOOGLE_AI_API_KEY as a compatibility
  // fallback) into the runtime container.
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
  if (!key) {
    throw new Error('GEMINI_API_KEY/GOOGLE_AI_API_KEY is not configured in the server environment.');
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
