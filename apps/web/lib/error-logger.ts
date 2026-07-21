import { createClient } from "@/lib/supabase/client";
import { logger } from '@/lib/logger';

export type ErrorLog = {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
};

export async function logError(error: ErrorLog) {
  logger.error("[ERROR]", { message: error.message, stack: error.stack });

  try {
    const supabase = createClient();
    if (!supabase) {
      logger.info("[ERROR LOG] Supabase not configured, logging to console only");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: error.url || (typeof window !== "undefined" ? window.location.href : "server"),
        userAgent:
          error.userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : "unknown"),
        userId: user?.id || "anonymous",
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch (e) {
    logger.error("[ERROR LOG] Failed to log error:", e);
  }
}

export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  const originalOnerror = window.onerror;
  window.onerror = (message, source, lineno, colno, errorObj) => {
    logError({
      message: String(message),
      stack: errorObj?.stack,
      url: source,
    });
    if (originalOnerror) {
      return originalOnerror(message, source, lineno, colno, errorObj);
    }
    return false;
  };

  const originalOnunhandledrejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    logError({
      message: event.reason?.message || "Unhandled Promise Rejection",
      stack: event.reason?.stack,
    });
    if (originalOnunhandledrejection) {
      originalOnunhandledrejection(event);
    }
  };
}