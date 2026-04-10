const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || "",
  NEXT_PUBLIC_WORKSPACE_DOMAIN: process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN || "",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  debug: (message: string, data?: unknown) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
};

export { env, requireEnv, logger };