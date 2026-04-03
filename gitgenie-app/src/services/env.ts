const globalEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

export function getGeminiApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY || globalEnv?.GEMINI_API_KEY;

  if (!key) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY (frontend) or GEMINI_API_KEY (server runtime env).');
  }

  return key;
}
