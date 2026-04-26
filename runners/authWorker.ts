import "server-only";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../lib/env";
import { logger } from "../lib/logger";

function safeRequireEnv(key: string): string {
  if (typeof requireEnv !== "function") {
    throw new Error("Invalid env helper: requireEnv is not a function");
  }
  return requireEnv(key);
}

function getServerClient() {
  return createClient(
    safeRequireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    safeRequireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

export async function verifyAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const supabase = getServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger?.error?.("AuthWorker: token verification failed", error?.message);
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? user.email,
      },
    };
  } catch (err) {
    logger?.error?.("AuthWorker error", { error: err instanceof Error ? err.message : err });
    return {
      authenticated: false,
      user: null,
    };
  }
}