// apps/web/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    NEXT_PUBLIC_URL?: string;
    NEXT_PUBLIC_ENABLE_GRAPES_BUILDER?: string;
    NODE_ENV?: string;

    // OPTIONAL (disabled infra)
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    STRIPE_SECRET_KEY?: string;
  }
}
