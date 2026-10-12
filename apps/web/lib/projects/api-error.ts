/** Read public API error envelopes without coercing objects into messages. */
export function projectApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as { message?: unknown; error?: unknown };
  const nested = data.error && typeof data.error === "object"
    ? (data.error as { message?: unknown }).message
    : undefined;
  for (const value of [data.message, nested, data.error]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}
